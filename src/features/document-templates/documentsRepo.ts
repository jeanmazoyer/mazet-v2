// Templates and the documents made from them. Visibility follows the deal; only administrators
// add templates; every creation is written to the deal's audit trail without any field values.
import { and, desc, eq } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { dealDocuments, documentTemplates } from "@/db/schema/dealDocuments";
import { recordChange } from "@/features/collaboration/changeLog";
import { assertDealVisible } from "@/features/deals/assertDealVisible";
import { loadEditableDeal } from "@/features/deals/dealAuth";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import type { DriveFile, DriveProvider } from "./driveProvider";
import { carriesAdminOnlyData } from "./fieldCatalog";
import { buildFieldValues } from "./fieldValues";
import { extractPlaceholders, planFill } from "./placeholders";
import { validateDocumentTitle, validateTemplateInput } from "./templateRules";

export interface TemplateRow {
  id: string;
  title: string;
  category: string;
  driveFileId: string;
}

export interface DealDocumentRow {
  id: string;
  title: string;
  status: string;
  driveFileId: string;
  templateTitle: string | null;
  createdAt: Date;
}

export interface CreatedDocument {
  document: DealDocumentRow;
  // Placeholders left as they are, so the user can complete them by hand.
  unfilled: string[];
  // Placeholders that need an administrator (identity numbers), left as they are for others.
  blockedAdminOnly: string[];
}

export async function createTemplateFromFile(
  db: DbOrTx,
  actor: PermSetUser,
  drive: DriveProvider,
  input: { title: string; category: string; driveFileId: string },
  signal: AbortSignal,
): Promise<Result<TemplateRow, AppError>> {
  if (actor.type !== "admin") {
    return err(new AppError(ERROR_IDS.PERM_DENIED, "Only an administrator can add templates", {}));
  }
  const rule = validateTemplateInput(input);
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.DOCUMENT_INVALID, "Check the template's title and category", {
        reason: rule.error,
      }),
    );
  }
  const readable = await drive.readText(rule.value.driveFileId, signal);
  if (!readable.ok) return err(readable.error);

  const [row] = await db
    .insert(documentTemplates)
    .values({ ...rule.value, createdBy: actor.id })
    .returning();
  if (row === undefined)
    throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "template insert returned no row");
  return ok({ id: row.id, title: row.title, category: row.category, driveFileId: row.driveFileId });
}

export async function listTemplates(
  db: DbOrTx,
  signal: AbortSignal,
): Promise<Result<TemplateRow[], AppError>> {
  const rows = await db.select().from(documentTemplates).orderBy(documentTemplates.title);
  signal.throwIfAborted();
  return ok(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      driveFileId: r.driveFileId,
    })),
  );
}

export async function createDealDocument(
  db: DbOrTx,
  actor: PermSetUser,
  drive: DriveProvider,
  dealId: string,
  input: { title: string; templateId?: string },
  signal: AbortSignal,
): Promise<Result<CreatedDocument, AppError>> {
  const title = validateDocumentTitle(input.title);
  if (!title.ok)
    return err(
      new AppError(ERROR_IDS.DOCUMENT_INVALID, "Give the document a title", {
        reason: title.error,
      }),
    );
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);
  const deal = editable.value.deal;
  const folderPath = dealFolderPath(deal.id, deal.title);

  let created: DriveFile;
  let unfilled: string[] = [];
  let blockedAdminOnly: string[] = [];
  let sensitive = false;
  if (input.templateId === undefined) {
    const blank = await drive.createBlank({ name: title.value, folderPath }, signal);
    if (!blank.ok) return err(blank.error);
    created = blank.value;
  } else {
    const [template] = await db
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.id, input.templateId))
      .limit(1);
    if (template === undefined) {
      return err(
        new AppError(ERROR_IDS.DOCUMENT_NOT_FOUND, "Template not found", {
          templateId: input.templateId,
        }),
      );
    }
    const text = await drive.readText(template.driveFileId, signal);
    if (!text.ok) return err(text.error);
    const values = await buildFieldValues(db, actor, dealId, signal);
    const plan = planFill(extractPlaceholders(text.value), values, {
      isAdmin: actor.type === "admin",
    });
    const made = await drive.createFromTemplate(
      {
        templateFileId: template.driveFileId,
        name: title.value,
        folderPath: carriesAdminOnlyData(Object.keys(plan.filled))
          ? adminFolderPath(deal.id, deal.title)
          : folderPath,
        replacements: plan.filled,
      },
      signal,
    );
    if (!made.ok) return err(made.error);
    created = made.value;
    unfilled = [...plan.empty, ...plan.unknown];
    blockedAdminOnly = plan.blockedAdminOnly;
    sensitive = carriesAdminOnlyData(Object.keys(plan.filled));
  }

  const templateId = input.templateId ?? null;
  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(dealDocuments)
      .values({
        dealId,
        templateId,
        title: title.value,
        status: "draft",
        driveFileId: created.fileId,
        createdBy: actor.id,
        carriesAdminData: sensitive,
      })
      .returning();
    if (inserted === undefined)
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "document insert returned no row");
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `document:${inserted.id}`,
        oldValue: null,
        newValue: { title: inserted.title, status: inserted.status, templateId },
        actorId: actor.id,
      },
      signal,
    );
    return inserted;
  });
  const templateTitle = await templateTitleOf(db, templateId);
  return ok({
    document: {
      id: row.id,
      title: row.title,
      status: row.status,
      driveFileId: row.driveFileId,
      templateTitle,
      createdAt: row.createdAt,
    },
    unfilled,
    blockedAdminOnly,
  });
}

export async function listDealDocuments(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<DealDocumentRow[], AppError>> {
  const visible = await assertDealVisible(db, actor, dealId, signal);
  if (!visible.ok) return err(visible.error);
  const rows = await db
    .select({
      id: dealDocuments.id,
      title: dealDocuments.title,
      status: dealDocuments.status,
      driveFileId: dealDocuments.driveFileId,
      createdAt: dealDocuments.createdAt,
      templateTitle: documentTemplates.title,
      carriesAdminData: dealDocuments.carriesAdminData,
    })
    .from(dealDocuments)
    .leftJoin(documentTemplates, eq(documentTemplates.id, dealDocuments.templateId))
    .where(
      and(
        eq(dealDocuments.dealId, dealId),
        actor.type === "admin" ? undefined : eq(dealDocuments.carriesAdminData, false),
      ),
    )
    .orderBy(desc(dealDocuments.createdAt));
  return ok(rows.map((r) => ({ ...r, templateTitle: r.templateTitle ?? null })));
}

// Each deal gets its own folder, under the year it was made, so the shared drive stays readable.
function dealFolderPath(dealId: string, dealTitle: string): string[] {
  return ["Deals", String(new Date().getUTCFullYear()), `${dealTitle} · ${dealId.slice(0, 8)}`];
}

// Documents with an identity number go to a folder the team does not share, under the year.
function adminFolderPath(dealId: string, dealTitle: string): string[] {
  return [
    "Contrats (administrateurs)",
    String(new Date().getUTCFullYear()),
    `${dealTitle} · ${dealId.slice(0, 8)}`,
  ];
}

async function templateTitleOf(db: DbOrTx, templateId: string | null): Promise<string | null> {
  if (templateId === null) return null;
  const [row] = await db
    .select({ title: documentTemplates.title })
    .from(documentTemplates)
    .where(eq(documentTemplates.id, templateId))
    .limit(1);
  return row?.title ?? null;
}

export interface DownloadableDocument {
  driveFileId: string;
  title: string;
  // The person whose Drive holds the file: the one who made it.
  createdBy: string | null;
}

// A document as one person may download it. A document with an identity number is answered as
// missing for everyone but an administrator, so its existence is not revealed either.
export async function getDocumentForDownload(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  documentId: string,
  signal: AbortSignal,
): Promise<Result<DownloadableDocument, AppError>> {
  const visible = await assertDealVisible(db, actor, dealId, signal);
  if (!visible.ok) return err(visible.error);
  const [row] = await db
    .select()
    .from(dealDocuments)
    .where(and(eq(dealDocuments.id, documentId), eq(dealDocuments.dealId, dealId)))
    .limit(1);
  if (row === undefined || (row.carriesAdminData && actor.type !== "admin")) {
    return err(new AppError(ERROR_IDS.DOCUMENT_NOT_FOUND, "Document not found", { documentId }));
  }
  return ok({ driveFileId: row.driveFileId, title: row.title, createdBy: row.createdBy });
}

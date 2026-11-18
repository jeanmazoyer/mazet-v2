import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import { DRIVE_API_URL, GOOGLE_TOKEN_URL } from "@/constants/googleDrive";
import { deals } from "@/db/schema/deals";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { PermSetUser } from "@/features/permissions/effective";
import { downloadDocumentPdf, pdfFilename } from "./documentDownload";
import { createDealDocument } from "./documentsRepo";
import { saveDriveConnection } from "./driveConnectionRepo";
import { createFakeDrive } from "./testing/fakeDrive";
import { scriptedFetch } from "./testing/scriptedFetch";

const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);
const CONFIG = { clientId: "client-1", clientSecret: "secret-1" };

function asActor(user: { id: string; name: string; email: string }): PermSetUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: "regular",
    isActive: true,
    groupIds: new Set(),
    flags: new Set(["deal.edit_own"]),
  } as PermSetUser;
}

describe("downloading a document as a PDF (base réelle, Google simulé)", () => {
  it("returns the PDF named after the document, read with the Drive of the person who made it", async () => {
    await withTestDb(async (db) => {
      const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
      const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
      const [deal] = await db
        .insert(deals)
        .values({
          title: "Séjour Bravo",
          pipelineId: pipeline.id,
          stageId: stages[0]?.id ?? "",
          ownerId: owner.id,
          visibilityLevel: "owner",
        })
        .returning();
      if (deal === undefined) throw new Error("deal insert failed");
      const drive = createFakeDrive();
      const made = await createDealDocument(
        db,
        asActor(owner),
        drive,
        deal.id,
        { title: "Devis : Bravo/2" },
        SIGNAL(),
      );
      if (!made.ok) throw new Error("creation failed");
      await saveDriveConnection(db, owner.id, "owner@gmail.com", "rt-owner", SIGNAL());

      const google = scriptedFetch([
        {
          match: (u) => u === GOOGLE_TOKEN_URL,
          json: { access_token: "at-fresh", expires_in: 3599 },
        },
        {
          match: (u) => u.startsWith(`${DRIVE_API_URL}/files/`) && u.includes("/export"),
          text: "%PDF-1.4 fictif",
        },
      ]);
      const pdf = await downloadDocumentPdf(
        db,
        asActor(owner),
        deal.id,
        made.value.document.id,
        { ...CONFIG, fetchFn: google.fetchFn },
        SIGNAL(),
      );
      expect(pdf.ok).toBe(true);
      if (!pdf.ok) return;
      expect(pdf.value.filename).toBe("Devis Bravo 2.pdf");
      expect(new TextDecoder().decode(pdf.value.bytes).startsWith("%PDF")).toBe(true);
      expect(google.calls.find((c) => c.url.includes("/export"))?.auth).toBe("Bearer at-fresh");
    });
  });

  it("says Drive is not connected when the person who made the document has not connected it", async () => {
    await withTestDb(async (db) => {
      const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
      const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
      const [deal] = await db
        .insert(deals)
        .values({
          title: "Séjour Bravo",
          pipelineId: pipeline.id,
          stageId: stages[0]?.id ?? "",
          ownerId: owner.id,
          visibilityLevel: "owner",
        })
        .returning();
      if (deal === undefined) throw new Error("deal insert failed");
      const drive = createFakeDrive();
      const made = await createDealDocument(
        db,
        asActor(owner),
        drive,
        deal.id,
        { title: "Note" },
        SIGNAL(),
      );
      if (!made.ok) throw new Error("creation failed");
      const pdf = await downloadDocumentPdf(
        db,
        asActor(owner),
        deal.id,
        made.value.document.id,
        { ...CONFIG, fetchFn: scriptedFetch([]).fetchFn },
        SIGNAL(),
      );
      expect(pdf.ok).toBe(false);
      if (!pdf.ok) expect(pdf.error.id).toBe(ERROR_IDS.DRIVE_NOT_CONNECTED);
    });
  });

  it("builds a file name Drive and every system accept, from the document title", () => {
    expect(pdfFilename('Contrat : "Bravo"/2')).toBe("Contrat Bravo 2.pdf");
    expect(pdfFilename("   ")).toBe("Document.pdf");
  });
});

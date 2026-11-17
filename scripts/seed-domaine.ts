/**
 * scripts/seed-domaine.ts
 *
 * Small FICTITIOUS dataset for the estate: a handful of files (weddings, events, seasonal lets)
 * spread over the default "Domaine" pipeline, so a fresh install is not an empty board.
 * No real client data: names are placeholders and addresses use example.com.
 *
 * Prerequisite: sign in once first. The first login creates the default pipeline and the
 * admin user this script attaches the files to.
 *
 * Run: pnpm db:seed:domaine
 * Re-runnable: does nothing if its files are already present.
 */

import { Pool } from "pg";
import { DEFAULT_PIPELINE } from "../src/constants/defaultCatalog";
import { DATABASE_URL } from "./seed-smoke-config";

const SEED_MARKER = "domaine-demo";

interface DemoFile {
  client: string;
  title: string;
  stage: (typeof DEFAULT_PIPELINE.stages)[number];
  value: number;
  closeInDays: number;
}

const FILES: readonly DemoFile[] = [
  {
    client: "Client fictif Echo",
    title: "Mariage Echo",
    stage: "Demande",
    value: 14000,
    closeInDays: 200,
  },
  {
    client: "Client fictif Delta",
    title: "Séminaire Delta",
    stage: "Visite",
    value: 6500,
    closeInDays: 75,
  },
  {
    client: "Client fictif Alpha",
    title: "Mariage Alpha",
    stage: "Option",
    value: 18500,
    closeInDays: 120,
  },
  {
    client: "Client fictif Bravo",
    title: "Séjour Bravo",
    stage: "Devis envoyé",
    value: 4200,
    closeInDays: 40,
  },
  {
    client: "Client fictif Charlie",
    title: "Mariage Charlie",
    stage: "Signé",
    value: 22000,
    closeInDays: 30,
  },
  {
    client: "Client fictif Foxtrot",
    title: "Séjour Foxtrot",
    stage: "Soldé",
    value: 3600,
    closeInDays: 20,
  },
];

const pool = new Pool({ connectionString: DATABASE_URL });

async function q<T extends Record<string, unknown>>(
  text: string,
  values?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, values);
  return result.rows as T[];
}

function isoInDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const owners = await q<{ id: string }>(
    `SELECT id FROM users WHERE is_admin = true AND is_active = true ORDER BY created_at LIMIT 1`,
  );
  const pipelines = await q<{ id: string }>(`SELECT id FROM pipelines WHERE name = $1 LIMIT 1`, [
    DEFAULT_PIPELINE.name,
  ]);
  const ownerId = owners[0]?.id;
  const pipelineId = pipelines[0]?.id;
  if (ownerId === undefined || pipelineId === undefined) {
    throw new Error(
      `Sign in once before seeding: the first login creates the admin user and the "${DEFAULT_PIPELINE.name}" pipeline.`,
    );
  }

  const already = await q<{ id: string }>(
    `SELECT id FROM deals WHERE source_channel_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [SEED_MARKER],
  );
  if (already[0] !== undefined) {
    console.warn("seed-domaine: files already present, nothing to do");
    return;
  }

  const stages = await q<{ id: string; name: string }>(
    `SELECT id, name FROM stages WHERE pipeline_id = $1`,
    [pipelineId],
  );
  const stageIdByName = new Map(stages.map((s) => [s.name, s.id]));

  let position = 0;
  for (const file of FILES) {
    const stageId = stageIdByName.get(file.stage);
    if (stageId === undefined)
      throw new Error(`stage "${file.stage}" is missing from the pipeline`);

    const email = `${file.client.split(" ").at(-1)?.toLowerCase() ?? "client"}@example.com`;
    const persons = await q<{ id: string }>(
      `INSERT INTO persons (name, primary_email, owner_id, visibility_level)
       VALUES ($1, $2, $3, 'all')
       RETURNING id`,
      [file.client, email, ownerId],
    );
    const personId = persons[0]?.id;
    if (personId === undefined) throw new Error("person insert returned no row");

    position += 1;
    await q(
      `INSERT INTO deals
         (title, status, value, expected_close_date, pipeline_id, stage_id, person_id, owner_id,
          visibility_level, board_position, source_channel_id)
       VALUES ($1, 'open', $2, $3, $4, $5, $6, $7, 'all', $8, $9)`,
      [
        file.title,
        file.value,
        isoInDays(file.closeInDays),
        pipelineId,
        stageId,
        personId,
        ownerId,
        position,
        SEED_MARKER,
      ],
    );
  }
  console.warn(`seed-domaine: ${FILES.length} fictitious files created`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });

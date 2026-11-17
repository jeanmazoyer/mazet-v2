-- Le journal est en ajout seul : aucune modification, aucune suppression,
-- aucune vidange, même pour le propriétaire de la base via l'application.
CREATE OR REPLACE FUNCTION journal_refuse_changes() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Le journal est en ajout seul (% interdit)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER journal_no_update_delete
  BEFORE UPDATE OR DELETE ON "journal"
  FOR EACH ROW EXECUTE FUNCTION journal_refuse_changes();
--> statement-breakpoint
CREATE TRIGGER journal_no_truncate
  BEFORE TRUNCATE ON "journal"
  FOR EACH STATEMENT EXECUTE FUNCTION journal_refuse_changes();

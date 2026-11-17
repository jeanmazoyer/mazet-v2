-- Blocage des doubles réservations, garanti par la base :
-- deux réservations ACTIVES d'une même organisation ne peuvent pas se chevaucher
-- (dates à la journée, bornes incluses). Les options expirées ou annulées
-- ne bloquent plus rien.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist (
    "organisation_id" WITH =,
    daterange("start_date", "end_date", '[]') WITH &&
  )
  WHERE ("state" = 'active');

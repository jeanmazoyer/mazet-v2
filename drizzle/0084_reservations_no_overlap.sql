-- Two ACTIVE bookings may not share a day. Dates are inclusive at both ends, so the range is
-- closed on both sides. Expired and cancelled bookings no longer hold their dates, hence the
-- partial predicate. Plain EXCLUDE on a daterange needs no extra extension.
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist (daterange("start_date", "end_date", '[]') WITH &&)
  WHERE ("state" = 'active');

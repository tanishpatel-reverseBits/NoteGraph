-- Add generated tsvector column for full-text search over title + body.
ALTER TABLE "Note"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("body", '')), 'B')
  ) STORED;

CREATE INDEX "Note_searchVector_idx" ON "Note" USING GIN ("searchVector");

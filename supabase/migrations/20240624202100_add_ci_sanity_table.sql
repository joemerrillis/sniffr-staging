-- Migration to add ci_sanity table for CI sanity checks

CREATE TABLE IF NOT EXISTS ci_sanity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    note text
);

CREATE INDEX IF NOT EXISTS ci_sanity_created_at_idx ON ci_sanity(created_at);

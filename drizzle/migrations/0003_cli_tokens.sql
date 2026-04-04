CREATE TABLE IF NOT EXISTS "cli_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "token_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "cli_tokens_token_hash_idx" ON "cli_tokens" USING btree ("token_hash");
CREATE INDEX IF NOT EXISTS "cli_tokens_user_id_idx" ON "cli_tokens" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "cli_tokens_revoked_at_idx" ON "cli_tokens" USING btree ("revoked_at");

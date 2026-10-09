import type { Session } from "@san/auth";
import type { Database } from "@san/db";

export type Context = {
  session: Session | null;
  db: Database;
};

import { createAuth } from "@san/auth";
import { createDb } from "@san/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);

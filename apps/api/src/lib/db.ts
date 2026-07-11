import { createDb, type Db } from "@kixvault/db";
import { env } from "./env.js";

export const db: Db = createDb(env.databaseUrl);

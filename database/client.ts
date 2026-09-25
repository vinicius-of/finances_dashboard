import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const databaseUrl = process.env.DATABASE_URL || "my-finances.db";

const sqlite = new Database(databaseUrl);

// PRAGMAs ACID — WAL para concorrência de leitura/escrita, FK ativas
// e busy_timeout para evitar erros de "database is locked".
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");
sqlite.run("PRAGMA busy_timeout = 5000;");

// API do drizzle-orm 1.x: o client deve ser passado como `{ client }`.
export const db = drizzle({ client: sqlite });

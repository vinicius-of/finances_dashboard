import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL || "my-finances.db";
const backupDirectory = path.join("database", "backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination =
  process.argv[2] ?? path.join(backupDirectory, `my-finances-${timestamp}.db`);

mkdirSync(path.dirname(destination), { recursive: true });

const database = new Database(databaseUrl);

database.run("PRAGMA wal_checkpoint(TRUNCATE);");
database.run(`VACUUM INTO '${destination.replace(/'/g, "''")}';`);
database.close();

console.log(`Backup criado em ${destination}`);

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

function createDb() {
  if (!connectionString) {
    // Return a proxy that alerts if a DB operation is executed without DATABASE_URL
    return new Proxy({} as ReturnType<typeof drizzle>, {
      get(_target, prop) {
        if (prop === "query") {
          return new Proxy({}, {
            get() {
              return () => {
                throw new Error("DATABASE_URL is not set. Please set DATABASE_URL in .env to connect to Neon PostgreSQL.");
              };
            }
          });
        }
        return () => {
          throw new Error("DATABASE_URL is not set. Please set DATABASE_URL in .env to connect to Neon PostgreSQL.");
        };
      }
    });
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = createDb();
export * from "./schema";

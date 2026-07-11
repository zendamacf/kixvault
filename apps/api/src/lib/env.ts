const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const env = {
  databaseUrl,
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === "production",
} as const;

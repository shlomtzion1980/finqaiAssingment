import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DB_FILE: z.string().min(1).default('data/profiles.db'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
});

export type Config = {
  port: number;
  dbFile: string;
  corsOrigins: string[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  return {
    port: parsed.data.PORT,
    dbFile: parsed.data.DB_FILE,
    corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  };
}

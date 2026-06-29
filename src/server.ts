import 'reflect-metadata';
import { createApp } from './infrastructure/http/app';
import { loadEnv } from './shared/config/env';
import { logger } from './shared/logger';

async function main(): Promise<void> {
  const config = loadEnv();
  const app = await createApp();

  app.listen(config.port, () => {
    logger.info(`Server listening on http://localhost:${config.port}`);
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error('Failed to start server', { error: message });
  process.exit(1);
});

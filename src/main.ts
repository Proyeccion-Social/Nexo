import { createApplication } from './app.js';

function readPort(): number {
  const value = process.env.PORT ?? '3000';
  const port = Number(value);

  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

async function bootstrap(): Promise<void> {
  const port = readPort();
  const app = await createApplication();

  try {
    await app.listen(port);
  } catch (error) {
    await app.close();
    throw error;
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start application:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

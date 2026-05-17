import 'reflect-metadata';
import { loadEnv } from './shared/lib/env.js';
import { buildContainer } from './app/container.js';
import { buildApp } from './app/index.js';

const env = loadEnv();
const container = await buildContainer(env);
const app = buildApp(container);

app.listen(env.PORT, () => {
  console.log(`[server] listening on ${env.PORT}`);
});

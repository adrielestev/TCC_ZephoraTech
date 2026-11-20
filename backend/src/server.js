'use strict';

const env = require('./config/env');
const { db } = require('./database/db');
const { createApp } = require('./app');

const server = createApp().listen(env.PORT, () => {
  console.log(`Zephora API em http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal) {
  console.log(`${signal} recebido, encerrando...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));

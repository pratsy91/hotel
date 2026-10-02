import express, { type Express } from 'express';
import { errorHandler } from './api/middleware/error-handler.js';
import { notFoundHandler } from './api/middleware/not-found.js';
import { requestLogger } from './api/middleware/request-logger.js';
import { routes } from './routes.js';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestLogger);
  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

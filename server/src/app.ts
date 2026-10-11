import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './http/middleware.js';
import { createProfileRouter } from './profiles/profile.routes.js';
import type { ProfileService } from './profiles/profile.service.js';

export type AppDeps = {
  profileService: ProfileService;
  corsOrigins: string[];
};

export function createApp({ profileService, corsOrigins }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/profiles', createProfileRouter(profileService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

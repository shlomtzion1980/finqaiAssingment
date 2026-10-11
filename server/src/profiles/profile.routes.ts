import { Router } from 'express';
import { parseOrThrow } from '../http/middleware.js';
import { profileIdSchema, profileSchema, updateProfileSchema } from './profile.schema.js';
import type { ProfileService } from './profile.service.js';

export function createProfileRouter(service: ProfileService): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(service.list());
  });

  router.get('/:id', (req, res) => {
    const id = parseOrThrow(profileIdSchema, req.params.id);
    res.json(service.get(id));
  });

  router.post('/', (req, res) => {
    const profile = parseOrThrow(profileSchema, req.body);
    const saved = service.save(profile);
    res.status(201).location(`${req.baseUrl}/${encodeURIComponent(saved.id)}`).json(saved);
  });

  router.patch('/:id', (req, res) => {
    const id = parseOrThrow(profileIdSchema, req.params.id);
    const { name } = parseOrThrow(updateProfileSchema, req.body);
    res.json(service.rename(id, name));
  });

  router.delete('/:id', (req, res) => {
    const id = parseOrThrow(profileIdSchema, req.params.id);
    service.remove(id);
    res.status(204).end();
  });

  return router;
}

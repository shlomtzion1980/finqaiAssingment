import type Database from 'better-sqlite3';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';
import { createSqliteProfileRepository } from '../src/profiles/profile.repository.js';
import type { Profile } from '../src/profiles/profile.schema.js';
import { ProfileService } from '../src/profiles/profile.service.js';

const profile: Profile = {
  id: '6a4f6c4e-1a0b-4c5e-9a3a-2b1f0e8d7c6b',
  name: { title: 'Ms', first: 'Noa', last: 'Levi' },
  gender: 'female',
  email: 'noa.levi@example.com',
  phone: '(272) 790-0888',
  dob: '1990-01-01T00:30:00.000Z',
  location: {
    street: { number: 12, name: 'Herzl St' },
    city: 'Haifa',
    state: 'Haifa District',
    country: 'Israel',
  },
  picture: {
    large: 'https://randomuser.me/api/portraits/women/1.jpg',
    thumbnail: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
  },
};

let db: Database.Database;
let app: ReturnType<typeof createApp>;
let tick = 0;

beforeEach(() => {
  db = openDatabase(':memory:');
  tick = 0;
  const clock = () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));
  const profileService = new ProfileService(createSqliteProfileRepository(db), clock);
  app = createApp({ profileService, corsOrigins: ['http://localhost:5173'] });
});

afterEach(() => db.close());

describe('profiles API', () => {
  it('saves, lists, renames and deletes a profile', async () => {
    const created = await request(app).post('/api/profiles').send(profile).expect(201);
    expect(created.body).toMatchObject({ ...profile, savedAt: '2026-01-01T00:00:00.000Z' });
    expect(created.headers.location).toBe(`/api/profiles/${profile.id}`);

    const list = await request(app).get('/api/profiles').expect(200);
    expect(list.body).toHaveLength(1);

    const renamed = await request(app)
      .patch(`/api/profiles/${profile.id}`)
      .send({ name: { title: 'Dr', first: 'נועה', last: 'Levi' } })
      .expect(200);
    expect(renamed.body.name).toEqual({ title: 'Dr', first: 'נועה', last: 'Levi' });
    expect(renamed.body.updatedAt).not.toBe(renamed.body.savedAt);

    await request(app).delete(`/api/profiles/${profile.id}`).expect(204);
    await request(app).get(`/api/profiles/${profile.id}`).expect(404);
  });

  it('rejects saving the same profile twice with 409', async () => {
    await request(app).post('/api/profiles').send(profile).expect(201);
    const res = await request(app).post('/api/profiles').send(profile).expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns newest saves first', async () => {
    await request(app).post('/api/profiles').send(profile).expect(201);
    await request(app)
      .post('/api/profiles')
      .send({ ...profile, id: 'second' })
      .expect(201);
    const list = await request(app).get('/api/profiles').expect(200);
    expect(list.body.map((p: Profile) => p.id)).toEqual(['second', profile.id]);
  });

  it('validates the body and reports which fields are wrong', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .send({ ...profile, email: 'not-an-email', name: { title: '', first: '  ', last: 'x' } })
      .expect(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'name.first']));
  });

  it('rejects unknown fields on update', async () => {
    await request(app).post('/api/profiles').send(profile).expect(201);
    await request(app)
      .patch(`/api/profiles/${profile.id}`)
      .send({ name: profile.name, email: 'x@example.com' })
      .expect(400);
  });

  it('returns 404 for updates and deletes of unknown profiles', async () => {
    await request(app).patch('/api/profiles/nope').send({ name: profile.name }).expect(404);
    await request(app).delete('/api/profiles/nope').expect(404);
  });

  it('answers malformed JSON with 400, not 500', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .set('Content-Type', 'application/json')
      .send('{"id":')
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nothing').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

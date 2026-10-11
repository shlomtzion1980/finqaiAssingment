import type Database from 'better-sqlite3';
import type { Profile, ProfileName, SavedProfile } from './profile.schema.js';

export interface ProfileRepository {
  list(): SavedProfile[];
  findById(id: string): SavedProfile | undefined;
  /** Returns undefined if a profile with this id already exists. */
  insert(profile: Profile, now: string): SavedProfile | undefined;
  updateName(id: string, name: ProfileName, now: string): SavedProfile | undefined;
  delete(id: string): boolean;
}

type ProfileRow = {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone: string;
  dob: string;
  street_number: number;
  street_name: string;
  city: string;
  state: string;
  country: string;
  picture_large: string;
  picture_thumbnail: string;
  saved_at: string;
  updated_at: string;
};

function toRow(profile: Profile, now: string): ProfileRow {
  return {
    id: profile.id,
    title: profile.name.title,
    first_name: profile.name.first,
    last_name: profile.name.last,
    gender: profile.gender,
    email: profile.email,
    phone: profile.phone,
    dob: profile.dob,
    street_number: profile.location.street.number,
    street_name: profile.location.street.name,
    city: profile.location.city,
    state: profile.location.state,
    country: profile.location.country,
    picture_large: profile.picture.large,
    picture_thumbnail: profile.picture.thumbnail,
    saved_at: now,
    updated_at: now,
  };
}

function fromRow(row: ProfileRow): SavedProfile {
  return {
    id: row.id,
    name: { title: row.title, first: row.first_name, last: row.last_name },
    gender: row.gender,
    email: row.email,
    phone: row.phone,
    dob: row.dob,
    location: {
      street: { number: row.street_number, name: row.street_name },
      city: row.city,
      state: row.state,
      country: row.country,
    },
    picture: { large: row.picture_large, thumbnail: row.picture_thumbnail },
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteProfileRepository(db: Database.Database): ProfileRepository {
  const statements = {
    list: db.prepare<[], ProfileRow>('SELECT * FROM profiles ORDER BY saved_at DESC, rowid DESC'),
    findById: db.prepare<[string], ProfileRow>('SELECT * FROM profiles WHERE id = ?'),
    insert: db.prepare<[ProfileRow], ProfileRow>(`
      INSERT INTO profiles (
        id, title, first_name, last_name, gender, email, phone, dob,
        street_number, street_name, city, state, country,
        picture_large, picture_thumbnail, saved_at, updated_at
      ) VALUES (
        @id, @title, @first_name, @last_name, @gender, @email, @phone, @dob,
        @street_number, @street_name, @city, @state, @country,
        @picture_large, @picture_thumbnail, @saved_at, @updated_at
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `),
    updateName: db.prepare<
      { id: string; title: string; first: string; last: string; now: string },
      ProfileRow
    >(`
      UPDATE profiles
      SET title = @title, first_name = @first, last_name = @last, updated_at = @now
      WHERE id = @id
      RETURNING *
    `),
    delete: db.prepare<[string]>('DELETE FROM profiles WHERE id = ?'),
  };

  return {
    list: () => statements.list.all().map(fromRow),

    findById: (id) => {
      const row = statements.findById.get(id);
      return row && fromRow(row);
    },

    insert: (profile, now) => {
      const row = statements.insert.get(toRow(profile, now));
      return row && fromRow(row);
    },

    updateName: (id, name, now) => {
      const row = statements.updateName.get({ id, ...name, now });
      return row && fromRow(row);
    },

    delete: (id) => statements.delete.run(id).changes > 0,
  };
}

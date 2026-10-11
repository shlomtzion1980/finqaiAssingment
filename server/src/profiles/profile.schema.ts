import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

export const nameSchema = z.object({
  title: z.string().trim().max(20),
  first: text(100),
  last: text(100),
});

/**
 * The app's own profile shape. Deliberately not randomuser's response format:
 * the client maps the third-party payload to this, so the API and the database
 * never depend on randomuser.me.
 */
export const profileSchema = z.object({
  id: text(64),
  name: nameSchema,
  gender: text(20),
  email: z.email().max(254),
  phone: text(40),
  dob: z.iso.datetime(),
  location: z.object({
    street: z.object({
      number: z.number().int().nonnegative(),
      name: text(200),
    }),
    city: text(100),
    state: z.string().trim().max(100),
    country: text(100),
  }),
  picture: z.object({
    large: z.url(),
    thumbnail: z.url(),
  }),
});

export const updateProfileSchema = z.object({ name: nameSchema }).strict();

export const profileIdSchema = text(64);

export type ProfileName = z.infer<typeof nameSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type SavedProfile = Profile & {
  savedAt: string;
  updatedAt: string;
};

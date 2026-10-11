/** Mirrors the server's profile contract (server/src/profiles/profile.schema.ts). */
export type ProfileName = {
  title: string;
  first: string;
  last: string;
};

export type Profile = {
  /** randomuser's login.uuid — stable and unique, unlike id.value which is often null. */
  id: string;
  name: ProfileName;
  gender: string;
  email: string;
  phone: string;
  /** ISO timestamp. Age is derived from it so stored profiles don't go stale. */
  dob: string;
  location: {
    street: { number: number; name: string };
    city: string;
    state: string;
    country: string;
  };
  picture: { large: string; thumbnail: string };
};

export type SavedProfile = Profile & {
  savedAt: string;
  updatedAt: string;
};

export type ProfileSource = 'random' | 'saved';

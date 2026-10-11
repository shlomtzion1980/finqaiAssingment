import type { Profile } from '@/types/profile';
import { ApiError, requestJson } from './http';

/** Pinned API version so a randomuser.me upgrade can't silently change the payload. */
const ENDPOINT = 'https://randomuser.me/api/1.4/';
const FIELDS = 'login,name,gender,location,email,phone,dob,picture';

type RandomUser = {
  login: { uuid: string };
  name: { title: string; first: string; last: string };
  gender: string;
  email: string;
  phone: string;
  dob: { date: string };
  location: {
    street: { number: number; name: string };
    city: string;
    state: string | number;
    country: string;
  };
  picture: { large: string; thumbnail: string };
};

type RandomUserResponse = { results?: RandomUser[]; error?: string };

export function toProfile(user: RandomUser): Profile {
  return {
    id: user.login.uuid,
    name: { title: user.name.title, first: user.name.first, last: user.name.last },
    gender: user.gender,
    email: user.email,
    phone: user.phone,
    dob: user.dob.date,
    location: {
      street: { number: user.location.street.number, name: user.location.street.name },
      city: user.location.city,
      state: String(user.location.state),
      country: user.location.country,
    },
    picture: { large: user.picture.large, thumbnail: user.picture.thumbnail },
  };
}

export async function fetchRandomProfiles(count: number, signal?: AbortSignal): Promise<Profile[]> {
  const url = `${ENDPOINT}?results=${count}&inc=${FIELDS}&noinfo`;
  const data = await requestJson<RandomUserResponse>(url, { signal });
  // randomuser reports some failures as 200 + { error }.
  if (!Array.isArray(data.results)) {
    throw new ApiError(data.error ?? 'randomuser.me returned an unexpected response.', 502, 'UPSTREAM');
  }
  return data.results.map(toProfile);
}

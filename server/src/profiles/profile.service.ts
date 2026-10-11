import { ConflictError, NotFoundError } from '../http/errors.js';
import type { ProfileRepository } from './profile.repository.js';
import type { Profile, ProfileName, SavedProfile } from './profile.schema.js';

export type Clock = () => Date;

export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly clock: Clock = () => new Date(),
  ) {}

  list(): SavedProfile[] {
    return this.repository.list();
  }

  get(id: string): SavedProfile {
    const profile = this.repository.findById(id);
    if (!profile) throw new NotFoundError(`Profile ${id} not found`);
    return profile;
  }

  save(profile: Profile): SavedProfile {
    const saved = this.repository.insert(profile, this.now());
    if (!saved) throw new ConflictError(`Profile ${profile.id} is already saved`);
    return saved;
  }

  rename(id: string, name: ProfileName): SavedProfile {
    const updated = this.repository.updateName(id, name, this.now());
    if (!updated) throw new NotFoundError(`Profile ${id} not found`);
    return updated;
  }

  remove(id: string): void {
    if (!this.repository.delete(id)) throw new NotFoundError(`Profile ${id} not found`);
  }

  private now(): string {
    return this.clock().toISOString();
  }
}

import type { IdeaStatus } from '../idea';

export const StatusPolicy = {
  // Logged becomes Critiquing; no automatic rule moves a status backwards.
  afterNotesSaved: (status: IdeaStatus): IdeaStatus => (status === 'Logged' ? 'Critiquing' : status),
};

import { Category, IdeaStatus } from '@cullr/api';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'solid';

export const categoryTone: Record<Category, Tone> = {
  'Toronto & GTA': 'info',
  Photography: 'warning',
  'Faith & ministry': 'success',
  Product: 'neutral',
  Engineering: 'danger',
};

export const statusTone: Record<IdeaStatus, Tone> = {
  Logged: 'neutral',
  Critiquing: 'info',
  Curating: 'warning',
  Building: 'success',
  Built: 'solid',
};

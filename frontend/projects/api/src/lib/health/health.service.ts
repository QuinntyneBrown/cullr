import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Health {
  service: 'up' | 'down';
  database: 'up' | 'down';
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  get(): Promise<Health> {
    return firstValueFrom(this.http.get<Health>('/api/health'));
  }
}

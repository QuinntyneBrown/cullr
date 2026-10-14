import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('Given the API answers, When health is requested, Then it reads GET /api/health', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);

    const result = TestBed.inject(HealthService).get();
    http.expectOne('/api/health').flush({ service: 'up', database: 'up' });

    expect(await result).toEqual({ service: 'up', database: 'up' });
    http.verify();
  });
});

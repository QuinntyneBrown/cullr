import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CurationService } from './curation.service';

describe('CurationService', () => {
  let http: HttpTestingController;
  let curation: CurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    curation = TestBed.inject(CurationService);
  });
  afterEach(() => http.verify());

  it('Given ideas and a period, When curating, Then it posts them and returns the result', async () => {
    const result = curation.curate(['a', 'b'], 'week');
    const req = http.expectOne('/api/curation');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ideaIds: ['a', 'b'], period: 'week' });
    const body = { period: 'week', curated: [{ id: 'a', title: 'A' }], alreadyBest: [], displaced: [{ id: 'z', title: 'Z' }] };
    req.flush(body);

    expect(await result).toEqual({ outcome: 'ok', ...body });
  });

  it('Given the idea is archived, When curating, Then the outcome is archived', async () => {
    const result = curation.curate(['a'], 'today');
    http.expectOne('/api/curation').flush({}, { status: 422, statusText: 'x' });

    expect(await result).toEqual({ outcome: 'archived' });
  });

  it('Given the save fails, When curating, Then the outcome is failed', async () => {
    const result = curation.curate(['a'], 'today');
    http.expectOne('/api/curation').flush({}, { status: 500, statusText: 'x' });

    expect(await result).toEqual({ outcome: 'failed' });
  });

  it('Given best-of ideas, When the curated list is requested, Then it is returned', async () => {
    const result = curation.getCurated();
    const list = { asOf: '2026-10-14', items: [], distinctIdeaCount: 0 };
    http.expectOne('/api/curation/curated').flush(list);

    expect(await result).toEqual(list);
  });
});

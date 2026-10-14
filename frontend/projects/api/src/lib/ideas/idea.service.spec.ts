import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IdeaService } from './idea.service';

describe('IdeaService', () => {
  let http: HttpTestingController;
  let ideas: IdeaService;
  const input = { title: 'Porch Light', summary: '', category: 'Product', score: null };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    ideas = TestBed.inject(IdeaService);
  });
  afterEach(() => http.verify());

  it('Given a capture request, When it succeeds, Then it posts the key with the fields and returns the idea', async () => {
    const result = ideas.capture(input, 'key-1');
    const req = http.expectOne('/api/ideas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ...input, captureKey: 'key-1' });
    req.flush({ id: 'a', title: 'Porch Light' }, { status: 201, statusText: 'Created' });

    expect(await result).toEqual({ outcome: 'ok', idea: { id: 'a', title: 'Porch Light' } });
  });

  it('Given the server rejects the fields, When capturing, Then the field errors are returned', async () => {
    const result = ideas.capture(input, 'key-1');
    http.expectOne('/api/ideas').flush({ errors: { title: 'Enter a title for this idea' } }, { status: 400, statusText: 'x' });

    expect(await result).toEqual({ outcome: 'rejected', errors: { title: 'Enter a title for this idea' } });
  });

  it('Given the save fails, When capturing, Then the outcome is failed', async () => {
    const result = ideas.capture(input, 'key-1');
    http.expectOne('/api/ideas').flush({}, { status: 500, statusText: 'x' });

    expect(await result).toEqual({ outcome: 'failed' });
  });

  it('Given no category, When today is requested, Then it gets the summary; with a category it passes it', async () => {
    const all = ideas.today();
    http.expectOne('/api/today').flush({ total: 0 });
    expect(await all).toEqual({ total: 0 });

    const photos = ideas.today('Photography');
    http.expectOne('/api/today?category=Photography').flush({ total: 0 });
    await photos;
  });

  it('Given criteria, When ideas are listed, Then only the set criteria become query parameters', async () => {
    const page = ideas.list({ status: 'Logged', categories: ['Product', 'Engineering'], sort: 'score', query: 'porch', page: 2 });
    const req = http.expectOne((r) => r.url === '/api/ideas');
    expect(req.request.params.get('status')).toBe('Logged');
    expect(req.request.params.getAll('category')).toEqual(['Product', 'Engineering']);
    expect(req.request.params.get('sort')).toBe('score');
    expect(req.request.params.get('q')).toBe('porch');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [] });
    await page;

    const bare = ideas.list({ categories: [], sort: 'newest', query: '', page: 1 });
    const bareReq = http.expectOne((r) => r.url === '/api/ideas');
    expect(bareReq.request.params.keys().sort()).toEqual(['page', 'sort']);
    bareReq.flush({ items: [] });
    await bare;
  });
});

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let navigate: ReturnType<typeof vi.fn>;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  const fail = (status: number, body: object = {}) => {
    http.get('/api/x').subscribe({ error: () => {} });
    backend.expectOne('/api/x').flush(body, { status, statusText: 'x' });
  };

  it('Given a 403 response, When it arrives, Then the Forbidden page is shown', () => {
    fail(403);

    expect(navigate).toHaveBeenCalledWith(['/403']);
  });

  it('Given a 500 response with a reference id, When it arrives, Then Something went wrong is shown with that id', () => {
    fail(500, { referenceId: 'abc-123' });

    expect(navigate).toHaveBeenCalledWith(['/500'], { queryParams: { ref: 'abc-123' } });
  });

  it('Given a 400 validation failure, When it arrives, Then the caller handles it and no page is shown', () => {
    fail(400);

    expect(navigate).not.toHaveBeenCalled();
  });
});

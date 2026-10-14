import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AuthResult {
  outcome: 'ok' | 'rejected' | 'invalid-link' | 'unreachable';
  errors?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  async isSignedIn(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get('/api/auth/session'));
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) return false;
      throw error;
    }
  }

  signIn(email: string, password: string): Promise<AuthResult> {
    return this.post('/api/auth/sign-in', { email, password });
  }

  async signOut(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/sign-out', {}));
  }

  forgotPassword(email: string): Promise<AuthResult> {
    return this.post('/api/auth/forgot-password', { email });
  }

  async isResetLinkValid(token: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get('/api/auth/reset-password', { params: { token } }));
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 410) return false;
      throw error;
    }
  }

  resetPassword(token: string, password: string): Promise<AuthResult> {
    return this.post('/api/auth/reset-password', { token, password });
  }

  private async post(url: string, body: object): Promise<AuthResult> {
    try {
      await firstValueFrom(this.http.post(url, body));
      return { outcome: 'ok' };
    } catch (error) {
      if (!(error instanceof HttpErrorResponse)) throw error;
      if (error.status === 0 || error.status === 503) return { outcome: 'unreachable' };
      if (error.status === 410) return { outcome: 'invalid-link' };
      if (error.status === 400 || error.status === 401) {
        const errors = (error.error as { errors?: Record<string, string> } | null)?.errors;
        return errors ? { outcome: 'rejected', errors } : { outcome: 'rejected' };
      }
      throw error;
    }
  }
}

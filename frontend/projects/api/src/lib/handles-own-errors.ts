import { HttpContextToken } from '@angular/common/http';

// Requests that show their own failure state instead of being redirected to a full-page error.
export const HANDLES_OWN_ERRORS = new HttpContextToken<boolean>(() => false);

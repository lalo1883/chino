import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { getPool } from './db';

export const auth = betterAuth({
  appName: 'Mǐ diario',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: getPool(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 20,
    // Classmates often sign up together from one school Wi-Fi IP; the default
    // allows only 3 sign-ins per 10 s per IP.
    customRules: {
      '/sign-in/*': { window: 60, max: 30 },
      '/sign-up/*': { window: 60, max: 30 },
    },
  },
  plugins: [nextCookies()],
});

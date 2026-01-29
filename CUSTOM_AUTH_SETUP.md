# Custom Authentication System Setup

This project now uses a custom authentication system instead of Better Auth to avoid schema compatibility issues.

## Installation Required

Install the `jose` package for JWT handling:

```bash
npm install jose
```

## What Changed

### 1. **Custom Auth System** (`src/lib/auth-custom.ts`)
- JWT-based session management using `jose`
- Cookie-based sessions (httpOnly, secure in production)
- Direct database operations using Prisma
- Password hashing with bcrypt (already installed)

### 2. **Updated Actions**
- `src/app/actions/register.ts` - Now uses custom auth
- `src/app/actions/login.ts` - Now uses custom auth  
- `src/app/actions/logout.ts` - Now uses custom auth

### 3. **Updated Utilities**
- `src/lib/auth-server.ts` - Uses custom session management
- `src/middleware.ts` - Uses custom session verification

### 4. **Client-Side Auth**
The `src/lib/auth-client.ts` file still references Better Auth for Google OAuth. You'll need to:
- Either keep Better Auth just for Google OAuth
- Or implement Google OAuth manually using `next-auth` or `google-auth-library`

## Features

✅ Email/Password authentication
✅ Session management with JWT
✅ Secure cookie handling
✅ Works with existing database schema
✅ No adapter compatibility issues

## Google OAuth

For Google OAuth, you have two options:

### Option 1: Keep Better Auth for OAuth only
- Keep the Better Auth setup but only use it for Google OAuth
- Use custom auth for email/password

### Option 2: Implement Google OAuth manually
- Use `google-auth-library` or `next-auth` just for OAuth
- Handle the OAuth flow manually

## Environment Variables

Make sure you have:
- `NEXTAUTH_SECRET` or `BETTER_AUTH_SECRET` - Used for JWT signing
- `GOOGLE_CLIENT_ID` - For Google OAuth (if using)
- `GOOGLE_CLIENT_SECRET` - For Google OAuth (if using)

## Testing

1. Install jose: `npm install jose`
2. Test registration: Should create user and session
3. Test login: Should verify password and create session
4. Test logout: Should delete session cookie
5. Test protected routes: Should redirect to login if not authenticated

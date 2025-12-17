# Authentication Flow Review

## Overview

This document reviews the complete authentication flow for signup and login, including security, user experience, and potential issues.

---

## 🔄 Authentication Flow Diagrams

### **Signup Flow (Email/Password)**

```
User → /sign-up page
  ↓
Fill form (name, email, password)
  ↓
Submit → register() action
  ↓
Validation (Zod schema)
  ↓
Check if email exists
  ↓
Hash password (bcrypt, 10 rounds)
  ↓
Create user in database
  ↓
Auto-login via login() action
  ↓
Redirect to /company-details
```

### **Signup Flow (Google OAuth)**

```
User → /sign-up page
  ↓
Click "Continue with Google"
  ↓
handleGoogleSignin() → signIn("google")
  ↓
Redirect to Google OAuth
  ↓
User authorizes
  ↓
Google redirects back → NextAuth callback
  ↓
PrismaAdapter creates/updates user
  ↓
signIn callback extracts firstName/lastName
  ↓
Session created → Redirect to /new-application
```

### **Login Flow (Email/Password)**

```
User → /login page
  ↓
Fill form (email, password)
  ↓
Submit → login() action
  ↓
Validation (Zod schema)
  ↓
Find user by email
  ↓
Check if user exists and has password
  ↓
signIn("credentials") → NextAuth
  ↓
NextAuth authorize() → bcrypt.compare()
  ↓
If match → Create session
  ↓
Redirect to /new-application
```

### **Login Flow (Google OAuth)**

```
User → /login page
  ↓
Click "Continue with Google"
  ↓
handleGoogleSignin() → signIn("google")
  ↓
Redirect to Google OAuth
  ↓
User authorizes (if not already)
  ↓
Google redirects back → NextAuth callback
  ↓
PrismaAdapter finds existing user
  ↓
signIn callback updates firstName/lastName
  ↓
Session created → Redirect to /new-application
```

---

## ✅ **What's Working Well**

### 1. **Security**
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Password validation (8-64 chars, alphanumeric + special chars)
- ✅ Email validation via Zod
- ✅ NextAuth handles session management securely
- ✅ PrismaAdapter prevents SQL injection
- ✅ OAuth properly configured

### 2. **User Experience**
- ✅ Auto-login after signup (credentials)
- ✅ Clear error messages
- ✅ Loading states during auth
- ✅ Redirect to callback URL after login
- ✅ Forgot password flow available

### 3. **Code Quality**
- ✅ Server actions for auth logic
- ✅ Zod validation schemas
- ✅ TypeScript types
- ✅ React Hook Form for form management

---

## ⚠️ **Issues & Recommendations**

### **CRITICAL Issues**

#### 1. **Password Validation Too Restrictive**
**Location**: `src/components/form/sign-up/index.ts` & `src/components/form/login/index.ts`

**Issue**: 
```typescript
.refine(
  (value) => /^[a-zA-Z0-9_.-]*$/.test(value ?? ""),
  "password should contain only alphabets and numbers",
)
```

**Problem**: 
- Regex only allows alphanumeric + `_`, `.`, `-`
- **Does NOT allow**: `!@#$%^&*()` etc. (common special chars)
- This contradicts the error message saying "only alphabets and numbers"
- Users can't use strong passwords with special characters

**Fix**:
```typescript
// Option 1: Remove the restriction entirely
password: z.string()
  .min(8, { message: "Your password must be at least 8 characters long" })
  .max(64, { message: "Your password cannot be longer than 64 characters" }),

// Option 2: Allow all special characters
password: z.string()
  .min(8, { message: "Your password must be at least 8 characters long" })
  .max(64, { message: "Your password cannot be longer than 64 characters" })
  .refine(
    (value) => /^[\x20-\x7E]*$/.test(value ?? ""), // Printable ASCII
    "Password contains invalid characters",
  ),
```

#### 2. **Login Page Google Button Says "signup"**
**Location**: `src/app/(auth)/login/page.tsx` line 158

**Issue**:
```typescript
<GoogleAuthButton method="signup" />  // Should be "signin"
```

**Problem**: Button says "signup" but user is on login page. This is confusing.

**Fix**:
```typescript
<GoogleAuthButton method="signin" />
```

#### 3. **No Email Verification**
**Issue**: Users can sign up without verifying their email address.

**Problems**:
- Invalid emails can be used
- No way to recover account if email is wrong
- GDPR compliance issue (can't contact users)
- Security risk (account takeover if email is compromised)

**Recommendation**: Implement email verification flow:
1. Send verification email after signup
2. Require verification before full access
3. Add "Resend verification email" option

#### 4. **Auto-Login After Signup Has Error Handling Issue**
**Location**: `src/app/(auth)/sign-up/page.tsx` lines 75-81

**Issue**:
```typescript
const res = await login(values, callbackUrl);
if (res?.error) {
  setError("Registration successful, but failed to log in");
} else {
  router.push("/company-details");
}
```

**Problems**:
- If login fails, user is stuck (account created but can't log in)
- No retry mechanism
- Error message doesn't guide user to next steps

**Recommendation**:
```typescript
if (res?.error) {
  setError("Registration successful! Please log in manually.");
  // Redirect to login page with email pre-filled
  router.push(`/login?email=${encodeURIComponent(values.email)}`);
} else {
  router.push("/company-details");
}
```

#### 5. **Inconsistent Redirect After Signup**
**Location**: `src/app/(auth)/sign-up/page.tsx`

**Issue**: 
- Signup redirects to `/company-details` (hardcoded)
- Ignores `callbackUrl` parameter
- Login redirects to `/new-application` (hardcoded)

**Recommendation**: Use callbackUrl consistently:
```typescript
const callbackUrl = searchParams.get("callbackUrl") || "/company-details";
// ... after successful login
router.push(callbackUrl);
```

### **Medium Priority Issues**

#### 6. **Name Splitting Logic**
**Location**: `src/app/actions/register.ts` lines 34-36

**Issue**:
```typescript
const parts = name.trim().split(" ");
const firstName = parts[0];
const lastName = parts.slice(1).join(" ") || "";
```

**Problems**:
- Single name users get empty lastName (may violate schema)
- Names like "Mary Jane Watson" → firstName: "Mary", lastName: "Jane Watson"
- No handling for titles (Dr., Mr., etc.)

**Recommendation**: Better name parsing or ask for firstName/lastName separately.

#### 7. **Duplicate User Check in Login**
**Location**: `src/app/actions/login.ts` line 24

**Issue**: 
```typescript
const existingUser = await client.user.findUnique({ where: { email } });
```

**Problem**: This duplicates the check that NextAuth already does in `authorize()`. Unnecessary database query.

**Recommendation**: Remove this check, let NextAuth handle it.

#### 8. **No Rate Limiting**
**Issue**: No rate limiting on login/signup endpoints.

**Risk**: 
- Brute force attacks
- Account enumeration (checking if emails exist)
- DDoS attacks

**Recommendation**: Add rate limiting (e.g., 5 attempts per 15 minutes per IP).

#### 9. **Error Messages Too Generic**
**Location**: Multiple places

**Issue**: 
- "Invalid credentials!" doesn't distinguish between wrong email vs wrong password
- "Email already in use!" reveals if email exists (account enumeration)

**Recommendation**:
```typescript
// For login: Generic message to prevent enumeration
return { error: "Invalid email or password" };

// For signup: Can be specific (user is trying to create account)
return { error: "An account with this email already exists" };
```

#### 10. **Google OAuth Button Logic**
**Location**: `src/components/GoogleOAuthButton.tsx`

**Issue**: `method` prop is passed but never used. Button always does the same thing.

**Recommendation**: Either use the prop or remove it.

#### 11. **No Account Lockout**
**Issue**: No protection against brute force attacks.

**Recommendation**: 
- Lock account after N failed attempts
- Require email verification to unlock
- Or implement CAPTCHA after 3 failed attempts

#### 12. **Session Configuration**
**Location**: `auth.ts` line 118

**Issue**: No explicit session maxAge or cookie security settings.

**Recommendation**: Add session configuration:
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

### **Low Priority / UX Issues**

#### 13. **Console Logs in Production**
**Location**: Multiple files (login.ts, register.ts, etc.)

**Issue**: Console.log statements that should be removed or use proper logging.

**Recommendation**: Use a logging library or remove in production.

#### 14. **No Password Strength Indicator**
**Issue**: Users don't know if their password is strong.

**Recommendation**: Add password strength meter.

#### 15. **No "Remember Me" Option**
**Issue**: No way for users to extend session duration.

**Recommendation**: Add checkbox for longer sessions.

---

## 🔒 **Security Checklist**

- [x] Passwords hashed (bcrypt)
- [x] Password validation
- [x] Email validation
- [x] SQL injection protection (Prisma)
- [x] Session management (NextAuth)
- [ ] Rate limiting
- [ ] Account lockout
- [ ] Email verification
- [ ] CAPTCHA for repeated failures
- [ ] Password strength indicator
- [ ] Session security headers

---

## 🇪🇺 **GDPR Compliance for Auth**

### **Missing Requirements**

1. **Consent Checkbox**: No checkbox for privacy policy acceptance during signup
2. **Data Minimization**: Collecting contactFirstName/contactLastName duplicates firstName/lastName
3. **Right to Deletion**: No account deletion feature
4. **Data Portability**: No way to export user data

---

## 📋 **Recommended Fixes Priority**

### **Immediate (Before Launch)**
1. ✅ Fix password validation regex
2. ✅ Fix Google button method on login page
3. ✅ Improve error handling in signup flow
4. ✅ Add email verification
5. ✅ Use callbackUrl consistently

### **High Priority (Within 1 Month)**
1. ✅ Add rate limiting
2. ✅ Improve error messages (prevent enumeration)
3. ✅ Add account lockout
4. ✅ Add consent checkbox
5. ✅ Remove duplicate user check in login

### **Medium Priority (Within 3 Months)**
1. ✅ Add password strength indicator
2. ✅ Improve name parsing
3. ✅ Add "Remember Me" option
4. ✅ Remove console logs
5. ✅ Add proper logging

---

## 🧪 **Testing Recommendations**

1. **Test Cases to Add**:
   - Signup with existing email
   - Login with wrong password (multiple attempts)
   - Google OAuth for new user
   - Google OAuth for existing user
   - Signup → auto-login → redirect
   - Login with callbackUrl
   - Password reset flow
   - Special characters in password
   - Very long names
   - Single-word names

2. **Security Testing**:
   - Brute force attack simulation
   - SQL injection attempts
   - XSS in form fields
   - CSRF token validation

---

## 📝 **Code Examples for Fixes**

### Fix Password Validation
```typescript
// src/components/form/sign-up/index.ts
export const SignUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("You must give a valid email"),
  password: z
    .string()
    .min(8, { message: "Your password must be at least 8 characters long" })
    .max(64, { message: "Your password cannot be longer than 64 characters" }),
  // Remove the restrictive regex
})
```

### Fix Login Page Google Button
```typescript
// src/app/(auth)/login/page.tsx line 158
<GoogleAuthButton method="signin" />
```

### Improve Signup Error Handling
```typescript
// src/app/(auth)/sign-up/page.tsx
const res = await login(values, callbackUrl);
if (res?.error) {
  setSuccess("Account created! Redirecting to login...");
  setTimeout(() => {
    router.push(`/login?email=${encodeURIComponent(values.email)}`);
  }, 2000);
} else {
  router.push(callbackUrl || "/company-details");
}
```

---

**Last Updated**: $(date)
**Reviewer**: AI Security Audit
**Next Review**: After implementing critical fixes

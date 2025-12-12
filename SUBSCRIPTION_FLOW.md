# Subscription Flow Documentation

## How It Works

### 1. **User Initiates Subscription**

**Where users can subscribe:**
- Landing page: "Pro" plan card → Click "Get Started"
- Sidebar menu: "Upgrade" button

**What happens:**
```typescript
// User clicks button → Calls /api/subscribe
POST /api/subscribe
Body: { isAnnual: false } // or true for annual
```

### 2. **Checkout Session Creation** (`/api/subscribe`)

**Steps:**
1. Authenticates user (checks session)
2. Gets or creates Stripe customer
3. Determines price ID (monthly vs annual from env vars)
4. Creates Stripe Checkout Session
5. Returns checkout URL

**Success/Cancel URLs:**
- ✅ Success: `/grant-database?subscription=success`
- ❌ Cancel: `/?subscription=canceled`

**Metadata passed:**
- `userId` in session metadata
- `userId` in subscription metadata (for webhook)

### 3. **User Completes Payment**

User is redirected to Stripe Checkout, enters payment details, and completes payment.

### 4. **Webhook Updates Database** (`/api/stripe/webhook`)

**Stripe sends webhook events:**

#### `checkout.session.completed`
- Triggered when payment succeeds
- Creates/updates `Subscription` record in database
- Sets status to `ACTIVE` or `TRIALING`
- Stores:
  - `stripeSubscriptionId`
  - `plan` (always `PRO`)
  - `period` (`MONTHLY` or `ANNUAL`)
  - `status` (mapped from Stripe)
  - `startDate` and `endDate`

#### `customer.subscription.updated`
- Triggered when subscription changes (renewal, plan change, etc.)
- Updates existing `Subscription` record
- Updates status and dates

#### `customer.subscription.deleted`
- Triggered when subscription is canceled
- Updates status to `CANCELED`
- Sets `endDate` to cancellation date

### 5. **User Redirected Back**

After payment:
- User redirected to: `/grant-database?subscription=success`
- You can show a success message based on this URL parameter

## Database Schema

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  stripeSubscriptionId String             @unique
  plan                 Plan               @default(PRO)      // Always PRO for now
  period               SubscriptionPeriod                      // MONTHLY or ANNUAL
  status               SubscriptionStatus                      // ACTIVE, TRIALING, CANCELED, etc.
  startDate            DateTime
  endDate              DateTime
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  user                 User               @relation(...)
}
```

## Helper Functions

### `hasActiveSubscription(userId: string)`
Checks if user has active subscription:
- Status is `ACTIVE` or `TRIALING`
- `endDate` is in the future

### `getSubscriptionDetails(userId: string)`
Returns full subscription details including plan, period, status, and dates.

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Frontend Integration

### Plan Card Component
- If `paymentLink` prop exists → Calls `/api/subscribe` on click
- Shows loading state while creating checkout
- Redirects to Stripe checkout URL

### Menu Component
- "Upgrade" button calls `/api/subscribe` with monthly plan
- Redirects to Stripe checkout

## Status Update Flow

```
User clicks subscribe
    ↓
POST /api/subscribe → Creates checkout session
    ↓
User redirected to Stripe Checkout
    ↓
User completes payment
    ↓
Stripe sends webhook: checkout.session.completed
    ↓
Webhook creates Subscription record in DB
    ↓
User redirected to success page
    ↓
Frontend can check subscription status
```

## Testing

1. **Test checkout:**
   - Click "Get Started" on Pro plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry, any CVC

2. **Test webhook:**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Or configure webhook in Stripe Dashboard

3. **Check database:**
   - Verify `Subscription` record created
   - Check status is `ACTIVE`
   - Verify dates are correct

## Important Notes

- Webhook is the **source of truth** for subscription status
- Always verify webhook signature
- Database is updated asynchronously via webhook
- User might see success page before webhook processes (add polling if needed)




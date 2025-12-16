# Testing Stripe Webhooks on Localhost

## Why Webhooks Don't Work on Localhost

Stripe **cannot** send webhooks directly to `localhost` because:
- `localhost` is only accessible on your computer
- Stripe's servers are on the internet and can't reach your local machine
- Webhooks require a publicly accessible URL

## Solution: Use Stripe CLI

The Stripe CLI creates a secure tunnel that forwards webhook events from Stripe to your local server.

### Step 1: Install Stripe CLI

**macOS (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (using Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download the latest release from:
# https://github.com/stripe/stripe-cli/releases
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Forward Webhooks to Localhost

In a **separate terminal** (keep your Next.js dev server running), run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Step 4: Update Your .env File

Copy the webhook signing secret from the CLI output and add it to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** This secret is different from the one in your Stripe Dashboard. The CLI generates a special secret for local development.

### Step 5: Test the Webhook

1. Make sure your Next.js dev server is running (`npm run dev`)
2. Make sure the Stripe CLI is forwarding (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
3. Complete a test payment on your localhost site
4. You should see webhook events in both:
   - Your Next.js server logs (the webhook handler)
   - The Stripe CLI terminal (showing events being forwarded)

### Step 6: Trigger Test Events

You can also manually trigger test events:

```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed

# Trigger an invoice.payment_succeeded event
stripe trigger invoice.payment_succeeded

# Trigger a subscription deletion
stripe trigger customer.subscription.deleted
```

## Alternative: Using ngrok (Not Recommended)

If you prefer ngrok over Stripe CLI:

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start your Next.js server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Stripe Dashboard → Webhooks → Add endpoint:
   - URL: `https://abc123.ngrok.io/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
6. Copy the webhook signing secret to your `.env`

**Note:** Stripe CLI is recommended because it's simpler and doesn't require updating the Stripe Dashboard.

## Production Setup

For production, you'll need to:
1. Deploy your app to a publicly accessible URL
2. In Stripe Dashboard → Webhooks → Add endpoint
3. Enter your production webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select the events you want to listen to
5. Copy the webhook signing secret to your production environment variables

## Troubleshooting

**Webhook not being received:**
- ✅ Check that Stripe CLI is running
- ✅ Check that your Next.js server is running on port 3000
- ✅ Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
- ✅ Check server logs for errors

**Signature verification failing:**
- Make sure you're using the webhook secret from `stripe listen` (not from Stripe Dashboard)
- The secret should start with `whsec_`

**Events not showing up:**
- Make sure you're using test mode in Stripe
- Check that the events are enabled in your webhook configuration







import { client } from "@/lib/prisma";

/**
 * Check if a user has an active subscription
 * A subscription is active if:
 * - hasPaid is true
 * - Status is 'active' or 'trialing'
 * - Not expired (subscriptionEndsAt is in the future)
 * - Not set to cancel at period end (cancelAtPeriodEnd is false)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        hasPaid: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!user) return false;

    // Check if subscription is active
    const isActiveStatus = ['active', 'trialing'].includes(user.subscriptionStatus || '');
    
    // Check if subscription hasn't expired
    const isNotExpired = !user.subscriptionEndsAt || user.subscriptionEndsAt > new Date();

    // Check if not set to cancel at period end
    const notCanceling = !user.cancelAtPeriodEnd;

    // User must have hasPaid = true, active status, not expired, and not canceling
    return user.hasPaid === true && isActiveStatus && isNotExpired && notCanceling;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string) {
  try {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        hasPaid: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!user) return null;

    return {
      hasPaid: user.hasPaid,
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      endsAt: user.subscriptionEndsAt,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
      subscriptionId: user.stripeSubscriptionId,
      customerId: user.stripeCustomerId,
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
}


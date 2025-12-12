import { client } from "@/lib/prisma";

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Check if subscription model exists (in case migration hasn't been run)
    if (!client.subscription) {
      console.warn('Subscription model not available in Prisma client. Make sure to run database migrations.');
      return false;
    }

    const subscription = await client.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    // Check if subscription is active
    const isActive = subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
    
    // Check if subscription hasn't expired
    const isNotExpired = subscription.endDate > new Date();

    return isActive && isNotExpired;
  } catch (error: any) {
    // Handle case where table doesn't exist yet
    if (error?.code === 'P2021' || error?.code === '42P01') {
      console.warn('Subscription table does not exist. Please run database migrations.');
      return false;
    }
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
        stripeCustomerId: true,
        subscription: {
          select: {
            id: true,
            stripeSubscriptionId: true,
            plan: true,
            period: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      customerId: user.stripeCustomerId,
      subscription: user.subscription,
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
}


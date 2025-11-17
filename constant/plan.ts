import { PlanType, SubscriptionStatus } from '@/lib/db'

export const FreePlan = {
  planType: PlanType.FREE,
  status: SubscriptionStatus.ACTIVE,
  endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
}

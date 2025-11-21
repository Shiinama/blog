export type GrantSubscriptionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string[]>
}

export const initialGrantSubscriptionState: GrantSubscriptionState = {
  status: 'idle'
}

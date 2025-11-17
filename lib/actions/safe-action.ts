'use server'

import { createSafeActionClient } from 'next-safe-action'

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error('[safe-action] server error', error)
    return 'Something went wrong'
  }
})

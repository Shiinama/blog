'use server'

import { z } from 'zod'

import { signIn, signOut } from '@/lib/auth'

import type { ActionState } from './types'

/** Only same-site relative paths, so the sign-in flow can't be turned into an open redirect. */
const redirectTo = z
  .string()
  .regex(/^\/(?!\/)/)
  .catch('/')

export async function signInWithProvider(provider: 'google' | 'github', formData: FormData) {
  await signIn(provider, { redirectTo: redirectTo.parse(formData.get('redirectTo')) })
}

const emailSchema = z.object({ email: z.email(), redirectTo })

export async function signInWithEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, error: 'invalidEmail' }
  // Throws a redirect to the "check your inbox" page on success.
  await signIn('resend', { email: parsed.data.email, redirectTo: parsed.data.redirectTo })
  return { ok: true }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' })
}

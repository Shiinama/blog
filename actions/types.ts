import messages from '@/messages/en.json'

import type { z } from 'zod'

/** A message key under `actions.errors`. */
export type ActionErrorKey = keyof (typeof messages)['actions']['errors']

/** Result shape shared by every form action (`useActionState`). */
export type ActionState =
  | { ok: true }
  | {
      ok: false
      error: ActionErrorKey
      fieldErrors?: Partial<Record<string, ActionErrorKey>>
      /** What was submitted, for `defaultValue`s: React resets a form after every action, even failed ones. */
      values?: Record<string, string>
    }
  | null

const errorKeys = new Set(Object.keys(messages.actions.errors))
const toErrorKey = (message: string): ActionErrorKey =>
  errorKeys.has(message) ? (message as ActionErrorKey) : 'invalid'

const submitted = (formData?: FormData) =>
  formData &&
  Object.fromEntries([...formData].filter((entry): entry is [string, string] => typeof entry[1] === 'string'))

export const fail = (error: ActionErrorKey, formData?: FormData): ActionState => ({
  ok: false,
  error,
  values: submitted(formData)
})

/** Zod failure → one message key per field. Schemas use message keys as their custom messages. */
export function invalid(error: z.ZodError, formData?: FormData): ActionState {
  const fieldErrors: Partial<Record<string, ActionErrorKey>> = {}
  for (const issue of error.issues) {
    fieldErrors[String(issue.path[0] ?? 'form')] ??= toErrorKey(issue.message)
  }
  return { ok: false, error: 'invalid', fieldErrors, values: submitted(formData) }
}

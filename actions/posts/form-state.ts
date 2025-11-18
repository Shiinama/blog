export type PostFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string[]>
  redirectTo?: string
}

export const initialPostFormState: PostFormState = {
  status: 'idle'
}

import LoginForm from '@/components/login-form'
import { redirect } from '@/i18n/navigation'
import { auth } from '@/lib/auth'

export default async function Login() {
  const session = await auth()
  if (session?.user) redirect('/')

  return (
    <div className="animate-gradient-x from-primary via-secondary to-accent flex min-h-screen items-center justify-center bg-linear-to-br">
      <div className="bg-background/80 w-full max-w-md transform rounded-lg shadow-2xl backdrop-blur-md">
        <div className="rounded-md bg-black/50 p-6">
          <h1 className="mb-6 text-center text-3xl text-white drop-shadow-md">Welcome to 鱼的杂记</h1>
          <p className="mb-8 text-center text-lg font-medium text-white drop-shadow-sm">
            Sign in to continue your journey
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

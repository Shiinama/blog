import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth, { DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import ResendProvider from 'next-auth/providers/resend'

import { accounts, createDb, sessions, users, verificationTokens } from '@/lib/db'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  const db = createDb()

  return {
    providers: [
      GoogleProvider,
      ResendProvider({
        from: 'no-reply@linkai.website'
      }),
      GitHub
    ],
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens
    })
  }
})

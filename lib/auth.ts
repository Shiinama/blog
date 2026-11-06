import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'

import { accounts, users, verificationTokens } from '@/drizzle/schema'
import { getDb } from '@/lib/db'

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

// Providers read AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET and AUTH_RESEND_KEY from the environment.
export const { auth, handlers, signIn, signOut } = NextAuth(async () => ({
  adapter: DrizzleAdapter(await getDb(), {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens
  }),
  providers: [Google, GitHub, Resend({ from: 'no-reply@xibaoyu.xyz' })],
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in', verifyRequest: '/sign-in?sent=1' },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    }
  }
}))

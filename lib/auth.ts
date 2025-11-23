import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth, { DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import ResendProvider from 'next-auth/providers/resend'

import { accounts, sessions, users, verificationTokens } from '@/drizzle/schema'

import { createDb } from './db'

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
        from: 'no-reply@xibaoyu.xyz'
      }),
      GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET })
    ],
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens
    }),
    session: {
      strategy: 'jwt'
    },
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user) {
          token.id = user.id
        }
        return token
      },
      session: async ({ session, token }) => {
        if (token && session.user) {
          session.user.id = token.id as string
        }
        return session
      }
    }
  }
})

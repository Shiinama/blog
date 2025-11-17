import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth, { DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import ResendProvider from 'next-auth/providers/resend'

import { FreePlan } from '@/constant/plan'
import {
  accounts,
  createDb,
  sessions,
  type Subscription,
  subscriptions,
  type UserRole as DbUserRole,
  UserRole,
  users,
  verificationTokens
} from '@/lib/db'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      subscription: Subscription | null
      role: DbUserRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: DbUserRole
    subscription?: Subscription | null
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
      users,
      accounts,
      sessions,
      verificationTokens
    }),
    session: {
      strategy: 'jwt'
    },
    callbacks: {
      jwt: async ({ token, trigger }) => {
        const dbUser =
          token.email &&
          (await db.query.users.findFirst({
            where: (table, { eq }) => eq(table.email, token.email!),
            with: {
              subscription: true
            }
          }))

        if (trigger === 'signUp' && token.email && dbUser) {
          await db
            .insert(subscriptions)
            .values({
              id: crypto.randomUUID(),
              userId: dbUser.id,
              planType: FreePlan.planType,
              status: FreePlan.status,
              startDate: new Date(),
              endDate: FreePlan.endDate,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .onConflictDoNothing()
        }

        if (dbUser) {
          token.id = dbUser.id
          token.subscription = dbUser.subscription
          token.role = dbUser.role
        }

        return token
      },
      session: ({ session, token }) => {
        if (token && session.user) {
          session.user = {
            ...session.user,
            // @ts-expect-error: has id
            id: token.id!,
            name: token.name,
            email: token.email ?? '',
            image: token.picture,
            subscription: (token.subscription as Subscription | null) ?? null,
            role: (token.role as DbUserRole) ?? UserRole.USER
          }
        }

        return session
      }
    }
  }
})

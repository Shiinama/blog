import { PrismaAdapter } from '@auth/prisma-adapter'
import { Subscription } from '@prisma/client'
import NextAuth, { DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import ResendProvider from 'next-auth/providers/resend'

import { FreePlan } from '@/constant/plan'

import prisma from '../prisma/client'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      subscription: Subscription
    } & DefaultSession['user']
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider,
    ResendProvider({
      from: 'no-reply@linkai.website'
    }),
    GitHub
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    jwt: async ({ token, trigger }) => {
      const db_user = await prisma.user.findFirst({
        where: {
          email: token.email
        },
        include: {
          subscription: true
        }
      })
      if (trigger === 'signUp' && token.email) {
        await prisma.user.update({
          where: { email: token.email },
          data: {
            subscription: {
              create: FreePlan
            }
          }
        })
      }
      if (db_user) {
        token.id = db_user.id
        token.subscription = db_user.subscription
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
          subscription: token.subscription as Subscription
        }
      }

      return session
    }
  }
})

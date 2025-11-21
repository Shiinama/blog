import { relations, sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

import type { AdapterAccountType } from 'next-auth/adapters'

export const users = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image')
})

export const accounts = sqliteTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state')
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  ]
)

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull()
})

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull()
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token]
    })
  ]
)

export const authenticators = sqliteTable(
  'authenticator',
  {
    credentialID: text('credentialID').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: integer('credentialBackedUp', {
      mode: 'boolean'
    }).notNull(),
    transports: text('transports')
  },
  (authenticator) => [
    primaryKey({
      columns: [authenticator.userId, authenticator.credentialID]
    })
  ]
)

export const categories = sqliteTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export type Category = typeof categories.$inferSelect

export const postStatusEnum = ['DRAFT', 'PUBLISHED'] as const
export type PostStatus = (typeof postStatusEnum)[number]

export const posts = sqliteTable('posts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  coverImageUrl: text('cover_image_url'),
  content: text('content').notNull(),
  status: text('status', { enum: postStatusEnum }).$type<PostStatus>().notNull().default('DRAFT'),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  isSubscriptionOnly: integer('is_subscription_only', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  tags: text('tags', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  language: text('language').notNull().default('zh'),
  readingTime: integer('reading_time').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export type Post = typeof posts.$inferSelect

export const postTranslations = sqliteTable('postTranslations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text('postId')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  coverImageUrl: text('cover_image_url'),
  locale: text('locale').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export type ProductType = 'one_time' | 'subscription'
export type SubscriptionInterval = 'day' | 'week' | 'month' | 'year'
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'credit_card' | 'paypal' | 'upgrade.chat' | 'other'
export type TransactionType = 'purchase' | 'usage' | 'refund' | 'subscription_renewal' | 'gift' | 'promotion'
export type Currency = 'USD' | 'CNY' | 'EUR' | 'JPY' | 'GBP'

// Products table for purchasable items and subscriptions
export const products = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').$type<ProductType>().notNull(),
  price: real('price').notNull(),
  currency: text('currency').$type<Currency>().notNull().default('USD'),
  interval: text('interval').$type<SubscriptionInterval>(), // Only used for subscription products
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

// Orders table recording all transactions
export const orders = sqliteTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
  productId: text('productId')
    .notNull()
    .references(() => products.id),
  status: text('status').$type<OrderStatus>().notNull().default('pending'),
  transactionType: text('transactionType').$type<TransactionType>(),
  paymentMethod: text('paymentMethod').$type<PaymentMethod>(),
  paymentIntentId: text('paymentIntentId'), // Payment processor transaction ID
  metadata: text('metadata'), // Extra metadata stored as JSON
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

// Subscriptions table tracking active subscriptions
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
  productId: text('productId')
    .notNull()
    .references(() => products.id),
  orderId: text('orderId').references(() => orders.id),
  expiredAt: integer('current_period_end', { mode: 'timestamp_ms' }).notNull(),
  cancelAt: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts)
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id]
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id]
  }),
  translations: many(postTranslations)
}))

export const postTranslationsRelations = relations(postTranslations, ({ one }) => ({
  post: one(posts, {
    fields: [postTranslations.postId],
    references: [posts.id]
  })
}))

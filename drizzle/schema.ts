import { relations, sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import type { AdapterAccountType } from 'next-auth/adapters'

/**
 * Timestamps are stored as integer milliseconds. The SQL default keeps raw inserts
 * (migrations, D1 console) correct; `$defaultFn` / `$onUpdateFn` keep ORM writes explicit.
 */
const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' })
const createdAt = () =>
  timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`)
    .$defaultFn(() => new Date())
const updatedAt = () =>
  timestamp('updated_at')
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`)
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

// ---------------------------------------------------------------------------
// Auth.js (JWT sessions, so no session/authenticator tables)
// Property names follow the Auth.js Drizzle adapter contract; column names are snake_case.
// ---------------------------------------------------------------------------

export const users = sqliteTable('users', {
  id: id(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image')
})

export const accounts = sqliteTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state')
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index('accounts_user_idx').on(table.userId)
  ]
)

export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires').notNull()
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
)

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const categories = sqliteTable('categories', {
  id: id(),
  /** Stable slug; also the `article.categories.*` message key suffix. */
  key: text('key').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})

export const postStatuses = ['DRAFT', 'PUBLISHED'] as const
export type PostStatus = (typeof postStatuses)[number]

export const posts = sqliteTable(
  'posts',
  {
    id: id(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    content: text('content').notNull(),
    coverImageUrl: text('cover_image_url'),
    /** Locale the post was originally written in; other locales live in `post_translations`. */
    locale: text('locale').notNull(),
    status: text('status', { enum: postStatuses }).notNull().default('DRAFT'),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    tags: text('tags', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    isMembersOnly: integer('is_members_only', { mode: 'boolean' }).notNull().default(false),
    /** Set when the content-signals API hands this post out. */
    signalClaimedAt: timestamp('signal_claimed_at'),
    publishedAt: timestamp('published_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    index('posts_status_published_idx').on(table.status, table.publishedAt),
    index('posts_category_idx').on(table.categoryId)
  ]
)

export const postTranslations = sqliteTable(
  'post_translations',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    content: text('content').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [primaryKey({ columns: [table.postId, table.locale] })]
)

export const comments = sqliteTable(
  'comments',
  {
    id: id(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: createdAt()
  },
  (table) => [index('comments_post_created_idx').on(table.postId, table.createdAt)]
)

// ---------------------------------------------------------------------------
// Memberships (granted manually by an admin)
// ---------------------------------------------------------------------------

export const memberships = sqliteTable(
  'memberships',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    note: text('note'),
    grantedBy: text('granted_by'),
    createdAt: createdAt()
  },
  (table) => [index('memberships_user_expires_idx').on(table.userId, table.expiresAt)]
)

// ---------------------------------------------------------------------------
// Relations & types
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts)
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  translations: many(postTranslations),
  comments: many(comments)
}))

export const postTranslationsRelations = relations(postTranslations, ({ one }) => ({
  post: one(posts, { fields: [postTranslations.postId], references: [posts.id] })
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.userId], references: [users.id] })
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] })
}))

export type Category = typeof categories.$inferSelect
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type PostTranslation = typeof postTranslations.$inferSelect
export type Comment = typeof comments.$inferSelect
export type Membership = typeof memberships.$inferSelect

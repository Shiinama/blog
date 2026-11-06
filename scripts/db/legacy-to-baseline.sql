-- One-off migration of the pre-2026-11 schema into `0000_baseline`.
-- Run through `pnpm db:rebuild -- --local|--remote`; the baseline DDL is spliced in at the marker below.
--
-- Order matters: legacy tables are renamed (not dropped) first so the baseline can reuse the names,
-- rows are copied and cleaned, then legacy tables are dropped child-first so `ON DELETE CASCADE`
-- never fires against data we still need.

PRAGMA defer_foreign_keys = on;

ALTER TABLE `comments` RENAME TO `_legacy_comments`;
ALTER TABLE `postTranslations` RENAME TO `_legacy_post_translations`;
ALTER TABLE `posts` RENAME TO `_legacy_posts`;
ALTER TABLE `categories` RENAME TO `_legacy_categories`;
ALTER TABLE `subscriptions` RENAME TO `_legacy_subscriptions`;
ALTER TABLE `orders` RENAME TO `_legacy_orders`;
ALTER TABLE `products` RENAME TO `_legacy_products`;
ALTER TABLE `account` RENAME TO `_legacy_account`;
ALTER TABLE `session` RENAME TO `_legacy_session`;
ALTER TABLE `authenticator` RENAME TO `_legacy_authenticator`;
ALTER TABLE `verificationToken` RENAME TO `_legacy_verification_token`;
ALTER TABLE `user` RENAME TO `_legacy_user`;

-- Index names survive a rename and would collide with the baseline.
DROP INDEX IF EXISTS `categories_key_unique`;
DROP INDEX IF EXISTS `user_email_unique`;
DROP INDEX IF EXISTS `authenticator_credentialID_unique`;

-- @@BASELINE@@

INSERT INTO `users` (`id`, `name`, `email`, `email_verified`, `image`)
SELECT `id`, `name`, `email`, `emailVerified`, `image` FROM `_legacy_user`;

INSERT INTO `accounts` (
  `user_id`, `type`, `provider`, `provider_account_id`, `refresh_token`, `access_token`,
  `expires_at`, `token_type`, `scope`, `id_token`, `session_state`
)
SELECT `userId`, `type`, `provider`, `providerAccountId`, `refresh_token`, `access_token`,
  `expires_at`, `token_type`, `scope`, `id_token`, `session_state`
FROM `_legacy_account`;

-- Only still-valid magic-link tokens are worth keeping.
INSERT INTO `verification_tokens` (`identifier`, `token`, `expires`)
SELECT `identifier`, `token`, `expires` FROM `_legacy_verification_token`
WHERE `expires` > unixepoch() * 1000;

-- Text is trimmed and CRLF line endings normalised to LF while copying.
-- Legacy rows inserted via `DEFAULT CURRENT_TIMESTAMP` hold TEXT ('YYYY-MM-DD HH:MM:SS'); normalise to ms.
INSERT INTO `categories` (`id`, `key`, `sort_order`, `is_visible`, `created_at`, `updated_at`)
SELECT `id`, `key`, `sort_order`, `is_visible`,
  CASE WHEN typeof(`created_at`) = 'text' THEN unixepoch(`created_at`) * 1000 ELSE `created_at` END,
  CASE WHEN typeof(`updated_at`) = 'text' THEN unixepoch(`updated_at`) * 1000 ELSE `updated_at` END
FROM `_legacy_categories`;

INSERT INTO `posts` (
  `id`, `title`, `summary`, `content`, `cover_image_url`, `locale`, `status`, `category_id`, `tags`,
  `is_members_only`, `signal_claimed_at`, `published_at`, `created_at`, `updated_at`
)
SELECT `id`, trim(`title`), replace(trim(`summary`), char(13) || char(10), char(10)), replace(`content`, char(13) || char(10), char(10)), NULLIF(trim(`cover_image_url`), ''), lower(trim(`language`)), `status`,
  `category_id`, `tags`, `is_subscription_only`, `content_signal_referenced_at`,
  CASE WHEN `status` = 'PUBLISHED' THEN coalesce(`published_at`, `created_at`) ELSE `published_at` END,
  `created_at`, `updated_at`
FROM `_legacy_posts`;

-- Same-locale "translations" are redundant with the source post, so they are dropped.
INSERT INTO `post_translations` (`post_id`, `locale`, `title`, `summary`, `content`, `created_at`, `updated_at`)
SELECT t.`postId`, lower(trim(t.`locale`)), trim(t.`title`), replace(trim(t.`summary`), char(13) || char(10), char(10)), replace(t.`content`, char(13) || char(10), char(10)), t.`created_at`, t.`updated_at`
FROM `_legacy_post_translations` t
JOIN `_legacy_posts` p ON p.`id` = t.`postId`
WHERE lower(trim(t.`locale`)) <> lower(trim(p.`language`));

INSERT INTO `comments` (`id`, `post_id`, `user_id`, `content`, `created_at`)
SELECT `id`, `post_id`, `user_id`, `content`,
  CASE WHEN typeof(`created_at`) = 'text' THEN unixepoch(`created_at`) * 1000 ELSE `created_at` END
FROM `_legacy_comments`;

-- subscriptions + orders (manual grants) collapse into memberships.
INSERT INTO `memberships` (`id`, `user_id`, `starts_at`, `expires_at`, `note`, `granted_by`, `created_at`)
SELECT s.`id`, s.`userId`, s.`created_at`, s.`current_period_end`,
  NULLIF(trim(json_extract(o.`metadata`, '$.note')), ''),
  json_extract(o.`metadata`, '$.issuedBy'),
  coalesce(o.`created_at`, s.`created_at`)
FROM `_legacy_subscriptions` s
LEFT JOIN `_legacy_orders` o ON o.`id` = s.`orderId`;

DROP TABLE `_legacy_comments`;
DROP TABLE `_legacy_post_translations`;
DROP TABLE `_legacy_subscriptions`;
DROP TABLE `_legacy_orders`;
DROP TABLE `_legacy_products`;
DROP TABLE `_legacy_posts`;
DROP TABLE `_legacy_categories`;
DROP TABLE `_legacy_account`;
DROP TABLE `_legacy_session`;
DROP TABLE `_legacy_authenticator`;
DROP TABLE `_legacy_verification_token`;
DROP TABLE `_legacy_user`;

-- Mark the baseline as applied so `wrangler d1 migrations apply` starts from here.
DELETE FROM `d1_migrations`;
INSERT INTO `d1_migrations` (`name`) VALUES ('@@BASELINE_NAME@@');

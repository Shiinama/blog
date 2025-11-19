import { getCloudflareContext } from '@opennextjs/cloudflare'

export const getR2Bucket = () => getCloudflareContext().env.BLOG_BUCKET

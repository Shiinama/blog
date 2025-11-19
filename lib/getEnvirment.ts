import { getCloudflareContext } from '@opennextjs/cloudflare'

export const { NEXT_PUBLIC_ADMIN_ID, NEXT_PUBLIC_R2_DOMAIN } = getCloudflareContext().env

import { blog, seo, easyAiTechnology } from '@/.velite'

export type Collection = typeof blog | typeof seo | typeof easyAiTechnology
export type CollectionName = 'blog' | 'seo' | 'easyAiTechnology'

export const collections: Record<CollectionName, Collection> = {
  blog,
  seo,
  easyAiTechnology
}

export function getCollections() {
  return {
    all: Object.values(collections),
    byName: collections,
    getBySlug: (slug: string) => {
      for (const [name, collection] of Object.entries(collections)) {
        const doc = collection.find((doc) => doc.slug === slug)

        if (doc) {
          return { doc, group: name as CollectionName }
        }
      }
      return null
    },
    getParams: () => {
      const params: { slug: string[] }[] = []
      Object.values(collections).forEach((collection) => {
        collection.forEach((doc) => {
          params.push({
            slug: doc.slugAsParams.split('/')
          })
        })
      })
      return params
    }
  }
}

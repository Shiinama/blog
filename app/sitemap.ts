import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import { SITE } from 'config/const'

export default function sitemap(): MetadataRoute.Sitemap {
  const blogRoutes = allBlogs.map((post) => ({
    url: `${SITE.website}/${post.path}`,
    lastModified: post.lastmod || post.date,
  }))

  const routes = ['', 'blog', 'projects', 'tags'].map((route) => ({
    url: `${SITE.website}/${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogRoutes]
}

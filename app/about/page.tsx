import { about } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AboutLayout from '@/layouts/AboutLayout'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  return (
    <>
      <AboutLayout content={about}>
        <MDXLayoutRenderer code={about.body.code} />
      </AboutLayout>
    </>
  )
}

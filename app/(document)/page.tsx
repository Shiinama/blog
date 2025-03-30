import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

//在此引用需要导入的content/目录下的分类
import {
  blog,
  business,
  easyAiTechnology,
  reactSourceCode,
  seo,
  timeline,
  independentDevelopment,
  vue,
  sdk,
  fontEnd,
  interview,
  flutter
} from '@/.velite'
import Navbar from '@/components/navbar'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Documentation',
  description: 'Manage and view all documentation'
}

//在此添加 titile 引用  collections: { blog, easyAiTechnology, timeline, seo, reactSourceCode, business },
export default async function ContentPage() {
  const t = await getTranslations('article')
  const contentTypes = [
    { title: t('timeline'), items: timeline },
    { title: t('life'), items: blog },
    { title: t('seo'), items: seo },
    { title: t('faqAndPath'), items: easyAiTechnology },
    { title: t('reactSourceCode'), items: reactSourceCode },
    { title: t('reactNative'), items: reactNative },
    { title: t('business'), items: business },
    { title: t('independentDevelopment'), items: independentDevelopment },
    { title: t('vue'), items: vue },
    { title: t('sdk'), items: sdk },
    { title: t('fontEnd'), items: fontEnd },
    { title: t('interview'), items: interview },
    { title: t('flutter'), items: flutter }
  ]
  return (
    <div className="flex-grow">
      <Navbar />
      <div className="container grid items-center gap-8 px-5 sm:px-10 md:mt-8">
        {contentTypes.map((contentType) => (
          <div key={contentType.title} className="my-4">
            <h2 className="mb-4 text-3xl font-bold">{contentType.title}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contentType.items
                .sort((a, b) => {
                  const aNum = parseInt(a.title.split('.')[0])
                  const bNum = parseInt(b.title.split('.')[0])
                  return aNum - bNum
                })
                .map((doc) => (
                  <Link href={`${doc.slug}`} key={doc.slug}>
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {doc.title}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {new Date(doc.date).toLocaleDateString()}
                          </span>
                        </CardTitle>
                        <CardDescription className="line-clamp-5">{doc.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

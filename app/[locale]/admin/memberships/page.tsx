import { getFormatter, getTranslations } from 'next-intl/server'

import { GrantMembershipForm } from '@/components/admin/grant-membership-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listRecentMemberships } from '@/lib/data/memberships'
import { requireAdminPage } from '@/lib/session'

export default async function MembershipsPage() {
  await requireAdminPage()
  const [memberships, t, format] = await Promise.all([
    listRecentMemberships(),
    getTranslations('admin.memberships'),
    getFormatter()
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('grant.title')}</CardTitle>
          <CardDescription>{t('grant.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <GrantMembershipForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('recent')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.user')}</TableHead>
                <TableHead>{t('columns.period')}</TableHead>
                <TableHead>{t('columns.note')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell>
                    <div className="font-medium">{membership.userName ?? membership.userEmail ?? '—'}</div>
                    <div className="text-muted-foreground font-mono text-xs">{membership.userId}</div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format.dateTimeRange(membership.startsAt, membership.expiresAt, 'short')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{membership.note ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

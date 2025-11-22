const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, DATABASE_ID } = process.env

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !DATABASE_ID) {
  console.warn(
    'CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and DATABASE_ID must be set to use the D1 HTTP proxy driver.'
  )
}

const apiBaseUrl =
  CLOUDFLARE_ACCOUNT_ID && DATABASE_ID
    ? `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`
    : null

type DriverMethod = 'all' | 'run' | 'get'

export async function d1HttpDriver(sql: string, params: unknown[], method: DriverMethod) {
  if (!apiBaseUrl) {
    throw new Error('Missing Cloudflare account credentials for the D1 HTTP driver.')
  }

  const response = await fetch(apiBaseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params, method })
  })

  const data = (await response.json()) as {
    success: boolean
    errors: unknown[]
    result: Array<{ success: boolean; results: Record<string, unknown>[] }>
  }

  if (!data.success || data.errors.length > 0) {
    throw new Error(`Error from D1 HTTP proxy: ${JSON.stringify(data.errors)}`)
  }

  const queryResult = data.result[0]

  if (!queryResult?.success) {
    throw new Error(`Error from D1 HTTP proxy: ${JSON.stringify(queryResult)}`)
  }

  return { rows: queryResult.results?.map((row) => Object.values(row)) ?? [] }
}

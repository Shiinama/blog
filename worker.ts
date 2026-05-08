// @ts-ignore The `.open-next/worker.js` file is generated at build time by OpenNext
import handler from './.open-next/worker.js'
import { AI_DAILY_TIME_ZONE, publishAiDailyPost } from './lib/ai-daily'

import type { ExportedHandler } from '@cloudflare/workers-types'

type AiDailyQueueMessage = {
  now: string
  cron: string
}

type WorkerEnv = CloudflareEnv & {
  AI_DAILY_QUEUE: Queue<AiDailyQueueMessage>
}

function scheduledHourInAiDailyTimeZone(scheduledTime: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AI_DAILY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(scheduledTime))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    hour: Number.parseInt(values.hour, 10),
    minute: Number.parseInt(values.minute, 10)
  }
}

const worker: ExportedHandler<WorkerEnv, AiDailyQueueMessage> = {
  fetch(request, env, ctx) {
    return handler.fetch(request, env, ctx)
  },
  scheduled(event, env, ctx) {
    const scheduledTime = scheduledHourInAiDailyTimeZone(event.scheduledTime)

    if (scheduledTime.minute !== 0 || ![0, 12].includes(scheduledTime.hour)) {
      return
    }

    ctx.waitUntil(
      env.AI_DAILY_QUEUE.send({
        now: new Date(event.scheduledTime).toISOString(),
        cron: event.cron
      }).catch((error) => {
        console.error('Failed to enqueue scheduled AI daily post', error)
      })
    )
  },
  async queue(batch, env) {
    const failures: unknown[] = []

    for (const message of batch.messages) {
      const now = new Date(message.body.now)

      if (Number.isNaN(now.getTime())) {
        console.error('Skipping AI daily queue message with invalid timestamp', message.body)
        message.ack()
        continue
      }

      try {
        await publishAiDailyPost({ env, now })
        message.ack()
      } catch (error) {
        console.error('Failed to publish queued AI daily post', {
          error,
          messageId: message.id,
          attempts: message.attempts,
          body: message.body
        })
        message.retry()
        failures.push(error)
      }
    }

    if (failures.length > 0) {
      throw failures[0]
    }
  }
}

export default worker

// Re-export anything OpenNext generates (Durable Objects, queue handlers, etc.)
// export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

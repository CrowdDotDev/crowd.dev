import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/greet'

type ExampleArgs = {
  name: string
}

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function example(args: ExampleArgs): Promise<{ greeting: string }> {
  const greeting = await activity.greet(args.name)
  return { greeting }
}

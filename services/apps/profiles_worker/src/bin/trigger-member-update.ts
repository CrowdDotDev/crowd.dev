import { svc } from '../main'

const memberId = process.argv[2]

if (!memberId) {
  console.error('Usage: npx tsx src/bin/trigger-member-update.ts <member-id>')
  process.exit(1)
}

setImmediate(async () => {
  await svc.init()

  console.log(`Triggering memberUpdate workflow for member: ${memberId}`)

  try {
    const handle = await svc.temporal.workflow.start('memberUpdate', {
      taskQueue: 'profiles',
      workflowId: `manual-member-update-${memberId}-${Date.now()}`,
      args: [
        {
          member: { id: memberId },
          syncToOpensearch: true,
          memberOrganizationIds: [],
        },
      ],
    })

    console.log(`✅ Workflow started: ${handle.workflowId}`)
    console.log('Waiting for completion...')

    await handle.result()

    console.log('✅ Workflow completed successfully!')
  } catch (err) {
    console.error('❌ Workflow failed:', err)
    process.exit(1)
  }

  process.exit(0)
})


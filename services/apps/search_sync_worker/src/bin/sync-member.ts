import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { REDIS_IOC, RedisClient } from '@crowd/redis'
import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { MemberRepository } from '../repo/member.repo'
import { MemberSyncService } from '../service/member.sync.service'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: memberId')
    process.exit(1)
  }

  const memberId = processArguments[0]

  const redis = ioc.get<RedisClient>(REDIS_IOC.client)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new MemberRepository(redis, store, log)
  const service = ioc.get<MemberSyncService>(APP_IOC.memberSyncService)

  const results = await repo.getMemberData([memberId])

  if (results.length === 0) {
    log.error(`Member ${memberId} not found!`)
    process.exit(1)
  } else {
    log.info(`Member ${memberId} found! Triggering sync!`)
    await service.syncMembers([memberId])
    process.exit(0)
  }
})

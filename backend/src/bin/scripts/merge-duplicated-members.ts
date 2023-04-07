import { QueryTypes } from 'sequelize'
import { v4 as uuid } from 'uuid'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberService from '../../services/memberService'
import { Logger, createChildLogger, createServiceLogger } from '../../utils/logging'
import { timeout } from '../../utils/timing'

/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-loop-func */

const log = createServiceLogger()

function checkUsernames(all_usernames: any[]): boolean {
  for (let i = 0; i < all_usernames.length; i++) {
    const usernames = all_usernames[i]
    for (const [platform, username] of Object.entries(usernames)) {
      for (let j = i; j < all_usernames.length; j++) {
        if (all_usernames[j][platform] && all_usernames[j][platform] !== username) {
          return false
        }
      }
    }
  }

  return true
}

function checkEmails(all_emails: string[][]): boolean {
  for (let i = 0; i < all_emails.length; i++) {
    const emails = all_emails[i]
    for (let j = i; j < all_emails.length; j++) {
      const emails2 = all_emails[j]
      for (let k = 0; k < emails.length; k++) {
        if (emails[k] !== emails2[k]) {
          return false
        }
      }
    }
  }

  return true
}

async function doMerge(data, logger: Logger) {
  // merge all instances to the first one
  const firstId = data.all_ids[0]
  const tenantOptions = await SequelizeRepository.getDefaultIRepositoryOptions(undefined, {
    id: data.tenantId,
  })
  tenantOptions.log = logger
  const service = new MemberService(tenantOptions)

  for (let i = 1; i < data.all_ids.length; i++) {
    logger.info(`Merging ${data.all_ids[i]} into ${firstId}...`)
    const id = data.all_ids[i]
    await service.merge(firstId, id)
  }
}

async function check(): Promise<number> {
  let count = 0
  const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

  const seq = SequelizeRepository.getSequelize(dbOptions)

  log.info('Querying database for duplicated members...')

  const results = await seq.query(
    `with activity_counts as (select count(id) as count, "memberId"
                              from activities
                              group by "memberId")
      select keys.platform,
            m.username ->> keys.platform as username,
            m."tenantId",
            count(*)                     as duplicate_count,
            coalesce(sum(ac.count), 0)   as total_activitites,
            json_agg(m.id)               as all_ids,
            --jsonb_agg(m."crowdInfo")     as all_crowd_infos,
            jsonb_agg(m.emails)          as all_emails,
            --jsonb_agg(m.attributes)      as all_attributes,
            jsonb_agg(m.username)        as all_usernames            
      from members m
              left join activity_counts ac on ac."memberId" = m.id,
          lateral jsonb_object_keys(m.username) as keys(platform)
      group by keys.platform,
              m.username ->> keys.platform,
              m."tenantId"
      having count(*) > 1
      order by duplicate_count desc,
              keys.platform,
              m."tenantId";`,
    {
      type: QueryTypes.SELECT,
    },
  )

  log.info(`Found ${results.length} duplicated members.`)

  let jobs = 0

  const promises = []

  for (const [i, data] of results.entries() as any) {
    log.info(`Processing ${i + 1}/${results.length}...`)

    if (checkUsernames(data.all_usernames) && checkEmails(data.all_emails)) {
      const logger = createChildLogger('merger', log, {
        requestId: uuid(),
      })
      logger.info(`Found ${data.all_ids.length} duplicated members with same usernames and emails.`)

      while (jobs >= 5) {
        log.info('Waiting for job opening...')
        await timeout(500)
      }

      jobs++
      log.info({ jobs }, 'Job started!')
      promises.push(
        doMerge(data, logger)
          .then(() => {
            jobs--
            log.info({ jobs }, 'Job done!')
          })
          .catch((err) => {
            logger.error(err, { ids: data.all_ids }, 'Error while merging members!')
            jobs--
            log.info({ jobs }, 'Job done with error!')
          }),
      )
      count++
    }
  }

  await Promise.all(promises)
  return count
}

setImmediate(async () => {
  log.info('Starting merge duplicated members script...')
  let count = await check()

  while (count > 0) {
    count = await check()
  }
})

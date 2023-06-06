import { QueryTypes } from 'sequelize'
import { Logger, getChildLogger, getServiceLogger } from '@crowd/logging'
import { generateUUIDv1, timeout } from '@crowd/common'
import MemberRepository from '../../database/repositories/memberRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberService from '../../services/memberService'

/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-loop-func */

const log = getServiceLogger()

function checkUsernames(allUsernames: any[]): boolean {
  for (let i = 0; i < allUsernames.length; i++) {
    const usernames = allUsernames[i]
    for (const [platform, username] of Object.entries(usernames)) {
      for (let j = i; j < allUsernames.length; j++) {
        if (allUsernames[j][platform] && allUsernames[j][platform] !== username) {
          return false
        }
      }
    }
  }

  return true
}

function checkEmails(allEmails: string[][]): boolean {
  for (let i = 0; i < allEmails.length; i++) {
    const emails = allEmails[i]
    for (let j = i; j < allEmails.length; j++) {
      const emails2 = allEmails[j]
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
    `  with activity_counts as (select count(id) as count, "memberId"
                             from activities
                            group by "memberId")
      select keys.platform,
            m.username ->> keys.platform as username,
            m."tenantId",
            count(*)                     as duplicate_count,
            coalesce(sum(ac.count), 0)   as total_activitites,
            json_agg(m.id)               as all_ids,
            jsonb_agg(m.emails)          as all_emails,
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

    if (data.username.toLowerCase().includes('deleted')) {
      log.warn('Skipping deleted member...')
      continue
    }

    if (checkUsernames(data.all_usernames) && checkEmails(data.all_emails)) {
      const logger = getChildLogger('merger', log, {
        requestId: generateUUIDv1(),
        platform: data.platform,
        tenantId: data.tenantId,
        username: data.username,
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
    } else {
      const logger = getChildLogger('fixer', log, {
        requestId: generateUUIDv1(),
        platform: data.platform,
        tenantId: data.tenantId,
        username: data.username,
      })
      logger.info(
        'Can not automatically merge - first member in the group by joinedAt will get the identity and the rest will get them as weakIdentities.',
      )

      const options = { ...dbOptions, log: logger, currentTenant: { id: data.tenantId } }

      let transaction
      try {
        transaction = await SequelizeRepository.createTransaction(options)
        const txOptions = { ...options, transaction }

        const allMembers = []
        for (const id of data.all_ids) {
          const member = await MemberRepository.findById(id, txOptions)
          allMembers.push(member)
        }

        // sort so the oldest members by joinedAt are first
        allMembers.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())

        // first member stays the same - it will keep the identity
        // these ones will get the duplicated identity as weakIdentities
        const otherMembers = allMembers.slice(1)

        for (const member of otherMembers) {
          logger.info({ memberId: member.id }, 'Removing identity from member.username column!')
          // let's remove this identity from the member.username column
          delete member.username[data.platform]
          await MemberRepository.update(
            member.id,
            {
              username: member.username,
            },
            txOptions,
          )
        }

        logger.info('Adding duplicated identity to other members as weakIdentity...')
        // finally let's add the duplicated identity as weakIdentity
        await MemberRepository.addToWeakIdentities(
          otherMembers.map((m) => m.id),
          data.username,
          data.platform,
          txOptions,
        )

        await SequelizeRepository.commitTransaction(transaction)
        count++
      } catch (err) {
        logger.error(err, 'Error while merging members that can not be automatically merged!')
        if (transaction) {
          await SequelizeRepository.rollbackTransaction(transaction)
        }
      }
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

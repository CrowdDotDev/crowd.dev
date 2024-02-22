import { ITriggerCSVExport, ExportableEntity } from '@crowd/types'
import { MemberSearchService } from '@crowd/opensearch'
import { parseAsync } from 'json2csv'
import moment from 'moment'
import pick from 'lodash.pick'

import { svc } from '../main'
import { uploadToS3 } from '../utils/s3'
import { ResultS3Upload } from '../types/s3'
import { fetchMemberAttributeSettings } from '@crowd/data-access-layer/src/old/apps/exports_worker'

const search = new MemberSearchService(svc.redis, svc.postgres.reader, svc.opensearch, svc.log)

/*
buildAndUploadMembersCSV is a Temporal activity that fetches members based on the
tenant ID passed and some filters. It also creates and uploads the CSV to S3, to
then return the private object URL. All those steps are done in a single activity
to ensure payloads passed in Temporal don't reach the size limit. It would be
pretty easy to break workflows simply by passing the list of all members to
export.

If we see some limitations with this approach, we could save the members found
by uploading the result as JSON in S3, and use the private object URL of the
said JSON to then create the CSV and upload it.
*/
export async function buildAndUploadMembersCSV(input: ITriggerCSVExport): Promise<ResultS3Upload> {
  const attributesSettings = await fetchMemberAttributeSettings(svc.postgres.reader, input.tenantId)

  const transformed = {
    filter: input.criteria ? input.criteria.filter : {},
    limit: input.criteria ? input.criteria.limit : 200,
    offset: input.criteria ? input.criteria.offset : 0,
    orderBy: input.criteria ? input.criteria.orderBy : 'joinedAt_DESC',
    countOnly: false,
    segments: input.segmentIds,
    attributesSettings: attributesSettings,
  }

  const data = await search.findAndCountAll(input.tenantId, transformed)

  const relations = [
    { relation: 'organizations', attributes: ['displayName', 'website', 'logo'] },
    { relation: 'notes', attributes: ['body'] },
    { relation: 'tags', attributes: ['name'] },
  ]
  for (const relation of relations) {
    for (const member of data.rows) {
      member[relation.relation] = member[relation.relation]?.map((i) => ({
        id: i.id,
        ...pick(i, relation.attributes),
      }))
    }
  }

  if (!data || !data.rows) {
    data.rows = []
  }

  const opts = {
    fields: [
      'id',
      'username',
      'displayName',
      'emails',
      'score',
      'joinedAt',
      'activeOn',
      'identities',
      'tags',
      'notes',
      'organizations',
      'activityCount',
      'lastActive',
      'reach',
      'averageSentiment',
      'score',
      'attributes',
    ],
  }

  const csv = await parseAsync(data.rows, opts)

  const entity = ExportableEntity.MEMBERS
  const key = `csv-exports/${moment().format('YYYY-MM-DD')}_${entity}_${input.tenantId}.csv`

  let privateObjectUrl: string
  try {
    privateObjectUrl = await uploadToS3(key, csv)
  } catch (err) {
    throw new Error(err)
  }

  return {
    link: privateObjectUrl,
  }
}

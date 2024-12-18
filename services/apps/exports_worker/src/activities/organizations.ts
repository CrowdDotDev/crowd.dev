import { parseAsync } from 'json2csv'
import moment from 'moment'

import { OrganizationSearchService } from '@crowd/opensearch'
import { ExportableEntity, ITriggerCSVExport } from '@crowd/types'

import { svc } from '../main'
import { ResultS3Upload } from '../types/s3'
import { uploadToS3 } from '../utils/s3'

const search = new OrganizationSearchService(svc.postgres.reader, svc.opensearch, svc.log)

/*
buildAndUploadOrganizationsCSV is a Temporal activity that fetches organizations
based on the tenant ID passed and some filters. It also creates and uploads the
CSV to S3, to then return the private object URL. All those steps are done in a
single activity to ensure payloads passed in Temporal don't reach the size limit.
It would be pretty easy to break workflows simply by passing the list of all
organizations to export.

If we see some limitations with this approach, we could save the organizations
found by uploading the result as JSON in S3, and use the private object URL of
the said JSON to then create the CSV and upload it.
*/
export async function buildAndUploadOrganizationsCSV(
  input: ITriggerCSVExport,
): Promise<ResultS3Upload> {
  const transformed = {
    filter: input.criteria ? input.criteria.filter : {},
    limit: input.criteria ? input.criteria.limit : 200,
    offset: input.criteria ? input.criteria.offset : 0,
    orderBy: input.criteria ? input.criteria.orderBy : 'joinedAt_DESC',
    countOnly: false,
    segments: input.segmentIds,
  }

  const data = await search.findAndCountAll(input.tenantId, transformed)

  if (!data || !data.rows) {
    data.rows = []
  }

  const opts = {
    fields: [
      'id',
      'displayName',
      'description',
      'emails',
      'phoneNumbers',
      'logo',
      'tags',
      'website',
      'location',
      'github',
      'twitter',
      'linkedin',
      'crunchbase',
      'employees',
      'revenueRange',
      'createdAt',
      'updatedAt',
      'deletedAt',
      'tenantId',
      'createdById',
      'updatedById',
      'isTeamOrganization',
      'type',
      'attributes',
      'manuallyCreated',
      'headline',
      'identities',
      'lastActive',
      'activityCount',
      'memberCount',
      'joinedAt',
      'industry',
      'size',
      'founded',
      'employeeGrowthRate',
    ],
  }

  data.rows.forEach((row) => {
    if (Number.isNaN(row.employees)) {
      row.employees = null
    }

    if (Number.isNaN(row.founded)) {
      row.founded = null
    }
  })

  const csv = await parseAsync(data.rows, opts)

  const entity = ExportableEntity.ORGANIZATIONS
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

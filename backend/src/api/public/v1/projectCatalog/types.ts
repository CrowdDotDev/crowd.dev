import { z } from 'zod'

import { MAX_REQUEST_TEXT_LENGTH } from '@crowd/common'

export const PROJECT_CATALOG_MANUAL_ACTIONS = ['auto', 'evaluate', 'onboard'] as const

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => (value ? value : null))

export const projectCatalogUpsertRequestSchema = z.object({
  repoUrl: z.string().url(),
  action: z.enum(PROJECT_CATALOG_MANUAL_ACTIONS),
  projectName: optionalText(500),
  requestText: optionalText(MAX_REQUEST_TEXT_LENGTH),
})

export const projectCatalogInternalUpsertRequestSchema = projectCatalogUpsertRequestSchema.extend({
  repoUrl: z.string().min(1),
})

export type IProjectCatalogUpsertRequest = z.infer<typeof projectCatalogUpsertRequestSchema>

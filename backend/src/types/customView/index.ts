import { CustomViewPlacement } from '@crowd/types'
import { memberCustomViews } from './member'
import { organizationCustomViews } from './organization'

export const defaultCustomViews = {
  [CustomViewPlacement.MEMBER]: memberCustomViews,
  [CustomViewPlacement.ORGANIZATION]: organizationCustomViews,
}

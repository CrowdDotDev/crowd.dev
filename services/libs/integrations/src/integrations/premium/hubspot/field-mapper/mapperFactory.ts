import { IMemberAttribute } from '@crowd/types'
import { HubspotEntity } from '../types'
import { HubspotFieldMapper } from './hubspotFieldMapper'
import { HubspotMemberFieldMapper } from './memberFieldMapper'
import { HubspotOrganizationFieldMapper } from './organizationFieldMapper'

export class HubspotFieldMapperFactory {
  static getFieldMapper(
    entity: HubspotEntity,
    hubspotId: number,
    attributes?: IMemberAttribute[],
    platforms?: string[],
  ): HubspotFieldMapper {
    switch (entity) {
      case HubspotEntity.MEMBERS:
        return new HubspotMemberFieldMapper(hubspotId, attributes, platforms)
      case HubspotEntity.ORGANIZATIONS:
        return new HubspotOrganizationFieldMapper(hubspotId)
      default:
        throw new Error(`Field mapper for ${entity} not found!`)
    }
  }
}

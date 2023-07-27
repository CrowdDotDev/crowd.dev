import { IMemberAttribute, IMemberIdentity } from '@crowd/types'
import { HubspotEntity } from '../types'
import { HubspotFieldMapper } from './hubspotFieldMapper'
import { HubspotMemberFieldMapper } from './memberFieldMapper'
import { HubspotOrganizationFieldMapper } from './organizationFieldMapper'

export class HubspotFieldMapperFactory {
  static getFieldMapper(
    entity: HubspotEntity,
    attributes?: IMemberAttribute[],
    identities?: IMemberIdentity[],
  ): HubspotFieldMapper {
    switch (entity) {
      case HubspotEntity.MEMBERS:
        return new HubspotMemberFieldMapper(attributes, identities)
      case HubspotEntity.ORGANIZATIONS:
        return new HubspotOrganizationFieldMapper()
      default:
        throw new Error(`Field mapper for ${entity} not found!`)
    }
  }
}

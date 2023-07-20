import { HubspotEntity, HubspotPropertyType, IHubspotObject } from '../types'

export abstract class HubspotFieldMapper {
  protected typeMap: Record<string, HubspotPropertyType>

  public fieldMap: Record<string, string>

  public entity: HubspotEntity

  public hubspotId: number

  abstract getFieldTypeMap(): Record<string, HubspotPropertyType>

  abstract getEntity(input: IHubspotObject, args?: unknown): unknown

  public isFieldMappableToHubspotType(field: string, type: HubspotPropertyType) {
    if (!this.typeMap) {
      throw new Error(
        `${this.entity} type map isn't initialized. Instance should be created with customAttributes and identities.`,
      )
    }

    if (this.typeMap[field] === undefined) {
      throw new Error(`${this.entity} attribute ${field} not found!`)
    }

    return this.typeMap[field] === type
  }

  public getCrowdFieldName(hubspotAttributeName: string): string {
    if (!this.fieldMap) {
      throw new Error(`${this.entity} field map is not set!`)
    }

    const crowdField = Object.keys(this.fieldMap).find(
      (crowdFieldName) => this.fieldMap[crowdFieldName] === hubspotAttributeName,
    )

    return crowdField
  }

  public getHubspotFieldName(crowdAttributeName: string): string {
    this.ensureFieldMapExists()

    return this.fieldMap[crowdAttributeName]
  }

  public getAllHubspotFields(): string[] {
    this.ensureFieldMapExists()

    return Object.values(this.fieldMap)
  }

  public getAllCrowdFields(): string[] {
    this.ensureFieldMapExists()

    return Object.keys(this.fieldMap)
  }

  public setFieldMap(fieldMap: Record<string, string>): void {
    this.fieldMap = fieldMap
  }

  public setHubspotId(hubspotId: number): void {
    this.hubspotId = hubspotId
  }

  protected ensureFieldMapExists(): void {
    if (!this.fieldMap) {
      throw new Error(`${this.entity} field map is not set!`)
    }
  }
}

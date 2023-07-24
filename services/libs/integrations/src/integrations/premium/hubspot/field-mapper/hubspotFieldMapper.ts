import { HubspotEntity, HubspotPropertyType, IFieldProperty, IHubspotObject } from '../types'

export abstract class HubspotFieldMapper {
  protected fieldProperties: Record<string, IFieldProperty>

  public fieldMap: Record<string, string>

  public entity: HubspotEntity

  public hubspotId: number

  abstract getFieldProperties(): Record<string, IFieldProperty>

  abstract getEntity(input: IHubspotObject, args?: unknown): unknown

  public isFieldMappableToHubspotType(field: string, type: HubspotPropertyType) {
    if (!this.fieldProperties) {
      throw new Error(
        `${this.entity} field properties aren't initialized. Instance should be created with customAttributes and identities.`,
      )
    }

    if (this.fieldProperties[field] === undefined) {
      throw new Error(`${this.entity} property ${field} not found!`)
    }

    return this.fieldProperties[field].hubspotType === type
  }

  public getCrowdValue(entity: any, crowdKey: string) {
    let value = entity[crowdKey]
    if (this.fieldProperties[crowdKey].serialize) {
      value = this.fieldProperties[crowdKey].serialize(entity[crowdKey])
    }

    return value
  }

  public getTypeMap(): Record<string, HubspotPropertyType> {
    if (!this.fieldProperties) {
      throw new Error(`Can't find field properties of ${this.entity}!`)
    }

    const typeMap: Record<string, HubspotPropertyType> = {}

    Object.keys(this.fieldProperties).forEach((propertyName) => {
      typeMap[propertyName] = this.fieldProperties[propertyName].hubspotType
    })

    return typeMap
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

export enum FilterCustomAttributeType {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  MULTISELECT = 'multiSelect',
  STRING = 'string',
  DATE = 'date',
  URL = 'url',
  SPECIAL = 'special',
}

export interface FilterCustomAttribute {
  canDelete: boolean;
  createdAt: string;
  createdById: string;
  id: string;
  label: string;
  name: string;
  options: string[]
  show: boolean;
  tenantId: string;
  type: FilterCustomAttributeType;
  updatedAt: string
  updatedById: string;
}

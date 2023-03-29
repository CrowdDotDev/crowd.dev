import { OrganizationModel } from '@/modules/organization/organization-model';

const { fields } = OrganizationModel;

export default [
  fields.id,
  fields.name,
  fields.description,
  fields.createdAt,
  fields.updatedAt,
];

import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { toSentenceCase } from '@/utils/string';

export default {
  name: 'employeeCountByCountry',
  label: 'Employee Count by Country',
  type: attributesTypes.json,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => toSentenceCase(key),
};

import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatDate } from '@/utils/date';
import { snakeToSentenceCase } from '@/utils/string';

const EmployeeCountByMonthByLevel = {
  vp: 'VP',
  cxo: 'CXO',
};

export default {
  name: 'employeeCountByMonthByLevel',
  label: 'Employee Count by Month by Level',
  type: attributesTypes.json,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => formatDate({
    timestamp: key,
    format: 'MMMM YYYY',
  }),
  nestedKeyParser: (nestedKey) => EmployeeCountByMonthByLevel[nestedKey] || snakeToSentenceCase(nestedKey),
};

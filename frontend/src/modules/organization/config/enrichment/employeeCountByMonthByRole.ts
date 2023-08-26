import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatDate } from '@/utils/date';
import { snakeToSentenceCase } from '@/utils/string';

export default {
  name: 'employeeCountByMonthByRole',
  label: 'Employee Count by month by Role',
  type: attributesTypes.json,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => formatDate({
    timestamp: key,
    format: 'MMMM YYYY',
  }),
  nestedKeyParser: (nestedKey) => snakeToSentenceCase(nestedKey),
};

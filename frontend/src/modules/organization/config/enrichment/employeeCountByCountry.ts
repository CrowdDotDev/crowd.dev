import { AttributeType } from '@/modules/organization/types/Attributes';
import { snakeToSentenceCase, toSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';
import { formatFloatToYears } from '@/utils/number';

const employeeCountByCountry: OrganizationEnrichmentConfig = {
  name: 'employeeCountByCountry',
  label: 'Employee Count by Country',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  formatValue: (val) => Object.entries(val).reduce((final, [key, value]) => ({
    ...final,
    [toSentenceCase(key)]: value,
  }), {}),
};

export default employeeCountByCountry;

import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatDate } from '@/utils/date';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';
import { toSentenceCase } from '@/utils/string';

const employeeCountByMonth: OrganizationEnrichmentConfig = {
  name: 'employeeCountByMonth',
  label: 'Employee Count by Month',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  formatValue: (val) => Object.entries(val).reduce((final, [key, value]) => ({
    ...final,
    [formatDate({
      timestamp: key,
      format: 'MMMM YYYY',
    } as any)]: value,
  }), {}),
};

export default employeeCountByMonth;

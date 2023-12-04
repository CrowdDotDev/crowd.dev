import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatDate } from '@/utils/date';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const employeeCountByMonth: OrganizationEnrichmentConfig = {
  name: 'employeeCountByMonth',
  label: 'Employee Count by Month',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => formatDate({
    timestamp: key,
    format: 'MMMM YYYY',
  } as any),
};

export default employeeCountByMonth;

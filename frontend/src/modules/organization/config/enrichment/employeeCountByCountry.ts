import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { toSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const employeeCountByCountry: OrganizationEnrichmentConfig = {
  name: 'employeeCountByCountry',
  label: 'Employee Count by Country',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => toSentenceCase(key),
};

export default employeeCountByCountry;

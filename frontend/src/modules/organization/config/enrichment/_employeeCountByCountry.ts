import { AttributeType } from '@/modules/organization/types/Attributes';
import { toSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const _employeeCountByCountry: OrganizationEnrichmentConfig = {
  name: 'employeeCountByCountry',
  label: 'Employee Count by Country',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => toSentenceCase(key),
};

export default _employeeCountByCountry;

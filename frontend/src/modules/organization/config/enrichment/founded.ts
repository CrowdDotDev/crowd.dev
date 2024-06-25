import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const founded: OrganizationEnrichmentConfig = {
  name: 'founded',
  label: 'Founded',
  type: AttributeType.NUMBER,
  showInForm: true,
  showInAttributes: true,
  formatValue: (value) => value,
};

export default founded;

import { AttributeType } from '@/modules/organization/types/Attributes';
import type { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const directSubsidiaries: OrganizationEnrichmentConfig = {
  name: 'directSubsidiaries',
  label: 'Direct Subsidiaries',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
  formatValue: (val) => val,
};

export default directSubsidiaries;

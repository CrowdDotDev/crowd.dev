import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const immediateParent: OrganizationEnrichmentConfig = {
  name: 'immediateParent',
  label: 'Immediate Parent',
  type: AttributeType.STRING,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => value,
};

export default immediateParent;

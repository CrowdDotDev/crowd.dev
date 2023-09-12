import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const ultimateParent: OrganizationEnrichmentConfig = {
  name: 'ultimateParent',
  label: 'Ultimate Parent',
  type: AttributeType.STRING,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value: string) => value,
};

export default ultimateParent;

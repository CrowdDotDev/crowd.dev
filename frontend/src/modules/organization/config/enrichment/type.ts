import { AttributeType } from '@/modules/organization/types/Attributes';
import { toSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const type: OrganizationEnrichmentConfig = {
  name: 'type',
  label: 'Type',
  type: AttributeType.STRING,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => toSentenceCase(value),
};

export default type;

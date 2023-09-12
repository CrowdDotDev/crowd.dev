import { AttributeType } from '@/modules/organization/types/Attributes';
import { toSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const gicsSector: OrganizationEnrichmentConfig = {
  name: 'gicsSector',
  label: 'GICS Sector',
  type: AttributeType.STRING,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => toSentenceCase(value),
};

export default gicsSector;

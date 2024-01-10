import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatDate } from '@/utils/date';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const lastEnrichedAt: OrganizationEnrichmentConfig = {
  name: 'lastEnrichedAt',
  label: 'Last enrichment',
  type: AttributeType.DATE,
  showInForm: false,
  showInAttributes: true,
  displayValue: (value) => (formatDate({
    timestamp: value,
    subtractDays: null,
    subtractMonths: null,
    format: 'D MMMM, YYYY',
  } as any)),
};

export default lastEnrichedAt;

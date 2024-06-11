import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatDate } from '@/utils/date';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const grossAdditionsByMonth: OrganizationEnrichmentConfig = {
  name: 'grossAdditionsByMonth',
  label: 'Gross Additions by Month',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  formatValue: (val) => Object.entries(val).reduce((final, [key, value]) => ({
    ...final,
    [formatDate({
      timestamp: key,
      format: 'MMMM YYYY',
    } as any)]: value,
  }), {}),
};

export default grossAdditionsByMonth;

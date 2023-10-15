import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatFloatToYears } from '@/utils/number';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const averageEmployeeTenure: OrganizationEnrichmentConfig = {
  name: 'averageEmployeeTenure',
  label: 'Average Employee Tenure',
  type: AttributeType.NUMBER,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => formatFloatToYears(value),
};

export default averageEmployeeTenure;

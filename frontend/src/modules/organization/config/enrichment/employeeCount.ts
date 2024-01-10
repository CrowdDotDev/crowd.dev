import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const employeeCount: OrganizationEnrichmentConfig = {
  name: 'employeeCount',
  label: 'Employee Count',
  type: AttributeType.NUMBER,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => value,
};

export default employeeCount;

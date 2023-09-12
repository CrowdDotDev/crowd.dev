import { AttributeType } from '@/modules/organization/types/Attributes';
import affiliatedProfiles from './affiliatedProfiles';
import allSubsidiaries from './allSubsidiaries';
import alternativeDomains from './alternativeDomains';
import alternativeNames from './alternativeNames';
import averageEmployeeTenure from './averageEmployeeTenure';
import averageTenureByLevel from './averageTenureByLevel';
import averageTenureByRole from './averageTenureByRole';
import directSubsidiaries from './directSubsidiaries';
import employeeChurnRate from './employeeChurnRate';
import employeeCount from './employeeCount';
import employeeCountByCountry from './employeeCountByCountry';
import employeeCountByMonth from './employeeCountByMonth';
import employeeGrowthRate from './employeeGrowthRate';
import founded from './founded';
import gicsSector from './gicsSector';
import grossAdditionsByMonth from './grossAdditionsByMonth';
import grossDeparturesByMonth from './grossDeparturesByMonth';
import headcount from './headcount';
import industry from './industry';
import revenueRange from './revenueRange';
import lastEnrichedAt from './lastEnrichedAt';
import tags from './tags';
import typeAttribute from './type';
import immediateParent from './immediateParent';
import ultimateParent from './ultimateParent';

export interface OrganizationEnrichmentConfig {
  name: string;
  label: string;
  type: AttributeType;
  showInForm: boolean;
  showInAttributes: boolean;
  displayValue?: (value: any) => string;
  component?: any;
  isLink?: boolean;
  keyParser?: (key: string) => string;
  valueParser?: (value: any) => string;
  filterValue?: (value: any) => any;
}

const enrichmentConfig: OrganizationEnrichmentConfig[] = [
  lastEnrichedAt,
  industry,
  headcount,
  typeAttribute,
  founded,
  affiliatedProfiles,
  allSubsidiaries,
  alternativeDomains,
  alternativeNames,
  averageEmployeeTenure,
  averageTenureByLevel,
  averageTenureByRole,
  directSubsidiaries,
  employeeChurnRate,
  employeeCount,
  employeeCountByCountry,
  employeeCountByMonth,
  employeeGrowthRate,
  gicsSector,
  grossAdditionsByMonth,
  grossDeparturesByMonth,
  immediateParent,
  revenueRange,
  tags,
  ultimateParent,
];

export default enrichmentConfig;

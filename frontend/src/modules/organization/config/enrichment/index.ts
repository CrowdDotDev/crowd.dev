import { AttributeType } from '@/modules/organization/types/Attributes';
import affiliatedProfiles from './affiliatedProfiles';
import allSubsidiaries from './allSubsidiaries';
import alternativeDomains from './alternativeDomains';
import alternativeNames from './alternativeNames';
import averageEmployeeTenure from './averageEmployeeTenure';
import averageTenureByLevel from './_averageTenureByLevel';
import _averageTenureByRole from './_averageTenureByRole';
import directSubsidiaries from './directSubsidiaries';
import _employeeChurnRate from './_employeeChurnRate';
import employeeCount from './employeeCount';
import _employeeCountByCountry from './_employeeCountByCountry';
import _employeeCountByMonth from './_employeeCountByMonth';
import _employeeGrowthRate from './_employeeGrowthRate';
import founded from './founded';
import gicsSector from './gicsSector';
import _grossAdditionsByMonth from './_grossAdditionsByMonth';
import _grossDeparturesByMonth from './_grossDeparturesByMonth';
import headcount from './headcount';
import industry from './industry';
import revenueRange from './revenueRange';
import lastEnrichedAt from './lastEnrichedAt';
import tags from './tags';
import typeAttribute from './type';
import immediateParent from './immediateParent';
import ultimateParent from './ultimateParent';

export interface OrganizationEnrichmentConfig {
  name: string; // id of the enrichment attribute
  label: string; // name of the enrichment property
  type: AttributeType; // Type of the attribute
  showInForm: boolean; // Display in Organization Form
  showInAttributes: boolean; // Display in Organization Profile
  component?: any; // Component that will render attribute in organization profile
  formatValue: (value: any) => string; // Formatter for values
  attributes?: any, // Custom attributes passed into displaying components
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
  _averageTenureByRole,
  directSubsidiaries,
  _employeeChurnRate,
  employeeCount,
  _employeeCountByCountry,
  _employeeCountByMonth,
  _employeeGrowthRate,
  gicsSector,
  _grossAdditionsByMonth,
  _grossDeparturesByMonth,
  immediateParent,
  revenueRange,
  tags,
  ultimateParent,
];

export default enrichmentConfig;

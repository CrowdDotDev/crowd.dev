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
  name: string; // id of the enrichment attribute
  label: string; // name of the enrichment property
  type: AttributeType; // Type of the attribute
  showInForm: boolean; // Display in Organization Form
  showInAttributes: boolean; // Display in Organization Profile
  enrichmentSneakPeak?: boolean; // Display as a sneak peak attribute
  isLink?: boolean; // If attribute is a url
  component?: any; // Component that will render attribute in organization profile
  displayValue?: (value: any) => string; // Formatter for displaying attribute value
  keyParser?: (key: string) => string; // Formatter for keys of jsons if attribute is json
  valueParser?: (value: any) => string; // Formatter for values of jsons if attribute is json
  filterValue?: (value: any) => any; // Filter attributes values
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

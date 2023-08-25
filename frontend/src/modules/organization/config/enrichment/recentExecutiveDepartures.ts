import { attributesTypes } from '@/modules/organization/types/Attributes';
import { formatDate } from '@/utils/date';
import { toSentenceCase, snakeToSentenceCase } from '@/utils/string';
import OrganizationAttributesArrayJsonRendered from '@/modules/organization/components/organization-attributes-array-json-renderer.vue';

const RecentExecutiveDepartures = {
  pdl_id: 'PDL ID',
  new_company_id: 'New company ID',
};

const RecentExecutiveDeparturesParser = {
  departed_date: (value) => formatDate({
    timestamp: value,
    format: 'MMMM YYYY',
  }),
  pdl_id: (value) => value,
  job_title: (value) => toSentenceCase(value),
  job_title_role: (value) => snakeToSentenceCase(value),
  job_title_sub_role: (value) => snakeToSentenceCase(value),
  job_title_levels: (values) => values.map((value) => snakeToSentenceCase(value)).join(', '),
  new_company_id: (value) => value,
  new_company_job_title: (value) => toSentenceCase(value),
  new_company_job_title_role: (value) => snakeToSentenceCase(value),
  new_company_job_title_sub_role: (value) => snakeToSentenceCase(value),
  new_company_job_title_levels: (values) => values.map((value) => snakeToSentenceCase(value)).join(', '),
};

export default {
  name: 'recentExecDepartures',
  label: 'Recent Executive Departures',
  type: attributesTypes.jsonArray,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesArrayJsonRendered,
  keyParser: (key) => RecentExecutiveDepartures[key] || snakeToSentenceCase(key),
  valueParser: (key, value) => RecentExecutiveDeparturesParser[key](value),
};

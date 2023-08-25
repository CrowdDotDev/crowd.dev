import { attributesTypes } from '@/modules/organization/types/Attributes';
import { formatDate } from '@/utils/date';
import { toSentenceCase, snakeToSentenceCase } from '@/utils/string';
import OrganizationAttributesArrayJsonRendered from '@/modules/organization/components/organization-attributes-array-json-renderer.vue';

const RecentExecutiveHires = {
  pdl_id: 'PDL ID',
  previous_company_id: 'Previous Company ID',
};

const RecentExecutiveHiresParser = {
  joined_date: (value) => formatDate({
    timestamp: value,
    format: 'MMMM YYYY',
  }),
  pdl_id: (value) => value,
  job_title: (value) => toSentenceCase(value),
  job_title_role: (value) => snakeToSentenceCase(value),
  job_title_sub_role: (value) => snakeToSentenceCase(value),
  job_title_levels: (values) => values.map((value) => snakeToSentenceCase(value)).join(', '),
  previous_company_id: (value) => value,
  previous_company_job_title: (value) => toSentenceCase(value),
  previous_company_job_title_role: (value) => snakeToSentenceCase(value),
  previous_company_job_title_sub_role: (value) => snakeToSentenceCase(value),
  previous_company_job_title_levels: (values) => values.map((value) => snakeToSentenceCase(value)).join(', '),
};

export default {
  name: 'recentExecHires',
  label: 'Recent Executive Hires',
  type: attributesTypes.jsonArray,
  showInForm: true,
  showInAttributes: true,
  component: null,
  component: OrganizationAttributesArrayJsonRendered,
  keyParser: (key) => RecentExecutiveHires[key] || snakeToSentenceCase(key),
  valueParser: (key, value) => RecentExecutiveHiresParser[key](value),
};

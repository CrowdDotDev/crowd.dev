import { ReportDataTypeConfig } from '@/shared/modules/report-issue/config';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import { Organization } from '@/modules/organization/types/Organization';
import moment from 'moment';
import WorkExperience from './type-work-experience.vue';

const { displayName } = useOrganizationHelpers();

const getDateRange = (dateStart?: string, dateEnd?: string) => {
  const start = dateStart
    ? moment(dateStart).utc().format('MMMM YYYY')
    : 'Unknown';
  const endDefault = dateStart ? 'Present' : 'Unknown';
  const end = dateEnd
    ? moment(dateEnd).utc().format('MMMM YYYY')
    : endDefault;
  if (start === end) {
    return start;
  }
  return `${start} → ${end}`;
};

export const workExperience: ReportDataTypeConfig = {
  description: (attribute: Organization) => {
    const workExperienceList: string[] = [
      `Work experience: ${displayName(attribute)}`,
    ];
    if (attribute.memberOrganizations.title) {
      workExperienceList.push(`Title: ${attribute.memberOrganizations.title}`);
    }
    if (!!attribute.memberOrganizations.dateStart || !!attribute.memberOrganizations.dateEnd) {
      workExperienceList.push(`Period: ${getDateRange(attribute.memberOrganizations.dateStart, attribute.memberOrganizations.dateEnd)}`);
    }
    return workExperienceList.join('\n');
  },
  display: WorkExperience,
};

export default workExperience;

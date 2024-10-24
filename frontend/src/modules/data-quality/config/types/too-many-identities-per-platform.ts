import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const tooManyIdentitiesPerPlatform: DataIssueTypeConfig = {
  label: 'More than 1 verified identity per platform',
  badgeType: 'warning',
  badgeText: () => 'More than 1 verified identity per platform',
  description: (member: any) => {
    const platforms = member.platforms.split(',');
    return `This profile has more than 1 verified identity on 
  ${CrowdIntegrations.getPlatformsLabel(platforms)}, please review them if they are all necessary.`;
  },
};

export default tooManyIdentitiesPerPlatform;

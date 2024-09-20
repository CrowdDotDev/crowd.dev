import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

const options: SelectFilterOptionGroup[] = [
  {
    label: 'Person',
    options: [
      {
        label: 'Profiles merged',
        value: 'contributors-merged',
      },
      {
        label: 'Profiles unmerged',
        value: 'contributors-unmerged',
      },
      {
        label: 'Profile identities updated',
        value: 'contributor-identities-updated',
      },
      {
        label: 'Profile work experience updated',
        value: 'contributor-work-experience-updated',
      },
      {
        label: 'Profile affiliation updated',
        value: 'contributor-affiliation-updated',
      },
      {
        label: 'Profile updated',
        value: 'contributor-profile-updated',
      },
      {
        label: 'Profile created',
        value: 'contributor-created',
      },
    ],
  },
  {
    label: 'Organization',
    options: [
      {
        label: 'Organizations merged',
        value: 'organizations-merged',
      },
      {
        label: 'Organizations unmerged',
        value: 'organizations-unmerged',
      },
      {
        label: 'Organization identities updated',
        value: 'organization-identities-updated',
      },
      {
        label: 'Organization profile updated',
        value: 'organization-profile-updated',
      },
      {
        label: 'Organization created',
        value: 'organization-created',
      },
    ],
  },
  {
    label: 'Integration',
    options: [
      {
        label: 'Integration connected',
        value: 'integration-connected',
      },
      {
        label: 'Integration re-connected',
        value: 'integration-re-connected',
      },
    ],
  },
];

export default options;

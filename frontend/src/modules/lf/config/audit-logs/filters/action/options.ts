import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

const options: SelectFilterOptionGroup[] = [
  {
    label: 'Contributor',
    options: [
      {
        label: 'Contributors merged',
        value: 'contributors-merged',
      },
      {
        label: 'Contributor identities updated',
        value: 'contributor-identities-updated',
      },
      {
        label: 'Contributor work experience updated',
        value: 'contributor-work-experience-updated',
      },
      {
        label: 'Contributor affiliation updated',
        value: 'contributor-affiliation-updated',
      },
      {
        label: 'Contributor profile updated',
        value: 'contributor-profile-updated',
      },
      {
        label: 'Contributor created',
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

import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

const options: SelectFilterOptionGroup[] = [
  {
    label: 'Person',
    options: [
      {
        label: 'People merged',
        value: 'contributors-merged',
      },
      {
        label: 'Person identities updated',
        value: 'contributor-identities-updated',
      },
      {
        label: 'Person work experience updated',
        value: 'contributor-work-experience-updated',
      },
      {
        label: 'Person affiliation updated',
        value: 'contributor-affiliation-updated',
      },
      {
        label: 'Person profile updated',
        value: 'contributor-profile-updated',
      },
      {
        label: 'Person created',
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

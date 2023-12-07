import {
  EnrichSneakPeakPopoverType,
  EnrichSneakPeakPopoverContent,
} from '@/shared/modules/enrichment/types/SneakPeakPopover';

export const popoverContent: Record<EnrichSneakPeakPopoverType, EnrichSneakPeakPopoverContent> = {
  [EnrichSneakPeakPopoverType.CONTACT]: {
    title: 'Contact enrichment',
    body: 'Get more insights about this contact by enriching it with valuable '
      + 'details such as seniority level, OSS contributions, skills and much more.',
    link: 'https://docs.crowd.dev/docs/guides/contacts/contact-enrichment',
  },
  [EnrichSneakPeakPopoverType.ORGANIZATION]: {
    title: 'Organization enrichment',
    body: 'Get more insights about this organization by enriching it with valuable details such ' +
      'as headcount, industry, location, and more...',
    link: 'https://docs.crowd.dev/docs/guides/organizations/organization-enrichment',
  },
};

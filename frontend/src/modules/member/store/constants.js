export const DEFAULT_MEMBER_FILTERS = [
  {
    isTeamMember: {
      not: true,
    },
  },
  {
    isOrganization: {
      not: true,
    },
  },
  {
    isBot: {
      not: true,
    },
  },
];

export const DEFAULT_MEMBER_FILTERS_NO_TEAM = [
  {
    isBot: {
      not: true,
    },
  },
  {
    isOrganization: {
      not: true,
    },
  },
  {},
];

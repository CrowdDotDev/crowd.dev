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

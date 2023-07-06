export const DEFAULT_ACTIVITY_FILTERS = [
  {
    member: {
      isTeamMember: {
        not: true,
      },
      isBot: {
        not: true,
      },
    },
  },
];

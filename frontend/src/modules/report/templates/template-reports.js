export const MEMBERS_REPORT = {
  nameAsId: 'Members report',
  name: 'Members',
  description:
    'Get insights into total/active/returning members and a member leaderboard',
  icon: 'ri-contacts-line',
  color: 'bg-gray-900',
  filters: {
    platform: true,
    teamMembers: true,
  },
};

export const PRODUCT_COMMUNITY_FIT_REPORT = {
  nameAsId: 'Product-community fit report',
  name: 'Product-Community Fit',
  description:
    'Measure and benchmark Product-Community Fit for your open-source project ',
  icon: 'ri-rocket-2-line rotate-45',
  color: 'bg-purple-500',
  filters: {
    teamMembers: true,
  },
};

export const templates = [
  MEMBERS_REPORT,
  PRODUCT_COMMUNITY_FIT_REPORT,
];

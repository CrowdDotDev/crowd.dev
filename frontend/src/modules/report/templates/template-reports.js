export const MEMBERS_REPORT = {
  name: 'Members report',
  description:
    'Get insights into total/active/returning members and a member leaderboard',
  icon: 'ri-contacts-line',
  color: 'bg-gray-900',
  filters: {
    platform: true,
    teamMembers: true
  }
}

export const PRODUCT_COMMUNITY_FIT_REPORT = {
  name: 'Product-community fit',
  description:
    'Measure and benchmark product-community fit for your open-source project ',
  icon: 'ri-rocket-2-line',
  color: 'bg-purple-500',
  filters: {
    teamMembers: true
  }
}

export const templates = [
  MEMBERS_REPORT,
  PRODUCT_COMMUNITY_FIT_REPORT
]

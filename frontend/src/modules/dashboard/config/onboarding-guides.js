export const onboardingGuides = ({ store, router }) => [
  {
    id: 'integration',
    title: 'Connect your first 2 integrations',
    description:
      'Connect with our built-in integrations to start syncing data from your digital channels.',
    loomUrl:
      'https://www.loom.com/share/86b43eb32ae34469ba3317bd329c652f',
    actionText: 'Connect integrations',
    action: () => {
      router.push({
        name: 'integration'
      })
    },
    completed: () => {
      // if user has 2 or more integrations connected
      const integrations =
        store.getters['integration/array']
      return integrations.length >= 2
    },
    display: () => true
  },
  {
    id: 'enrich',
    title: 'Enrich a member',
    description:
      'Get more insights about members by enriching them with attributes such as emails, seniority, OSS contributions and much more.',
    loomUrl:
      'https://www.loom.com/share/86b43eb32ae34469ba3317bd329c652f',
    actionText: 'Try member enrichment',
    action: () => {
      // TODO: link to sample member which is not enriched
    },
    completed: () => {
      // TODO: if user enriched more than one member
      return false
    },
    display: () => true
  },
  {
    id: 'report',
    title: 'Look into a report',
    description:
      'Check our specially crafted default reports and dig into the inner workings of your community',
    loomUrl:
      'https://www.loom.com/share/86b43eb32ae34469ba3317bd329c652f',
    actionText: 'Explore reports',
    action: () => {
      router.push({
        name: 'report'
      })
    },
    completed: () => {
      // TODO: if user viewed at least one report
      console.log('completed')
      return false
    },
    display: () => true
  },
  {
    id: 'eagle-eye',
    title: 'Discover content in your niche',
    description:
      'Discover and engage with relevant content across various community platforms in order to gain developers’ mindshare and increase your community awareness',
    loomUrl:
      'https://www.loom.com/share/86b43eb32ae34469ba3317bd329c652f',
    actionText: 'Explore Eagle Eye',
    action: () => {
      router.push({
        name: 'eagleEye'
      })
    },
    completed: () => {
      // If user has onboarded eagle eye
      const { onboarded } =
        store.getters['auth/currentUser'].eagleEyeSettings
      return onboarded
    },
    display: () => {
      // If user has paid Growth plan and not trial
      const tenant = store.getters['auth/currentTenant']
      return tenant.plan === 'Growth' && !tenant.trialEndsAt
    }
  },
  {
    id: 'invite',
    title: 'Invite your colleagues',
    description:
      'Invite colleagues to your crowd.dev workspace by giving full access or read-only permissions',
    loomUrl:
      'https://www.loom.com/share/86b43eb32ae34469ba3317bd329c652f',
    actionText: 'Invite colleagues',
    action: () => {
      router.push({
        name: 'settings'
      })
    },
    completed: () => {
      // If users in tenant are more than 2
      const users = store.getters['user/list/rows']
      return users.length > 1
    },
    display: () => true
  }
]

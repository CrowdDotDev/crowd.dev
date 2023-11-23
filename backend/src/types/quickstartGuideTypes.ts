export enum QuickstartGuideType {
  VIEW_REPORT = 'view-report',
  INVITE_COLLEAGUES = 'invite-colleagues',
  CONNECT_FIRST_INTEGRATION = 'connect-first-integration',
  EXPLORE_CONTACTS = 'explore-contacts',
  EXPLORE_ORGANIZATIONS = 'explore-organizations',
  CREATE_AUTOMATIONS = 'create-automations',
}

export interface QuickstartGuideMap {
  [key: string]: QuickstartGuide
}

export interface QuickstartGuide {
  title: string
  body: string
  videoLink: string
  learnMoreLink: string
  buttonLink: string
  buttonText: string
  completed: boolean
  disabledInSampleData?: boolean
  disabledTooltipText?: string
}

export interface QuickstartGuideSettings {
  isEagleEyeGuideDismissed: boolean
  isQuickstartGuideDismissed: boolean
}

const connectFirstIntegrationGuide: QuickstartGuide = {
  title: 'Connect your first integration',
  body: 'Connect with our built-in integrations to start syncing data from your digital channels.',
  videoLink: 'https://www.loom.com/share/578ea6ef431c48e0b338cf975d3b80bc',
  learnMoreLink: 'https://docs.crowd.dev/docs/getting-started/integrations',
  buttonLink: '/integrations',
  buttonText: 'Connect integrations',
  completed: false,
}

const viewReportGuide: QuickstartGuide = {
  title: 'Look into reports',
  body: 'Check our specially crafted default reports and dig into the inner workings of your community.',
  videoLink: 'https://www.loom.com/share/545e7dfc692540d09115ee32653640ca',
  learnMoreLink: 'https://docs.crowd.dev/docs/guides/reports',
  buttonLink: '/reports',
  buttonText: 'Explore reports',
  completed: false,
}

const inviteColleaguesGuide: QuickstartGuide = {
  title: 'Invite your colleagues',
  body: 'Invite colleagues to your crowd.dev workspace by giving full access or read-only permissions.',
  videoLink: 'https://www.loom.com/share/f12d87814e7447edab4282eab6bb3ccf',
  learnMoreLink: 'https://docs.crowd.dev/docs/getting-started/getting-set-up',
  buttonLink: '/settings',
  buttonText: 'Invite colleagues',
  completed: false,
}

const exploreOrganizations: QuickstartGuide = {
  title: 'Explore organizations',
  body: 'Discover organizations with developers engaging with your ecosystem or technology and see which companies fit your ICP.',
  videoLink: 'https://www.loom.com/share/f12d87814e7447edab4282eab6bb3ccf',
  learnMoreLink: 'https://docs.crowd.dev/docs/guides/organizations',
  buttonLink: '/organizations',
  buttonText: 'Explore organizations',
  completed: false,
}

const exploreContacts: QuickstartGuide = {
  title: 'Explore contacts',
  body: 'Get an overview of all contacts that engaged with your product or community across the platforms you have connected.',
  videoLink: 'https://www.loom.com/share/f12d87814e7447edab4282eab6bb3ccf',
  learnMoreLink: 'https://docs.crowd.dev/docs/guides/contacts',
  buttonLink: '/contacts',
  buttonText: 'Explore contacts',
  completed: false,
}

const createAutomations: QuickstartGuide = {
  title: 'Create automations',
  body: 'Stop focusing on repetitive tasks and concentrate on building deeper relationships with your community by automating your workflows via HubSpot syncs, Slack notifications, or Webhooks.',
  videoLink: 'https://www.loom.com/share/f12d87814e7447edab4282eab6bb3ccf',
  learnMoreLink: 'https://docs.crowd.dev/docs/guides/automations',
  buttonLink: '/automations',
  buttonText: 'Create automations',
  completed: false,
}

export const DEFAULT_GUIDES = {
  [QuickstartGuideType.CONNECT_FIRST_INTEGRATION]: connectFirstIntegrationGuide,
  [QuickstartGuideType.INVITE_COLLEAGUES]: inviteColleaguesGuide,
  [QuickstartGuideType.EXPLORE_CONTACTS]: exploreContacts,
  [QuickstartGuideType.EXPLORE_ORGANIZATIONS]: exploreOrganizations,
  [QuickstartGuideType.VIEW_REPORT]: viewReportGuide,
  [QuickstartGuideType.CREATE_AUTOMATIONS]: createAutomations,
}

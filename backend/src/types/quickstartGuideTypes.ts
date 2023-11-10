export enum QuickstartGuideType {
  CONNECT_INTEGRATION = 'connect-integration',
  ENRICH_MEMBER = 'enrich-member',
  VIEW_REPORT = 'view-report',
  SET_EAGLE_EYE = 'set-eagle-eye',
  INVITE_COLLEAGUES = 'invite-colleagues',
  CONNECT_FIRST_INTEGRATION = 'connect-first-integration',
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

const connectIntegrationGuide: QuickstartGuide = {
  title: 'Connect your first 2 integrations',
  body: 'Connect with our built-in integrations to start syncing data from your digital channels.',
  videoLink: 'https://www.loom.com/share/578ea6ef431c48e0b338cf975d3b80bc',
  learnMoreLink: 'https://docs.crowd.dev/docs/getting-started/integrations',
  buttonLink: '/integrations',
  buttonText: 'Connect integrations',
  completed: false,
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

const enrichMemberGuide: QuickstartGuide = {
  title: 'Enrich a contact',
  body: 'Get more insights about contacts by enriching them with attributes such as emails, seniority, OSS contributions and much more.',
  videoLink: 'https://www.loom.com/share/8fdbdd2c0d4c4ab59ae845248b1db04f',
  learnMoreLink: 'https://www.loom.com/share/8fdbdd2c0d4c4ab59ae845248b1db04f',
  buttonLink: '/contacts',
  buttonText: 'Try enrichment',
  completed: false,
  disabledInSampleData: true,
  disabledTooltipText: 'Connect integrations to try enrichment',
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

const setEagleEyeGuide: QuickstartGuide = {
  title: 'Discover content in your niche',
  body: 'Discover and engage with relevant content across various community platforms in order to gain developers’ mindshare and increase your community awareness.',
  videoLink: 'https://www.loom.com/share/7900b1c0ea0b4a33a2cf85d3b175b1b7',
  learnMoreLink: 'https://www.loom.com/share/7900b1c0ea0b4a33a2cf85d3b175b1b7',
  buttonLink: '/eagle-eye',
  buttonText: 'Explore Eagle Eye',
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

const createAutomations: QuickstartGuide = {
  title: 'Create automations',
  body: 'Stop focusing on repetitive tasks and concentrate on building deeper relationships with your community by automating your workflows.',
  videoLink: 'https://www.loom.com/share/f12d87814e7447edab4282eab6bb3ccf',
  learnMoreLink: 'https://docs.crowd.dev/docs/guides/automations',
  buttonLink: '/automations',
  buttonText: 'Create automations',
  completed: false,
}

export const DEFAULT_GUIDES = {
  [QuickstartGuideType.CONNECT_INTEGRATION]: connectIntegrationGuide,
  [QuickstartGuideType.INVITE_COLLEAGUES]: inviteColleaguesGuide,
  [QuickstartGuideType.ENRICH_MEMBER]: enrichMemberGuide,
  [QuickstartGuideType.VIEW_REPORT]: viewReportGuide,
  [QuickstartGuideType.SET_EAGLE_EYE]: setEagleEyeGuide,
}

export const DEFAULT_GUIDES_V2 = {
  [QuickstartGuideType.CONNECT_FIRST_INTEGRATION]: connectFirstIntegrationGuide,
  [QuickstartGuideType.INVITE_COLLEAGUES]: inviteColleaguesGuide,
  [QuickstartGuideType.EXPLORE_ORGANIZATIONS]: exploreOrganizations,
  [QuickstartGuideType.VIEW_REPORT]: viewReportGuide,
  [QuickstartGuideType.CREATE_AUTOMATIONS]: createAutomations,
}

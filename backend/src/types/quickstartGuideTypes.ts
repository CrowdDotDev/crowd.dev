export enum QuickstartGuideType {
  CONNECT_INTEGRATION = 'connect-integration',
  ENRICH_MEMBER = 'enrich-member',
  VIEW_REPORT = 'view-report',
  SET_EAGLE_EYE = 'set-eagle-eye',
  INVITE_COLLEAGUES = 'invite-colleagues',
}

export interface QuickstartGuideMap {
  [key: string]: QuickstartGuide
}

export interface QuickstartGuide {
  title: string
  body: string
  videoLink: string
  buttonLink: string
  buttonText: string
  completed: boolean
}

export interface QuickstartGuideSettings {
  isEagleEyeGuideDismissed: boolean
  isQuickstartGuideDismissed: boolean
}

const connectIntegrationGuide: QuickstartGuide = {
  title: 'Connect your first 2 integrations',
  body: 'Connect with our built-in integrations to start syncing data from your digital channels.',
  videoLink: 'https://www.crowd.dev/quickstart-video-integrations',
  buttonLink: '/integrations',
  buttonText: 'Connect integrations',
  completed: false,
}

const enrichMemberGuide: QuickstartGuide = {
  title: 'Enrich a member',
  body: 'Get more insights about members by enriching them with attributes such as emails, seniority, OSS contributions and much more.',
  videoLink: 'https://www.crowd.dev/quickstart-video-enrichment',
  buttonLink: '/members',
  buttonText: 'Try enrichment',
  completed: false,
}

const viewReportGuide: QuickstartGuide = {
  title: 'Look into a report',
  body: 'Check our specially crafted default reports and dig into the inner workings of your community.',
  videoLink: 'https://www.crowd.dev/quickstart-video-report',
  buttonLink: '/reports',
  buttonText: 'Explore reports',
  completed: false,
}

const setEagleEyeGuide: QuickstartGuide = {
  title: 'Discover content in your niche',
  body: 'Discover and engage with relevant content across various community platforms in order to gain developers’ mindshare and increase your community awareness.',
  videoLink: 'https://www.crowd.dev/quickstart-video-eagleeye',
  buttonLink: '/eagle-eye',
  buttonText: 'Explore Eagle Eye',
  completed: false,
}

const inviteColleaguesGuide: QuickstartGuide = {
  title: 'Invite your colleagues',
  body: 'Invite colleagues to your crowd.dev workspace by giving full access or read-only permissions.',
  videoLink: 'https://www.crowd.dev/quickstart-video-invitecolleague',
  buttonLink: '/settings',
  buttonText: 'Invite colleagues',
  completed: false,
}

export const DEFAULT_GUIDES = {
  [QuickstartGuideType.CONNECT_INTEGRATION]: connectIntegrationGuide,
  [QuickstartGuideType.ENRICH_MEMBER]: enrichMemberGuide,
  [QuickstartGuideType.VIEW_REPORT]: viewReportGuide,
  [QuickstartGuideType.SET_EAGLE_EYE]: setEagleEyeGuide,
  [QuickstartGuideType.INVITE_COLLEAGUES]: inviteColleaguesGuide,
}

export enum QuickstartGuideType {
  CONNECT_INTEGRATION = 'connect-integration',
  ENRICH_MEMBER = 'enrich-member',
  VIEW_REPORT = 'view-report',
  SET_EAGLE_EYE = 'set-eagle-eye',
  INVITE_COLLEAGUES = 'invite-colleagues',
}

export interface QuickstartGuide {
  title: string
  body: string
  videoLink: string
  buttonLink: string
  completed: boolean
}

export interface QuickstartGuideSettings {
  isEagleEyeGuideDismissed: boolean
  isQuickstartGuideDismissed: boolean
}

const connectIntegrationGuide: QuickstartGuide = {
  title: 'Connect your integration',
  body: 'bodyplaceholder',
  videoLink: 'https://a-link',
  buttonLink: 'https://a-link',
  completed: false,
}

const enrichMemberGuide: QuickstartGuide = {
  title: 'Enrich a member',
  body: 'bodyplaceholder',
  videoLink: 'https://a-link',
  buttonLink: 'https://a-link',
  completed: false,
}

const viewReportGuide: QuickstartGuide = {
  title: 'View a report',
  body: 'bodyplaceholder',
  videoLink: 'https://a-link',
  buttonLink: 'https://a-link',
  completed: false,
}

const setEagleEyeGuide: QuickstartGuide = {
  title: 'Set Eagle Eye',
  body: 'bodyplaceholder',
  videoLink: 'https://a-link',
  buttonLink: 'https://a-link',
  completed: false,
}

const inviteColleaguesGuide: QuickstartGuide = {
  title: 'Invite colleagues',
  body: 'blah blah',
  videoLink: 'https://a-link',
  buttonLink: 'https://a-link',
  completed: false,
}

export const DEFAULT_GUIDES = {
  [QuickstartGuideType.CONNECT_INTEGRATION]: connectIntegrationGuide,
  [QuickstartGuideType.ENRICH_MEMBER]: enrichMemberGuide,
  [QuickstartGuideType.VIEW_REPORT]: viewReportGuide,
  [QuickstartGuideType.SET_EAGLE_EYE]: setEagleEyeGuide,
  [QuickstartGuideType.INVITE_COLLEAGUES]: inviteColleaguesGuide,
}

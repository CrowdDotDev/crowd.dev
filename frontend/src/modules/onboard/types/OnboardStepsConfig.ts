export interface OnboardStepConfig {
  name: string;
  component: any;
  textColor: (currentStep: number) => {
    [key: string]: boolean;
  };
  bgColor: (currentStep: number) => {
    [key: string]: boolean;
  };
  cta: string;
  ctaTooltip?: (form: {
    tenantName: string;
    activeIntegrations: number;
    invitedUsers: {
      emails: string[];
      roles: string[];
    }[];
  }) => string | null;
  submitActionInfo?: string;
  sideInfo?: {
    icon: string;
    text: string;
  }[];
  submitAction: (payload: any, activeIntegrations?: any[]) => Promise;
  alert: () => string;
}

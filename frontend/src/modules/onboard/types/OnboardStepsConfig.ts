export interface OnboardStepConfig {
  name: string;
  component: any;
  textColor: (currentStep: number) => {
    [key: string]: boolean
  }
  bgColor: (currentStep: number) => {
    [key: string]: boolean
  }
  cta: string;
  ctaTooltip?: string;
  submitActionInfo?: string;
  sideInfo?: {
    icon: string;
    text: string;
  }[];
  submitAction: (payload: any, activeIntegrations?: any[]) => Promise;
  alert: () => string;
}

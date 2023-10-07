export interface OnboardStepConfig {
  name: string;
  component: any;
  hasValidation: boolean;
  textColor: (currentStep: number) => {
    [key: string]: boolean
  }
  bgColor: (currentStep: number) => {
    [key: string]: boolean
  }
  cta: (touch?: boolean) => string;
  submitAction: (payload: any, activeIntegrations?: any[]) => Promise
  alert: () => string;
}

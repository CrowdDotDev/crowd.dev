import AppOnboardSyncDataStep from '@/modules/onboard/components/onboard-sync-data-step.vue';
import { OnboardStepConfig } from '@/modules/onboard/types/OnboardStepsConfig';

const syncData: OnboardStepConfig = {
  name: 'Sync data',
  component: AppOnboardSyncDataStep,
  cta: 'Continue',
  ctaTooltip: 'Connect at least 1 integration to proceed',
  textColor: (currentStep: number) => ({
    'text-gray-400': currentStep < 2,
    'text-brand-400': currentStep > 2,
    'text-brand-500': currentStep === 2,
  }),
  bgColor: (currentStep: number) => ({
    'bg-gray-300': currentStep < 2,
    'bg-brand-200': currentStep > 2,
    'bg-brand-500': currentStep === 2,
  }),
  submitAction: () => Promise.resolve(),
  alert: () => 'Are you sure you want to leave this page?',
};

export default syncData;

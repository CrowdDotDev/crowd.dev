import AppOnboardWorkspaceDetailsStep from '@/modules/onboard/components/onboard-workspace-details-step.vue';
import { OnboardStepConfig } from '@/modules/onboard/types/OnboardStepsConfig';
import { store } from '@/store';
import { TenantService } from '@/modules/tenant/tenant-service';
import Errors from '@/shared/error/errors';

const workspaceDetails: OnboardStepConfig = {
  name: 'Workspace details',
  component: AppOnboardWorkspaceDetailsStep,
  cta: 'Continue',
  textColor: (currentStep: number) => ({
    'text-gray-400': currentStep < 1,
    'text-brand-400': currentStep > 1,
    'text-brand-500': currentStep === 1,
  }),
  bgColor: (currentStep: number) => ({
    'bg-gray-300': currentStep < 1,
    'bg-brand-200': currentStep > 1,
    'bg-brand-500': currentStep === 1,
  }),
  submitAction: (payload) => {
    const currentTenant = store.getters['auth/currentTenant'];

    // Update tenant name if user goes back to first step and name is different
    if (currentTenant && payload.tenantName !== currentTenant.name) {
      return TenantService.update(currentTenant.id, {
        name: payload.tenantName,
      });
    }

    // Create new tenant
    if (!currentTenant) {
      return TenantService.create({
        name: payload.tenantName,
        integrationsRequired: [],
        onboard: true,
      })
        // Store the newly created tenant as current tenant
        .then((tenant) => {
          store.dispatch('auth/doSelectTenant', { tenant, redirect: false });
          store.dispatch('auth/doRefreshCurrentUser');

          return Promise.resolve();
        })
        .catch((error) => {
          Errors.handle(error);
          return Promise.reject();
        });
    }

    return Promise.resolve();
  },
  alert: () => 'Changes that you made will not be saved',
};

export default workspaceDetails;

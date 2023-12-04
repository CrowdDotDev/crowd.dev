import AppOnboardInviteColleaguesStep from '@/modules/onboard/components/onboard-invite-colleagues-step.vue';
import { OnboardStepConfig } from '@/modules/onboard/types/OnboardStepsConfig';
import { UserService } from '@/modules/user/user-service';
import { TenantService } from '@/modules/tenant/tenant-service';
import { router } from '@/router';
import { store } from '@/store';
import { RoleEnum } from '@/modules/user/types/Roles';

const inviteColleagues: OnboardStepConfig = {
  name: 'Invite colleagues',
  component: AppOnboardInviteColleaguesStep,
  cta: 'Finish setup',
  textColor: (currentStep: number) => ({
    'text-gray-400': currentStep < 3,
    'text-brand-400': currentStep > 3,
    'text-brand-500': currentStep === 3,
  }),
  bgColor: (currentStep: number) => ({
    'bg-gray-300': currentStep < 3,
    'bg-brand-200': currentStep > 3,
    'bg-brand-500': currentStep === 3,
  }),
  submitAction: (payload, activeIntegrations) => {
    const currentTenant = store.getters['auth/currentTenant'];

    // Split list of users into 2 requests
    // One for admin users another for readonly
    const users = payload.invitedUsers.reduce((acc, user) => {
      if (user.emails.some((e) => !!e)) {
        if (user.roles.includes('readonly')) {
          acc.readonly.emails.push(user.emails[0]);
        } else {
          acc.admin.emails.push(user.emails[0]);
        }
      }

      return acc;
    }, {
      readonly: {
        emails: [],
        roles: [RoleEnum.READONLY],
      },
      admin: {
        emails: [],
        roles: [RoleEnum.ADMIN],
      },
    });

    return Promise.all(Object.values(users).map(({ emails, roles }) => {
      if (!emails.length) {
        return Promise.resolve();
      }

      return UserService.create({
        emails,
        roles,
      });
    }))
      // Update newly created tenant to be onboarded after this step
      .then(() => TenantService.update(currentTenant.id, {
        onboardedAt: new Date(),
      }))
      // Refresh currently stored tenant to new payload
      .then(() => {
        window.analytics.track('Onboarding completed', {
          tenantName: currentTenant.name,
          connectedPlatforms: activeIntegrations?.map((i) => i.name),
          invitedColleagues: users.readonly.emails.length + users.admin.emails.length,
        });

        return store.dispatch('auth/doRefreshCurrentUser');
      })
      // Redirect to Book a demo page
      .then(() => {
        router.push('/onboard/demo');

        return Promise.resolve();
      });
  },
  alert: () => 'Changes that you made will not be saved',
};

export default inviteColleagues;

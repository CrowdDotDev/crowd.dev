<template>
  <div
    class="flex grow my-8 bg-white panel"
  >
    <div class="flex flex-col justify-between gap-3 basis-3/5">
      <div>
        <span class="text-xs text-gray-400 font-medium">Current plan</span>
        <h5 class="text-gray-900">
          {{ activePlan }}
        </h5>
        <span class="text-2xs text-gray-500">Active since {{ moment(currentTenant.createdAt).format('MMMM DD, YYYY') }}</span>
      </div>
      <el-button
        class="btn btn--bordered flex items-center gap-2 w-fit !shadow !border-gray-100"
        @click="onManageBillingClick"
      >
        <i class="ri-external-link-line" /><span>Manage billing & payments</span>
      </el-button>
    </div>
    <div
      v-if="planLimits.automation[activePlan] || planLimits.export[activePlan]"
      class="flex flex-col basis-2/5 justify-start"
    >
      <div
        v-if="planLimits.automation[activePlan]"
        class="flex justify-between items-center py-4 border-b border-gray-200"
      >
        <span class="text-2xs text-gray-400 font-medium">Active automations:</span>
        <span
          v-if="planLimits.automation[activePlan] !== 'unlimited'"
          class="text-sm text-gray-900 leading-[18px]"
        >
          {{ currentTenant.automationCount }}/{{ planLimits.automation[activePlan] }}
        </span>
        <span v-else class="text-sm text-gray-900 leading-[18px] flex items-center gap-2">
          <i class="ri-infinity-line text-base w-4" />
          <span>Unlimited</span>
        </span>
      </div>
      <div
        v-if="planLimits.export[activePlan]"
        class="flex justify-between items-center py-4"
      >
        <span class="text-2xs text-gray-400 font-medium">CSV exports:</span>
        <span
          v-if="planLimits.export[activePlan] !== 'unlimited'"
          class="text-sm text-gray-900 leading-[18px]"
        >
          {{ currentTenant.csvExportCount }}/{{ planLimits.export[activePlan] }}
        </span>
        <span v-else class="text-sm text-gray-900 leading-[18px] flex items-center gap-2">
          <i class="ri-infinity-line text-base w-4" />
          <span>Unlimited</span>
        </span>
      </div>
    </div>
  </div>
  <app-plans-list />
  <app-dialog
    v-model="isCalDialogOpen"
    size="2extra-large"
  >
    <template #content>
      <div id="embbeded-script" class="w-full px-3 pb-3 min-h-20" />
    </template>
  </app-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import config from '@/config';
import Plans from '@/security/plans';
import { planLimits } from '@/security/plans-limits';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import moment from 'moment';
import AppPlansList from '@/modules/settings/components/plans-list.vue';

const communityPlans = Plans.communityValues;

const { isCommunityVersion } = config;
const isCommunitPremiumVersion = config.communityPremium === 'true';

const { doRefreshCurrentUser } = mapActions('auth');

const store = useStore();

const isCalDialogOpen = ref(false);

const currentTenant = computed(
  () => store.getters['auth/currentTenant'],
);

const activePlan = computed(() => {
  // Community Versions
  if (isCommunityVersion) {
    return isCommunitPremiumVersion
      ? communityPlans.custom
      : communityPlans.community;
  }
  // Crowd Hosted Versions
  return currentTenant.value.plan;
});

onMounted(() => {
  doRefreshCurrentUser({});
});

const onManageBillingClick = () => {
  window.open(config.stripe.customerPortalLink, '_blank');
};
</script>

<script>
export default {
  name: 'AppPlansPage',
};
</script>

<style lang="scss">

.pricing-plan {
  @apply flex flex-col flex-1 rounded-lg bg-white border border-solid border-gray-100 p-5 grow justify-between shadow;

  &.active {
    @apply border-gray-50 bg-gray-50 shadow-none;
  }
}
</style>

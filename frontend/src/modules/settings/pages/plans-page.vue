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
  <div class="panel mt-6">
    <div class="flex gap-4">
      <div
        v-for="plan in plansList"
        :key="plan.key"
        class="flex flex-1 flex-col"
      >
        <!-- Pricing plan block -->
        <div
          class="pricing-plan"
          :class="{
            active: plan.key === activePlan,
            'mt-6': !isCommunityVersion,
          }"
        >
          <div>
            <div class="flex flex-col mb-8">
              <div
                class="flex flex-wrap justify-between items-center gap-2  mb-3.5"
              >
                <!-- Title -->
                <h6 class="text-gray-900">
                  {{ plan.title }}
                </h6>
                <!-- Badge -->
                <span
                  v-if="getBadge(plan.key)"
                  class="h-5 rounded-full text-2xs font-medium px-2 flex items-center"
                  :class="getBadge(plan.key).class"
                >{{ getBadge(plan.key).content }}</span>
              </div>
              <!-- Description -->
              <div class="text-gray-600 text-2xs mb-4">
                {{ plan.description }}
              </div>
              <!-- Price -->
              <div class="flex items-start gap-1">
                <span class="text-brand-500 text-base">{{ plan.price }}</span>
                <span class="text-2xs text-gray-400 font-medium">{{ plan.priceInfo }}</span>
              </div>

              <el-button
                v-if="plan.ctaLabel[activePlan]"
                class="btn btn--md btn--full btn--primary mt-6"
                @click="() => handleOnCtaClick(plan)"
              >
                {{ plan.ctaLabel[activePlan] }}
              </el-button>
            </div>

            <div
              class="flex flex-col gap-4 mb-10"
            >
              <div v-if="plan.featuresNote" class="text-2xs text-gray-600">
                {{ plan.featuresNote }}
              </div>

              <ul class="flex flex-col gap-4 text-xs text-gray-900">
                <li
                  v-for="feature in plan.features"
                  :key="feature"
                  class="flex items-start gap-3 leading-5"
                >
                  <i
                    class="ri-checkbox-circle-fill text-lg"
                  />
                  <span>{{ feature }}</span>
                </li>
                <li
                  v-for="feature in plan.featuresSpecial"
                  :key="feature"
                  class="flex items-start gap-3 leading-5"
                >
                  <i
                    class="ri-information-line text-lg"
                  />
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
import { plans } from '../settings-pricing-plans';

const crowdHostedPlans = Plans.values;
const communityPlans = Plans.communityValues;

const { isCommunityVersion } = config;
const isCommunitPremiumVersion = config.communityPremium === 'true';

const { doRefreshCurrentUser } = mapActions('auth');

const store = useStore();

const isCalDialogOpen = ref(false);

const currentTenant = computed(
  () => store.getters['auth/currentTenant'],
);

const plansList = computed(() => {
  if (isCommunityVersion) {
    return plans.community;
  }

  return plans.crowdHosted;
});

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

const getBadge = (plan) => {
  if (plan === crowdHostedPlans.scale && [crowdHostedPlans.essential, crowdHostedPlans.eagleEye].includes(activePlan.value)) {
    // Recommended plan
    return {
      class: 'text-brand-600 bg-brand-50',
      content: 'Recommended',
    };
  } if (plan === activePlan.value) {
    // Active plans
    return {
      class: 'text-white bg-brand-500',
      content: 'Current plan',
    };
  }

  return null;
};

const onManageBillingClick = () => {
  window.open(config.stripe.customerPortalLink, '_blank');
};

const displayCalDialog = () => {
  isCalDialogOpen.value = true;
};

const handleOnCtaClick = ({ key, ctaAction }) => {
  // Send an event with plan request
  window.analytics.track('Change Plan Request', {
    tenantId: currentTenant.value.id,
    tenantName: currentTenant.value.name,
    requestedPlan: key,
  });

  ctaAction[activePlan.value]({
    displayCalDialog,
  });
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

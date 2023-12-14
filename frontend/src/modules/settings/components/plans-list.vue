<template>
  <div class="panel mt-6">
    <div class="flex justify-center">
      <div
        class="h-8 border-solid border-gray-200 border-r border-y first:border-l flex items-center
       justify-center transition hover:bg-gray-50 cursor-pointer first:rounded-l-md last:rounded-r-md px-4 text-sm"
        :class="!monthlyPayment ? 'bg-gray-100 font-medium text-gray-900' : 'bg-white'"
        @click="monthlyPayment = false"
      >
        Yearly payment
      </div>
      <div
        class="h-8 border-solid border-gray-200 border-r border-y first:border-l flex items-center
       justify-center transition hover:bg-gray-50 cursor-pointer first:rounded-l-md last:rounded-r-md px-4 text-sm"
        :class="monthlyPayment ? 'bg-gray-100 font-medium text-gray-900' : 'bg-white'"
        @click="monthlyPayment = true"
      >
        Monthly payment
      </div>
    </div>
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
                <span class="text-brand-500 text-base">{{ !monthlyPayment ? plan.price : (plan.priceMonthly ?? plan.price) }}</span>
                <span class="text-2xs text-gray-400 font-medium" />
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
              class="flex flex-col gap-4 mb-4"
            >
              <ul class="flex flex-col gap-4 text-xs text-gray-900">
                <li
                  v-for="{ includes, value, integrations } in plan.features"
                  :key="value"
                >
                  <span class="flex items-start gap-3 leading-5">
                    <i
                      class="text-lg"
                      :class="{
                        'ri-checkbox-circle-fill': includes,
                        'ri-close-circle-fill': !includes,
                      }"
                    />
                    <span>{{ value }}</span>
                  </span>
                  <div v-if="integrations?.length" class="flex flex-wrap gap-2 mt-4 ml-8">
                    <div
                      v-for="integration in integrations"
                      :key="integration"
                    >
                      <el-tooltip
                        v-if="CrowdIntegrations.getConfig(integration)"
                        placement="top"
                        :content="CrowdIntegrations.getConfig(integration).name"
                      >
                        <div
                          class="bg-white rounded-md shadow w-12 h-12 flex items-center justify-center"
                        >
                          <img
                            :alt="CrowdIntegrations.getConfig(integration).name"
                            :src="CrowdIntegrations.getConfig(integration).image"
                            class="w-5"
                          />
                        </div>
                      </el-tooltip>
                    </div>
                  </div>
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
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { plans } from '../settings-pricing-plans';

const crowdHostedPlans = Plans.values;
const communityPlans = Plans.communityValues;

const { isCommunityVersion } = config;
const isCommunitPremiumVersion = config.communityPremium === 'true';

const { doRefreshCurrentUser } = mapActions('auth');

const store = useStore();

const isCalDialogOpen = ref(false);
const monthlyPayment = ref(false);

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
  if (plan === crowdHostedPlans.essential) {
    return null;
  }
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
    monthlyPayment: monthlyPayment.value,
  });
};
</script>

<script>
export default {
  name: 'AppPlansList',
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

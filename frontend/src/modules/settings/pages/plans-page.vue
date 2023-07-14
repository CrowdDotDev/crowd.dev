<template>
  <div
    class="flex grow items-center justify-end my-8"
    :class="{
      'justify-between': showEagleEyePricing,
    }"
  >
    <div v-if="showEagleEyePricing">
      <div v-if="!isEagleEyeEnabled">
        <div class="font-medium text-sm">
          Only interested in Eagle Eye?
        </div>
        <div clasS="text-xs">
          <a
            :href="eagleEyeStripeLink"
            target="_blank"
            rel="noopener noreferrer"
          >Add Eagle Eye</a><span class="text-gray-500">
            for only $50 per month.</span>
        </div>
      </div>
      <div v-else>
        <div class="flex gap-3">
          <div class="font-medium text-sm">
            Eagle Eye
          </div>
          <div
            class="text-green-600 flex items-center gap-1"
          >
            <i class="ri-check-line text-base" /><span
              class="text-2xs"
            >Subscribed</span>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Enabled on top of your current Essential plan.
        </div>
      </div>
    </div>
    <el-button
      class="btn btn--secondary btn--md flex items-center gap-2"
      @click="onManageBillingClick"
    >
      <i class="ri-external-link-line" /><span>Manage billing & payments</span>
    </el-button>
  </div>
  <div class="panel mt-6">
    <div class="flex gap-4">
      <div
        v-for="plan in plansList"
        :key="plan.key"
        class="flex flex-1 flex-col"
      >
        <!-- Sale banner -->
        <div v-if="plan.sale" class="sale-banner">
          {{ plan.sale }}
        </div>
        <!-- Pricing plan block -->
        <div
          class="pricing-plan"
          :class="{
            active: plan.key === activePlan,
            sale: plan.sale,
            'mt-6': !isCommunityVersion && !plan.sale,
          }"
        >
          <div>
            <div class="flex flex-col gap-4 mb-8">
              <div
                class="flex flex-wrap justify-between items-center gap-2"
              >
                <!-- Title -->
                <h5 class="text-gray-900">
                  {{ plan.title }}
                </h5>
                <!-- Badge -->
                <span
                  v-if="
                    plan.key === activePlan
                      || (plan.key === crowdHostedPlans.growth
                        && activePlan
                          === crowdHostedPlans.essential)
                  "
                  class="badge badge--sm"
                  :class="getBadge(plan.key).class"
                >{{ getBadge(plan.key).content }}</span>
              </div>
              <!-- Description -->
              <div class="text-gray-600 text-xs">
                {{ plan.description }}
              </div>
              <!-- Price -->
              <div class="text-brand-500 text-sm">
                {{ plan.price }}
              </div>
            </div>

            <div
              class="flex flex-col gap-4 text-gray-900 text-xs mb-10"
            >
              <div v-if="plan.featuresNote">
                {{ plan.featuresNote }}
              </div>

              <ul class="flex flex-col gap-4">
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
              </ul>
            </div>
          </div>

          <div
            class="text-center flex flex-col justify-end"
            :class="{
              'min-h-10': !isGrowthTrialPlan,
              'min-h-[110px]': isGrowthTrialPlan,
            }"
          >
            <div
              v-if="
                plan.key === crowdHostedPlans.growth
                  && isGrowthTrialPlan
              "
              class="text-gray-500 text-xs italic mb-3"
            >
              <span class="font-medium">{{
                getTrialDate()
              }}</span><br />
              <span>If you don't take action, you will be
                automatically downgraded to Essential.</span>
            </div>
            <el-button
              v-if="
                (plan.key !== activePlan
                  || isGrowthTrialPlan)
                  && !(
                    plan.key === crowdHostedPlans.essential
                    && isGrowthTrialPlan
                  )
              "
              class="btn btn--md btn--full btn--primary"
              @click="() => handleOnCtaClick(plan.key)"
            >
              {{ getCtaContent(plan.key) }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AppPlanModal
    v-if="isPlanModalOpen"
    v-model="isPlanModalOpen"
    :title="planModalTitle"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import moment from 'moment';
import config from '@/config';
import Plans from '@/security/plans';
import { plans } from '../settings-pricing-plans';
import AppPlanModal from '../components/plan-modal.vue';

const crowdHostedPlans = Plans.values;
const communityPlans = Plans.communityValues;

const { isCommunityVersion } = config;
const isCommunitPremiumVersion = config.communityPremium === 'true';

const store = useStore();

const isPlanModalOpen = ref(false);
const planModalTitle = ref(null);

const currentTenant = computed(
  () => store.getters['auth/currentTenant'],
);

const currentUser = computed(
  () => store.getters['auth/currentUser'],
);

const plansList = computed(() => {
  if (isCommunityVersion) {
    return plans.community;
  }

  return plans.crowdHosted;
});

// eslint-disable-next-line vue/max-len
const eagleEyeStripeLink = computed(() => `${config.stripe.eagleEyePlanPaymentLink}?client_reference_id=${currentTenant.value.id}&prefilled_email=${currentUser.value.email}`);

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

const isGrowthTrialPlan = computed(
  () => activePlan.value === crowdHostedPlans.growth
    && currentTenant.value.isTrialPlan,
);

const isEssentialPlanActive = computed(
  () => activePlan.value === crowdHostedPlans.essential,
);

const isEagleEyeEnabled = computed(
  () => activePlan.value === crowdHostedPlans.eagleEye,
);

const showEagleEyePricing = computed(
  () => isEssentialPlanActive.value
    || isGrowthTrialPlan.value
    || isEagleEyeEnabled.value,
);

const getBadge = (plan) => {
  if (plan === crowdHostedPlans.growth) {
    // Growth Trial plans
    if (currentTenant.value.isTrialPlan) {
      return {
        class: 'badge--yellow',
        content: 'Active plan (Trial)',
      };
    } if (
      // Recommended plans
      activePlan.value === crowdHostedPlans.essential
    ) {
      return {
        class: 'badge--light-brand',
        content: 'Recommended',
      };
    }
  }

  // Active plans
  return {
    class: 'badge--brand',
    content: 'Active plan',
  };
};

const getCtaContent = (plan) => {
  const { title } = plansList.value.find(
    (p) => p.key === plan,
  );

  // Custom plans
  if (
    plan === crowdHostedPlans.enterprise
    || plan === communityPlans.custom
  ) {
    return 'Book a call';
    // Growth Trial Plans
  } if (
    plan === crowdHostedPlans.growth
    && isGrowthTrialPlan.value
  ) {
    return 'Subscribe Growth';
  } if (
    // Essential, Community and Growth
    plan === crowdHostedPlans.essential
    || plan === communityPlans.community
    || (plan === crowdHostedPlans.growth
      && activePlan.value === crowdHostedPlans.enterprise)
  ) {
    return `Downgrade to ${title}`;
  }
  return `Upgrade to ${title}`;
};

const onManageBillingClick = () => {
  window.open(config.stripe.customerPortalLink, '_blank');
};

const handleOnCtaClick = (plan) => {
  // Send an event with plan request
  window.analytics.track('Change Plan Request', {
    tenantId: currentTenant.value.id,
    tenantName: currentTenant.value.name,
    requestedPlan: plan,
  });

  // Custom plans
  if (
    plan === crowdHostedPlans.enterprise
    || plan === communityPlans.custom
  ) {
    window.open(
      'https://cal.com/team/CrowdDotDev/custom-plan',
      '_blank',
    );
    // Growth plan
  } else if (plan === crowdHostedPlans.growth) {
    window.open(
      `${config.stripe.growthPlanPaymentLink}?client_reference_id=${currentTenant.value.id}&prefilled_email=${currentUser.value.email}`,
      '_blank',
    );
  } else {
    onManageBillingClick();
  }
};

const getTrialDate = () => {
  const daysLeft = moment(
    currentTenant.value.trialEndsAt,
  ).diff(moment(), 'days');

  return `Growth Trial ends in ${
    daysLeft < 0 ? 0 : daysLeft
  } days.`;
};
</script>

<script>
export default {
  name: 'AppPlansPage',
};
</script>

<style lang="scss">
.sale-banner {
  @apply text-2xs font-medium text-purple-900 bg-purple-50 rounded-t-lg min-h-6 flex items-center justify-center px-4 py-0.5;
}

.pricing-plan {
  @apply flex flex-col flex-1 rounded-lg bg-white border border-solid border-gray-200 p-6 grow justify-between;

  &.active {
    @apply border-gray-50 bg-gray-50;
  }

  &.sale {
    @apply rounded-t-none;
  }
}
</style>

<template>
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
            'mt-6': !isCommunityVersion && !plan.sale
          }"
        >
          <div>
            <div class="flex flex-col gap-4 mb-8">
              <div
                class="flex justify-between items-center"
              >
                <!-- Title -->
                <h5 class="text-gray-900">
                  {{ plan.title }}
                </h5>
                <!-- Badge -->
                <span
                  v-if="
                    plan.key === activePlan ||
                    (plan.key === crowdHostedPlans.growth &&
                      activePlan ===
                        crowdHostedPlans.essential)
                  "
                  class="badge badge--sm"
                  :class="getBadge(plan.key).class"
                  >{{ getBadge(plan.key).content }}</span
                >
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
              class="flex flex-col gap-4 text-gray-900 text-xs mb-12"
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

          <div class="text-center">
            <div
              v-if="
                plan.key === crowdHostedPlans.growth &&
                isGrowthTrialPlan
              "
              class="text-gray-500 text-xs italic mb-3"
            >
              {{ getTrialDate() }}
            </div>
            <el-button
              v-if="
                plan.key !== activePlan || isGrowthTrialPlan
              "
              class="btn btn--md btn--full btn--primary"
              @click="() => handleOnCtaClick(plan.key)"
              >{{ getCtaContent(plan.key) }}</el-button
            >
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

<script>
export default {
  name: 'AppPlansPage'
}
</script>

<script setup>
import config from '@/config'
import Plans from '@/security/plans'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { plans } from '../settings-pricing-plans'
import moment from 'moment'
import AppPlanModal from '../components/plan-modal.vue'

const crowdHostedPlans = Plans.values
const communityPlans = Plans.communityValues

const isCommunityVersion = config.isCommunityVersion
const isCommunitPremiumVersion =
  config.communityPremium === 'true'

const store = useStore()

const isPlanModalOpen = ref(false)
const planModalTitle = ref(null)

const currentTenant = computed(
  () => store.getters['auth/currentTenant']
)

const plansList = computed(() => {
  if (isCommunityVersion) {
    return plans.community
  }

  return plans.crowdHosted
})

const activePlan = computed(() => {
  // Community Versions
  if (isCommunityVersion) {
    return isCommunitPremiumVersion
      ? communityPlans.custom
      : communityPlans.community
  } else {
    // Crowd Hosted Versions
    return currentTenant.value.plan
  }
})

const isGrowthTrialPlan = computed(
  () =>
    activePlan.value === crowdHostedPlans.growth &&
    currentTenant.value.isTrialPlan
)

const getBadge = (plan) => {
  if (plan === crowdHostedPlans.growth) {
    // Growth Trial plans
    if (currentTenant.value.isTrialPlan) {
      return {
        class: 'badge--yellow',
        content: 'Active plan (Trial)'
      }
    } else if (
      // Recommended plans
      activePlan.value === crowdHostedPlans.essential
    ) {
      return {
        class: 'badge--light-brand',
        content: 'Recommended'
      }
    }
  }

  // Active plans
  return {
    class: 'badge--brand',
    content: 'Active plan'
  }
}

const getCtaContent = (plan) => {
  const title = plansList.value.find(
    (p) => p.key === plan
  ).title

  // Custom plans
  if (
    plan === crowdHostedPlans.enterprise ||
    plan === communityPlans.custom
  ) {
    return 'Book a call'
    // Growth Trial Plans
  } else if (
    plan === crowdHostedPlans.growth &&
    isGrowthTrialPlan.value
  ) {
    return 'Subscribe Growth'
  } else if (
    // Essential, Community and Growth
    plan === crowdHostedPlans.essential ||
    plan === communityPlans.community ||
    (plan === crowdHostedPlans.growth &&
      activePlan.value === crowdHostedPlans.enterprise)
  ) {
    return `Downgrade to ${title}`
  } else {
    return `Upgrage to ${title}`
  }
}

const handleOnCtaClick = (plan) => {
  // Custom plans
  if (
    plan === crowdHostedPlans.enterprise ||
    plan === communityPlans.custom
  ) {
    window.open(
      'https://cal.com/team/CrowdDotDev/custom-plan',
      '_blank'
    )
  } else {
    isPlanModalOpen.value = true
    planModalTitle.value = getCtaContent(plan)

    // Send an event with plan request
    window.analytics.track('Change Plan Request', {
      tenantId: currentTenant.value.id,
      tenantName: currentTenant.value.name,
      requestedPlan: plan
    })
  }
}

const getTrialDate = () => {
  const daysLeft = moment(
    currentTenant.value.trialEndsAt
  ).diff(moment(), 'days')

  return `Trial ends in ${daysLeft < 0 ? 0 : daysLeft} days`
}
</script>

<style lang="scss">
.sale-banner {
  @apply text-2xs font-medium text-purple-900 bg-purple-50 rounded-t-lg h-6 flex items-center justify-center;
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

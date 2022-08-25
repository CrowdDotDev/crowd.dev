<template>
  <div class="plan-card">
    <div>
      <div class="title">{{ label }}</div>
      <div class="pricing">
        {{ price }}
        <span class="pricingPeriod">
          <app-i18n code="plan.pricingPeriod"></app-i18n>
        </span>
      </div>
    </div>

    <div>
      <el-button
        :disabled="true"
        class="w-100"
        native-type="button"
        v-if="isCurrentPlan"
      >
        <app-i18n code="plan.current"></app-i18n>
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Plans from '@/security/plans'
import { i18n } from '@/i18n'

export default {
  name: 'app-plan-card-free',

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant'
    }),

    label() {
      return i18n(`plan.${Plans.values.free}.label`)
    },

    price() {
      return i18n(`plan.free.price`)
    },

    isCurrentPlan() {
      return this.currentTenant.plan === Plans.values.free
    }
  }
}
</script>

<style></style>

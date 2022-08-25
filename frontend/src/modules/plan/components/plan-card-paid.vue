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
      <p
        v-if="
          isCurrentPlan &&
          currentTenant.planStatus ===
            'cancel_at_period_end'
        "
        class="cancelAtPeriodEnd"
      >
        <app-i18n code="plan.cancelAtPeriodEnd"></app-i18n>
      </p>

      <p
        v-if="
          isCurrentPlan &&
          currentTenant.planStatus === 'error'
        "
        class="somethingWrong"
      >
        <app-i18n code="plan.somethingWrong"></app-i18n>
      </p>

      <el-button
        :disabled="
          !hasPermissionToEdit || !isPlanUser || loading
        "
        @click="doCheckout(plan)"
        native-type="button"
        class="w-100 btn btn--primary"
        v-if="buttonState === 'payment'"
      >
        <app-i18n code="plan.subscribe"></app-i18n>
      </el-button>

      <el-button
        :disabled="!hasPermissionToEdit || loading"
        @click="doPortal()"
        native-type="button"
        class="w-100 btn btn--primary"
        v-if="buttonState === 'manage' && isPlanUser"
      >
        <app-i18n code="plan.manage"></app-i18n>
      </el-button>

      <el-tooltip
        v-if="buttonState === 'manage' && !isPlanUser"
        :content="notPlanUserTooltip"
      >
        <span>
          <el-button
            :disabled="true"
            native-type="button"
            class="w-100 btn btn--primary"
          >
            <app-i18n code="plan.manage"></app-i18n>
          </el-button>
        </span>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Plans from '@/security/plans'
import { i18n } from '@/i18n'
import { PlanPermissions } from '../plan-permissions'

export default {
  name: 'app-plan-card-paid',

  props: ['plan'],

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      loading: 'plan/loading',
      isPlanUser: 'plan/isPlanUser'
    }),

    hasPermissionToEdit() {
      return new PlanPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    label() {
      return i18n(`plan.${this.plan}.label`)
    },

    price() {
      return i18n(`plan.${this.plan}.price`)
    },

    isCurrentPlan() {
      return this.currentTenant.plan === this.plan
    },

    buttonState() {
      return this.isCurrentPlan
        ? 'manage'
        : this.currentTenant.plan === Plans.values.free
        ? 'payment'
        : 'none'
    },

    notPlanUserTooltip() {
      return i18n('plan.notPlanUser')
    }
  },

  methods: {
    ...mapActions({
      doCheckout: 'plan/doCheckout',
      doPortal: 'plan/doPortal'
    })
  }
}
</script>

<style></style>

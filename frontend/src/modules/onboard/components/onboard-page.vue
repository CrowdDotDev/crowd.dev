<template>
  <div class="onboard relative">
    <div class="wrapper flex-col" :style="wrapperStyle">
      <img
        src="/images/icon.png"
        alt="crowd-logo"
        class="mb-20 h-10 absolute top-0 left-0 mt-6 ml-6"
      />
      <div class="absolute top-0 right-0 mt-6 mr-6">
        <app-header></app-header>
      </div>
      <h1 class="title">
        {{ computedHeader }}
      </h1>
      <div class="content">
        <transition name="fade" mode="out-in">
          <div class="content panel" v-if="step === 1">
            <img
              src="/images/tenant-create.svg"
              alt="create-tenant"
              class="h-64 my-12 block"
            />
            <app-tenant-new-form @created="step = 2" />
          </div>
          <app-onboard-populate-data v-if="step === 2" />
        </transition>
      </div>
      <div class="flex items-center justify-center py-8">
        <span
          class="bg-white h-3 w-3 rounded-full opacity-25 mr-2"
        ></span>
        <span
          class="bg-white h-3 w-3 rounded-full mr-2"
        ></span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppOnboardPopulateData from './onboard-populate-data'
import AppTenantNewForm from '../../auth/components/tenant-new-form'

export default {
  name: 'app-onboard-page',

  components: {
    AppTenantNewForm,
    AppOnboardPopulateData
  },

  data() {
    return {
      step: 1
    }
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      invitedTenants: 'auth/invitedTenants',
      integrationsCount: 'integration/count'
    }),

    computedHeader() {
      return this.step === 1
        ? "First, let's create your Workspace"
        : "Now, let's set up some data"
    },

    wrapperStyle() {
      return {
        backgroundColor: '#140505'
      }
    }
  },

  created() {
    this.step = this.currentTenant === null ? 1 : 2
  }
}
</script>

<style lang="scss">
.onboard {
  .el-dropdown-link-body {
    @apply flex items-center;
  }

  .data-type-option {
    @apply flex flex-col items-center w-1/2 mx-4 p-8 border rounded-lg cursor-pointer;
    transition: all 0.2s;
  }
}
</style>

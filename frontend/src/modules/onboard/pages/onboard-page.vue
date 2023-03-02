<template>
  <div class="p-6 flex justify-center">
    <main>
      <div class="pt-10">
        <div
          class="flex flex-wrap flex-row-reverse justify-between pb-8"
        >
          <div>
            <img
              class="h-6 w-auto"
              src="/images/logo/crowd.svg"
              alt="crowd.dev logo"
            />
          </div>
          <div>
            <h3
              class="text-2xl font-semibold leading-12 mb-1"
            >
              Howdie<span v-if="currentUser"
                >, {{ currentUser.firstName }}</span
              >
            </h3>
            <p class="text-sm text-gray-600 leading-5">
              Let’s setup your community
            </p>
          </div>
        </div>
        <section class="panel !p-8">
          <div class="-mx-3 flex">
            <div
              class="basis-0 flex-grow w-full px-3"
              :class="{ 'cursor-pointer': currentTenant }"
              @click="tab = currentTenant ? 1 : tab"
            >
              <div
                class="h-1 w-full rounded mb-3"
                :class="
                  tab === 1
                    ? 'bg-brand-500'
                    : 'bg-brand-200'
                "
              ></div>
              <p
                class="text-xs leading-5 font-semibold"
                :class="
                  tab === 1
                    ? 'text-brand-500'
                    : 'text-brand-300'
                "
              >
                Tell us about your community
              </p>
            </div>
            <div
              v-if="secondTabEnabled"
              class="basis-0 flex-grow w-full px-3"
              :class="{ 'cursor-pointer': currentTenant }"
              @click="tab = currentTenant ? 2 : tab"
            >
              <div
                class="h-1 w-full rounded mb-3"
                :class="
                  tab !== 1 ? 'bg-brand-500' : 'bg-gray-200'
                "
              ></div>
              <p
                class="text-xs leading-5 font-semibold"
                :class="
                  tab !== 1
                    ? 'text-brand-500'
                    : 'text-gray-400'
                "
              >
                Sync data
              </p>
            </div>
          </div>
          <div class="pt-16">
            <app-onboard-community
              v-show="tab === 1"
              :is-new="isNew"
              :is-button-loading="populatingData"
              @saved="next()"
            >
              <template #submitButton>
                <span v-if="secondTabEnabled" class="pr-3"
                  >Next step</span
                >
                <span v-else class="pr-3"
                  >Finish setup</span
                >
                <span
                  class="ri-arrow-right-s-line text-xl"
                ></span>
              </template>
            </app-onboard-community>
            <app-onboard-integrations
              v-if="currentTenant && tab === 2"
              @previous="tab = 1"
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import AppOnboardCommunity from '@/modules/onboard/components/onboard-community'
import AppOnboardIntegrations from '@/modules/onboard/components/onboard-integrations'
import { mapActions, mapGetters } from 'vuex'
import { TenantService } from '@/modules/tenant/tenant-service'
export default {
  name: 'OnboardPage',
  components: {
    AppOnboardIntegrations,
    AppOnboardCommunity
  },
  data() {
    return {
      tab: 1,
      created: false,
      isNew: false,
      onboardType: null,
      populatingData: false
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser', 'currentTenant']),
    secondTabEnabled() {
      return this.onboardType !== 'eagle-eye'
    }
  },
  watch: {
    currentTenant: {
      immediate: true,
      handler(tenant) {
        this.onboardType =
          localStorage.getItem('onboardType')
        if (
          tenant &&
          !this.isNew &&
          this.secondTabEnabled
        ) {
          this.tab = 2
        }
      }
    }
  },
  created() {
    const { action } = this.$route.query
    this.onboardType = localStorage.getItem('onboardType')
    this.isNew = action === 'new'
    if (this.isNew) {
      localStorage.removeItem('onboardType')
      this.onboardType = null
    }
    if (this.isNew) {
      this.clearTenant()
      this.tab = 1
    }
  },
  methods: {
    ...mapActions('auth', [
      'clearTenant',
      'doFinishOnboard'
    ]),
    next() {
      if (this.secondTabEnabled) {
        this.tab = 2
      } else {
        this.populateData()
      }
    },
    populateData() {
      this.populatingData = true
      TenantService.populateSampleData(
        this.currentTenant.id
      ).then(() => {
        localStorage.removeItem('onboardType')
        return this.doFinishOnboard({ route: '/eagle-eye' })
      })
    }
  }
}
</script>
<style lang="scss" scoped>
main {
  width: 100%;
  max-width: 42.75rem;
}
</style>

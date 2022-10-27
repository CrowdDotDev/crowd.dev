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
              src="/images/crowd-logo.svg"
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
              class="w-1/2 px-3"
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
              class="w-1/2 px-3"
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
              @saved="tab = 2"
            />
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
      isNew: false
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser', 'currentTenant'])
  },
  watch: {
    currentTenant: {
      immediate: true,
      handler(tenant) {
        if (tenant && !this.isNew) {
          this.tab = 2
        }
      }
    }
  },
  created() {
    const { action } = this.$route.query
    this.isNew = action === 'new'
    if (this.isNew) {
      this.clearTenant()
      this.tab = 1
    }
  },
  methods: {
    ...mapActions('auth', ['clearTenant'])
  }
}
</script>
<style lang="scss" scoped>
main {
  width: 100%;
  max-width: 42.75rem;
}
</style>

<template>
  <div class="pt-10">
    <div
      class="flex flex-wrap flex-row-reverse justify-between pb-8"
    >
      <div>
        <img
          class="h-6 w-auto"
          src="/images/logo-black.png"
          alt="crowd.dev logo"
        />
      </div>
      <div>
        <h3 class="text-2xl font-semibold leading-12 mb-1">
          Howdie, Jonathan
        </h3>
        <p class="text-sm text-gray-600 leading-5">
          Let’s setup your community
        </p>
      </div>
    </div>
    <section class="panel !p-8">
      <div class="-mx-3 flex">
        <div class="w-1/2 px-3">
          <div
            class="h-1 w-full rounded mb-3"
            :class="
              tab === 1 ? 'bg-brand-500' : 'bg-brand-200'
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
        <div class="w-1/2 px-3">
          <div
            class="h-1 w-full rounded mb-3"
            :class="
              tab !== 1 ? 'bg-brand-500' : 'bg-gray-200'
            "
          ></div>
          <p
            class="text-xs leading-5 font-semibold text-gray-400"
            :class="
              tab !== 1 ? 'text-brand-500' : 'text-gray-400'
            "
          >
            Sync data
          </p>
        </div>
      </div>
      <div class="pt-16">
        <app-onboard-community v-if="tab === 1" />
        <app-onboard-integrations v-else />
      </div>
    </section>
  </div>
</template>

<script>
import AppOnboardCommunity from '@/modules/onboard/components/onboard-community'
import AppOnboardIntegrations from '@/modules/onboard/components/onboard-integrations'
export default {
  name: 'OnboardPage',
  components: {
    AppOnboardIntegrations,
    AppOnboardCommunity
  },
  data() {
    return {
      tab: 1
    }
  }
}
</script>

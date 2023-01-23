<template>
  <div>
    <p class="text-xs font-semibold mb-2">
      Plug-in with our available integrations
    </p>
    <div class="pb-10">
      <article
        v-for="(integration, ii) of activeIntegrations"
        :key="integration.platform"
        :class="{
          'border-b': ii < activeIntegrations.length - 1
        }"
        class="py-4 border-gray-200 flex items-center"
      >
        <div class="flex-grow flex">
          <div class="pr-4">
            <img
              :src="integration.image"
              class="h-6 w-6"
              :alt="integration.name"
            />
          </div>
          <div class="flex-grow">
            <h6 class="text-sm font-medium mb-1">
              {{ integration.name }}
            </h6>
            <p class="text-gray-500 text-2xs">
              {{ integration.description }}
            </p>
          </div>
        </div>
        <div>
          <app-onboard-integrations-connect
            :integration="integration"
          />
        </div>
      </article>
    </div>
    <div
      class="-mx-8 -mb-8 px-8 py-6 bg-gray-50 flex justify-between"
    >
      <el-button
        class="btn btn--lg btn--transparent"
        @click="$emit('previous')"
      >
        <span class="ri-arrow-left-s-line text-xl"></span>
        <span class="pl-3">Previous step</span>
      </el-button>
      <el-button
        id="onboardFinish"
        class="btn btn--lg btn--primary"
        @click="finish()"
      >
        <span class="pr-3">Finish setup</span>
        <span class="ri-arrow-right-s-line text-xl"></span>
      </el-button>
    </div>
  </div>
  <app-dialog
    v-model="populateDataModal"
    size="small"
    custom-class="onboard-dialog"
    :show-header="false"
  >
    <template #content>
      <div class="p-6">
        <p class="text-2xl leading-12 pb-2">👀</p>
        <h4
          class="text-base leading-6 font-semibold pb-2 text-gray-1000"
        >
          Not ready to sync your own data?
        </h4>
        <p class="text-sm leading-5 text-gray-500 pb-8">
          Get to know the product with a set of sample data
          <br />
          that we prepared for you
        </p>
        <el-button
          id="continueSampleData"
          :loading="populatingData"
          class="btn btn--primary btn--md mb-3 w-full"
          @click="populateData()"
        >
          Continue with sample data
        </el-button>
        <div class="flex justify-center">
          <div
            id="closeSampleDataModal"
            class="text-sm font-medium p-2 text-brand-600 cursor-pointer"
            @click="populateDataModal = false"
          >
            Back to setup
          </div>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AppOnboardIntegrationsConnect from '@/modules/onboard/components/onboard-integrations-connect'
import { TenantService } from '@/modules/tenant/tenant-service'
import { CrowdIntegrations } from '@/integrations/integrations-config'

export default {
  name: 'AppOnboardIntegrations',
  components: {
    AppOnboardIntegrationsConnect
  },
  emits: ['previous'],
  data() {
    return {
      populateDataModal: false,
      populatingData: false
    }
  },
  computed: {
    ...mapGetters('integration', [
      'findByPlatform',
      'count'
    ]),
    ...mapGetters('auth', ['currentTenant']),
    activeIntegrations() {
      return CrowdIntegrations.mappedEnabledConfigs(
        this.$store
      )
    }
  },
  mounted() {
    if (this.count === 0) {
      this.doFetch()
    }

    const params = new URLSearchParams(
      window.location.search
    )
    // GitHub redirects back here. This might have to be changed.
    // It is giving us a code for Oauth and and Install ID in the URL,
    // we need those things to authenticate the app and to perform the Oauth
    const code = params.get('code')
    const install_id = params.get('installation_id')

    // If the URL parameters are present (we have been redirected from GitHub):
    // do the authentication and the Oauth.
    const setupAction = params.get('setup_action')

    // Get the source. If none we use GitHub.
    const source = params.get('source')

    if (code) {
      if (source === 'discord') {
        this.doDiscordConnect({
          guildId: params.get('guild_id')
        })
      } else {
        this.doGithubConnect({
          code,
          install_id,
          setupAction
        })
      }
    }
  },
  methods: {
    ...mapActions('integration', [
      'doFetch',
      'doDiscordConnect',
      'doGithubConnect'
    ]),
    ...mapActions('auth', ['doFinishOnboard']),
    finish() {
      if (this.count > 0) {
        this.doFinishOnboard()
        return
      }
      this.populateDataModal = true
    },
    populateData() {
      this.populatingData = true
      TenantService.populateSampleData(
        this.currentTenant.id
      ).then(() => {
        return this.doFinishOnboard()
      })
    }
  }
}
</script>

<style lang="scss">
.onboard-dialog {
  .el-dialog__header {
    @apply p-0;
  }
}
</style>

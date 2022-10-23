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
              {{ integration.status }}
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
      <el-button class="btn btn--lg btn--primary">
        <span class="pr-3">Finish setup</span>
        <span class="ri-arrow-right-s-line text-xl"></span>
      </el-button>
    </div>
  </div>
</template>

<script>
import integrations from '@/jsons/integrations.json'
import { mapActions, mapGetters } from 'vuex'
import AppOnboardIntegrationsConnect from '@/modules/onboard/components/onboard-integrations-connect'

export default {
  name: 'AppOnboardIntegrations',
  components: {
    AppOnboardIntegrationsConnect
  },
  emits: ['previous'],
  computed: {
    ...mapGetters('integration', [
      'findByPlatform',
      'count'
    ]),
    activeIntegrations() {
      return integrations
        .filter((integration) => integration.active)
        .map((i) => this.mapper(i))
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
    mapper(integration) {
      return {
        ...integration,
        ...this.findByPlatform(integration.platform)
      }
    }
  }
}
</script>

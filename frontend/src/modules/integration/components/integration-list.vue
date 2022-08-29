<template>
  <div class="relative">
    <div
      v-if="loading"
      class="absolute flex items-center justify-center flex-grow flex-col w-full inset-0 z-10 rounded-lg blur-2xl mt-4"
      :style="{
        backgroundColor: 'rgba(255,255,255,1)'
      }"
    >
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner w-20"
      ></div>
      <span>
        Finishing the integration setup, please don't reload
        the page.
      </span>
    </div>
    <el-row type="flex" :gutter="16" class="pt-4">
      <el-col
        v-for="integrationJson in integrationsJsonArray"
        :key="integrationJson.platform"
        :lg="12"
        :md="16"
        :sm="24"
      >
        <div
          class="panel flex items-start justify-between mb-4"
          :class="onboard ? 'border border-gray-50' : ''"
        >
          <div class="flex items-center">
            <img
              :src="integrationJson.image"
              class="h-12 mr-4"
            />
            <div>
              <span
                class="block font-semibold leading-none"
                >{{ integrationJson.name }}</span
              >
              <div
                v-if="integrationJson.platform !== 'other'"
                class="flex items-center mt-1 text-sm"
              >
                <div
                  v-if="
                    integrations.hasOwnProperty(
                      integrationJson.platform
                    )
                  "
                  class="font-semibold flex items-center"
                  :class="
                    integrations[integrationJson.platform]
                      .status === 'done'
                      ? 'text-green-900'
                      : 'text-yellow-900'
                  "
                >
                  <span class="block">{{
                    statusToString(
                      integrations[integrationJson.platform]
                        .status
                    )
                  }}</span>
                  <span
                    v-if="
                      integrationJson.platform ===
                        'twitter' &&
                      integrations.twitter.status !== 'done'
                    "
                    class="block ml-2 font-light italic text-gray-400"
                  >
                    Fetching the first activities from this
                    integration may take a few minutes
                  </span>
                </div>
                <span v-else class="text-gray-400">
                  Inactive
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center">
            <div
              v-if="integrationJson.platform === 'github'"
            >
              <a
                class="btn btn--secondary btn--sm"
                :href="githubConnectUrl"
              >
                {{
                  integrations.hasOwnProperty(
                    integrationJson.platform
                  )
                    ? integrations[integrationJson.platform]
                        .status === 'in-progress' ||
                      integrations[integrationJson.platform]
                        .status === 'waiting-approval'
                      ? 'Reconnect'
                      : 'Edit'
                    : 'Connect'
                }}
              </a>
            </div>
            <a
              v-else-if="
                integrationJson.platform === 'discord'
              "
              class="btn btn--secondary btn--sm"
              :href="discordConnectUrl"
            >
              Connect
            </a>
            <a
              v-else-if="
                integrationJson.platform === 'slack'
              "
              class="btn btn--secondary btn--sm cursor-pointer block"
              :href="slackConnectUrl"
            >
              Connect
            </a>
            <div
              v-else-if="
                integrationJson.platform === 'twitter'
              "
              class="relative"
            >
              <el-button
                v-if="integrations.twitter"
                class="btn btn--secondary btn--sm"
                @click="twitter.popover = true"
              >
                {{
                  hasTwitterHashtags
                    ? 'Update Hashtag'
                    : 'Add Hashtag'
                }}
              </el-button>
              <a
                v-else
                class="btn btn--secondary btn--sm"
                :href="twitterConnectUrl"
              >
                Connect
              </a>
              <app-popover
                :visible="twitter.popover"
                @hide="twitter.popover = false"
              >
                <el-form class="form">
                  <span
                    class="flex items-center font-semibold text-base"
                    ><i class="ri-twitter-fill mr-1"></i
                    >Pick the hashtag you want to
                    follow</span
                  >
                  <el-form-item>
                    <app-autocomplete-one-input
                      :fetch-fn="() => []"
                      :create-fn="createTwitterHashtag"
                      :value="twitter.hashtags[0]"
                      :allow-create="true"
                      class="mt-2"
                      placeholder="Type to select hashtag"
                      @input="handleTwitterHashtagsInput"
                    ></app-autocomplete-one-input>

                    <div
                      class="app-form-hint leading-tight mt-1"
                    >
                      Tip: Choose a hashtag that's specific
                      to your company/community for better
                      data
                    </div>
                  </el-form-item>
                </el-form>
                <a
                  class="btn btn--primary btn--sm mr-2"
                  :href="twitterConnectUrl"
                >
                  Update
                </a>
                <button
                  class="btn btn--secondary"
                  @click="twitter.popover = false"
                >
                  Close
                </button>
              </app-popover>
            </div>
            <div
              v-else-if="
                integrationJson.platform === 'devto'
              "
            >
              <el-button
                v-if="
                  integrations.devto === undefined ||
                  integrations.devto.status === 'done'
                "
                class="btn btn--secondary btn--sm"
                @click="$refs.devtoWidget[0].toggle()"
              >
                {{
                  integrations.devto ? 'Edit' : 'Connect'
                }}
              </el-button>
              <devto-integration-widget
                ref="devtoWidget"
                :integration="
                  integrations.devto
                    ? integrations.devto
                    : null
                "
              />
            </div>
            <a
              v-else-if="
                integrationJson.platform === 'other'
              "
              class="btn btn--secondary btn--sm"
              target="_blank"
              href="https://8vcqnrnp5it.typeform.com/to/EvtXce0q"
            >
              Tell us
            </a>
            <span
              v-else
              class="text-gray-600 uppercase text-xs font-semibold"
              >Soon</span
            >
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { AuthToken } from '@/modules/auth/auth-token'
import AppPopover from '@/shared/popover/popover'
import DevtoIntegrationWidget from '@/modules/integration/components/devto-integration-widget'

import config from '@/config'
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'AppIntegrationsList',
  components: { AppPopover, DevtoIntegrationWidget },

  props: {
    onboard: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loading: false,
      user: '',
      repositories: [],
      integrationsJsonArray: this.onboard
        ? integrationsJsonArray.filter((i) =>
            [
              'github',
              'slack',
              'discord',
              'twitter',
              'devto'
            ].includes(i.platform)
          )
        : integrationsJsonArray,
      twitter: {
        popover: false,
        hashtags: []
      }
    }
  },

  computed: {
    ...mapGetters({
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout',
      integrations: 'integration/listByPlatform'
    }),

    githubConnectUrl() {
      // We have 3 GitHub apps: test, test-local and prod
      // Getting the proper URL from config file
      return config.gitHubInstallationUrl
    },

    discordConnectUrl() {
      return config.discordInstallationUrl
    },

    twitterConnectUrl() {
      const currentUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
      const redirectUrl = currentUrl.includes(
        'integrations'
      )
        ? currentUrl
        : `${currentUrl}?activeTab=integrations`

      return `${config.backendUrl}/twitter/${
        this.currentTenant.id
      }/connect?redirectUrl=${redirectUrl}&${this.twitter.hashtags.map(
        (t) => `hashtags[]=${t.id}`
      )}&crowdToken=${AuthToken.get()}`
    },

    slackConnectUrl() {
      const currentUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
      const redirectUrl = currentUrl.includes(
        'integrations'
      )
        ? currentUrl
        : `${currentUrl}?activeTab=integrations`

      return `${config.backendUrl}/slack/${
        this.currentTenant.id
      }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}`
    },

    codeQuery() {
      return this.$route.query.code
    },

    hasTwitterHashtags() {
      return (
        this.integrations.twitter &&
        this.integrations.twitter.settings &&
        this.integrations.twitter.settings.hashtags.length >
          0
      )
    }
  },

  async mounted() {
    // GitHub redirects back here. This might have to be changed.
    // It is giving us a code for Oauth and and Install ID in the URL,
    // we need those things to authenticate the app and to perform the Oauth
    const code = this.$route.query.code
    const install_id = this.$route.query.installation_id
    // Get the source. If none we use GitHub.
    const source = this.$route.query.source
    // If the URL parameters are present (we have been redirected from GitHub):
    // do the authentication and the Oauth.

    const setupAction = this.$route.query.setup_action

    if (code) {
      if (source === 'discord') {
        const guildId = this.$route.query.guild_id
        await this.doDiscordConnect({ guildId })
      } else {
        // The default connection if a code is present is GitHub.
        this.loading = true
        await this.doGithubConnect({
          code,
          install_id,
          setupAction
        })
        this.loading = false
      }
    }
  },

  async created() {
    await this.doFetch()

    this.twitter.hashtags = !this.hasTwitterHashtags
      ? []
      : this.integrations.twitter.settings.hashtags.map(
          (t) => {
            return { id: t, label: `#${t}` }
          }
        )
  },

  methods: {
    ...mapActions({
      doFetch: 'integration/doFetch',
      doGithubConnect: 'integration/doGithubConnect',
      needsAttention: 'integration/needsAttention',
      doDiscordConnect: 'integration/doDiscordConnect'
    }),

    createTwitterHashtag(hashtag) {
      // TODO: Maybe in the future it would be cool to fetch real twitter's hashtags
      const value = hashtag.replace('#', '')

      return { id: value, label: `#${value}` }
    },

    handleTwitterHashtagsInput(hashtag) {
      this.$nextTick(() => {
        this.twitter.hashtags = [hashtag]
      })
    },

    statusToString(status) {
      if (status === 'done') {
        return 'Active'
      } else if (status === 'in-progress') {
        return 'In Progress'
      } else if (status === 'waiting-approval') {
        return 'Waiting for GitHub admin to set up the integration'
      } else {
        return 'Inactive'
      }
    }
  }
}
</script>

<template>
  <div class="community-help-center-settings">
    <el-button
      v-if="buttonVisible && hasPermissionToEdit"
      class="btn btn--transparent btn--md"
      :disabled="isCreateLockedForSampleData"
      @click="$emit('open')"
    >
      <i class="ri-lg ri-settings-2-line mr-1" />
      Settings
    </el-button>
    <app-drawer
      v-model="computedVisible"
      title="Settings"
      pre-title="Community Help Center"
      size="600px"
      @close="$emit('close')"
    >
      <template #content>
        <toggle v-model="model.enabled" class="mb-6" />
        <el-form
          v-if="visible"
          ref="form"
          class="w-full form"
          :model="model"
          :rules="rules"
          label-position="top"
          @submit.prevent="doSubmit"
        >
          <div class="relative">
            <div
              v-if="!model.enabled"
              class="absolute inset-0 bg-gray-50 opacity-60 z-10 -m-6"
            ></div>
            <general
              v-model:tenantSlug="model.tenantSlug"
              v-model:tenantName="model.tenantName"
              v-model:customUrl="model.customUrl"
              :disabled="!model.enabled"
            />
            <links
              v-model:website="model.website"
              v-model:discordInviteLink="
                model.discordInviteLink
              "
              v-model:slackInviteLink="
                model.slackInviteLink
              "
              v-model:githubInviteLink="
                model.githubInviteLink
              "
              :disabled="!model.enabled"
            />
            <auto-publish
              v-model:status="model.autoPublish.status"
              v-model:channels="model.autoPublish.channels"
              :disabled="!model.enabled"
            />
            <theming
              v-model:theme="model.theme"
              v-model:logoUrl="model.logoUrl"
              v-model:faviconUrl="model.faviconUrl"
              :disabled="!model.enabled"
            />
          </div>
        </el-form>
      </template>
      <template #footer>
        <div class="form-buttons">
          <el-button
            :disabled="loading"
            class="btn btn--bordered btn--md mr-4"
            @click="$emit('close')"
          >
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>

          <el-button
            :disabled="loading"
            class="btn btn--primary btn--md"
            @click="doSubmit"
          >
            Update
          </el-button>
        </div>
      </template>
    </app-drawer>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import StringField from '@/shared/fields/string-field'
import UrlField from '@/shared/fields/url-field'
import DomainField from '@/shared/fields/domain-field'
import { FormSchema } from '@/shared/form/form-schema'
import authAxios from '@/shared/axios/auth-axios'
import Message from '@/shared/message/message'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'
import { i18n } from '@/i18n'
import AutoPublish from '@/premium/community-help-center/components/settings/_auto-publish'
import General from '@/premium/community-help-center/components/settings/_general'
import Theming from '@/premium/community-help-center/components/settings/_theming'
import Toggle from '@/premium/community-help-center/components/settings/_toggle'
import Links from '@/premium/community-help-center/components/settings/_links'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'

const formSchema = new FormSchema([
  new UrlField('website', 'Website'),
  new StringField('tenantName', 'Tenant Name'),
  new StringField('tenantSlug', 'Tenant Slug'),
  new UrlField('slackInviteLink', 'Slack URL'),
  new UrlField('discordInviteLink', 'Discord URL'),
  new UrlField('githubInviteLink', 'GitHub URL'),
  new UrlField('logoUrl', 'Logo URL'),
  new UrlField('faviconUrl', 'Favicon URL'),
  new DomainField('customUrl', 'Custom Domain')
])

export default {
  name: 'AppConversationSettings',
  components: {
    General,
    AutoPublish,
    Theming,
    Toggle,
    Links
  },

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    buttonVisible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'open', 'update:modelValue'],

  data() {
    return {
      loading: false,
      rules: formSchema.rules(),
      model: {
        theme: {},
        autoPublish: {}
      }
    }
  },

  computed: {
    ...mapGetters({
      loadedIntegrations: 'integration/loaded',
      activeIntegrationsList: 'integration/activeList',
      hasConversationsConfigured:
        'communityHelpCenter/isConfigured',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      currentSettings: 'auth/currentSettings',
      communityHelpCenterSettings:
        'auth/communityHelpCenterSettings'
    }),
    computedVisible: {
      get() {
        return this.visible
      },
      set(value) {
        if (value) {
          this.$emit('open')
        } else {
          this.$emit('close')
        }
      }
    },
    slackIntegration() {
      return (
        this.activeIntegrationsList.slack || {
          settings: {}
        }
      )
    },
    discordIntegration() {
      return (
        this.activeIntegrationsList.discord || {
          settings: {}
        }
      )
    },
    githubIntegration() {
      return (
        this.activeIntegrationsList.github || {
          settings: {}
        }
      )
    },
    hasPermissionToEdit() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },
    shouldConfirmAutoPublish() {
      if (this.model.autoPublish.status === 'disabled') {
        return false
      }

      let shouldConfirm =
        this.model.autoPublish.status === 'all' ||
        this.model.autoPublish.status === 'custom'

      if (this.communityHelpCenterSettings.autoPublish) {
        shouldConfirm =
          this.model.autoPublish.status !==
          this.communityHelpCenterSettings.autoPublish
            .status
      }

      return shouldConfirm
    },
    isCreateLockedForSampleData() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).createLockedForSampleData
    }
  },

  async created() {
    if (!this.loadedIntegrations) {
      await this.fetchIntegrations()
    }
    this.setModel()
  },

  methods: {
    ...mapActions({
      fetchIntegrations: 'integration/doFetch',
      fetchConversations: 'communityHelpCenter/doFetch',
      doRefreshCurrentUser: 'auth/doRefreshCurrentUser'
    }),
    async doSubmit() {
      this.loading = true
      try {
        await this.$refs.form.validate()

        if (this.shouldConfirmAutoPublish) {
          await ConfirmDialog({
            title: i18n('common.confirm'),
            message: `Are you sure you want to enable auto-publishing for ${
              this.model.autoPublish.status === 'all'
                ? 'all channels'
                : 'selected channels'
            }?`,
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no')
          })
        }

        await authAxios.post(
          `/tenant/${this.currentTenant.id}/conversation/settings`,
          {
            tenant: {
              name: this.model.tenantName,
              url: this.model.tenantSlug
            },
            enabled: this.model.enabled,
            inviteLinks: {
              discord: this.model.discordInviteLink,
              slack: this.model.slackInviteLink,
              github: this.model.githubInviteLink
            },
            website: this.model.website,
            customUrl: this.model.customUrl || undefined,
            logoUrl: this.model.logoUrl || undefined,
            faviconUrl: this.model.faviconUrl || undefined,
            theme: this.model.theme || undefined,
            autoPublish: {
              status: this.model.autoPublish.status,
              channelsByPlatform:
                this.model.autoPublish.channels.reduce(
                  (acc, item) => {
                    const [platform, channel] =
                      item.split('.')
                    acc[platform] = acc[platform]
                      ? [...acc[platform], channel]
                      : [channel]
                    return acc
                  },
                  {}
                )
            }
          }
        )
        await this.doRefreshCurrentUser()
        await this.fetchIntegrations()
        await this.fetchConversations({})
        this.setModel()
        this.loading = false
        this.$emit('close')
        Message.success(
          'Community Help Center settings updated successfully'
        )
      } catch (error) {
        if (error.response) {
          Message.error(error.response.data)
        }
        console.log(error)
        this.loading = false
      }
    },
    setModel() {
      this.model = {
        enabled:
          this.communityHelpCenterSettings.enabled || false,
        website: this.currentSettings.website,
        tenantName: this.currentTenant.name,
        tenantSlug: this.currentTenant.url,
        theme: this.communityHelpCenterSettings.theme
          ? this.communityHelpCenterSettings.theme
          : {
              primary: '#E94F2E',
              secondary: '#140505',
              text: '#140505',
              textSecondary: '#7F7F7F',
              textCta: '#fff',
              bg: '#F8F8F8',
              bgHighlight: '#fff',
              bgNav: '#140505'
            },
        customUrl:
          this.communityHelpCenterSettings.customUrl,
        logoUrl: this.communityHelpCenterSettings.logoUrl,
        faviconUrl:
          this.communityHelpCenterSettings.faviconUrl,
        discordInviteLink:
          this.discordIntegration.settings.inviteLink,
        slackInviteLink:
          this.slackIntegration.settings.inviteLink,
        githubInviteLink:
          this.githubIntegration.settings.inviteLink,
        autoPublish: !this.communityHelpCenterSettings
          .autoPublish
          ? {
              status: 'all',
              channels: [],
              channelsByPlatform: {}
            }
          : {
              status:
                this.communityHelpCenterSettings.autoPublish
                  .status,
              channels: Object.keys(
                this.communityHelpCenterSettings.autoPublish
                  .channelsByPlatform
              ).reduce((acc, platform) => {
                acc = acc.concat(
                  this.communityHelpCenterSettings.autoPublish.channelsByPlatform[
                    platform
                  ].map(
                    (channel) => `${platform}.${channel}`
                  )
                )
                return acc
              }, []),
              channelsByPlatform:
                this.communityHelpCenterSettings.autoPublish
                  .channelsByPlatform
            }
      }
    }
  }
}
</script>

<style lang="scss">
.community-help-center-settings {
  .el-drawer {
    &__header {
      @apply mb-0;
    }
  }
}
</style>

<template>
  <div class="conversation-settings">
    <el-button
      v-if="buttonVisible && hasPermissionToEdit"
      class="btn btn--transparent btn--md"
      @click="$emit('open')"
    >
      <i class="ri-lg ri-settings-2-line mr-1" />
      Settings
    </el-button>
    <!-- TODO: Update this component with app-dialog -->
    <el-dialog
      v-model="computedVisible"
      title="Community Help Center Settings"
      :close-on-click-modal="false"
      width="100%"
      @close="$emit('close')"
    >
      <el-form
        v-if="visible"
        ref="form"
        class="w-full form"
        :model="model"
        :rules="rules"
        @submit.prevent="doSubmit"
      >
        <app-alert
          v-if="!hasConversationsConfigured"
          type="info"
          class="mb-8"
        >
          <template #title>
            Please configure your Community Help Center
          </template>
          <template #body>
            Before publishing any Conversation, your
            Community Help Center needs to be configured.
            <br />
            The mandatory fields are:
            <span class="font-semibold">Community Name</span
            >,
            <span class="font-semibold"
              >Community Slug</span
            >
            and <span class="font-semibold">Website</span>.
          </template>
        </app-alert>
        <div
          class="font-semibold text-sm text-gray-200 mb-1"
        >
          General
        </div>
        <hr class="pb-2" />
        <div class="flex items-center -mx-2">
          <el-form-item
            label="Community Name"
            prop="tenantName"
            :required="true"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.tenantName"
              placeholder="Crowd.dev"
            />
            <div class="app-form-hint">
              Display name of your community/company
            </div>
          </el-form-item>
          <el-form-item
            label="Community Slug"
            prop="tenantSlug"
            :required="true"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.tenantSlug"
              :readonly="publishedConversations.length > 0"
              placeholder="crowd-dev"
            />
            <div class="app-form-hint">
              Unique identifier —
              <strong>can't be changed</strong>
            </div>
          </el-form-item>
        </div>
        <div
          class="font-semibold text-sm text-gray-200 mb-1 mt-12"
        >
          Community links
        </div>
        <hr class="pb-2" />
        <div class="flex items-start flex-wrap -mx-2">
          <el-form-item
            label="Website"
            prop="website"
            :required="true"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.website"
              placeholder="https://crowd.dev"
            />
            <div class="app-form-hint">
              URL of your community/company
            </div>
          </el-form-item>
          <el-form-item
            v-if="activeIntegrations.includes('discord')"
            label="Discord URL"
            prop="discordInviteLink"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.discordInviteLink"
              placeholder="https://invite.discord.url"
            />
            <div class="app-form-hint flex items-center">
              Permanent Discord invite link
            </div>
          </el-form-item>
          <el-form-item
            v-if="activeIntegrations.includes('slack')"
            label="Slack URL"
            prop="slackInviteLink"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.slackInviteLink"
              placeholder="https://invite.slack.url"
            />
            <div class="app-form-hint">
              Permanent Slack invite link
            </div>
          </el-form-item>
          <el-form-item
            v-if="activeIntegrations.includes('github')"
            label="GitHub URL"
            prop="githubInviteLink"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.githubInviteLink"
              placeholder="https://github.com/CrowdHQ"
            />
            <div class="app-form-hint">
              GitHub's organization URL
            </div>
          </el-form-item>
        </div>
        <div
          class="font-semibold text-sm text-gray-200 mb-1 mt-12"
        >
          Auto-publishing
        </div>
        <hr class="pb-2" />
        <div class="flex items-start -mx-2">
          <el-form-item
            label="Publish from"
            prop="status"
            class="w-full lg:w-1/3 px-2"
          >
            <el-select v-model="model.autoPublish.status">
              <el-option
                key="all"
                label="All channels"
                value="all"
              ></el-option>
              <el-option
                key="custom"
                label="Specific channels"
                value="custom"
              ></el-option>
              <el-option
                key="disabled"
                label="None"
                value="disabled"
              ></el-option>
            </el-select>
            <div class="app-form-hint leading-normal pt-2">
              <span
                v-if="model.autoPublish.status === 'all'"
                >All conversations will automatically be
                published.</span
              >
              <span
                v-if="model.autoPublish.status === 'custom'"
                >All conversations, from specific channels,
                will automatically be published.</span
              >
              <span
                v-if="
                  model.autoPublish.status === 'disabled'
                "
                >No conversation is going to be published
                automatically.</span
              >
            </div>
          </el-form-item>
          <el-form-item
            v-if="model.autoPublish.status === 'custom'"
            label="Channels"
            prop="channels"
            class="w-full lg:w-1/3 px-2"
          >
            <el-select
              v-model="model.autoPublish.channels"
              class="w-full"
              placeholder="Select channels"
              :filterable="true"
              :multiple="true"
            >
              <el-option
                v-for="channel in computedChannelsList"
                :key="channel.value"
                :label="channel.label"
                :value="channel.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </div>
        <div
          class="font-semibold text-sm text-gray-200 mb-1 mt-12"
        >
          Theming
        </div>
        <hr class="pb-2" />
        <div class="flex items-center -mx-2">
          <el-form-item
            label="Logo URL"
            prop="logoUrl"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.logoUrl"
              placeholder="https://logourl.com"
            />
            <div class="app-form-hint">
              Recommended size: 240x60 pixels
            </div>
          </el-form-item>
          <el-form-item
            label="Favicon URL"
            prop="faviconUrl"
            class="w-full lg:w-1/3 px-2"
          >
            <el-input
              v-model="model.faviconUrl"
              placeholder="https://faviconurl.com"
            />
            <div class="app-form-hint">
              Recommended size: 32x32 pixels
            </div>
          </el-form-item>
        </div>
        <div class="flex -mx-2">
          <el-form-item
            label="Brand Colors"
            class="w-full lg:w-1/3 px-2"
          >
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600"
                >Primary</span
              >
              <el-color-picker
                v-model="model.theme.primary"
                size="mini"
              />
            </div>
          </el-form-item>
          <el-form-item
            label="Text Colors"
            class="w-full lg:w-1/3 px-2"
          >
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600"
                >Primary</span
              >
              <el-color-picker
                v-model="model.theme.text"
                size="mini"
              />
            </div>
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600"
                >Secondary</span
              >
              <el-color-picker
                v-model="model.theme.textSecondary"
                size="mini"
              />
            </div>
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600">CTA</span>
              <el-color-picker
                v-model="model.theme.textCta"
                size="mini"
              />
            </div>
          </el-form-item>

          <el-form-item
            label="Background Colors"
            class="w-full lg:w-1/3 px-2"
          >
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600"
                >Normal</span
              >
              <el-color-picker
                v-model="model.theme.bg"
                size="mini"
              />
            </div>
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600"
                >Highlight</span
              >
              <el-color-picker
                v-model="model.theme.bgHighlight"
                size="mini"
              />
            </div>
            <div
              class="flex items-center justify-between leading-normal"
            >
              <span class="text-xs text-gray-600"
                >Navigation</span
              >
              <el-color-picker
                v-model="model.theme.bgNav"
                size="mini"
              />
            </div>
          </el-form-item>
        </div>
        <div
          class="font-semibold text-sm text-gray-200 mb-1 mt-12 flex items-center justify-between"
        >
          Custom URL
          <span
            class="flex items-center uppercase ml-4 text-xs text-brand-500 font-semibold"
            ><i class="ri-information-line mr-1"></i>Premium
            Only</span
          >
        </div>
        <hr class="pb-2" />
        <div class="relative">
          <div v-if="!hasPermissionToCustomize">
            <div
              class="absolute w-full inset-0 z-10 -mx-4 bg-white"
            ></div>
            <div
              class="absolute inset-0 flex items-center justify-center flex-col pt-8 z-20"
            >
              <span class="text-gray-600 text-center">
                If you want to customize the URL of your
                Public
                <br />
                Community Help Center, you need to switch to
                a paid plan.
              </span>
              <a
                href="mailto:help@crowd.dev"
                class="btn btn--secondary btn--secondary--orange mt-4"
                >Contact crowd.dev</a
              >
            </div>
          </div>
          <div class="flex items-center -mx-2">
            <el-form-item
              label="Custom Domain"
              prop="customUrl"
              class="w-full lg:w-1/3 px-2"
            >
              <el-input
                v-model="model.customUrl"
                placeholder="https://help.crowd.dev"
                :disabled="!hasPermissionToCustomize"
              />
              <div class="app-form-hint">
                Custom domain/url for the help center —
                <a
                  href="https://docs.crowd.dev/docs/conversations#4-set-up-custom-domain-premium-only"
                  target="_blank"
                  class="font-semibold"
                  >see docs</a
                >
              </div>
            </el-form-item>
          </div>
        </div>
        <div class="form-buttons mt-12">
          <el-button
            :disabled="loading"
            class="btn btn--primary mr-2"
            @click="doSubmit"
          >
            <i class="ri-lg ri-save-line mr-1" />
            <app-i18n code="common.save"></app-i18n>
          </el-button>

          <el-button
            :disabled="loading"
            class="btn btn--secondary mr-2"
            @click="doReset"
          >
            <i class="ri-lg ri-arrow-go-back-line mr-1" />
            <app-i18n code="common.reset"></app-i18n>
          </el-button>

          <el-button
            :disabled="loading"
            class="btn btn--secondary"
            @click="$emit('close')"
          >
            <i class="ri-lg ri-close-line mr-1" />
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
        </div>
      </el-form>
    </el-dialog>
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
  emits: ['close', 'open'],

  data() {
    return {
      loading: false,
      rules: formSchema.rules(),
      initialModel: {},
      model: {
        theme: {},
        autoPublish: {}
      }
    }
  },

  computed: {
    ...mapGetters({
      publishedConversations: 'conversation/publishedRows',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      currentSettings: 'auth/currentSettings',
      conversationSettings: 'auth/conversationSettings',
      loadedIntegrations: 'integration/loaded',
      activeIntegrationsList: 'integration/activeList',
      hasConversationsConfigured:
        'conversation/isConfigured',
      rawFilter: 'conversation/rawFilter',
      filter: 'conversation/filter'
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
    activeIntegrations() {
      return Object.keys(this.activeIntegrationsList)
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
    hasPermissionToCustomize() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).customize
    },
    hasPermissionToEdit() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },
    computedChannelsList() {
      return Object.values(
        this.activeIntegrationsList
      ).reduce((acc, item) => {
        if (
          item.platform === 'github' &&
          item.settings.repos &&
          item.settings.repos.length > 0
        ) {
          for (const repo of item.settings.repos) {
            acc.push({
              value: `${item.platform}.${repo.name}`,
              label: `[GitHub] ${repo.name}`
            })
          }
        } else if (
          (item.platform === 'slack' ||
            item.platform === 'discord') &&
          item.settings.channels &&
          item.settings.channels.length > 0
        ) {
          for (const channel of item.settings.channels) {
            acc.push({
              value: `${item.platform}.${channel.name}`,
              label: `[${
                item.platform.charAt(0).toUpperCase() +
                item.platform.slice(1)
              }] ${channel.name}`
            })
          }
        }
        return acc
      }, [])
    },
    shouldConfirmAutoPublish() {
      if (this.model.autoPublish.status === 'disabled') {
        return false
      }

      let shouldConfirm =
        this.model.autoPublish.status === 'all' ||
        this.model.autoPublish.status === 'custom'

      if (this.conversationSettings.autoPublish) {
        shouldConfirm =
          this.model.autoPublish.status !==
          this.conversationSettings.autoPublish.status
      }

      return shouldConfirm
    }
  },

  async created() {
    if (!this.loadedIntegrations) {
      await this.fetchIntegrations()
    }
    this.setModels()
  },

  methods: {
    ...mapActions({
      fetchIntegrations: 'integration/doFetch',
      fetchConversations: 'conversation/doFetch',
      doRefreshCurrentUser: 'auth/doRefreshCurrentUser'
    }),
    async doSubmit() {
      this.loading = true
      try {
        await this.$refs.form.validate()

        if (this.shouldConfirmAutoPublish) {
          await this.$myConfirm(
            `Are you sure you want to enable auto-publishing for ${
              this.model.autoPublish.status === 'all'
                ? 'all channels'
                : 'selected channels'
            }?`,
            i18n('common.confirm'),
            {
              confirmButtonText: i18n('common.yes'),
              cancelButtonText: i18n('common.no'),
              type: 'warning'
            }
          )
        }

        await authAxios.post(
          `/tenant/${this.currentTenant.id}/conversation/settings`,
          {
            data: {
              tenant: {
                name: this.model.tenantName,
                url:
                  this.publishedConversations.length === 0
                    ? this.model.tenantSlug
                    : undefined
              },
              inviteLinks: {
                discord: this.model.discordInviteLink,
                slack: this.model.slackInviteLink,
                github: this.model.githubInviteLink
              },
              website: this.model.website,
              customUrl: this.model.customUrl || undefined,
              logoUrl: this.model.logoUrl || undefined,
              faviconUrl:
                this.model.faviconUrl || undefined,
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
          }
        )
        await this.doRefreshCurrentUser()
        await this.fetchIntegrations()
        await this.fetchConversations({
          filter: this.filter,
          rawFilter: this.rawFilter,
          keepPagination: true
        })
        this.setModels()
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
    setModels() {
      this.initialModel = {
        website: this.currentSettings.website,
        tenantName: this.currentTenant.name,
        tenantSlug: this.currentTenant.url,
        theme: this.conversationSettings.theme
          ? this.conversationSettings.theme
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
        customUrl: this.conversationSettings.customUrl,
        logoUrl: this.conversationSettings.logoUrl,
        faviconUrl: this.conversationSettings.faviconUrl,
        discordInviteLink:
          this.discordIntegration.settings.inviteLink,
        slackInviteLink:
          this.slackIntegration.settings.inviteLink,
        githubInviteLink:
          this.githubIntegration.settings.inviteLink,
        autoPublish: !this.conversationSettings.autoPublish
          ? {
              status: 'all',
              channels: [],
              channelsByPlatform: {}
            }
          : {
              status:
                this.conversationSettings.autoPublish
                  .status,
              channels: Object.keys(
                this.conversationSettings.autoPublish
                  .channelsByPlatform
              ).reduce((acc, platform) => {
                acc = acc.concat(
                  this.conversationSettings.autoPublish.channelsByPlatform[
                    platform
                  ].map(
                    (channel) => `${platform}.${channel}`
                  )
                )
                return acc
              }, []),
              channelsByPlatform:
                this.conversationSettings.autoPublish
                  .channelsByPlatform
            }
      }
      this.model = { ...this.initialModel }
    },
    doReset() {
      this.model = formSchema.initialValues(
        this.initialModel
      )
    }
  }
}
</script>

<style lang="scss">
.conversation-settings {
  .el-dialog {
    max-width: 60rem;
  }
}
</style>

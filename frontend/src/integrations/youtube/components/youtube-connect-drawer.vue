<template>
  <app-drawer
    v-model="isVisible"
    title="Youtube"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img
        class="w-6 h-6 mr-2"
        :src="logoUrl"
        alt="Youtube Logo"
      />
    </template>
    <template #content>
      <el-form class="form">
        <div class="flex flex-col gap-2 items-start">
          <span class="text-sm font-medium">API Key</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            lorem ipsum<br />
          </span>
          <el-form-item class="mb-4 w-full">
            <div
              class="flex flex-row items-center w-full gap-4"
            >
              <el-input
                v-model="apiKey"
                class="text-green-500"
                spellcheck="false"
              />
            </div>
          </el-form-item>
        </div>
        <div class="flex flex-col gap-2 items-start">
          <span class="text-sm font-medium">Channel Id</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            lorem ipsum<br />
          </span>
          <el-form-item class="mb-4 w-full">
            <div
              class="flex flex-row items-center w-full gap-4"
            >
              <el-input
                v-model="channelId"
                class="text-green-500"
                spellcheck="false"
                :disabled="shouldDisableChannelIdInput"
              />
            </div>
          </el-form-item>
        </div>
      </el-form>
      <div v-if="isKeywordsEnabled" class="flex flex-col gap-2 items-start mb-2">
        <span class="text-sm font-medium">Keywords Search</span>
        <span
          class="text-2xs font-light mb-2 text-gray-600"
        >
          Lorem ipsum <br />
        </span>
        <app-keywords-input
          v-model="keywords"
          placeholder="e.g. Jazz, Classical, Pop"
          :disabled="false"
        />
      </div>
    </template>
    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--bordered mr-4"
          :disabled="loading"
          @click="cancel"
        >
          <app-i18n code="common.cancel" />
        </el-button>
        <el-button
          id="devConnect"
          class="btn btn--md btn--primary"
          :disabled="connectDisabled || loading"
          :loading="loading"
          @click="save"
        >
          <app-i18n code="common.connect" />
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script>
import { mapActions } from 'vuex';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export default {
  name: 'AppYoutubeConnectDrawer',
  props: {
    integration: {
      type: Object,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      logoUrl:
        CrowdIntegrations.getConfig('youtube').image,
      apiKey: null,
      channelId: null,
      keywords: [],
      loading: false,
      isKeywordsEnabled: true,
    };
  },
  computed: {
    isVisible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    shouldDisableChannelIdInput() {
      return this.keywords.length > 0;
    },
    connectDisabled() {
      if (!this.apiKey || this.apiKey === '') {
        return true;
      }

      if (this.channelId && this.channelId !== '') {
        return false;
      }

      const validKeywords = this.keywords.filter((k) => !!k);
      const empty = validKeywords.length === 0;
      if (this.integration.settings && !empty) {
        return validKeywords.length === this.integration.settings.keywords.length;
      }
      return empty;
    },
  },
  watch: {
    channelId: {
      handler(newValue) {
        if (!newValue && !this.isKeywordsEnabled) {
          this.isKeywordsEnabled = true;
        } else if (newValue !== '') {
          this.isKeywordsEnabled = false;
        }
      },
    },
  },
  methods: {
    ...mapActions({
      doYoutubeConnect: 'integration/doYoutubeConnect',
    }),
    toggle() {
      this.isVisible = !this.isVisible;
    },
    cancel() {
      this.isVisible = false;
    },
    async save() {
      this.loading = true;
      const relevantKeywords = this.keywords.filter((k) => !!k);
      const youtubeConnectReq = {};

      if (this.isKeywordsEnabled) {
        youtubeConnectReq.channelId = null;
        youtubeConnectReq.keywords = relevantKeywords;
      } else if (this.channelId) {
        youtubeConnectReq.channelId = this.channelId;
        youtubeConnectReq.keywords = [];
      }

      youtubeConnectReq.apiKey = this.apiKey;
      await this.doYoutubeConnect(youtubeConnectReq);
      this.isVisible = false;
      this.loading = false;
    },
  },
};
</script>

<style lang="scss">
.el-input-group__prepend {
  @apply px-3;
}
</style>

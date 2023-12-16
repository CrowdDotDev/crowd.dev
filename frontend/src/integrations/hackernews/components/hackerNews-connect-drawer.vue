<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-hackerNews-drawer"
    title="Hacker News"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img
        class="w-6 h-6 mr-2"
        :src="logoUrl"
        alt="Hacker News logo"
      />
    </template>
    <template #content>
      <div class="flex flex-col gap-2 items-start mb-2">
        <span class="text-xs font-light mb-2 text-gray-900">
          Monitor mentions of your community/organization on
          Hacker News. <br />Historical data is available
          after the 1st of December 2022.
          <a
            href="https://docs.crowd.dev/docs/hacker-news-integration"
            target="__blank"
          >
            Read more</a>.
        </span>
        <span class="text-sm font-medium">Track posts mentioning your
          community/organization</span>
        <span
          class="text-2xs font-light mb-2 text-gray-600"
        >
          Monitor your community/organization being
          mentioned in the top 500 of Hacker News. <br />
        </span>
        <app-keywords-input
          v-model="keywords"
          placeholder="e.g. LFX, linux"
        />
      </div>
      <el-form class="form integration-hackerNews-form" @submit.prevent>
        <div class="flex flex-col gap-2 items-start">
          <span class="text-sm font-medium">Track your URL</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor when a post with your URL is published
            in the top 500 of Hacker News. <br />
          </span>
          <el-form-item
            v-for="url in urls"
            :key="url.id"
            class="mb-4 w-full"
            :class="{
              'is-error': url.touched && !url.valid,
              'is-success': url.touched && url.valid,
            }"
          >
            <div
              class="flex flex-row items-center w-full gap-4"
            >
              <el-input
                id="devUrl"
                v-model="url.url"
                class="text-green-500"
                spellcheck="false"
                placeholder="Enter a URL"
                @blur="handleUrlValidation(url.id)"
              >
                <template #prepend>
                  <span class="font-light text-gray-800">https://</span>
                </template>
              </el-input>
              <el-button
                v-if="!isLastUrl"
                class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
                @click="removeUrl(url.id)"
              >
                <i
                  class="ri-delete-bin-line text-lg text-black"
                />
              </el-button>
            </div>
            <span
              v-if="url.touched && !url.valid"
              class="el-form-item__error"
            >Url slug is not valid</span>
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            @click="addNewUrl"
          >
            + Add URL
          </el-button>
        </div>
      </el-form>
    </template>
    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--secondary mr-4"
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
import isUrl from '@/utils/isUrl';

export default {
  name: 'AppHackerNewsConnectDrawer',

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
        CrowdIntegrations.getConfig('hackernews').image,
      users: [],
      urls: [],
      keywords: [],
      loading: false,
    };
  },
  computed: {
    maxId() {
      return this.urls.length;
    },
    isVisible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    isValid() {
      const relevantUrls = this.urls.filter((u) => !!u.url);

      const relevantKeywords = this.keywords.filter(
        (k) => !!k,
      );

      if (relevantUrls.some((url) => !url.valid)) {
        return false;
      }

      return (
        relevantUrls.length > 0
        || relevantKeywords.length > 0
      );
    },
    connectDisabled() {
      if (!this.isValid) {
        return true;
      }

      const validUrls = this.urls.filter((u) => !!u.url);

      const validKeywords = this.keywords.filter((k) => !!k);

      const empty = validUrls.length === 0 && validKeywords.length === 0;
      if (this.integration.settings && !empty) {
        return (
          validUrls.length
            === this.integration.settings.urls.length
          && validUrls.every((o) => this.integration.settings.urls.includes(o.url))
          && validKeywords.length
            === this.integration.settings.keywords.length
        );
      }
      return empty;
    },
    isLastUrl() {
      return this.urls.length === 1;
    },
  },
  watch: {
    integration: {
      handler(newVal) {
        if (newVal) {
          this.syncData();
        }
      },
    },
  },

  mounted() {
    this.syncData();
  },

  methods: {
    ...mapActions({
      doHackerNewsConnect: 'integration/doHackerNewsConnect',
    }),

    toggle() {
      this.isVisible = !this.isVisible;
    },

    syncData() {
      this.urls = [];

      if (this.integration && this.integration.settings) {
        this.integration.settings.urls.forEach((k) => this.addNewUrl(k));
      }

      if (this.urls.length === 0) {
        this.addNewUrl();
      }
    },

    addNewUrl(url) {
      this.urls.push({
        id: this.maxId + 1,
        url:
          typeof url === 'string' || url instanceof String
            ? url
            : '',
        touched: false,
        valid: false,
        validating: false,
      });
    },

    handleUrlValidation(id) {
      const url = this.urls.find((o) => o.id === id);
      url.validating = true;
      url.url = url.url.replace('https://', '');
      url.url = url.url.replace('http://', '');

      const isValid = isUrl(url.url);

      url.valid = isValid && !!url.url;
      url.validating = false;
      url.touched = true;
    },

    removeUrl(id) {
      this.urls = this.urls.filter((u) => u.id !== id);
    },

    cancel() {
      this.isVisible = false;
      this.syncData();
    },

    async save() {
      this.loading = true;

      const relevantUrls = this.urls.filter((u) => !!u.url);

      const relevantKeywords = this.keywords.filter(
        (k) => !!k,
      );

      await this.doHackerNewsConnect({
        urls: relevantUrls.map((u) => u.url),
        keywords: relevantKeywords,
      });

      this.isVisible = false;
      this.loading = false;
    },
  },
};
</script>
<style lang="scss">
.integration-hackerNews-form {
  .el-form-item {
    @apply mb-3;
    &__content {
      @apply mb-0;
    }
  }

  .el-input-group__prepend {
    @apply px-3;
  }
}
</style>

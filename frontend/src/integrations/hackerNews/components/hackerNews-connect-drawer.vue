<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-hackerNews-drawer"
    title="DEV"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="DEV logo"
    @close="cancel"
  >
    <template #content>
      <el-form class="form integration-hackerNews-form">
        <div class="flex flex-col gap-2 items-start">
          <span class="text-sm font-medium"
            >Track keyword articles</span
          >
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor all articles from keyword accounts
          </span>
          <el-form-item
            v-for="org in keywords"
            :key="org.id"
            class="mb-4 w-full"
            :class="{
              'is-error': org.touched && !org.valid,
              'is-success': org.touched && org.valid
            }"
          >
            <div
              class="flex flex-row items-center w-full gap-4"
            >
              <el-input
                id="devKeyword"
                v-model="org.keyword"
                class="text-green-500"
                spellcheck="false"
                placeholder="Enter keyword slug"
                @blur="handleKeywordValidation(org.id)"
              >
                <template #prepend>hackernews/</template>
              </el-input>
              <el-button
                v-if="!isLastKeyword"
                class="btn btn--md btn--transparent w-10 h-10"
                @click="removeKeyword(org.id)"
              >
                <i
                  class="ri-delete-bin-line text-lg text-black"
                ></i>
              </el-button>
            </div>
            <span
              v-if="org.touched && !org.valid"
              class="el-form-item__error"
              >Keyword slug is not valid</span
            >
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            @click="addNewKeyword"
            >+ Add keyword link</el-button
          >
        </div>
      </el-form>
    </template>
    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--bordered mr-4"
          :disabled="loading"
          @click="cancel"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
        <el-button
          id="devConnect"
          class="btn btn--md btn--primary"
          :disabled="connectDisabled || loading"
          :loading="loading"
          @click="save"
        >
          <app-i18n code="common.connect"></app-i18n>
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script>
import { mapActions } from 'vuex'
import { CrowdIntegrations } from '@/integrations/integrations-config'

export default {
  name: 'AppHackerNewsConnectDrawer',

  props: {
    integration: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      logoUrl:
        CrowdIntegrations.getConfig('hackernews').image,
      users: [],
      keywords: [],
      loading: false
    }
  },
  computed: {
    maxId() {
      return this.keywords.length
    },
    isVisible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    isValid() {
      const relevantKeywords = this.keywords.filter(
        (k) => !!k.keyword
      )
      for (const org of relevantKeywords) {
        if (!org.valid) return false
      }

      return relevantKeywords.length > 0
    },
    connectDisabled() {
      if (!this.isValid) {
        return true
      }

      const validOrgs = this.keywords.filter(
        (k) => !!k.keyword
      )

      const empty = validOrgs.length === 0

      if (this.integration.settings && !empty) {
        return (
          validOrgs.length ===
            this.integration.settings.keywords.length &&
          validOrgs.every((o) =>
            this.integration.settings.keywords.includes(
              o.keyword
            )
          )
        )
      }

      return empty
    },
    isLastKeyword() {
      return this.keywords.length === 1
    }
  },
  watch: {
    integration: {
      handler: function (newVal) {
        if (newVal) {
          this.syncData()
        }
      }
    }
  },

  mounted() {
    this.syncData()
  },

  methods: {
    ...mapActions({
      doHackerNewsConnect: 'integration/doHackerNewsConnect'
    }),

    toggle() {
      this.isVisible = !this.isVisible
    },

    syncData() {
      this.keywords = []

      if (this.integration && this.integration.settings) {
        this.integration.settings.keywords.forEach((k) =>
          this.addNewKeyword(k)
        )
      }

      if (this.keywords.length === 0) {
        this.addNewKeyword()
      }
    },

    addNewKeyword(keyword) {
      this.keywords.push({
        id: this.maxId + 1,
        keyword:
          typeof keyword === 'string' ||
          keyword instanceof String
            ? keyword
            : '',
        touched: false,
        valid: false,
        validating: false
      })
    },

    handleKeywordValidation(id) {
      const keyword = this.keywords.find((o) => o.id === id)
      keyword.valid = !!keyword.keyword
    },

    removeKeyword(id) {
      this.keywords = this.keywords.filter(
        (k) => k.id !== id
      )
    },

    cancel() {
      this.isVisible = false
      this.syncData()
    },

    async save() {
      this.loading = true

      const relevantKeywords = this.keywords.filter(
        (k) => !!k.keyword
      )

      await this.doHackerNewsConnect({
        keywords: relevantKeywords.map((k) => k.keyword)
      })

      this.isVisible = false
      this.loading = false
    }
  }
}
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

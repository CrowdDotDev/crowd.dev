<template>
  <div>
    <el-form
      v-if="model"
      ref="form"
      :label-position="labelPosition"
      :label-width="labelWidthForm"
      :model="model"
      :rules="rules"
      class="form conversation-form"
      @submit.prevent="doSubmit"
    >
      <div
        class="flex flex-1 items-center justify-between -mx-2"
      >
        <div v-if="!isEditing" class="flex w-2/3">
          <el-tooltip
            content="Click to edit"
            placement="top"
          >
            <button
              class="app-content-title flex items-center mx-2 hover:text-gray-500 cursor-pointer truncate"
              @click="$emit('edit')"
            >
              <div class="w-full truncate">
                {{ record.title }}
              </div>
              <i
                class="text-2xl ri-pencil-line flex items-center ml-2"
              ></i>
            </button>
          </el-tooltip>
        </div>
        <div v-else class="flex w-2/3">
          <el-form-item
            :prop="fields.title.name"
            :required="fields.title.required"
            class="mx-2 flex-1"
          >
            <el-input
              ref="focus"
              v-model="model[fields.title.name]"
              :placeholder="fields.title.placeholder"
            />

            <div
              v-if="fields.title.hint"
              class="app-form-hint"
            >
              {{ fields.title.hint }}
            </div>
          </el-form-item>
          <el-form-item>
            <div class="flex items-center">
              <el-button
                :disabled="saveLoading"
                class="btn btn--secondary btn--secondary--orange ml-2"
                @click="doSubmit"
              >
                <i class="ri-lg ri-save-line mr-1" />
                <app-i18n code="common.save"></app-i18n>
              </el-button>

              <el-button
                :disabled="saveLoading"
                class="btn btn--secondary ml-2"
                @click="doCancel"
              >
                <i class="ri-lg ri-close-line mr-1" />
                <app-i18n code="common.cancel"></app-i18n>
              </el-button>
            </div>
          </el-form-item>
        </div>
        <el-form-item class="w-1/3 mx-2">
          <div class="form-buttons leading-none">
            <a
              v-if="record.published"
              target="_blank"
              :href="computedPublicUrl"
              class="btn btn--secondary"
            >
              <i
                class="ri-lg ri-external-link-line mr-2"
              ></i>
              Open Conversation
            </a>
            <el-tooltip
              content="Finish editing the conversation first"
              placement="top"
              :disabled="!isEditing"
            >
              <div>
                <el-button
                  v-if="!record.published"
                  :disabled="saveLoading || isEditing"
                  class="btn btn--primary ml-2"
                  @click="triggerPublishModal"
                >
                  <i
                    class="ri-lg ri-upload-cloud-2-line mr-1"
                  />
                  Publish
                </el-button>
                <el-button
                  v-else
                  :disabled="saveLoading || isEditing"
                  class="btn btn--secondary btn--secondary--red ml-2"
                  @click="doUnpublish"
                >
                  <i
                    class="ri-lg ri-arrow-go-back-line mr-1"
                  />
                  Unpublish
                </el-button>
              </div>
            </el-tooltip>
          </div>
        </el-form-item>
      </div>
      <el-dialog
        v-model="publishModal"
        title="Publish Conversation"
      >
        <el-form-item label="Slug" :required="true">
          <el-input v-model="model.slug"></el-input>
          <div class="app-form-hint">
            Can’t be changed once it’s published
          </div>
        </el-form-item>

        <div class="form-buttons mt-12">
          <el-button
            :disabled="loading"
            class="btn btn--primary mr-2"
            @click="doPublish"
          >
            <i class="ri-lg ri-upload-cloud-2-line mr-1" />
            Publish
          </el-button>

          <el-button
            :disabled="loading"
            class="btn btn--secondary"
            @click="publishModal = false"
          >
            <i class="ri-lg ri-close-line mr-1" />
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
        </div>
      </el-dialog>
    </el-form>

    <app-conversation-settings
      :visible="hasConversationsSettingsVisible"
      :button-visible="false"
      @open="doOpenSettingsModal"
      @close="doCloseSettingsModal"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { ConversationModel } from '@/modules/conversation/conversation-model'
import config from '@/config'
import ConversationSettings from '@/modules/conversation/components/conversation-settings'

const { fields } = ConversationModel
const formSchema = new FormSchema([
  fields.title,
  fields.published
])

export default {
  name: 'AppConversationForm',

  components: {
    'app-conversation-settings': ConversationSettings
  },

  props: {
    isEditing: {
      type: Boolean,
      default: false
    },
    saveLoading: {
      type: Boolean,
      default: false
    },
    record: {
      type: Object,
      default: () => {}
    }
  },
  emits: [
    'cancel',
    'submit',
    'publish',
    'unpublish',
    'edit'
  ],

  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      publishModal: false,
      loading: false
    }
  },

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm',
      hasConversationsConfigured:
        'conversation/isConfigured',
      hasConversationsSettingsVisible:
        'conversation/hasSettingsVisible'
    }),

    fields() {
      return fields
    },

    computedPublicUrl() {
      return `${config.conversationPublicUrl}/${this.currentTenant.url}/${this.record.slug}`
    }
  },

  created() {
    this.model = this.record
      ? JSON.parse(JSON.stringify(this.record))
      : {}
  },

  methods: {
    ...mapActions({
      doOpenSettingsModal:
        'conversation/doOpenSettingsModal',
      doCloseSettingsModal:
        'conversation/doCloseSettingsModal'
    }),
    doCancel() {
      this.$emit('cancel')
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      return this.$emit('submit', {
        id: this.record && this.record.id,
        values: formSchema.cast(this.model)
      })
    },

    async triggerPublishModal() {
      if (!this.hasConversationsConfigured) {
        return this.doOpenSettingsModal()
      }
      this.publishModal = true
    },

    async doPublish() {
      this.model.published = true
      this.loading = true
      await this.$emit('publish', {
        id: this.record && this.record.id,
        values: {
          ...formSchema.cast(this.model),
          published: true
        }
      })
      this.loading = false
      this.publishModal = false
    },

    async doUnpublish() {
      this.model.published = false
      this.loading = true
      await this.$emit('unpublish', {
        id: this.record && this.record.id,
        values: {
          ...formSchema.cast(this.model),
          published: false
        }
      })
      this.loading = false
    }
  }
}
</script>

<style lang="scss">
.el-form-item.flex.items-center {
  .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>

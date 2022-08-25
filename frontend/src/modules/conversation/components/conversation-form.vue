<template>
  <div>
    <el-form
      :label-position="labelPosition"
      :label-width="labelWidthForm"
      :model="model"
      :rules="rules"
      @submit.native.prevent="doSubmit"
      class="form conversation-form"
      ref="form"
      v-if="model"
    >
      <div
        class="flex flex-1 items-center justify-between -mx-2"
      >
        <div class="flex w-2/3" v-if="!isEditing">
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
        <div class="flex w-2/3" v-else>
          <el-form-item
            :prop="fields.title.name"
            :required="fields.title.required"
            class="mx-2 flex-1"
          >
            <el-input
              v-model="model[fields.title.name]"
              :placeholder="fields.title.placeholder"
              ref="focus"
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
                @click="doSubmit"
                icon="ri-lg ri-save-line"
                class="btn btn--secondary btn--secondary--orange ml-2"
              >
                <app-i18n code="common.save"></app-i18n>
              </el-button>

              <el-button
                :disabled="saveLoading"
                @click="doCancel"
                icon="ri-lg ri-close-line"
                class="btn btn--secondary ml-2"
              >
                <app-i18n code="common.cancel"></app-i18n>
              </el-button>
            </div>
          </el-form-item>
        </div>
        <el-form-item class="w-1/3 mx-2">
          <div class="form-buttons leading-none">
            <a
              target="_blank"
              :href="computedPublicUrl"
              class="btn btn--secondary"
              v-if="record.published"
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
                  :disabled="saveLoading || isEditing"
                  @click="triggerPublishModal"
                  icon="ri-lg ri-upload-cloud-2-line"
                  class="btn btn--primary ml-2"
                  v-if="!record.published"
                >
                  Publish
                </el-button>
                <el-button
                  :disabled="saveLoading || isEditing"
                  @click="doUnpublish"
                  icon="ri-lg ri-arrow-go-back-line"
                  class="btn btn--secondary btn--secondary--red ml-2"
                  v-else
                >
                  Unpublish
                </el-button>
              </div>
            </el-tooltip>
          </div>
        </el-form-item>
      </div>
      <el-dialog
        title="Publish Conversation"
        :visible.sync="publishModal"
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
            @click="doPublish"
            icon="ri-lg ri-upload-cloud-2-line"
            class="btn btn--primary mr-2"
          >
            Publish
          </el-button>

          <el-button
            :disabled="loading"
            @click="publishModal = false"
            icon="ri-lg ri-close-line"
            class="btn btn--secondary"
          >
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
        </div>
      </el-dialog>
    </el-form>

    <app-conversation-settings
      :visible="hasConversationsSettingsVisible"
      @open="doOpenSettingsModal"
      @close="doCloseSettingsModal"
      :button-visible="false"
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
  name: 'app-conversation-form',

  components: {
    'app-conversation-settings': ConversationSettings
  },

  props: ['isEditing', 'record', 'saveLoading', 'modal'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      publishModal: false,
      loading: false
    }
  },

  created() {
    this.model = this.record
      ? JSON.parse(JSON.stringify(this.record))
      : {}
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

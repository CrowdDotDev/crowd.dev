<template>
  <el-form
    v-if="model"
    ref="form"
    :model="model"
    :rules="rules"
    class="form automation-form"
    @submit.prevent="doSubmit"
  >
    <div
      v-if="loadingIntegrations"
      v-loading="loadingIntegrations"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div class="flex items-center pb-2">
        <span
          class="font-semibold text-primary-900 leading-relaxed"
          >Trigger</span
        >
        <span
          class="text-gray-600 text-xs ml-2 leading-relaxed"
          >Define the event that triggers your webhook</span
        >
      </div>
      <hr class="mb-6" />
      <el-form-item
        :label="fields.trigger.label"
        :prop="fields.trigger.name"
        :required="fields.trigger.required"
        class="w-full"
      >
        <el-select
          v-model="model.trigger"
          placeholder="Select option"
        >
          <el-option
            key="new_activity"
            value="new_activity"
            :label="
              translate(
                'entities.automation.triggers.new_activity'
              )
            "
          />
          <el-option
            key="new_member"
            value="new_member"
            :label="
              translate(
                'entities.automation.triggers.new_member'
              )
            "
          />
        </el-select>
      </el-form-item>
      <el-collapse
        v-if="model.trigger === 'new_activity'"
        v-model="newActivityFilters"
      >
        <el-collapse-item
          title="Filter options"
          name="activityFilters"
        >
          <div class="flex -mx-2">
            <el-form-item
              label="Matching activity platform(s)"
              class="w-full lg:w-1/2 mx-2"
            >
              <el-select
                v-model="model.settings.platforms"
                multiple
                placeholder="Select option"
              >
                <el-option
                  v-for="platform of computedPlatformOptions"
                  :key="platform.value"
                  :value="platform.value"
                  :label="platform.label"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              label="Matching activity type(s)"
              class="w-full lg:w-1/2 mx-2"
            >
              <el-select
                v-model="model.settings.types"
                multiple
                placeholder="Select option"
                :disabled="
                  model.settings.platforms.length === 0
                "
              >
                <el-option
                  v-for="platform of computedActivityTypeOptions"
                  :key="platform.value"
                  :value="platform.value"
                  :label="platform.label"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="Including keyword(s)">
            <div class="-mb-4">
              <app-keywords-input
                v-model="model.settings.keywords"
              />
            </div>
          </el-form-item>
          <el-checkbox
            v-model="model.settings.teamMemberActivities"
            label="Include activities from team members"
          ></el-checkbox>
        </el-collapse-item>
      </el-collapse>

      <el-collapse
        v-if="model.trigger === 'new_member'"
        v-model="newMemberFilters"
      >
        <el-collapse-item
          title="Filter options"
          name="memberFilters"
        >
          <el-form-item
            label="Matching member platform(s)"
            class="w-full"
          >
            <el-select
              v-model="model.settings.platforms"
              multiple
              placeholder="Select option"
            >
              <el-option
                v-for="platform of computedPlatformOptions"
                :key="platform.value"
                :value="platform.value"
                :label="platform.label"
              />
            </el-select>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <div class="flex items-center pb-2 mt-10">
        <span
          class="font-semibold text-primary-900 leading-relaxed"
          >Action</span
        >
        <span
          class="text-gray-600 text-xs ml-2 leading-relaxed"
          >Define the endpoint where the webhook payload
          should be sent to</span
        >
      </div>
      <hr class="mb-6" />
      <el-form-item
        label="Webhook URL"
        prop="settings.url"
        :required="true"
      >
        <el-input
          v-model="model.settings.url"
          type="text"
          placholder="https://somewebhook.url"
        ></el-input>
      </el-form-item>

      <div class="form-buttons mt-8">
        <el-button
          :disabled="saveLoading || !isFilled"
          class="btn btn--primary mr-2"
          @click="doSubmit"
        >
          {{ isEditing ? 'Update' : 'Add' }} webhook
        </el-button>

        <el-button
          :disabled="saveLoading"
          class="btn btn--secondary"
          @click="doCancel"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
      </div>
    </div>
  </el-form>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { AutomationModel } from '@/modules/automation/automation-model'
import { FormSchema } from '@/shared/form/form-schema'
import { i18n } from '@/i18n'
import integrationsJson from '@/jsons/integrations.json'
import activityTypesJson from '@/jsons/activity-types.json'
import UrlField from '@/shared/fields/url-field'

const { fields } = AutomationModel
const formSchema = new FormSchema([
  fields.type,
  fields.trigger,
  fields.status,
  fields.settings,
  new UrlField('settings.url', 'Webhook URL')
])

export default {
  name: 'AppWebhookForm',
  props: {
    modelValue: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['cancel', 'success'],
  data() {
    return {
      rules: formSchema.rules(),
      model: {
        ...this.modelValue
      },
      newActivityFilters: 'activityFilters',
      newMemberFilters: 'memberFilters',
      loadingIntegrations: false
    }
  },
  computed: {
    ...mapGetters({
      loading: 'automation/loading',
      integrationsActive: 'integration/active',
      integrationsCount: 'integration/count'
    }),
    fields() {
      return fields
    },
    isEditing() {
      return this.modelValue.id !== undefined
    },
    saveLoading() {
      return this.loading('submit')
    },
    isFilled() {
      return this.model.trigger && this.model.settings.url
    },
    computedPlatformOptions() {
      return this.integrationsActive.map((item) => {
        return {
          value: item.platform,
          label: integrationsJson.find(
            (i) => i.platform === item.platform
          ).name
        }
      })
    },
    computedActivityTypeOptions() {
      if (
        !this.model.settings.platforms ||
        this.model.settings.platforms.length === 0
      ) {
        return []
      }

      return this.model.settings.platforms.reduce(
        (acc, platform) => {
          const platformActivityTypes =
            activityTypesJson[platform]
          acc.push(
            ...platformActivityTypes.map((activityType) => {
              return {
                value: activityType,
                label: i18n(
                  `entities.activity.${platform}.${activityType}`
                )
              }
            })
          )
          return acc
        },
        []
      )
    }
  },

  async created() {
    if (this.integrationsCount === 0) {
      this.loadingIntegrations = true
      await this.doFetchIntegrations()
      this.loadingIntegrations = false
    }
  },

  methods: {
    ...mapActions({
      doFetchIntegrations: 'integration/doFetch',
      doUpdate: 'automation/doUpdate',
      doCreate: 'automation/doCreate'
    }),
    translate(key) {
      return i18n(key)
    },
    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        console.log(error)
        return
      }

      if (this.isEditing) {
        await this.doUpdate({
          id: this.model.id,
          values: formSchema.cast(this.model)
        })
      } else {
        await this.doCreate(formSchema.cast(this.model))
      }

      this.$emit('success')
    },
    doReset() {
      this.model = formSchema.initialValues(this.modelValue)
    },

    doCancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="scss">
.automation-form {
  .el-collapse {
    @apply border border-gray-100 rounded p-4;
    background-color: #f3f4f6;
    overflow: unset;

    .el-collapse-item__header {
      @apply text-primary-900 text-sm flex flex-row-reverse justify-end leading-tight h-6 font-medium;
      background-color: #f3f4f6;
      .el-collapse-item__arrow {
        margin: 0 8px 0 0;
      }
    }
    .el-collapse-item__content {
      @apply pb-0 pt-6 leading-none;
    }
    .el-collapse-item__wrap {
      @apply border-none leading-none;
      background-color: #f3f4f6;
    }

    .el-form-item {
      @apply mb-0;
    }
  }
}
</style>

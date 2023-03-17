<template>
  <app-drawer
    v-model="isDrawerOpenComputed"
    :title="isEditing ? 'Edit webhook' : 'Add webhook'"
    @close="doCancel"
  >
    <template #content>
      <el-form
        v-if="model"
        ref="form"
        label-position="top"
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
        <div v-else class="flex flex-col">
          <div class="flex flex-col gap-1 mb-6">
            <span
              class="text-base font-semibold text-brand-500"
              >Trigger</span
            >
            <span class="text-gray-500 text-2xs"
              >Define the event that triggers your
              webkook</span
            >
          </div>
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
                @mouseleave="onSelectMouseLeave"
              />
              <el-option
                key="new_member"
                value="new_member"
                :label="
                  translate(
                    'entities.automation.triggers.new_member'
                  )
                "
                @mouseleave="onSelectMouseLeave"
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
              <div class="flex items-start gap-4 mb-2">
                <el-form-item
                  label="Matching activity platform(s)"
                  class="grow"
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
                      @mouseleave="onSelectMouseLeave"
                    >
                      <div class="flex items-center">
                        <img
                          :src="
                            getPlatformDetails(
                              platform.value
                            ).image
                          "
                          class="w-4 h-4 mr-2"
                        />
                        {{ platform.label }}
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="Matching activity type(s)"
                  class="grow"
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
                      @mouseleave="onSelectMouseLeave"
                    />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="Including keyword(s)">
                <app-keywords-input
                  v-model="model.settings.keywords"
                />
              </el-form-item>
              <el-checkbox
                v-model="
                  model.settings.teamMemberActivities
                "
                class="text-gray-900"
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
                    @mouseleave="onSelectMouseLeave"
                  />
                </el-select>
              </el-form-item>
            </el-collapse-item>
          </el-collapse>

          <el-divider
            class="border-gray-200 mt-4 mb-6"
          ></el-divider>

          <div class="flex flex-col gap-1 mb-6">
            <span
              class="text-base font-semibold text-brand-500"
              >Action</span
            >
            <span class="text-gray-500 text-2xs"
              >Define the endpoint where the webhook payload
              should be sent to</span
            >
          </div>

          <el-form-item
            label="Webhook URL"
            required
            prop="settings.url"
          >
            <el-input
              v-model="model.settings.url"
              type="text"
              placholder="https://somewebhook.url"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div
        class="flex grow items-center"
        :class="
          isEditing && isDirty
            ? 'justify-between'
            : 'justify-end'
        "
      >
        <el-button
          v-if="isEditing && isDirty"
          class="btn btn-link btn-link--primary"
          @click="doReset"
          ><i class="ri-arrow-go-back-line"></i>
          <span>Reset changes</span></el-button
        >

        <div class="flex gap-4">
          <el-button
            :disabled="saveLoading"
            class="btn btn--md btn--bordered"
            @click="doCancel"
          >
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading || !isFilled || !isDirty"
            class="btn btn--md btn--primary"
            @click="doSubmit"
          >
            {{ isEditing ? 'Update' : 'Add webhook' }}
          </el-button>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { AutomationModel } from '@/modules/automation/automation-model'
import { FormSchema } from '@/shared/form/form-schema'
import { i18n } from '@/i18n'
import activityTypesJson from '@/jsons/activity-types.json'
import UrlField from '@/shared/fields/url-field'
import isEqual from 'lodash/isEqual'
import { onSelectMouseLeave } from '@/utils/select'
import { CrowdIntegrations } from '@/integrations/integrations-config'

const { fields } = AutomationModel
const formSchema = new FormSchema([
  fields.id,
  fields.type,
  fields.trigger,
  fields.status,
  fields.settings,
  new UrlField('settings.url', 'Webhook URL', {
    required: true
  })
])

export default {
  name: 'AppWebhookForm',
  props: {
    modelValue: {
      type: Object,
      default: () => {}
    },
    isDrawerOpen: {
      type: Boolean,
      default: () => false
    }
  },
  emits: ['cancel', 'success'],
  data() {
    return {
      rules: formSchema.rules(),
      newActivityFilters: 'activityFilters',
      newMemberFilters: 'memberFilters',
      loadingIntegrations: false,
      model: formSchema.initialValues(
        JSON.parse(JSON.stringify(this.modelValue))
      )
    }
  },

  computed: {
    isDrawerOpenComputed: {
      get() {
        return this.isDrawerOpen
      },
      set(value) {
        return value
      }
    },
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
    isDirty() {
      return !isEqual(
        formSchema.initialValues(
          JSON.parse(JSON.stringify(this.modelValue))
        ),
        this.model
      )
    },
    computedPlatformOptions() {
      return this.integrationsActive.map((item) => {
        return {
          value: item.platform,
          label: CrowdIntegrations.getConfig(item.platform)
            .name
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
      this.model = formSchema.initialValues(
        JSON.parse(JSON.stringify(this.modelValue))
      )
    },
    getPlatformDetails(platform) {
      return CrowdIntegrations.getConfig(platform)
    },

    doCancel() {
      this.$emit('cancel')
    },

    onSelectMouseLeave
  }
}
</script>

<style lang="scss">
.automation-form {
  .el-collapse {
    @apply border-none bg-gray-50 rounded p-4;
    overflow: unset;

    .el-collapse-item {
      @apply bg-gray-50;
    }

    .el-collapse-item__header {
      @apply text-gray-600 bg-gray-50 text-xs flex flex-row-reverse justify-end leading-tight h-6 font-medium border-none;
      .el-collapse-item__arrow {
        margin: 0 8px 0 0;
      }
    }
    .el-collapse-item__content {
      @apply pb-0 pt-6 leading-none;
    }
    .el-collapse-item__wrap {
      @apply border-none leading-none bg-gray-50;
    }
  }
  .el-form-item {
    @apply mb-0;
  }
}
</style>

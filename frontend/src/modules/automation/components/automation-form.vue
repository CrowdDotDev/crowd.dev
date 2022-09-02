<template>
  <el-form
    v-if="model"
    ref="form"
    :model="model"
    :rules="rules"
    class="form"
    @submit.prevent="doSubmit"
  >
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
        <el-option key="new_activity" value="new_activity">
          <app-i18n
            code="entities.automation.triggers.new_activity"
          />
        </el-option>
        <el-option key="new_member" value="new_member">
          <app-i18n
            code="entities.automation.triggers.new_member"
          />
        </el-option>
      </el-select>
    </el-form-item>
    <div class="flex -mx-2">
      <el-form-item
        label="Matching activity platform(s)"
        :prop="fields.settings.activityPlatforms"
        class="w-full lg:w-1/2 mx-2"
      >
        <el-select
          v-model="model.settings.activityPlatforms"
          placeholder="Select option"
        >
          <el-option
            key="new_activity"
            value="new_activity"
          >
            <app-i18n
              code="entities.automation.triggers.new_activity"
            />
          </el-option>
          <el-option key="new_member" value="new_member">
            <app-i18n
              code="entities.automation.triggers.new_member"
            />
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="Matching activity type(s)"
        :prop="fields.settings.activityTypes"
        class="w-full lg:w-1/2 mx-2"
      >
        <el-select
          v-model="model.settings.activityTypes"
          placeholder="Select option"
        >
          <el-option
            key="new_activity"
            value="new_activity"
          >
            <app-i18n
              code="entities.automation.triggers.new_activity"
            />
          </el-option>
          <el-option key="new_member" value="new_member">
            <app-i18n
              code="entities.automation.triggers.new_member"
            />
          </el-option>
        </el-select>
      </el-form-item>
    </div>
    <el-form-item label="Including keyword(s)">
      <app-keywords-input
        v-model="model.settings.keywords"
      />
    </el-form-item>

    <div class="flex items-center pb-2">
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
    <el-form-item label="Webhook URL" :required="true">
      <el-input
        v-model="model.settings.webhookUrl"
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
        {{ isEditing ? 'Update' : 'Save' }} webhook
      </el-button>

      <el-button
        :disabled="saveLoading"
        class="btn btn--secondary"
        @click="doCancel"
      >
        <app-i18n code="common.cancel"></app-i18n>
      </el-button>
    </div>
  </el-form>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { AutomationModel } from '@/modules/automation/automation-model'
import { FormSchema } from '@/shared/form/form-schema'

const { fields } = AutomationModel
const formSchema = new FormSchema([
  fields.type,
  fields.trigger,
  fields.status,
  fields.settings
])

export default {
  name: 'AppAutomationForm',
  props: {
    modelValue: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['cancel'],
  data() {
    return {
      rules: formSchema.rules(),
      model: {
        ...this.modelValue
      }
    }
  },
  computed: {
    ...mapGetters({
      loading: 'automation/loading'
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
      return (
        this.model.trigger && this.model.settings.action
      )
    }
  },
  methods: {
    ...mapActions({
      doUpdate: 'automation/doUpdate',
      doCreate: 'automation/doCreate'
    }),
    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        console.log(error)
        return
      }

      if (this.isEditing) {
        return this.doUpdate({
          id: this.model.id,
          values: formSchema.cast(this.model)
        })
      } else {
        return this.doCreate(formSchema.cast(this.model))
      }
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

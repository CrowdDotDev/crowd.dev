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
        label="Matching activity type(s)"
        :prop="fields.settings.activityTypes"
        class="w-full lg:w-1/2 mx-2"
      >
        <el-select
          v-model="model.trigger"
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
        label="Matching activity platform(s)"
        :prop="fields.settings.activityPlatforms"
        class="w-full lg:w-1/2 mx-2"
      >
        <el-select
          v-model="model.trigger"
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
  </el-form>
</template>

<script>
import { AutomationModel } from '@/modules/automation/automation-model'
import { FormSchema } from '@/shared/form/form-schema'
import AppI18n from '@/shared/i18n/i18n'

const { fields } = AutomationModel
const formSchema = new FormSchema([
  fields.type,
  fields.trigger,
  fields.status,
  fields.settings
])

export default {
  name: 'AppAutomationForm',
  components: { AppI18n },
  props: {
    modelValue: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      rules: formSchema.rules(),
      model: {
        ...this.modelValue
      }
    }
  },
  computed: {
    isEditing() {
      return this.modelValue.id !== undefined
    },
    fields() {
      return fields
    }
  },
  methods: {
    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        console.log(error)
        return
      }

      if (this.isEditing) {
        return this.doUpdate(formSchema.cast(this.model))
      } else {
        return this.doCreate(formSchema.cast(this.model))
      }
    }
  }
}
</script>

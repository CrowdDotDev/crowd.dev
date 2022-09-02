<template>
  <el-form
    v-if="model"
    ref="form"
    :model="model"
    :rules="rules"
    class="form"
    @submit.prevent="doSubmit"
  >
  </el-form>
</template>

<script>
import { AutomationModel } from '@/modules/automation/automation-model'
import { FormSchema } from '@/shared/form/form-schema'

const { fields } = AutomationModel
const formSchema = new FormSchema([
  fields.name,
  fields.active
])

export default {
  name: 'AppAutomationForm',
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

<template>
  <div>
    <div
      v-if="initLoading"
      v-loading="initLoading"
      class="app-page-spinner"
    ></div>

    <el-form
      v-if="model"
      ref="form"
      :label-position="labelPosition"
      :label-width="labelWidthForm"
      :model="model"
      :rules="rules"
      class="form"
      @submit.prevent="doSubmit"
    >
      <div class="flex items-center -mx-2">
        <el-form-item
          :label="fields.email.label"
          :prop="fields.email.name"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-input
            v-model="model[fields.email.name]"
            disabled
          />
        </el-form-item>

        <el-form-item
          :label="fields.roles.label"
          :prop="fields.roles.name"
          :required="fields.roles.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-select
            v-model="model[fields.roles.name]"
            multiple
            placeholder
          >
            <el-option
              v-for="option in fields.roles.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
      </div>

      <div class="form-buttons mt-12">
        <el-button
          :disabled="saveLoading"
          icon="ri-lg ri-save-line"
          class="btn btn--primary mr-2"
          @click="doSubmit"
        >
          <app-i18n code="common.save"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          icon="ri-lg ri-arrow-go-back-line"
          class="btn btn--secondary mr-2"
          @click="doReset"
        >
          <app-i18n code="common.reset"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          icon="ri-lg ri-close-line"
          class="btn btn--secondary"
          @click="$emit('cancel')"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { UserModel } from '@/premium/user/user-model'
import { i18n } from '@/i18n'

const { fields } = UserModel
const formSchema = new FormSchema([
  fields.email,
  fields.roles
])

export default {
  name: 'AppUserEditPage',

  props: ['id'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm',
      record: 'user/form/record',
      initLoading: 'user/form/initLoading',
      saveLoading: 'user/form/saveLoading'
    }),

    fields() {
      return fields
    }
  },

  async created() {
    await this.doInit(this.id)
    this.model = formSchema.initialValues(this.record)
  },

  methods: {
    ...mapActions({
      doInit: 'user/form/doInit',
      doUpdate: 'user/form/doUpdate'
    }),

    doReset() {
      this.model = formSchema.initialValues(this.record)
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      const values = formSchema.cast(this.model)
      delete values.email
      this.doUpdate({
        id: this.record && this.record.id,
        ...values
      })
    },

    i18n(code) {
      return i18n(code)
    }
  }
}
</script>

<template>
  <div>
    <div
      class="app-page-spinner"
      v-if="initLoading"
      v-loading="initLoading"
    ></div>

    <el-form
      :label-position="labelPosition"
      :label-width="labelWidthForm"
      :model="model"
      :rules="rules"
      @submit.native.prevent="doSubmit"
      class="form"
      ref="form"
      v-if="model"
    >
      <div class="flex items-center -mx-2">
        <el-form-item
          :label="fields.email.label"
          :prop="fields.email.name"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-input
            disabled
            v-model="model[fields.email.name]"
          />
        </el-form-item>

        <el-form-item
          :label="fields.roles.label"
          :prop="fields.roles.name"
          :required="fields.roles.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-select
            multiple
            placeholder
            v-model="model[fields.roles.name]"
          >
            <el-option
              :key="option.value"
              :label="option.label"
              :value="option.value"
              v-for="option in fields.roles.options"
            ></el-option>
          </el-select>
        </el-form-item>
      </div>

      <div class="form-buttons mt-12">
        <el-button
          :disabled="saveLoading"
          @click="doSubmit"
          icon="ri-lg ri-save-line"
          class="btn btn--primary mr-2"
        >
          <app-i18n code="common.save"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          @click="doReset"
          icon="ri-lg ri-arrow-go-back-line"
          class="btn btn--secondary mr-2"
        >
          <app-i18n code="common.reset"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          @click="$emit('cancel')"
          icon="ri-lg ri-close-line"
          class="btn btn--secondary"
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
  name: 'app-user-edit-page',

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

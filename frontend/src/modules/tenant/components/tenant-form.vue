<template>
  <div>
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
      <el-form-item
        :label="fields.tenantName.label"
        :prop="fields.tenantName.name"
        :required="fields.tenantName.required"
      >
        <el-col :lg="11" :md="16" :sm="24">
          <el-input
            ref="focus"
            v-model="model[fields.tenantName.name]"
          />
        </el-col>
      </el-form-item>

      <el-form-item
        v-if="tenantSubdomain.isEnabled"
        :label="fields.tenantUrl.label"
        :prop="fields.tenantUrl.name"
        :required="fields.tenantUrl.required"
      >
        <el-col :lg="11" :md="16" :sm="24">
          <el-input v-model="model[fields.tenantUrl.name]">
            <template #append>{{
              frontendUrlHost
            }}</template>
          </el-input>
        </el-col>
      </el-form-item>

      <el-form-item>
        <div class="form-buttons">
          <el-button
            :disabled="saveLoading"
            class="btn btn--primary"
            @click="doSubmit"
          >
            <i class="ri-lg ri-save-line mr-1" />
            <app-i18n code="common.save"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading"
            @click="doReset"
          >
            <i class="ri-lg ri-arrow-go-back-line mr-1" />
            <app-i18n code="common.reset"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading"
            @click="doCancel"
          >
            <i class="ri-close-line mr-1" />
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { TenantModel } from '@/modules/tenant/tenant-model'
import config from '@/config'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'

const { fields } = TenantModel
const formSchema = new FormSchema(
  [
    fields.tenantName,
    tenantSubdomain.isEnabled && fields.tenantUrl
  ].filter(Boolean)
)

export default {
  name: 'AppTenantForm',

  props: {
    isEditing: {
      type: Boolean,
      default: false
    },
    record: {
      type: Object,
      default: () => {}
    },
    saveLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['cancel', 'submit'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm'
    }),

    fields() {
      return fields
    },

    frontendUrlHost() {
      return `.${config.frontendUrl.host}`
    },

    tenantSubdomain() {
      return tenantSubdomain
    }
  },

  created() {
    this.model = formSchema.initialValues(this.record || {})
  },

  methods: {
    doReset() {
      this.model = formSchema.initialValues(this.record)
    },

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
    }
  }
}
</script>

<style></style>

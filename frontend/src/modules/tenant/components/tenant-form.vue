<template>
  <div>
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
        :label="fields.tenantUrl.label"
        :prop="fields.tenantUrl.name"
        :required="fields.tenantUrl.required"
        v-if="tenantSubdomain.isEnabled"
      >
        <el-col :lg="11" :md="16" :sm="24">
          <el-input v-model="model[fields.tenantUrl.name]">
            <template slot="append">{{
              frontendUrlHost
            }}</template>
          </el-input>
        </el-col>
      </el-form-item>

      <el-form-item>
        <div class="form-buttons">
          <el-button
            :disabled="saveLoading"
            @click="doSubmit"
            icon="ri-lg ri-save-line"
            class="btn btn--primary"
          >
            <app-i18n code="common.save"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading"
            @click="doReset"
            icon="ri-lg ri-arrow-go-back-line"
          >
            <app-i18n code="common.reset"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading"
            @click="doCancel"
            icon="ri-close-line"
          >
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
  name: 'app-tenant-form',

  props: ['isEditing', 'record', 'saveLoading'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null
    }
  },

  created() {
    this.model = formSchema.initialValues(this.record || {})
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

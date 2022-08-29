<template>
  <el-form
    ref="form"
    :model="model"
    :rules="rules"
    class="form"
    label-position="left"
    label-width="0px"
    @submit.prevent="doSubmit"
  >
    <el-form-item
      :prop="fields.tenantName.name"
      :label="fields.tenantName.label"
    >
      <el-input
        id="tenant-name"
        ref="focus"
        v-model="model[fields.tenantName.name]"
        :placeholder="fields.tenantName.label"
        auto-complete="off"
        type="text"
        @input="onTenantNameChange()"
      ></el-input>
    </el-form-item>

    <el-form-item
      v-if="tenantSubdomain.isEnabled"
      :prop="fields.tenantUrl.name"
    >
      <el-input
        v-model="model[fields.tenantUrl.name]"
        :placeholder="fields.tenantUrl.label"
        auto-complete="off"
        type="text"
      >
        <template #append>{{ frontendUrlHost }}</template>
      </el-input>
    </el-form-item>

    <el-button
      id="submit"
      :loading="loading"
      native-type="submit"
      class="btn btn--primary btn--xl w-full mt-8"
    >
      <app-i18n code="tenant.create.button"></app-i18n>
    </el-button>

    <el-button
      v-if="invitedTenants.length"
      class="w-full"
      native-type="button"
      @click="$emit('viewToggle')"
    >
      <app-i18n code="tenant.invitation.view"></app-i18n>
    </el-button>
  </el-form>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { TenantModel } from '@/modules/tenant/tenant-model'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'
import config from '@/config'
import { FormSchema } from '@/shared/form/form-schema'
import { urlfy } from '@/shared/urlfy'

const { fields } = TenantModel
const formSchema = new FormSchema(
  [
    fields.tenantName,
    tenantSubdomain.isEnabled && fields.tenantUrl
  ].filter(Boolean)
)

export default {
  name: 'AppTenantNewForm',

  data() {
    return {
      rules: formSchema.rules(),
      model: {}
    }
  },

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      loading: 'tenant/form/saveLoading',
      invitedTenants: 'auth/invitedTenants'
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
    ...mapActions({
      doCreate: 'tenant/form/doCreate'
    }),

    onTenantNameChange() {
      this.model.url = urlfy(this.model.name)
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      if (await this.doCreate(this.model)) {
        this.$emit('created')
      }
    }
  }
}
</script>

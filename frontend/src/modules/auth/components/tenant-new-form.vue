<template>
  <el-form
    :model="model"
    :rules="rules"
    @submit.prevent.native="doSubmit"
    class="form"
    label-position="left"
    label-width="0px"
    ref="form"
  >
    <el-form-item
      :prop="fields.tenantName.name"
      :label="fields.tenantName.label"
    >
      <el-input
        :placeholder="fields.tenantName.label"
        auto-complete="off"
        ref="focus"
        type="text"
        id="tenant-name"
        v-model="model[fields.tenantName.name]"
        @input="onTenantNameChange()"
      ></el-input>
    </el-form-item>

    <el-form-item
      v-if="tenantSubdomain.isEnabled"
      :prop="fields.tenantUrl.name"
    >
      <el-input
        :placeholder="fields.tenantUrl.label"
        auto-complete="off"
        type="text"
        v-model="model[fields.tenantUrl.name]"
      >
        <template slot="append">{{
          frontendUrlHost
        }}</template>
      </el-input>
    </el-form-item>

    <el-button
      :loading="loading"
      native-type="submit"
      class="btn btn--primary btn--xl w-full mt-8"
      id="submit"
    >
      <app-i18n code="tenant.create.button"></app-i18n>
    </el-button>

    <el-button
      @click="$emit('viewToggle')"
      class="w-full"
      native-type="button"
      v-if="invitedTenants.length"
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
  name: 'app-tenant-new-form',

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

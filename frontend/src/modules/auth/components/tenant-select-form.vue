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
    <el-form-item :prop="fields.tenantId.name">
      <el-select
        placeholder
        v-model="model[fields.tenantId.name]"
      >
        <el-option
          :key="option.id"
          :label="option.name"
          :value="option.id"
          v-for="option in invitedTenants"
        ></el-option>
      </el-select>
    </el-form-item>

    <el-form-item class="form-buttons">
      <el-button
        :loading="loading"
        native-type="submit"
        class="w-100 btn btn--primary"
      >
        <app-i18n
          code="tenant.invitation.accept"
        ></app-i18n>
      </el-button>

      <el-button
        @click="$emit('viewToggle')"
        class="w-100"
        native-type="button"
        style="margin-top: 16px"
      >
        <app-i18n code="tenant.new.title"></app-i18n>
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { TenantModel } from '@/modules/tenant/tenant-model'

const { fields } = TenantModel

export default {
  name: 'app-tenant-select-form',

  created() {
    this.model.id = this.invitedTenants[0].id
  },

  data() {
    return {
      rules: {
        tenantId: fields.tenantId.forFormRules()
      },
      model: {}
    }
  },

  computed: {
    ...mapGetters({
      loading: 'tenant/form/saveLoading',
      invitedTenants: 'auth/invitedTenants',
      currentUser: 'auth/currentUser'
    }),

    fields() {
      return fields
    }
  },

  methods: {
    ...mapActions({
      doAccept: 'tenant/invitation/doAccept'
    }),

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      const tenantUserInvitation = this.currentUser.tenants.find(
        (tenantUser) =>
          tenantUser.tenant.id === this.model.id
      )

      await this.doAccept(
        tenantUserInvitation.invitationToken
      )
    }
  }
}
</script>

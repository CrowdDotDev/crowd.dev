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
    <el-form-item :prop="fields.tenantId.name">
      <el-select
        v-model="model[fields.tenantId.name]"
        placeholder
      >
        <el-option
          v-for="option in invitedTenants"
          :key="option.id"
          :label="option.name"
          :value="option.id"
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
        class="w-100"
        native-type="button"
        style="margin-top: 16px"
        @click="$emit('viewToggle')"
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
  name: 'AppTenantSelectForm',
  emits: ['viewToggle'],

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

  created() {
    this.model.id = this.invitedTenants[0].id
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

<template>
  <div>
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/tenant' }">
        <app-i18n code="tenant.menu"></app-i18n>
      </el-breadcrumb-item>
      <el-breadcrumb-item>
        <app-i18n
          code="tenant.edit.title"
          v-if="isEditing"
        ></app-i18n>
        <app-i18n
          code="tenant.new.title"
          v-if="!isEditing"
        ></app-i18n>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="app-content-page">
      <h1 class="app-content-title">
        <app-i18n
          code="tenant.edit.title"
          v-if="isEditing"
        ></app-i18n>
        <app-i18n
          code="tenant.new.title"
          v-if="!isEditing"
        ></app-i18n>
      </h1>

      <div
        class="app-page-spinner"
        v-if="initLoading"
        v-loading="initLoading"
      ></div>

      <app-tenant-form
        :isEditing="isEditing"
        :record="record"
        :saveLoading="saveLoading"
        @cancel="doCancel"
        @submit="doSubmit"
        v-if="!initLoading"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import TenantForm from '@/modules/tenant/components/tenant-form.vue'
import { routerAsync } from '@/router'

export default {
  name: 'app-tenant-form-page',

  props: ['id'],

  components: {
    'app-tenant-form': TenantForm
  },

  computed: {
    ...mapGetters({
      record: 'tenant/form/record',
      initLoading: 'tenant/form/initLoading',
      saveLoading: 'tenant/form/saveLoading'
    }),

    isEditing() {
      return Boolean(this.id)
    }
  },

  async created() {
    await this.doInit(this.id)
  },

  methods: {
    ...mapActions({
      doInit: 'tenant/form/doInit',
      doUpdate: 'tenant/form/doUpdate',
      doCreate: 'tenant/form/doCreate'
    }),

    doCancel() {
      routerAsync().push('/tenant')
    },

    async doSubmit(payload) {
      if (this.isEditing) {
        return this.doUpdate(payload)
      } else {
        return this.doCreate(payload.values)
      }
    }
  }
}
</script>

<style></style>

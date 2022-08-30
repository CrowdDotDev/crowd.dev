<template>
  <div>
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/tenant' }">
        <app-i18n code="tenant.menu"></app-i18n>
      </el-breadcrumb-item>
      <el-breadcrumb-item>
        <app-i18n
          v-if="isEditing"
          code="tenant.edit.title"
        ></app-i18n>
        <app-i18n
          v-if="!isEditing"
          code="tenant.new.title"
        ></app-i18n>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="app-content-page">
      <h1 class="app-content-title">
        <app-i18n
          v-if="isEditing"
          code="tenant.edit.title"
        ></app-i18n>
        <app-i18n
          v-if="!isEditing"
          code="tenant.new.title"
        ></app-i18n>
      </h1>

      <div
        v-if="initLoading"
        v-loading="initLoading"
        class="app-page-spinner"
      ></div>

      <app-tenant-form
        v-if="!initLoading"
        :is-editing="isEditing"
        :record="record"
        :save-loading="saveLoading"
        @cancel="doCancel"
        @submit="doSubmit"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import TenantForm from '@/modules/tenant/components/tenant-form.vue'
import { router } from '@/router'

export default {
  name: 'AppTenantFormPage',

  components: {
    'app-tenant-form': TenantForm
  },

  props: {
    id: {
      type: String,
      default: null
    }
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
      router.push('/tenant')
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

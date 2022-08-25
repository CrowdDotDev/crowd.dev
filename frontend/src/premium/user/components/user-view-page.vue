<template>
  <div>
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/' }">
        <span class="dashboard-label">Home</span>
      </el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/settings' }">
        <app-i18n code="settings.menu"></app-i18n>
      </el-breadcrumb-item>
      <el-breadcrumb-item>
        <app-i18n code="user.view.title"></app-i18n>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="app-content-page">
      <h1 class="app-content-title">
        <app-i18n code="user.view.title"></app-i18n>
      </h1>

      <app-user-view-toolbar
        v-if="record"
      ></app-user-view-toolbar>

      <div
        class="app-page-spinner"
        v-if="loading"
        v-loading="loading"
      ></div>

      <el-form
        :label-position="labelPosition"
        :label-width="labelWidthForm"
        @submit.prevent.native
        class="form"
        v-if="record && !loading"
      >
        <app-view-item-text
          :label="fields.email.label"
          :value="presenter(record, 'email')"
        ></app-view-item-text>

        <app-view-item-text
          :label="fields.firstName.label"
          :value="presenter(record, 'firstName')"
        ></app-view-item-text>

        <app-view-item-text
          :label="fields.lastName.label"
          :value="presenter(record, 'lastName')"
        ></app-view-item-text>

        <app-view-item-text
          :label="fields.phoneNumber.label"
          :value="presenter(record, 'phoneNumber')"
          prefix="+"
        ></app-view-item-text>

        <app-view-item-image
          :label="fields.avatars.label"
          :value="presenter(record, 'avatars')"
        ></app-view-item-image>

        <app-view-item-custom
          :label="fields.status.label"
          :value="presenter(record, 'status')"
        >
          <el-tag
            :type="
              record[fields.status.name] === 'invited'
                ? 'warning'
                : record[fields.status.name] ===
                  'empty-permissions'
                ? 'danger'
                : 'success'
            "
            >{{ presenter(record, 'status') }}</el-tag
          >
        </app-view-item-custom>

        <app-view-item-custom
          :label="fields.roles.label"
          :value="presenter(record, 'roles')"
        >
          <div :key="roleId" v-for="roleId in record.roles">
            <el-tooltip
              :content="roleDescriptionOf(roleId)"
            >
              <span>{{ roleLabelOf(roleId) }}</span>
            </el-tooltip>
          </div>
        </app-view-item-custom>
      </el-form>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { UserModel } from '@/premium/user/user-model'
import { i18n } from '@/i18n'
import Roles from '@/security/roles'
import UserViewToolbar from '@/premium/user/components/user-view-toolbar.vue'

const { fields } = UserModel

export default {
  name: 'app-user-view-page',

  props: ['id'],

  components: {
    'app-user-view-toolbar': UserViewToolbar
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm',
      record: 'user/view/record',
      loading: 'user/view/loading',
      currentTenant: 'auth/currentTenant'
    }),

    fields() {
      return fields
    }
  },

  async created() {
    await this.doFind(this.id)
  },

  methods: {
    ...mapActions({
      doFind: 'user/view/doFind'
    }),

    presenter(record, fieldName) {
      return UserModel.presenter(record, fieldName)
    },

    roleDescriptionOf(roleId) {
      return Roles.descriptionOf(roleId)
    },

    roleLabelOf(roleId) {
      return Roles.labelOf(roleId)
    },

    i18n(code) {
      return i18n(code)
    }
  }
}
</script>

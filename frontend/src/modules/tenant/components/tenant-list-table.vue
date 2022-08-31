<template>
  <div>
    <el-table
      ref="table"
      v-loading="loading"
      :data="rows"
      row-key="id"
      @sort-change="doChangeSort"
    >
      <el-table-column
        :label="fields.name.label"
        :prop="fields.name.name"
        sortable="custom"
      >
        <template #default="scope">
          {{ presenter(scope.row, 'name') }}
          <el-tag
            v-if="invitationToken(scope.row)"
            type="warning"
          >
            <app-i18n
              code="tenant.invitation.invited"
            ></app-i18n>
          </el-tag>

          <el-button
            v-if="
              !isCurrentTenant(scope.row) &&
              !invitationToken(scope.row)
            "
            class="btn btn--secondary btn--secondary--orange ml-4 block"
            @click="doSelectTenant(scope.row)"
          >
            Switch to this workspace
          </el-button>
        </template>
      </el-table-column>

      <el-table-column
        v-if="tenantSubdomain.isEnabled"
        :label="fields.url.label"
        :prop="fields.url.name"
        align="center"
        width="180"
      >
        <template #default="scope">
          {{ urlOf(scope.row) }}
        </template>
      </el-table-column>

      <el-table-column
        v-if="isPlanEnabled"
        :label="fields.plan.label"
        :prop="fields.plan.name"
        align="center"
        width="180"
      >
        <template #default="scope">
          <el-tag
            :type="
              scope.row.plan === plans.free
                ? 'info'
                : 'warning'
            "
            >{{ planLabelOf(scope.row.plan) }}</el-tag
          >
        </template>
      </el-table-column>

      <el-table-column
        :fixed="isMobile ? undefined : 'right'"
        align="center"
        width="180"
      >
        <template #default="scope">
          <div v-if="invitationToken(scope.row)">
            <div style="margin-bottom: 8px">
              <el-button
                :disabled="invitationLoading"
                type="success"
                @click="
                  doAcceptInvitation(
                    invitationToken(scope.row)
                  )
                "
              >
                <app-i18n
                  code="tenant.invitation.accept"
                ></app-i18n>
              </el-button>
            </div>
            <div>
              <el-button
                :disabled="invitationLoading"
                type="danger"
                @click="
                  doDeclineInvitationWithConfirm(
                    invitationToken(scope.row)
                  )
                "
              >
                <app-i18n
                  code="tenant.invitation.decline"
                ></app-i18n>
              </el-button>
            </div>
          </div>
          <div
            v-if="!invitationToken(scope.row)"
            class="table-actions"
          >
            <router-link
              v-if="hasPermissionToEdit(scope.row)"
              :to="`/tenant/${scope.row.id}/edit`"
            >
              <el-button type="text">
                <app-i18n code="common.edit"></app-i18n>
              </el-button>
            </router-link>

            <!--<el-button
              :disabled="destroyLoading"
              @click="doDestroyWithConfirm(scope.row.id)"
              type="text"
              v-if="hasPermissionToDestroy(scope.row)"
            >
              <app-i18n code="common.destroy"></app-i18n>
            </el-button>-->
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="el-pagination-wrapper">
      <el-pagination
        :current-page="pagination.currentPage || 1"
        :disabled="loading"
        :layout="paginationLayout"
        :total="count"
        :page-size="20"
        :page-sizes="[20, 50, 100, 200]"
        @current-change="doChangePaginationCurrentPage"
        @size-change="doChangePaginationPageSize"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import { TenantModel } from '@/modules/tenant/tenant-model'
import { mapGetters, mapActions } from 'vuex'
import { TenantPermissions } from '@/modules/tenant/tenant-permissions'
import { i18n } from '@/i18n'
import config from '@/config'
import Plans from '@/security/plans'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'

const { fields } = TenantModel

export default {
  name: 'AppTenantListTable',

  computed: {
    ...mapGetters({
      rows: 'tenant/list/rows',
      count: 'tenant/list/count',
      loading: 'tenant/list/loading',
      pagination: 'tenant/list/pagination',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      destroyLoading: 'tenant/destroy/loading',
      invitationLoading: 'tenant/invitation/loading',
      paginationLayout: 'layout/paginationLayout',
      invitationToken: 'tenant/invitation/invitationToken'
    }),

    tenantSubdomain() {
      return tenantSubdomain
    },

    fields() {
      return fields
    },

    plans() {
      return Plans.values
    },

    isPlanEnabled() {
      return config.isPlanEnabled
    }
  },

  created() {
    return this.doFetch()
  },

  mounted() {
    this.doMountTable(this.$refs.table)
  },

  methods: {
    ...mapActions({
      doFetch: 'tenant/list/doFetch',
      doChangeSort: 'tenant/list/doChangeSort',
      doChangePaginationCurrentPage:
        'tenant/list/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'tenant/list/doChangePaginationPageSize',
      doMountTable: 'tenant/list/doMountTable',
      doDestroy: 'tenant/destroy/doDestroy',
      doSelectTenant: 'auth/doSelectTenant',
      doDeclineInvitation: 'tenant/invitation/doDecline',
      doAcceptInvitation: 'tenant/invitation/doAccept'
    }),

    urlOf(tenant) {
      return `${tenant.url}.${config.frontendUrl.host}`
    },

    planLabelOf(plan) {
      return i18n(`plan.${plan}.label`)
    },

    hasPermissionToEdit(tenant) {
      return new TenantPermissions(tenant, this.currentUser)
        .edit
    },

    hasPermissionToDestroy(tenant) {
      return new TenantPermissions(tenant, this.currentUser)
        .destroy
    },

    isCurrentTenant(row) {
      return this.currentTenant.id === row.id
    },

    presenter(row, fieldName) {
      return TenantModel.presenter(row, fieldName)
    },

    async doDeclineInvitationWithConfirm(token) {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        return this.doDeclineInvitation(token)
      } catch (error) {
        // no
      }
    },

    async doDestroyWithConfirm(id) {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style></style>

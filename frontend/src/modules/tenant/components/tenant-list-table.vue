<template>
  <div>
    <el-table
      :border="true"
      :data="rows"
      @sort-change="doChangeSort"
      ref="table"
      row-key="id"
      v-loading="loading"
    >
      <el-table-column
        :label="fields.name.label"
        :prop="fields.name.name"
        sortable="custom"
      >
        <template slot-scope="scope">
          {{ presenter(scope.row, 'name') }}
          <el-tag
            type="warning"
            v-if="invitationToken(scope.row)"
          >
            <app-i18n
              code="tenant.invitation.invited"
            ></app-i18n>
          </el-tag>

          <el-button
            @click="doSelectTenant(scope.row)"
            class="btn btn--secondary btn--secondary--orange ml-4 block"
            v-if="
              !isCurrentTenant(scope.row) &&
              !invitationToken(scope.row)
            "
          >
            Switch to this workspace
          </el-button>
        </template>
      </el-table-column>

      <el-table-column
        :label="fields.url.label"
        :prop="fields.url.name"
        align="center"
        v-if="tenantSubdomain.isEnabled"
        width="180"
      >
        <template slot-scope="scope">
          {{ urlOf(scope.row) }}
        </template>
      </el-table-column>

      <el-table-column
        :label="fields.plan.label"
        :prop="fields.plan.name"
        align="center"
        v-if="isPlanEnabled"
        width="180"
      >
        <template slot-scope="scope">
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
        <template slot-scope="scope">
          <div v-if="invitationToken(scope.row)">
            <div style="margin-bottom: 8px">
              <el-button
                :disabled="invitationLoading"
                @click="
                  doAcceptInvitation(
                    invitationToken(scope.row)
                  )
                "
                type="success"
              >
                <app-i18n
                  code="tenant.invitation.accept"
                ></app-i18n>
              </el-button>
            </div>
            <div>
              <el-button
                :disabled="invitationLoading"
                @click="
                  doDeclineInvitationWithConfirm(
                    invitationToken(scope.row)
                  )
                "
                type="danger"
              >
                <app-i18n
                  code="tenant.invitation.decline"
                ></app-i18n>
              </el-button>
            </div>
          </div>
          <div
            class="table-actions"
            v-if="!invitationToken(scope.row)"
          >
            <router-link
              :to="`/tenant/${scope.row.id}/edit`"
              v-if="hasPermissionToEdit(scope.row)"
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
  name: 'app-tenant-list-table',

  created() {
    return this.doFetch()
  },

  mounted() {
    this.doMountTable(this.$refs.table)
  },

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

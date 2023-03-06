<template>
  <el-form-item v-if="!isBlank" :label="label">
    <el-col :lg="11" :md="16" :sm="24">
      <router-link
        v-if="hasPermissionToRead"
        :to="urlWithId"
      >
        <strong>{{ display }}</strong>
      </router-link>
      <strong v-if="!hasPermissionToRead">
        {{ display }}
      </strong>
    </el-col>
  </el-form-item>
</template>

<script>
import { mapGetters } from 'vuex'
import { PermissionChecker } from '@/modules/user/permission-checker'

export default {
  name: 'AppViewItemRelationToOne',

  props: {
    label: {
      type: String,
      default: null
    },
    value: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    permission: {
      type: String,
      default: null
    }
  },

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),

    hasPermissionToRead() {
      return new PermissionChecker(
        this.currentTenant,
        this.currentUser
      ).match(this.permission)
    },

    urlWithId() {
      if (!this.value) {
        return null
      }

      return `${this.url}/${this.value.id}`
    },

    isBlank() {
      return !this.value || !this.value.id
    },

    display() {
      if (!this.value) {
        return null
      }

      return this.value.label
    }
  }
}
</script>

<style></style>

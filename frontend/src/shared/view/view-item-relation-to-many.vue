<template>
  <el-form-item v-if="!isBlank" :label="label">
    <el-col :lg="11" :md="16" :sm="24">
      <div v-for="item of value" :key="item.id">
        <router-link
          v-if="hasPermissionToRead"
          :to="urlWithId(item)"
        >
          <strong>{{ display(item) }}</strong>
        </router-link>
        <strong v-if="!hasPermissionToRead">
          {{ display(item) }}
        </strong>
      </div>
    </el-col>
  </el-form-item>
</template>

<script>
import { mapGetters } from 'vuex'
import { PermissionChecker } from '@/premium/user/permission-checker'

export default {
  name: 'AppViewItemRelationToMany',

  props: ['label', 'value', 'url', 'permission'],

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

    isBlank() {
      return !this.value || !this.value.length
    }
  },

  methods: {
    urlWithId(item) {
      if (!item) {
        return null
      }

      return `${this.url}/${item.id}`
    },

    display(item) {
      if (!item) {
        return null
      }

      return item.label
    }
  }
}
</script>

<style></style>

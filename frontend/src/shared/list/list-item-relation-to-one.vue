<template>
  <div v-if="!isBlank">
    <router-link :to="urlWithId" v-if="hasPermissionToRead">
      <strong>{{ display }}</strong>
    </router-link>
    <strong v-if="!hasPermissionToRead">
      {{ display }}
    </strong>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { PermissionChecker } from '@/premium/user/permission-checker'

export default {
  name: 'app-list-item-relation-to-one',

  props: ['value', 'url', 'permission'],

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

<template>
  <div class="app-page-toolbar">
    <router-link :to="{ path: '/tenant/new' }">
      <el-button
        icon="ri-lg ri-add-line"
        class="btn btn--primary"
      >
        <app-i18n code="common.new"></app-i18n>
      </el-button>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'app-tenant-list-toolbar'
}
</script>

<style></style>

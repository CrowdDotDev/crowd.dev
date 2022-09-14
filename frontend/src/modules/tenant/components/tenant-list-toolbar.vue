<template>
  <div class="app-page-toolbar">
    <router-link :to="{ path: '/tenant/new' }">
      <el-button class="btn btn--primary"
        ><i class="ri-lg ri-add-line mr-1" />
        <app-i18n code="common.new"></app-i18n>
      </el-button>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'AppTenantListToolbar'
}
</script>

<style></style>

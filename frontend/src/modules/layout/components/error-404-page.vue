<template>
  <div class="error-page">
    <div class="imgBlock">
      <div
        class="imgEle"
        style="background-image: url(/images/404.svg)"
      ></div>
    </div>
    <div class="content">
      <h1>404</h1>
      <div class="desc">
        <app-i18n code="errors.404"></app-i18n>
      </div>
      <div class="actions">
        <router-link :to="{ path: '/' }">
          <el-button>
            <app-i18n code="errors.backToHome"></app-i18n>
          </el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppError404Page'
}
</script>

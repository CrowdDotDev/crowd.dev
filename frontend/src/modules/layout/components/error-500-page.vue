<template>
  <div class="error-page">
    <div class="imgBlock">
      <div
        class="imgEle"
        style="
          background-image: url(/images/logo-all-black.png);
        "
      ></div>
    </div>
    <div class="content">
      <h1>Sorry, something went wrong 🥴</h1>
      <div class="desc">
        Please try again, and if the problem remains, let us
        know in our
        <a href="https://crowd.dev/discord"
          >Discord community</a
        >
        or
        <a href="mailto:help@crowd.dev">send an email</a>.
      </div>
      <div class="actions">
        <router-link :to="{ path: '/' }">
          <el-button class="btn btn--secondary">
            <app-i18n code="errors.backToHome"></app-i18n>
          </el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-error-500-page'
}
</script>

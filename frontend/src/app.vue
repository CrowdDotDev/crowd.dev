<template>
  <div v-if="!loadingInit" id="app">
    <div class="sm:hidden md:block lg:block">
      <router-view v-slot="{ Component }">
        <transition>
          <component :is="Component" />
        </transition>
      </router-view>

      <div id="teleport-modal"></div>
    </div>

    <div class="sm:block md:hidden lg:hidden">
      <app-resize-page />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppResizePage from '@/modules/layout/pages/resize-page.vue'

export default {
  name: 'App',

  components: {
    AppResizePage
  },

  inject: ['unleash'],

  computed: {
    ...mapGetters({
      loadingInit: 'auth/loadingInit',
      currentTenant: 'auth/currentTenant'
    })
  },

  async created() {
    await this.doInit()

    const {
      automationCount,
      csvExportCount,
      memberEnrichmentCount,
      plan
    } = this.currentTenant

    this.unleash.init({
      automationCount,
      csvExportCount,
      memberEnrichmentCount,
      plan
    })

    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },

  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    ...mapActions({
      doInit: 'auth/doInit',
      resize: 'layout/resize'
    }),

    handleResize() {
      this.resize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
  }
}
</script>

<style lang="scss">
@import 'assets/scss/index.scss';
</style>

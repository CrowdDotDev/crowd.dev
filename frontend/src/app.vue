<template>
  <div v-if="!loadingInit" id="app">
    <router-view v-slot="{ Component }">
      <transition>
        <component :is="Component" />
      </transition>
    </router-view>

    <div id="modal-teleport"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',

  computed: {
    ...mapGetters({
      loadingInit: 'auth/loadingInit'
    })
  },

  created() {
    this.doInit()
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

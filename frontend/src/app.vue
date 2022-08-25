<template>
  <div id="app" v-if="!loadingInit">
    <transition mode="out-in" name="fade">
      <router-view />
    </transition>

    <portal-target name="modal"></portal-target>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'app',

  created() {
    this.doInit()
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },

  destroyed() {
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
  },

  computed: {
    ...mapGetters({
      loadingInit: 'auth/loadingInit'
    })
  }
}
</script>

<style lang="scss">
@import 'assets/scss/index.scss';
</style>

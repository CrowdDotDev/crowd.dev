<template>
  <div class="p-6 flex justify-center">
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'AppOnboardLayout'
}
</script>

<style lang="scss" scoped>
main {
  width: 100%;
  max-width: 42.75rem;
}
</style>

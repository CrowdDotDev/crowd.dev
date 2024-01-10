<template>
  <main class="flex justify-center items-center !pt-0">
    <router-view />
  </main>
</template>

<script>
export default {
  name: 'AppAuthLayout',
};
</script>

<style lang="scss" scoped>

main {
  flex-shrink: 1;
  height: 100vh;
  width: 100%;
}
</style>

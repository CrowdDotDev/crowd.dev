<template>
  <Teleport v-if="targetMounted" :to="to">
    <slot />
  </Teleport>
</template>

<script>
export default {
  name: 'AppTeleport',
  props: {
    to: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      targetMounted: false,
      timer: null,
    };
  },
  mounted() {
    this.timer = setInterval(
      this.validateTargetIsMounted,
      100,
    );
  },
  methods: {
    validateTargetIsMounted() {
      const element = document.querySelector(this.to);
      if (element) {
        this.targetMounted = true;
        clearInterval(this.timer);
      }
    },
  },
};
</script>

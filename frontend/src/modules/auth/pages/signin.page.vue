<template>
  <div class="flex items-center justify-center h-screen">
    <cr-spinner size="5rem" />
  </div>
</template>

<script setup lang="ts">
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { onMounted } from 'vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';

const { signin } = useAuthStore();

onMounted(() => {
  signin();
});
</script>

<script lang="ts">
export default {
  name: 'AuthSigninPage',
};
</script>

<template>
  <div class="flex items-center bg-white h-full w-full justify-center">
    <cr-spinner size="12rem" />
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

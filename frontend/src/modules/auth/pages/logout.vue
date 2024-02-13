<template>
  <div class="flex items-center h-screen">
    <cr-spinner size="3.5rem" />
  </div>
</template>

<script lang="ts" setup>
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { onMounted } from 'vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';

const { logout } = useAuthStore();

onMounted(() => {
  logout();
});
</script>

<script lang="ts">
export default {
  name: 'AuthLogoutPage',
};
</script>

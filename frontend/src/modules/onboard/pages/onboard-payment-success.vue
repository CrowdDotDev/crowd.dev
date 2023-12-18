<template>
  <div class="overflow-auto mt-20">
    <div class="flex justify-center pt-16 pb-4">
      <div>
        <h4 v-if="loading" class="text-xl font-semibold leading-8 text-center">
          Processing your subscription
        </h4>
        <h4 v-else class="text-xl font-semibold leading-8 text-center">
          Error confirming subscription
        </h4>
        <p v-if="loading" class="text-sm text-gray-600 leading-5 text-center">
          Please wait for our system to process your subscription
        </p>
        <p v-else class="text-sm text-gray-600 leading-5 text-center">
          There was an error confirming subscription, please contact our support
        </p>

        <div class="flex justify-center pt-3">
          <div
            v-if="loading"
            v-loading="true"
            class="app-page-spinner h-16 w-16 !relative !min-h-fit"
          />
          <a v-else href="mailto:help@crowd.dev" target="_blank" rel="noopener noreferrer">
            <button type="button" class="btn btn--primary btn--md">
              Contact support
            </button>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import { AuthService } from '@/modules/auth/auth-service';
import config from '@/config';

const route = useRoute();

const { sessionId } = route.query;

const loading = ref<boolean>(true);

onMounted(() => {
  AuthService.confirmPayment(sessionId)
    .then(() => {
      window.location.href = `${config.frontendUrl.protocol}://${config.frontendUrl.host}/settings?activeTab=plans`;
    })
    .catch(() => {
      loading.value = false;
    });
});
</script>

<style lang="scss" scoped>

.limit-width {
  @apply w-full px-8;
  max-width: 42.75rem;
}
</style>

<template>
  <div class="overflow-auto mb-20">
    <div class="flex justify-center py-16">
      <div class="flex gap-6 items-center">
        <span class="text-5xl"> 🙌 </span>
        <div class="flex flex-col gap-1">
          <h4 class="text-xl font-semibold leading-8">
            Get personalised onboarding
          </h4>
          <p class="text-sm text-gray-600 leading-5">
            Learn how to use crowd.dev to accelerate your growth.
          </p>
        </div>
      </div>
    </div>

    <div id="embbeded-script" class="w-full" />

    <div class="fixed bottom-0 w-full bg-white flex justify-center py-4 px-8 border-t border-gray-200">
      <div class="limit-width">
        <el-button
          class="btn btn--primary btn--md btn--full"
          @click="onBtnClick"
        >
          <span class="text-base">Get started</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { renderCal } from '@/utils/cals';

const router = useRouter();

onMounted(() => {
  renderCal({
    calLink: 'team/crowddotdev/get-personalised-onboarding',
  });
});

const onBtnClick = () => {
  router.push({ name: 'welcomeaboard' });
};
</script>

<style lang="scss" scoped>

.limit-width {
  @apply w-full px-8;
  max-width: 42.75rem;
}
</style>

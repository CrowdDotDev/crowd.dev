<template>
  <div class="overflow-auto mb-20">
    <div class="flex justify-center py-16">
      <div class="flex gap-6 items-center">
        <span class="text-5xl"> 🙌 </span>
        <div class="flex flex-col gap-1">
          <h4 class="text-xl font-semibold leading-8">
            Get personalized onboarding
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
/* eslint-disable */ 
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  (function (C, A, L) {
    const p = function (a, ar) {
      a.q.push(ar);
    };
    const d = C.document;
    C.Cal = C.Cal
      || function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          typeof namespace === 'string'
            ? (cal.ns[namespace] = api) && p(api, ar)
            : p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  }(window, 'https://app.cal.com/embed/embed.js', 'init'));
  Cal('init', { origin: 'https://cal.com' });

  Cal('inline', {
    elementOrSelector: '#embbeded-script',
    calLink: 'team/crowddotdev/intro-to-crowd-dev',
    layout: 'month_view',
  });

  Cal('ui', {
    styles: { branding: { brandColor: '#E94F2E' } },
    hideEventTypeDetails: false,
    layout: 'month_view',
  });
});

const onBtnClick = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>

.limit-width {
  @apply w-full px-8;
  max-width: 42.75rem;
}
</style>

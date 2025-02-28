<template>
  <div class="grid grid-cols-12 h-full">
    <div class="flex items-center justify-between col-start-2 col-end-12">
      <div class="w-2/3">
        <div class="text-gray-900 font-semibold mt-2 text-3xl">
          Upgrade plan
        </div>
        <div class="text-gray-600 mt-2">
          You need to upgrade your plan in order to enable this feature. Please
          leave us a message.
        </div>
        <div class="mt-10">
          <a
            href="https://www.crowd.dev/contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            <el-button class="btn btn--primary btn--md" @click="onCtaClick">
              Contact us
            </el-button>
          </a>
        </div>
      </div>
      <img
        :src="getImageUrlFromPath('error/403.svg')"
        alt="403 img"
        class="block w-32 h-auto"
      />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { getImageUrlFromPath } from '@/utils/image-loader';

const route = useRoute();

const onCtaClick = () => {
  window.analytics.track('Upgrade Plan Contact', {
    route: route.path,
  });
};
</script>

<script>
export default {
  name: 'AppPaywallPage',
};
</script>

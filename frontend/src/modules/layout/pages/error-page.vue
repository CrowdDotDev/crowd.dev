<template>
  <div
    class="flex items-center justify-between h-screen col-start-1 col-end-13 py-16 relative max-w-5xl mx-auto"
  >
    <div class="content">
      <div
        class="text-brand-500 text-xs uppercase font-semibold"
      >
        Error {{ code }}
      </div>
      <div
        class="text-gray-900 font-semibold mt-2 text-3xl"
      >
        {{ title }}
      </div>
      <div class="text-gray-600 mt-2">
        {{ subtitle }}
      </div>
      <div class="mt-10">
        <router-link :to="{ path: '/' }">
          <el-button
            class="btn btn--primary btn--md"
            @click="onBackHomeClick"
          >
            Back to Home
          </el-button>
        </router-link>
      </div>
    </div>
    <img
      :src="`/images/error/${code}.svg`"
      alt="404 img"
      class="block w-32 h-auto"
    />
    <div
      class="absolute right-0 bottom-0 mb-16 flex items-center"
    >
      <a
        href="https://crowd.dev/discord"
        class="btn btn-link btn-link--md btn-link--primary flex items-center mr-6"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/5968/5968756.png"
          alt=""
          class="mr-2 h-4 w-4 block"
        />
        <span class="leading-4"> Discord community</span>
      </a>
      <a
        href="mailto:help@crowd.dev"
        class="btn btn-link btn-link--md btn-link--primary flex items-center"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i
          class="ri-mail-line text-brand-500 w-4 h-4 mr-2 flex items-center justify-center"
        />
        <span class="leading-4">Contact us</span>
      </a>
    </div>
  </div>
</template>

<script>
import { TenantService } from '@/modules/tenant/tenant-service';

export default {
  name: 'AppError404Page',
  props: {
    code: {
      type: Number,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },
    subtitle: {
      type: String,
      default: null,
    },
  },
  methods: {
    async onBackHomeClick() {
      await TenantService.fetchAndApply();
    },
  },
};
</script>

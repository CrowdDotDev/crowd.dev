<template>
  <div class="panel w-full col-span-2 !p-8 background-dotted flex flex-col items-center">
    <div class="flex gap-2 items-center">
      <img
        alt="Github"
        src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
        class="h-5 w-5"
      />
      <div class="text-gray-900 text-base font-semibold">
        OSS contributions
      </div>
      <div class="text-white flex items-center gap-1 bg-purple-400 rounded-full px-2 h-5">
        <app-svg name="white-source" class="h-3 w-3" />
        <span class="text-2xs font-medium">Enrichment</span>
      </div>
    </div>

    <div class="text-center w-[404px] text-2xs mt-2 text-gray-600">
      Get more insights about this contact by enriching it with valuable details such as seniority level, OSS contributions, skills and much more.
    </div>

    <div class="flex gap-3 mt-4">
      <router-link
        :to="{
          name: 'settings',
          query: { activeTab: 'plans' },
        }"
        class=""
      >
        <el-button class="btn btn--primary !h-8 !px-3 text-xs">
          Update plan
        </el-button>
      </router-link>
      <a
        href="https://docs.crowd.dev/docs/guides/contacts/contact-enrichment"
        target="_blank"
        rel="noopener noreferrer"
      >
        <button type="button" class="btn btn--transparent !h-8 !px-3">
          <span class="ri-book-open-line text-base mr-2 h-4 flex items-center" />
          <span class="text-xs">Learn more</span>
        </button>
      </a>
    </div>
  </div>
</template>

<script setup>
import AppSvg from '@/shared/svg/svg.vue';
</script>

<style lang="scss" scoped>
.background-dotted {
  background: white;
  background-image: radial-gradient(rgb(217,217,217) 1px, transparent 0);
  background-size: 12px 12px;
  background-position: -11px -11px;
}
</style>

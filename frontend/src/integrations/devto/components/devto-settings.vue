<template>
  <div>
    <div class="flex items-center gap-1">
      <el-popover trigger="hover" placement="top" popper-class="!w-72">
        <template #reference>
          <div class="flex flex-row gap-1">
            <div class="text-gray-600 text-2xs flex items-center leading-5 font-medium">
              <i class="ri-community-line text-base !text-gray-600 mr-1 h-4 flex items-center" />
              {{ organizations.length }}
              {{ organizations.length !== 1 ? "organizations" : "organization" }}
            </div>
            •
            <div class="text-gray-600 text-2xs flex items-center leading-5 font-medium">
              {{ users.length }}
              {{ users.length !== 1 ? "users" : "user" }}
            </div>
          </div>
        </template>

        <div class="max-h-44 overflow-auto -my-1 px-1">
          <template v-if="organizations.length > 0">
            <p class="text-gray-400 text-[13px] font-semibold mb-4">
              DEV organizations
            </p>
            <article
              v-for="organization of organizations"
              :key="organization"
              class="flex items-center flex-nowrap mb-4 last:mb-0"
            >
              <div class="ri-community-line text-[16px] mr-1 h-4 flex items-center" />

              <span class="text-gray-900 text-[13px] max-w-3xs truncate">{{
                organization
              }}</span>
            </article>
          </template>

          <template v-if="users.length > 0">
            <p class="text-gray-400 text-[13px] font-semibold mb-4" :class="{ 'mt-4': organizations.length > 0 }">
              DEV users
            </p>

            <article v-for="user of users" :key="user" class="flex items-center flex-nowrap mb-4 last:mb-0">
              <div class="ri-user-line text-[16px] mr-1 h-4 flex items-center" />

              <span class="text-gray-900 text-[13px] max-w-3xs truncate">{{
                user
              }}</span>
            </article>
          </template>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => { },
  },
});

const organizations = computed<string[]>(() => props.integration.settings.organizations);
const users = computed<string[]>(() => props.integration.settings.users);
</script>

<script lang="ts">
export default {
  name: 'AppGithubSettings',
};
</script>

<style scoped>
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-thumb {
    background-color: #9ca3af;
    /* text-gray-400 */
    border-radius: 3px;
}

::-webkit-scrollbar-track {
    background-color: #f3f4f6;
    /* A light gray background for the track */
}
</style>

<template>
  <div>
    <div class="flex items-center gap-1">
      <el-popover trigger="hover" placement="top" popper-class="!w-auto">
        <template #reference>
          <div
            class="text-gray-600 text-2xs flex items-center leading-5 font-medium"
          >
            <i
              class="ri-question-answer-line text-base !text-gray-600 mr-1 h-4 flex items-center"
            />
            {{ groups.length }}
            {{ groups.length !== 1 ? "groups" : "group" }}
          </div>
        </template>

        <div class="-my-1 px-1 max-h-44 overflow-auto">
          <article
            v-for="group of groups"
            :key="group.id"
            class="py-2 flex items-center flex-nowrap"
          >
            <div
              class="ri-question-answer-line text-base mr-2 h-4 flex items-center"
            />
            <div class="text-xs leading-5 max-w-3xs truncate">
              {{ group.name }}
            </div>
            <div
              class="ri-arrow-right-line text-gray-400 text-base mx-2 h-4 flex items-center"
            />
            <div class="text-xs leading-5 max-w-3xs truncate">
              {{ group.slug }}
            </div>
          </article>
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
    default: () => {},
  },
});

const groups: any[] = computed(() => props.integration.settings.groups);
</script>

<script lang="ts">
export default {
  name: 'AppGithubSettings',
};
</script>

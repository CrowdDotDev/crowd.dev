<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Associated Sub-projects
      </div>
    </div>

    <div v-if="member.segments.length" class="flex flex-col gap-4 mt-6 group">
      <app-entities
        :entities="member.segments"
        :limit="3"
      >
        <template #default="{ slicedEntities }">
          <div
            v-for="(segment, i) of slicedEntities"
            :key="segment.id"
            class="flex flex-col gap-4"
          >
            <div class="text-xs text-gray-900 flex items-center gap-3">
              <lf-icon name="layer-group" :size="20" />
              <span>{{ segment.name }}</span>
            </div>
            <el-divider v-if="i !== slicedEntities.length - 1" class="!my-0 border-gray-200" />
          </div>
        </template>
      </app-entities>
    </div>
    <div v-else class="text-gray-400 mt-6 text-xs italic">
      No sub-projects
    </div>
  </div>
</template>

<script setup lang="ts">
import { Member } from '@/modules/member/types/Member';
import AppEntities from '@/shared/modules/entities/Entities.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

defineProps<{
  member: Member
}>();
</script>

<script lang="ts">
export default {
  name: 'AppLfMemberAsideSubProjects',
};
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Associated Sub-projects
      </div>
    </div>

    <div class="flex flex-col gap-4 mt-6 group">
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
            <div class="text-xs text-gray-900">
              {{ segment.name }}
            </div>
            <el-divider v-if="i !== slicedEntities.length - 1" class="!my-0 border-gray-200" />
          </div>
        </template>
      </app-entities>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Member } from '@/modules/member/types/Member';
import AppEntities from '@/shared/modules/entities/Entities.vue';

defineProps<{
  member: Member
}>();
</script>

<script lang="ts">
export default {
  name: 'AppLfMemberAsideSubProjects',
};
</script>

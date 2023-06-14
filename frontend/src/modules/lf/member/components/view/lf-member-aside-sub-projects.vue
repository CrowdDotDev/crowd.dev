<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Associated Sub-projects
      </div>
    </div>

    <div class="flex flex-col gap-4 mt-6 group">
      <div
        v-for="(segment, i) in member.segments"
        :key="segment.id"
        class="flex flex-col gap-4"
      >
        <div class="text-xs text-gray-900">
          {{ segment.name }}
        </div>
        <el-divider v-if="i !== member.segments.length - 1" class="!my-0 border-gray-200" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});
</script>

<script>
export default {
  name: 'AppLfMemberAsideSubProjects',
};
</script>

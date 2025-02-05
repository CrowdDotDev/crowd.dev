<template>
  <el-tooltip
    v-if="isNew"
    placement="top"
    :content="computedContent"
  >
    <div
      v-if="!isSmallAvatar"
      class="absolute text-3xs text-white bg-primary-500
      h-3 flex items-center justify-center top-[-4px] px-1 font-medium rounded z-10 outline outline-2 outline-white"
    >
      New
    </div>
    <div
      v-else
      class="absolute bg-primary-500 rounded-full h-2 w-2 top-0 right-0 z-10 outline outline-2 outline-white"
    />
  </el-tooltip>
</template>

<script setup>
import { computed } from 'vue';
import { dateHelper } from '@/shared/date-helper/date-helper';

const props = defineProps({
  entity: {
    type: Object,
    default: () => {},
  },
  entityName: {
    type: String,
    default: null,
  },
  isSmallAvatar: {
    type: Boolean,
    default: false,
  },
});

const isNew = computed(() => {
  if (!props.entity.joinedAt) {
    return false;
  }

  return dateHelper().diff(dateHelper(props.entity.joinedAt), 'days')
    <= 14;
});

const computedContent = computed(() => {
  if (props.entityName === 'organization') {
    return `Organization since ${dateHelper(
      props.entity.joinedAt,
    ).format('MMM DD, YYYY')}`;
  }

  return `Member since ${dateHelper(
    props.entity.joinedAt,
  ).format('MMM DD, YYYY')}`;
});
</script>

<script>
export default {
  name: 'AppAvatarNewBadge',
};
</script>

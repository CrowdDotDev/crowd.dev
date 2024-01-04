<template>
  <el-divider v-if="emails.length" class="!my-8 border-gray-200" />

  <div v-if="emails.length" class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Email(s)
      </div>
      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="isEditLockedForSampleData"
        @click="emit('openDrawer')"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>

    <div class="flex flex-col gap-2 mt-6">
      <div
        v-for="emailIdentity in emails"
        :key="emailIdentity.handle"
      >
        <a
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-gray-900 hover:text-brand-500 border border-gray-200 rounded-md py-0.5 px-2"
          :href="emailIdentity.link"
        >{{ emailIdentity.handle }}</a>
      </div>

      <div
        v-if="Object.keys(emails).length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayMore = !displayMore"
      >
        Show {{ displayMore ? 'less' : 'more' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, defineProps, ref,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const emit = defineEmits(['openDrawer']);
const props = defineProps<{
  emails: {
    handle: string;
    link: string;
  }[],
}>();

const { currentTenant, currentUser } = mapGetters('auth');

const displayMore = ref(false);

const emails = computed(() => {
  if (!displayMore.value) {
    return Object.fromEntries(
      Object.entries(props.emails).slice(0, 5),
    );
  }

  return props.emails;
});

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);
</script>

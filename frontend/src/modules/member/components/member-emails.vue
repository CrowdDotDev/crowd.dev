<template>
  <div
    v-if="hasEmails"
    class="text-sm cursor-auto flex flex-col gap-2.5"
  >
    <el-tooltip
      v-for="email of slicedEmails"
      :key="email"
      :disabled="!email"
      popper-class="custom-identity-tooltip"
      placement="top"
    >
      <template #content>
        <span>Send email
          <i
            v-if="email"
            class="ri-external-link-line text-gray-400"
          /></span>
      </template>
      <a
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-lg bg-white text-gray-900 hover:text-primary-500 px-2 h-6 border
        border-gray-200 flex items-center justify-center w-fit line-clamp-1"
        :href="`mailto:${email}`"
        @click.stop
      >{{ email }}</a>
    </el-tooltip>
    <el-popover
      v-if="remainingEmails.length"
      placement="top"
      :width="400"
      trigger="hover"
      popper-class="support-popover"
    >
      <template #reference>
        <span
          class="rounded-lg bg-white text-gray-500 px-2 h-6 border border-gray-200 flex items-center justify-center w-fit text-xs"
        >+{{ pluralize('email', remainingEmails.length, true) }}</span>
      </template>
      <div class="flex flex-wrap gap-3 my-1">
        <el-tooltip
          v-for="email of remainingEmails"
          :key="email"
          :disabled="!email"
          popper-class="custom-identity-tooltip flex "
          placement="top"
        >
          <template #content>
            <span>Send email
              <i
                v-if="email"
                class="ri-external-link-line text-gray-400"
              /></span>
          </template>
          <div @click.prevent>
            <a
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg bg-white text-gray-900 hover:text-primary-500 px-2 h-6 border
              border-gray-200 flex items-center justify-center w-fitline-clamp-1"
              :href="`mailto:${email}`"
              @click.stop
            >{{ email }}</a>
          </div>
        </el-tooltip>
      </div>
    </el-popover>
  </div>
  <span v-else class="text-gray-500">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import pluralize from 'pluralize';
import { Member, MemberIdentity } from '../types/Member';

const props = defineProps<{
  member: Member
}>();

const emails = computed(() => (props.member.identities || []).filter((i: MemberIdentity) => i.type === 'email').map((i) => i.value));

const hasEmails = computed(() => emails.value.length);

const slicedEmails = computed(() => emails.value.slice(0, 3));
const remainingEmails = computed(() => emails.value.slice(3));
</script>

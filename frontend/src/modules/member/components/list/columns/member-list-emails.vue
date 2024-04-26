<template>
  <div
    v-if="emails?.length && emails?.some((e) => !!e)"
    class="text-sm cursor-auto flex flex-wrap gap-1"
  >
    <el-tooltip
      v-for="email of emails.slice(0, 3)"
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
      <div @click.prevent>
        <a
          target="_blank"
          rel="noopener noreferrer"
          class="badge--interactive"
          :href="email.link"
          @click.stop="trackEmailClick"
        >{{ email.handle }}</a>
      </div>
    </el-tooltip>
    <el-popover
      v-if="emails?.length > 3"
      placement="top"
      :width="400"
      trigger="hover"
      popper-class="support-popover"
    >
      <template #reference>
        <span
          class="badge--interactive hover:text-gray-900"
        >+{{ emails.length - 3 }}</span>
      </template>
      <div class="flex flex-wrap gap-3 my-1">
        <el-tooltip
          v-for="email of emails.slice(3)"
          :key="email.handle"
          :disabled="!email.handle"
          popper-class="custom-identity-tooltip flex "
          placement="top"
        >
          <template #content>
            <span>Send email
              <i
                v-if="email.link"
                class="ri-external-link-line text-gray-400"
              /></span>
          </template>
          <div @click.prevent>
            <a
              target="_blank"
              rel="noopener noreferrer"
              class="badge--interactive"
              :href="email.link"
              @click.stop="trackEmailClick"
            >{{ email.handle }}</a>
          </div>
        </el-tooltip>
      </div>
    </el-popover>
  </div>
  <span v-else class="text-gray-500">-</span>
</template>

<script lang="ts" setup>
import { Member } from '@/modules/member/types/Member';
import { computed } from 'vue';
import useMemberIdentities from '@/shared/modules/identities/config/useMemberIdentities';
import memberOrder from '@/shared/modules/identities/config/identitiesOrder/member';

const props = defineProps<{
  member: Member
}>();

const emails = computed(() => useMemberIdentities({
  member: props.member,
  order: memberOrder.list,
}).getEmails());

const trackEmailClick = () => {
  window.analytics.track('Click Member Contact', {
    channel: 'Email',
  });
};

</script>

<script lang="ts">
export default {
  name: 'AppMemberListEmails',
};
</script>

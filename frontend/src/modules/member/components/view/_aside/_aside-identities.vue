<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Identities
      </div>
      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="isEditLockedForSampleData"
        @click="identitiesDrawer = true"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>
    <div class="-mx-6 mt-6">
      <a
        v-for="platform of Object.keys(socialIdentities)"
        :key="platform"
        class="px-6 py-2 flex justify-between items-center relative"
        :class="
          member.attributes.url?.[platform] !== undefined
            || platform === 'hackernews'
            ? 'hover:bg-gray-50 transition-colors cursor-pointer'
            : ''
        "
        :href="identityUrl(platform)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="flex gap-3 items-center">
          <app-platform :platform="platform" />
          <div
            v-if="
              platform === 'linkedin'
                && socialIdentities[platform].includes(
                  'private-',
                )
            "
            class="text-gray-900 text-xs"
          >
            *********
            <el-tooltip
              placement="top"
              content="Private profile"
            >
              <i
                class="ri-lock-line text-gray-400 ml-2"
              />
            </el-tooltip>
          </div>
          <span v-else class="text-gray-900 text-xs">
            {{ socialIdentities[platform] }}</span>
        </div>
        <i
          v-if="
            platform === 'hackernews'
              ? true
              : member.attributes.url?.[platform]
          "
          class="ri-external-link-line text-gray-300"
        />
      </a>
    </div>
    <div
      v-if="
        Object.keys(socialIdentities).length
          && emails.length
      "
      class="mt-2"
    >
      <el-divider class="border-t-gray-200" />
      <div class="mt-4">
        <a
          v-for="email of emails"
          :key="email"
          class="py-2 px-6 -mx-6 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`mailto:${email}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="email" />
            <span class="text-gray-900 text-xs">
              {{ email }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          />
        </a>
      </div>
    </div>
    <app-member-manage-identities-drawer
      v-model="identitiesDrawer"
      :member="member"
    />
  </div>
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppMemberManageIdentitiesDrawer from '../../member-manage-identities-drawer.vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const identitiesDrawer = ref(false);

const emails = computed(() => props.member.emails);

const socialIdentities = computed(() => {
  const identities = { ...props.member.username };
  delete identities.emails;

  return identities;
});

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);

const identityUrl = (platform) => {
  if (platform === 'hackernews') {
    return `https://news.ycombinator.com/user?id=${socialIdentities.value.hackernews}`;
  } if (
    platform === 'linkedin'
    && socialIdentities.value[platform].includes('private-')
  ) {
    return null;
  }
  return props.member.attributes.url?.[platform];
};
</script>

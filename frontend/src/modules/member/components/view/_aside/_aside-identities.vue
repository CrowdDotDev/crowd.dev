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
      <div
        v-for="platform of Object.keys(socialIdentities)"
        :key="platform"
        class="px-2"
      >
        <app-platform-list
          :username-handles="socialIdentities[platform]"
          :platform="platform"
          :url="member.attributes?.url?.[platform]"
          :attributes="member.attributes"
        />
      </div>
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
          v-for="(email, index) of emails"
          :key="email"
          class="py-2 px-6 -mx-6 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`mailto:${email}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <el-tooltip
            placement="top"
            :content="email"
            :disabled="!showTooltip[index]"
          >

            <div
              class="flex gap-3 items-center overflow-hidden mr-2"
              @mouseover="handleOnMouseOver(index)"
              @mouseleave="handleOnMouseLeave(index)"
            >
              <app-platform platform="email" />
              <span ref="emailRef" class="text-gray-900 text-xs truncate">
                {{ email }}</span>
            </div>
          </el-tooltip>
          <i
            class="ri-external-link-line text-gray-300"
          />
        </a>
      </div>
    </div>
    <app-member-manage-identities-drawer
      v-if="identitiesDrawer"
      v-model="identitiesDrawer"
      :member="member"
    />
  </div>
</template>

<script setup>
import {
  computed, defineProps, ref,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppPlatformList from '@/shared/platform/platform-list.vue';
import AppMemberManageIdentitiesDrawer from '../../member-manage-identities-drawer.vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const identitiesDrawer = ref(false);

const emailRef = ref([]);
const showTooltip = ref([]);

const handleOnMouseOver = (index) => {
  if (!emailRef.value[index]) {
    showTooltip.value[index] = false;
  }

  showTooltip.value[index] = emailRef.value[index].scrollWidth > emailRef.value[index].clientWidth;
};

const handleOnMouseLeave = (index) => {
  showTooltip.value[index] = false;
};

const emails = computed(() => (props.member.emails
  // Filters out any falsy values (like `null`, `undefined)
  ? props.member.emails.filter(Boolean)
  : []));

const socialIdentities = computed(() => {
  const identities = { ...props.member.username };
  delete identities.emails;

  return identities;
});

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);
</script>

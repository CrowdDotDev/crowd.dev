<template>
  <div class="px-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <div class="font-medium text-black">
          Identities
        </div>
        <el-tooltip placement="top">
          <template #content>
            Identities can be profiles on social platforms, emails, phone numbers,<br>
            or unique identifiers from internal sources (e.g. web app log-in email).
          </template>
          <span>
            <i class="ri-information-line text-xs" />
          </span>
        </el-tooltip>
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
      <app-identities-vertical-list
        :platform-handles-links="identities.getIdentities()"
        :x-padding="6"
        :display-show-more="true"
      />
    </div>
  </div>

  <el-divider class="!my-8 border-gray-200" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Email(s)
      </div>
      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="isEditLockedForSampleData"
        @click="identitiesDrawer = true"
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
        v-if="Object.keys(identities.getEmails()).length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayMore = !displayMore"
      >
        Show {{ displayMore ? 'less' : 'more' }}
      </div>
    </div>
  </div>

  <app-member-manage-identities-drawer
    v-if="identitiesDrawer"
    v-model="identitiesDrawer"
    :member="member"
  />
</template>

<script setup>
import {
  computed, defineProps, ref,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppIdentitiesVerticalList from '@/shared/modules/identities/components/identities-vertical-list.vue';
import useMemberIdentities from '@/shared/modules/identities/config/useMemberIdentities';
import platformOrders from '@/shared/platform/config/order/member';
import AppMemberManageIdentitiesDrawer from '../../member-manage-identities-drawer.vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const identitiesDrawer = ref(false);
const displayMore = ref(false);

const identities = computed(() => useMemberIdentities({
  member: props.member,
  order: platformOrders.profileOrder,
}));

const emails = computed(() => {
  if (!displayMore.value) {
    return Object.fromEntries(
      Object.entries(identities.value.getEmails()).slice(0, 5),
    );
  }

  return identities.value.getEmails();
});

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);
</script>

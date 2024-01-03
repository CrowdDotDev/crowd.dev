<template>
  <div>
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
      <app-platform-vertical-list
        :platform-handles-links="identities.getOrderedPlatformHandlesAndLinks()"
        :x-padding="6"
        :show-identities-divider="true"
      />
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
import AppPlatformVerticalList from '@/shared/platform/platform-vertical-list.vue';
import useMemberIdentities from '@/utils/identities/useMemberIdentities';
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

const identities = computed(() => useMemberIdentities({
  member: props.member,
  order: platformOrders.profileOrder,
}));

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);
</script>

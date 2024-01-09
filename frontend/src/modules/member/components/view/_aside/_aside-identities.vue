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
        @click="emit('edit')"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>
    <div class="-mx-6 mt-6">
      <app-identities-vertical-list-members
        :member="member"
        :order="memberOrder.profile"
        :x-padding="6"
        :display-show-more="true"
      >
        <template #default="{ identities }">
          <app-aside-identities-extra
            :emails="identities.getEmails()"
            @open-drawer="emit('edit')"
          />
        </template>
      </app-identities-vertical-list-members>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, defineProps,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppIdentitiesVerticalListMembers from '@/shared/modules/identities/components/identities-vertical-list-members.vue';
import memberOrder from '@/shared/modules/identities/config/identitiesOrder/member';
import { Member } from '@/modules/member/types/Member';
import AppAsideIdentitiesExtra from './_aside-identities-extra.vue';

defineProps<{
  member: Member
}>();

const emit = defineEmits(['edit']);

const { currentTenant, currentUser } = mapGetters('auth');

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);
</script>

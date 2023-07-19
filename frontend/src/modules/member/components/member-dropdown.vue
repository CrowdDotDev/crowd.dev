<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <router-link
          :to="{
            name: 'memberEdit',
            params: {
              id: member.id,
            },
            query: { projectGroup: selectedProjectGroup?.id },
          }"
          :class="{
            'pointer-events-none cursor-not-allowed':
              isEditLockedForSampleData,
          }"
        >
          <el-dropdown-item
            class="h-10 mb-1"
            :disabled="isEditLockedForSampleData"
          >
            <i
              class="ri-pencil-line text-base mr-2"
            /><span class="text-xs">Edit contributor</span>
          </el-dropdown-item>
        </router-link>
        <el-tooltip
          placement="top"
          content="Contributor enrichment requires an associated GitHub profile or Email"
          :disabled="!isEnrichmentDisabled"
          popper-class="max-w-[260px]"
        >
          <span>
            <el-dropdown-item
              :command="{
                action: 'memberEnrich',
                member,
              }"
              class="h-10 mb-1"
              :disabled="
                isEnrichmentDisabled
                  || isEditLockedForSampleData
              "
            >
              <app-svg
                name="enrichment"
                class="max-w-[16px] h-4"
                color="#9CA3AF"
              />
              <span
                class="ml-2 text-xs"
                :class="{
                  'text-gray-400': isEnrichmentDisabled,
                }"
              >{{
                member.lastEnriched
                  ? 'Re-enrich contributor'
                  : 'Enrich contributor'
              }}</span>
            </el-dropdown-item>
          </span>
        </el-tooltip>
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'memberMerge',
            member: member,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-group-line text-base mr-2" /><span
            class="text-xs"
          >Merge contributor</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="!member.attributes.isTeamMember?.default"
          class="h-10"
          :command="{
            action: 'memberMarkAsTeamMember',
            member: member,
            value: true,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i
            class="ri-bookmark-line text-base mr-2"
          /><span class="text-xs">Mark as team contributor</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="member.attributes.isTeamMember?.default"
          class="h-10"
          :command="{
            action: 'memberMarkAsTeamMember',
            member: member,
            value: false,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i
            class="ri-bookmark-2-line text-base mr-2"
          /><span class="text-xs">Unmark as team contributor</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="!member.attributes.isBot?.default"
          class="h-10"
          :command="{
            action: 'memberMarkAsBot',
            member: member,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-robot-line text-base mr-2" /><span
            class="text-xs"
          >Mark as bot</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="member.attributes.isBot?.default"
          class="h-10"
          :command="{
            action: 'memberUnmarkAsBot',
            member: member,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-robot-line text-base mr-2" /><span
            class="text-xs"
          >Unmark as bot</span>
        </el-dropdown-item>
        <el-divider class="border-gray-200" />
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'memberDelete',
            member: member,
          }"
          :disabled="isDeleteLockedForSampleData"
        >
          <i
            class="ri-delete-bin-line text-base mr-2"
            :class="{
              'text-red-500': !isDeleteLockedForSampleData,
            }"
          /><span
            class="text-xs"
            :class="{
              'text-red-500': !isDeleteLockedForSampleData,
            }"
          >Delete contributor</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapActions as piniaMapActions, storeToRefs } from 'pinia';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { MemberPermissions } from '@/modules/member/member-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppSvg from '@/shared/svg/svg.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

export default {
  name: 'AppMemberDropdown',
  components: {
    AppSvg,
  },
  props: {
    member: {
      type: Object,
      default: () => {},
    },
  },
  emits: [
    'merge',
  ],
  data() {
    return {
      isMergeLoading: false,
      pair: [],
    };
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
    }),
    isReadOnly() {
      return (
        new MemberPermissions(
          this.currentTenant,
          this.currentUser,
        ).edit === false
      );
    },
    isEnrichmentDisabled() {
      return (
        !this.member.username?.github?.length
        && !this.member.emails?.length
      );
    },
    isEditLockedForSampleData() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser,
      ).editLockedForSampleData;
    },
    isDeleteLockedForSampleData() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser,
      ).destroyLockedForSampleData;
    },
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();

      return storeToRefs(lsSegmentsStore).selectedProjectGroup.value;
    },
  },
  methods: {
    ...mapActions({
      doFind: 'member/doFind',
      doDestroy: 'member/doDestroy',
      doEnrich: 'member/doEnrich',
    }),
    ...piniaMapActions(useMemberStore, ['fetchMembers']),
    async doDestroyWithConfirm(id) {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete contributor',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line',
        });

        await this.doDestroy(id);
        await this.fetchMembers({ reload: true });
      } catch (error) {
        // no
      }
      return null;
    },
    async handleCommand(command) {
      if (command.action === 'memberDelete') {
        await this.doDestroyWithConfirm(command.member.id);
      } else if (
        command.action === 'memberMarkAsTeamMember'
      ) {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isTeamMember: {
              default: command.value,
            },
          },
        }, command.member.segmentIds);
        await this.fetchMembers({ reload: true });
        Message.success('Contributor updated successfully');
        if (this.$route.name === 'member') {
          await this.fetchMembers({ reload: true });
        } else {
          this.doFind({ id: command.member.id });
        }
      } else if (command.action === 'memberMarkAsBot' || command.action === 'memberUnmarkAsBot') {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isBot: {
              default: command.action === 'memberMarkAsBot',
            },
          },
        }, command.member.segmentIds);
        await this.fetchMembers({ reload: true });
        Message.success('Contributor updated successfully');
        if (this.$route.name === 'member') {
          await this.fetchMembers({ reload: true });
        } else {
          this.doFind({ id: command.member.id });
        }
      } else if (command.action === 'memberMerge') {
        this.$emit('merge');
      } else if (command.action === 'memberEnrich') {
        await this.doEnrich(command.member.id, command.member.segmentIds);
        await this.fetchMembers({ reload: true });
      }
    },
  },
};
</script>

<style lang="scss">
.el-dropdown__popper .el-dropdown__list {
  @apply p-2;
}

// Override divider margin
.el-divider--horizontal {
  @apply my-2;
}
</style>

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
            /><span class="text-xs">Edit member</span>
          </el-dropdown-item>
        </router-link>
        <el-tooltip
          placement="top"
          content="Member enrichment requires an associated GitHub profile or Email"
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
                  ? 'Re-enrich member'
                  : 'Enrich member'
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
          >Merge member</span>
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
          /><span class="text-xs">Mark as team member</span>
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
          /><span class="text-xs">Unmark as team member</span>
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
          >Delete member</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
    <app-member-merge-dialog v-model="isMergeDialogOpen" />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { MemberPermissions } from '@/modules/member/member-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppSvg from '@/shared/svg/svg.vue';
import AppMemberMergeDialog from '@/modules/member/components/member-merge-dialog.vue';

export default {
  name: 'AppMemberDropdown',
  components: {
    AppMemberMergeDialog,
    AppSvg,
  },
  props: {
    member: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      isMergeDialogOpen: null,
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
  },
  methods: {
    ...mapActions({
      doFetch: 'member/doFetch',
      doFind: 'member/doFind',
      doDestroy: 'member/doDestroy',
      doEnrich: 'member/doEnrich',
    }),
    async doDestroyWithConfirm(id) {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete member',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line',
        });

        return this.doDestroy(id);
      } catch (error) {
        // no
      }
      return null;
    },
    async handleCommand(command) {
      if (command.action === 'memberDelete') {
        return this.doDestroyWithConfirm(command.member.id);
      } if (
        command.action === 'memberMarkAsTeamMember'
      ) {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isTeamMember: {
              default: command.value,
            },
          },
        });
        await this.doFetch({
          filter: {},
          keepPagination: false,
        });
        Message.success('Member updated successfully');
        if (this.$route.name === 'member') {
          this.doFetch({
            filter: {},
            keepPagination: true,
          });
        } else {
          this.doFind(command.member.id);
        }
      } else if (command.action === 'memberMarkAsBot' || command.action === 'memberUnmarkAsBot') {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isBot: {
              default: command.action === 'memberMarkAsBot',
            },
          },
        });
        await this.doFetch({
          filter: {},
          keepPagination: false,
        });
        Message.success('Member updated successfully');
        if (this.$route.name === 'member') {
          this.doFetch({
            filter: {},
            keepPagination: true,
          });
        } else {
          this.doFind(command.member.id);
        }
      } else if (command.action === 'memberMerge') {
        this.isMergeDialogOpen = this.member;
      } else if (command.action === 'memberEnrich') {
        const segments = command.member.segments?.map((s) => s.id) || [];

        this.doEnrich(command.member.id, segments);
      } else {
        return this.$router.push({
          name: command.action,
          params: { id: command.member.id },
        });
      }
      return null;
    },
    async handleMergeClick() {
      try {
        this.isMergeLoading = true;

        await this.$store.dispatch('member/doMerge', {
          memberToKeep: this.primaryMember,
          memberToMerge: this.memberToMerge,
        });

        this.isMergeDialogOpen = false;
        this.memberToMerge = null;

        // If in member view, fetch member newly merged member
        if (this.$route.name === 'memberView') {
          this.doFind(this.primaryMember.id);
        }
      } catch (error) {
        console.error(error);
        Message.error('There was an error merging members');
      }
      this.isMergeLoading = false;
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

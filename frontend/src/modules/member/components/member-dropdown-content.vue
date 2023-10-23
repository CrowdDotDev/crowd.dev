<template>
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
    <div
      class="h-10 el-dropdown-menu__item mb-1"
      :disabled="isEditLockedForSampleData"
    >
      <i
        class="ri-pencil-line text-base mr-2"
      /><span class="text-xs">Edit contact</span>
    </div>
  </router-link>
  <el-tooltip
    placement="top"
    :content="!isEnrichmentFeatureEnabled()
      ? 'Upgrade your plan to increase your quota of available contact enrichments'
      : 'Contact enrichment requires an associated GitHub profile or Email'"
    :disabled="isEnrichmentDisabledForMember || isEnrichmentFeatureEnabled()"
    popper-class="max-w-[260px]"
  >
    <span>
      <div
        class="h-10 el-dropdown-menu__item mb-1"
        :disabled="isEnrichmentActionDisabled"
        @click="handleCommand({
          action: 'memberEnrich',
          member,
        })"
      >
        <app-svg
          name="enrichment"
          class="max-w-[16px] h-4"
          color="#9CA3AF"
        />
        <span
          class="ml-2 text-xs"
          :class="{
            'text-gray-400': isEnrichmentDisabledForMember,
          }"
        >{{
          member.lastEnriched
            ? 'Re-enrich contact'
            : 'Enrich contact'
        }}</span>
      </div>
    </span>
  </el-tooltip>
  <div
    class="h-10 el-dropdown-menu__item"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'memberMerge',
      member,
    })"
  >
    <i class="ri-group-line text-base mr-2" /><span
      class="text-xs"
    >Merge contact</span>
  </div>

  <!-- Hubspot -->
  <el-tooltip
    placement="top"
    content="Upgrade your plan to create a 2-way sync with HubSpot"
    :disabled="isHubspotFeatureEnabled"
    popper-class="max-w-[260px]"
  >
    <span>
      <div
        v-if="!isSyncingWithHubspot"
        class="h-10 el-dropdown-menu__item"
        :disabled="isHubspotActionDisabled"
        @click="handleCommand({
          action: 'syncHubspot',
          member,
        })"
      >
        <app-svg name="hubspot" class="h-4 w-4 text-current" />
        <span
          class="text-xs pl-2"
        >Sync with HubSpot</span>
      </div>
      <div
        v-else
        class="h-10 el-dropdown-menu__item"
        :disabled="isHubspotActionDisabled"
        @click="handleCommand({
          action: 'stopSyncHubspot',
          member,
        })"
      >
        <app-svg name="hubspot" class="h-4 w-4 text-current" />
        <span
          class="text-xs pl-2"
        >Stop sync with HubSpot</span>
      </div>
    </span>
  </el-tooltip>

  <div
    v-if="!member.attributes.isTeamMember?.default"
    class="h-10 el-dropdown-menu__item"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'memberMarkAsTeamMember',
      member,
      value: true,
    })"
  >
    <i
      class="ri-bookmark-line text-base mr-2"
    /><span class="text-xs">Mark as team contact</span>
  </div>
  <div
    v-if="member.attributes.isTeamMember?.default"
    class="h-10 el-dropdown-menu__item"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'memberMarkAsTeamMember',
      member,
      value: false,
    })"
  >
    <i
      class="ri-bookmark-2-line text-base mr-2"
    /><span class="text-xs">Unmark as team contact</span>
  </div>
  <div
    v-if="!member.attributes.isBot?.default"
    class="h-10 el-dropdown-menu__item"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'memberMarkAsBot',
      member,
    })"
  >
    <i class="ri-robot-line text-base mr-2" /><span
      class="text-xs"
    >Mark as bot</span>
  </div>
  <div
    v-if="member.attributes.isBot?.default"
    class="h-10 el-dropdown-menu__item"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'memberUnmarkAsBot',
      member,
    })"
  >
    <i class="ri-robot-line text-base mr-2" /><span
      class="text-xs"
    >Unmark as bot</span>
  </div>
  <el-divider class="border-gray-200" />
  <div
    class="h-10 el-dropdown-menu__item"
    :disabled="isDeleteLockedForSampleData"
    @click="handleCommand({
      action: 'memberDelete',
      member,
    })"
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
    >Delete contact</span>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapActions as piniaMapActions } from 'pinia';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { MemberPermissions } from '@/modules/member/member-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppSvg from '@/shared/svg/svg.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import { isEnrichmentFeatureEnabled } from '@/modules/member/member-enrichment';
import { FeatureFlag, FEATURE_FLAGS } from '@/utils/featureFlag';

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
    isEnrichmentDisabledForMember() {
      return (
        !this.member.username?.github?.length
            && !this.member.emails?.length
      );
    },
    isEnrichmentActionDisabled() {
      return this.isEnrichmentDisabledForMember || this.isEditLockedForSampleData || !this.isEnrichmentFeatureEnabled();
    },
    isSyncingWithHubspot() {
      return this.member.attributes?.syncRemote?.hubspot || false;
    },
    isHubspotConnected() {
      const hubspot = CrowdIntegrations.getMappedConfig('hubspot', this.$store);
      const enabledFor = hubspot.settings?.enabledFor || [];
      return hubspot.status === 'done' && enabledFor.includes(HubspotEntity.MEMBERS);
    },
    isHubspotDisabledForMember() {
      return props.member.emails.length === 0;
    },
    isHubspotFeatureEnabled() {
      return FeatureFlag.isFlagEnabled(
        FEATURE_FLAGS.hubspot,
      );
    },
    isHubspotActionDisabled() {
      return !this.isHubspotConnected || this.isHubspotDisabledForMember || !this.isHubspotFeatureEnabled;
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
          title: 'Delete contact',
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
        command.action === 'syncHubspot' || command.action === 'stopSyncHubspot'
      ) {
        // Hubspot
        const sync = command.action === 'syncHubspot';
        (sync ? HubspotApiService.syncMember(command.member.id) : HubspotApiService.stopSyncMember(command.member.id))
          .then(() => {
            if (this.$route.name === 'member') {
              this.fetchMembers({ reload: true });
            } else {
              this.doFind(command.member.id);
            }
            if (sync) {
              Message.success('Contact is now syncing with HubSpot');
            } else {
              Message.success('Contact syncing stopped');
            }
          })
          .catch(() => {
            Message.error('There was an error');
          });
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
        });
        await this.fetchMembers({ reload: true });

        Message.success('Contact updated successfully');

        if (this.$route.name === 'member') {
          await this.fetchMembers({ reload: true });
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
        await this.fetchMembers({ reload: true });
        Message.success('Contact updated successfully');
        if (this.$route.name === 'member') {
          await this.fetchMembers({ reload: true });
        } else {
          this.doFind(command.member.id);
        }
      } else if (command.action === 'memberMerge') {
        this.$emit('merge');
      } else if (command.action === 'memberEnrich') {
        await this.doEnrich(command.member.id);
        await this.fetchMembers({ reload: true });
      }

      return null;
    },
    isEnrichmentFeatureEnabled,
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

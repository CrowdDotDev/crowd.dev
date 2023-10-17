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
            'pointer-events-none cursor-not-allowed': isEditLockedForSampleData,
          }"
        >
          <el-dropdown-item
            class="h-10 mb-1"
            :disabled="isEditLockedForSampleData"
          >
            <i class="ri-pencil-line text-base mr-2" /><span class="text-xs"
              >Edit contact</span
            >
          </el-dropdown-item>
        </router-link>
        <el-tooltip
          placement="top"
          :content="
            !isEnrichmentFeatureEnabled()
              ? 'Upgrade your plan to increase your quota of available contact enrichments'
              : 'Contact enrichment requires an associated GitHub profile or Email'
          "
          :disabled="
            isEnrichmentDisabledForMember || isEnrichmentFeatureEnabled()
          "
          popper-class="max-w-[260px]"
        >
          <span>
            <el-dropdown-item
              :command="{
                action: 'memberEnrich',
                member,
              }"
              class="h-10 mb-1"
              :disabled="isEnrichmentActionDisabled"
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
                  member.lastEnriched ? "Re-enrich contact" : "Enrich contact"
                }}</span
              >
            </el-dropdown-item>
          </span>
        </el-tooltip>
        <el-dropdown-item
          v-if="isFindGitHubFeatureEnabled"
          :command="{
            action: 'memberFindGitHub',
            member,
          }"
          class="h-10 mb-1"
          :disabled="!isFindingGitHubDisabled"
        >
          <span class="max-w-[16px]" color="#9CA3AF"
            ><i class="ri-github-fill"
          /></span>
          <span class="ml-2 text-xs"> Find GitHub </span>
        </el-dropdown-item>
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'memberMerge',
            member: member,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-group-line text-base mr-2" /><span class="text-xs"
            >Merge contact</span
          >
        </el-dropdown-item>

        <!-- Hubspot -->
        <el-tooltip
          placement="top"
          content="Upgrade your plan to create a 2-way sync with HubSpot"
          :disabled="isHubspotFeatureEnabled"
          popper-class="max-w-[260px]"
        >
          <span>
            <el-dropdown-item
              v-if="!isSyncingWithHubspot"
              class="h-10"
              :command="{
                action: 'syncHubspot',
                member: member,
              }"
              :disabled="isHubspotActionDisabled"
            >
              <app-svg name="hubspot" class="h-4 w-4 text-current" />
              <span class="text-xs pl-2">Sync with HubSpot</span>
            </el-dropdown-item>
            <el-dropdown-item
              v-else
              class="h-10"
              :command="{
                action: 'stopSyncHubspot',
                member: member,
              }"
              :disabled="isHubspotActionDisabled"
            >
              <app-svg name="hubspot" class="h-4 w-4 text-current" />
              <span class="text-xs pl-2">Stop sync with HubSpot</span>
            </el-dropdown-item>
          </span>
        </el-tooltip>

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
          <i class="ri-bookmark-line text-base mr-2" /><span class="text-xs"
            >Mark as team contact</span
          >
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
          <i class="ri-bookmark-2-line text-base mr-2" /><span class="text-xs"
            >Unmark as team contact</span
          >
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
          <i class="ri-robot-line text-base mr-2" /><span class="text-xs"
            >Mark as bot</span
          >
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
          <i class="ri-robot-line text-base mr-2" /><span class="text-xs"
            >Unmark as bot</span
          >
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
            >Delete contact</span
          >
        </el-dropdown-item>
      </template>
    </el-dropdown>
    <app-member-find-github-drawer
      v-model="openFindGitHubDrawer"
      :member="member"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { mapActions as piniaMapActions } from "pinia";
import { MemberService } from "@/modules/member/member-service";
import Message from "@/shared/message/message";
import { MemberPermissions } from "@/modules/member/member-permissions";
import ConfirmDialog from "@/shared/dialog/confirm-dialog";
import AppSvg from "@/shared/svg/svg.vue";
import { useMemberStore } from "@/modules/member/store/pinia";
import { CrowdIntegrations } from "@/integrations/integrations-config";
import { HubspotEntity } from "@/integrations/hubspot/types/HubspotEntity";
import { HubspotApiService } from "@/integrations/hubspot/hubspot.api.service";
import AppMemberFindGithubDrawer from "./member-find-github-drawer.vue";
import { FeatureFlag, FEATURE_FLAGS } from "@/featureFlag";
import { isEnrichmentFeatureEnabled } from "@/modules/member/member-enrichment";

export default {
  name: "AppMemberDropdown",
  components: {
    AppSvg,
    AppMemberFindGithubDrawer,
  },
  props: {
    member: {
      type: Object,
      default: () => {},
    },
  },
  emits: ["merge"],
  data() {
    return {
      isMergeLoading: false,
      pair: [],
      openFindGitHubDrawer: false,
      isFindGitHubFeatureEnabled: FeatureFlag.isFlagEnabled(
        FEATURE_FLAGS.findGitHub
      ),
    };
  },

  computed: {
    ...mapGetters({
      currentTenant: "auth/currentTenant",
      currentUser: "auth/currentUser",
    }),
    isReadOnly() {
      return (
        new MemberPermissions(this.currentTenant, this.currentUser).edit ===
        false
      );
    },
    isEnrichmentDisabled() {
      return (
        !this.member.username?.github?.length && !this.member.emails?.length
      );
    },
    isFindingGitHubDisabled() {
      console.log(
        this.member.username?.github === undefined ||
          !this.member.username?.github?.length
      );
      return (
        this.member.username?.github === undefined ||
        !this.member.username?.github?.length
      );
    },
    isEditLockedForSampleData() {
      return new MemberPermissions(this.currentTenant, this.currentUser)
        .editLockedForSampleData;
    },
    isDeleteLockedForSampleData() {
      return new MemberPermissions(this.currentTenant, this.currentUser)
        .destroyLockedForSampleData;
    },
    isEnrichmentDisabledForMember() {
      return (
        !this.member.username?.github?.length && !this.member.emails?.length
      );
    },
    isEnrichmentActionDisabled() {
      return (
        this.isEnrichmentDisabledForMember ||
        this.isEditLockedForSampleData ||
        !this.isEnrichmentFeatureEnabled()
      );
    },
    isSyncingWithHubspot() {
      return this.member.attributes?.syncRemote?.hubspot || false;
    },
    isHubspotConnected() {
      const hubspot = CrowdIntegrations.getMappedConfig("hubspot", this.$store);
      const enabledFor = hubspot.settings?.enabledFor || [];
      return (
        hubspot.status === "done" && enabledFor.includes(HubspotEntity.MEMBERS)
      );
    },
    isHubspotDisabledForMember() {
      return props.member.emails.length === 0;
    },
    isHubspotFeatureEnabled() {
      return FeatureFlag.isFlagEnabled(FEATURE_FLAGS.hubspot);
    },
    isHubspotActionDisabled() {
      return (
        !this.isHubspotConnected ||
        this.isHubspotDisabledForMember ||
        !this.isHubspotFeatureEnabled
      );
    },
  },
  methods: {
    ...mapActions({
      doFind: "member/doFind",
      doDestroy: "member/doDestroy",
      doEnrich: "member/doEnrich",
    }),
    ...piniaMapActions(useMemberStore, ["fetchMembers"]),
    async doDestroyWithConfirm(id) {
      try {
        await ConfirmDialog({
          type: "danger",
          title: "Delete contact",
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: "Confirm",
          cancelButtonText: "Cancel",
          icon: "ri-delete-bin-line",
        });

        await this.doDestroy(id);
        await this.fetchMembers({ reload: true });
      } catch (error) {
        // no
      }
      return null;
    },
    async handleCommand(command) {
      if (command.action === "memberDelete") {
        await this.doDestroyWithConfirm(command.member.id);
      } else if (
        command.action === "syncHubspot" ||
        command.action === "stopSyncHubspot"
      ) {
        // Hubspot
        const sync = command.action === "syncHubspot";
        (sync
          ? HubspotApiService.syncMember(command.member.id)
          : HubspotApiService.stopSyncMember(command.member.id)
        )
          .then(() => {
            if (this.$route.name === "member") {
              this.fetchMembers({ reload: true });
            } else {
              this.doFind(command.member.id);
            }
            if (sync) {
              Message.success("Contact is now syncing with HubSpot");
            } else {
              Message.success("Contact syncing stopped");
            }
          })
          .catch(() => {
            Message.error("There was an error");
          });
      } else if (command.action === "memberMarkAsTeamMember") {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isTeamMember: {
              default: command.value,
            },
          },
        });
        await this.fetchMembers({ reload: true });

        Message.success("Contact updated successfully");

        if (this.$route.name === "member") {
          await this.fetchMembers({ reload: true });
        } else {
          this.doFind(command.member.id);
        }
      } else if (
        command.action === "memberMarkAsBot" ||
        command.action === "memberUnmarkAsBot"
      ) {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isBot: {
              default: command.action === "memberMarkAsBot",
            },
          },
        });
        await this.fetchMembers({ reload: true });
        Message.success("Contact updated successfully");
        if (this.$route.name === "member") {
          await this.fetchMembers({ reload: true });
        } else {
          this.doFind(command.member.id);
        }
      } else if (command.action === "memberMerge") {
        this.$emit("merge");
      } else if (command.action === "memberEnrich") {
        await this.doEnrich(command.member.id);
        await this.fetchMembers({ reload: true });
      } else if (command.action === "memberFindGitHub") {
        console.log("here");
        this.openFindGitHubDrawer = true;
        console.log(this.openFindGitHubDrawer);
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

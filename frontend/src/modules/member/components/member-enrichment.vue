<template>
  <div class="panel !bg-brand-25">
    <div class="flex justify-between items-center">
      <div class="flex gap-2">
        <app-svg
          name="enrichment"
          class="w-5 h-5 enrichment-icon"
          color="#111827"
        />
        <span class="text-gray-900 font-semibold text-sm">Contributor enrichment</span>
      </div>
      <el-tooltip placement="top" content="Learn more">
        <a
          aria-label="Learn more"
          class="btn btn-link btn-link--primary !h-8 !w-8 !text-gray-400 hover:!text-gray-600 hover:no-underline"
          href="https://docs.crowd.dev/docs/member-enrichment"
          target="_blank"
          rel="noopener noreferrer"
        ><i class="ri-question-line text-lg" /></a>
      </el-tooltip>
    </div>

    <div class="mt-4 mb-5 text-2xs text-gray-600">
      Get more insights about this contributor by enriching it with attributes such
      as emails, seniority, OSS contributions and much more.
    </div>

    <el-tooltip
      placement="top"
      content="Contributor enrichment requires an associated GitHub profile or Email"
      :disabled="!isEnrichmentDisabled"
      popper-class="max-w-[260px]"
    >
      <span v-if="isFindGitHubFeatureEnabled">
        <el-button
          v-if="!isEnrichmentDisabled"
          class="btn btn--primary btn--full !h-8"
          :disabled="isEditLockedForSampleData"
          @click="onEnrichmentClick"
        >Enrich member</el-button>
        <el-button
          v-else
          class="btn btn--primary btn--full !h-8"
          :disabled="isEditLockedForSampleData"
          @click="onFindGithubClick"
        >
          <i class="ri-github-fill pr-2" /> Find GitHub
        </el-button>
      </span>
      <span v-else>
        <el-button
          class="btn btn--primary btn--full !h-8"
          :disabled="
            isEnrichmentDisabled
              || isEditLockedForSampleData
          "
          @click="onEnrichmentClick"
        >Enrich contributor</el-button>
      </span>
    </el-tooltip>

    <div class="w-full text-center italic text-gray-500 text-3xs mt-2">
      * requires a GitHub profile or Email
    </div>
    <app-member-find-github-drawer
      v-if="openFindGitHubDrawer"
      v-model="openFindGitHubDrawer"
      :member="member"
    />
  </div>
</template>

<script setup>
import {
  computed, defineProps, onMounted, ref,
} from 'vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import AppSvg from '@/shared/svg/svg.vue';
import { MemberPermissions } from '../member-permissions';
import AppMemberFindGithubDrawer from './member-find-github-drawer.vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const { doEnrich } = mapActions('member');
const { currentTenant, currentUser } = mapGetters('auth');

const isFindGitHubFeatureEnabled = FeatureFlag.isFlagEnabled(
  FEATURE_FLAGS.findGitHub,
);

const isEnrichmentDisabled = computed(
  () => !props.member.username?.github?.length && !props.member.emails?.length,
);

const openFindGitHubDrawer = ref(false);

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

const onEnrichmentClick = async () => {
  const segments = props.member.segments.map((s) => s.id);

  await doEnrich(props.member.id, segments);
};

const onFindGithubClick = () => {
  openFindGitHubDrawer.value = props.member;
};
</script>

<style lang="scss">
.enrichment-icon svg use {
  transform: scale(1.25);
}
</style>

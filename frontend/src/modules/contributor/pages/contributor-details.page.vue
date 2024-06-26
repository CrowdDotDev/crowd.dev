<template>
  <div v-if="loading || !contributor" class="flex justify-center py-20">
    <lf-spinner />
  </div>
  <div v-else class="-mt-5 -mb-5">
    <div class="contributor-details  grid grid-cols-2 grid-rows-2 px-3">
      <section class="w-full border-b border-gray-100 py-4 flex justify-between items-center col-span-2 h-min">
        <div class="flex items-center">
          <lf-back :to="{ path: '/contributors' }" class="mr-2">
            <lf-button type="secondary-ghost" :icon-only="true">
              <lf-icon name="arrow-left-s-line" />
            </lf-button>
          </lf-back>
          <lf-contributor-details-header :contributor="contributor" />
        </div>
        <div class="flex items-center">
          <lf-contributor-last-enrichment :contributor="contributor" class="mr-4" />
          <lf-contributor-details-actions :contributor="contributor" @reload="fetchContributor()" />
        </div>
      </section>
      <section class="w-80 border-r relative border-gray-100 overflow-y-auto overflow-x-visible h-full ">
        <div class="sticky top-0 left-0 w-full h-6 bg-gradient-to-b from-white to-transparent" />
        <div class="pr-8 pb-10">
          <lf-contributor-details-work-history
            :contributor="contributor"
            class="mb-8"
            @reload="fetchContributor()"
          />
          <lf-contributor-details-identities
            :contributor="contributor"
            class="mb-8"
            @reload="fetchContributor()"
          />
          <lf-contributor-details-emails
            :contributor="contributor"
            @reload="fetchContributor()"
          />
        </div>
      </section>
      <section class="overflow-auto h-full pb-10" @scroll="controlScroll">
        <div class="sticky top-0 z-10">
          <div class="bg-white pt-5 pl-10 pb-3">
            <lf-tabs v-model="tabs">
              <lf-tab v-model="tabs" name="overview">
                Overview
              </lf-tab>
              <lf-tab v-model="tabs" name="activities">
                Activities
              </lf-tab>
              <lf-tab v-model="tabs" name="notes">
                Notes
              </lf-tab>
            </lf-tabs>
          </div>
          <div class="w-full h-5 bg-gradient-to-b from-white to-transparent pl-10" />
        </div>
        <div class="pl-10">
          <lf-contributor-details-overview
            v-if="tabs === 'overview'"
            :contributor="contributor"
          />
          <lf-contributor-details-activities
            v-else-if="tabs === 'activities'"
            :contributor="contributor"
          />
          <lf-contributor-details-notes
            v-else-if="tabs === 'notes'"
            ref="notes"
            :contributor="contributor"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import { onMounted, ref } from 'vue';
import LfContributorDetailsOverview from '@/modules/contributor/components/details/contributor-details-overview.vue';
import LfContributorDetailsActivities
  from '@/modules/contributor/components/details/contributor-details-activities.vue';
import LfContributorDetailsNotes from '@/modules/contributor/components/details/contributor-details-notes.vue';
import LfContributorDetailsWorkHistory
  from '@/modules/contributor/components/details/contributor-details-work-history.vue';
import LfContributorDetailsIdentities
  from '@/modules/contributor/components/details/contributor-details-identities.vue';
import LfBack from '@/ui-kit/back/Back.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfContributorDetailsHeader from '@/modules/contributor/components/details/contributor-details-header.vue';
import LfContributorDetailsActions from '@/modules/contributor/components/details/contributor-details-actions.vue';
import { useRoute } from 'vue-router';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfContributorDetailsEmails from '@/modules/contributor/components/details/contributor-details-emails.vue';
import LfContributorLastEnrichment from '@/modules/contributor/components/shared/contributor-last-enrichment.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';

const { getMemberCustomAttributes } = useMemberStore();

const contributorStore = useContributorStore();
const { getContributor } = contributorStore;
// const { contributor } = storeToRefs(contributorStore);
const contributor = ref({
  id: '944ca2a0-1f80-11ef-b03b-65b2d81282bb',
  tenantId: '875c38bd-2b1b-4e91-ad07-0cfbabb4c49f',
  grandParentSegment: true,
  displayName: 'Yamen',
  reach: {
    total: -1,
  },
  attributes: {},
  score: -1,
  lastEnriched: null,
  joinedAt: '2024-05-27T23:46:05.000Z',
  createdAt: '2024-05-31T19:04:17.610Z',
  manuallyCreated: false,
  numberOfOpenSourceContributions: 0,
  activeOn: [
    'git',
  ],
  activityCount: 1,
  activityTypes: [
    'git:reported-commit',
  ],
  activeDaysCount: 1,
  lastActive: '2024-05-27T23:46:05.000Z',
  averageSentiment: 72,
  identities: [
    {
      platform: 'git',
      value: 'ysafadi@nvidia.com',
      type: 'username',
      verified: true,
      sourceId: null,
      integrationId: 'acf1e166-6ee0-481a-930c-18376b1d845e',
    },
    {
      platform: 'git',
      value: 'ysafadi@nvidia.com',
      type: 'email',
      verified: false,
      sourceId: null,
      integrationId: 'acf1e166-6ee0-481a-930c-18376b1d845e',
    },
  ],
  verifiedEmails: [],
  unverifiedEmails: [
    'ysafadi@nvidia.com',
  ],
  verifiedUsernames: [
    'ysafadi@nvidia.com',
  ],
  unverifiedUsernames: [],
  identityPlatforms: [
    'git',
  ],
  organizations: [],
  contributions: [],
  affiliations: [],
  tags: [],
  notes: [],
  tasks: [],
  toMergeIds: [],
  noMergeIds: [],
  lastActivity: {
    id: '949125b0-1f80-11ef-b03b-65b2d81282bb',
    type: 'reported-commit',
    timestamp: '2024-05-27T23:46:05.000Z',
    platform: 'git',
    isContribution: true,
    score: null,
    sourceId: '003387523c522200e2d768b7c70679b4dd6159d5',
    sourceParentId: '7b05ab85e28f615e70520d24c075249b4512044e',
    attributes: {
      lines: 1,
      isMerge: false,
      timezone: 'UTC-07:00',
      deletions: 2,
      insertions: 3,
      isMainBranch: true,
    },
    channel: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux',
    body: "ipv4: Fix address dump when IPv4 is disabled on an interface\n\nCited commit started returning an error when user space requests to dump\nthe interface's IPv4 addresses and IPv4 is disabled on the interface.\nRestore the previous behavior and do not return an error.\n\nBefore cited commit:\n\n # ip address show dev dummy1\n 10: dummy1: <BROADCAST,NOARP,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN group default qlen 1000\n     link/ether e2:40:68:98:d0:18 brd ff:ff:ff:ff:ff:ff\n     inet6 fe80::e040:68ff:fe98:d018/64 scope link proto kernel_ll\n        valid_lft forever preferred_lft forever\n # ip link set dev dummy1 mtu 67\n # ip address show dev dummy1\n 10: dummy1: <BROADCAST,NOARP,UP,LOWER_UP> mtu 67 qdisc noqueue state UNKNOWN group default qlen 1000\n     link/ether e2:40:68:98:d0:18 brd ff:ff:ff:ff:ff:ff\n\nAfter cited commit:\n\n # ip address show dev dummy1\n 10: dummy1: <BROADCAST,NOARP,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN group default qlen 1000\n     link/ether 32:2d:69:f2:9c:99 brd ff:ff:ff:ff:ff:ff\n     inet6 fe80::302d:69ff:fef2:9c99/64 scope link proto kernel_ll\n        valid_lft forever preferred_lft forever\n # ip link set dev dummy1 mtu 67\n # ip address show dev dummy1\n RTNETLINK answers: No such device\n Dump terminated\n\nWith this patch:\n\n # ip address show dev dummy1\n 10: dummy1: <BROADCAST,NOARP,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN group default qlen 1000\n     link/ether de:17:56:bb:57:c0 brd ff:ff:ff:ff:ff:ff\n     inet6 fe80::dc17:56ff:febb:57c0/64 scope link proto kernel_ll\n        valid_lft forever preferred_lft forever\n # ip link set dev dummy1 mtu 67\n # ip address show dev dummy1\n 10: dummy1: <BROADCAST,NOARP,UP,LOWER_UP> mtu 67 qdisc noqueue state UNKNOWN group default qlen 1000\n     link/ether de:17:56:bb:57:c0 brd ff:ff:ff:ff:ff:ff\n\nI fixed the exact same issue for IPv6 in commit c04f7dfe6ec2 (\"ipv6: Fix\naddress dump when IPv6 is disabled on an interface\"), but noted [1] that\nI am not doing the change for IPv4 because I am not aware of a way to\ndisable IPv4 on an interface other than unregistering it. I clearly\nmissed the above case.\n\n[1] https://lore.kernel.org/netdev/20240321173042.2151756-1-idosch@nvidia.com/\n\nFixes: cdb2f80f1c10 (\"inet: use xa_array iterator to implement inet_dump_ifaddr()\")\nReported-by: Carolina Jubran <cjubran@nvidia.com>\nReported-by: Yamen Safadi <ysafadi@nvidia.com>\nTested-by: Carolina Jubran <cjubran@nvidia.com>\nReviewed-by: Petr Machata <petrm@nvidia.com>\nSigned-off-by: Ido Schimmel <idosch@nvidia.com>\nReviewed-by: Eric Dumazet <edumazet@google.com>\nReviewed-by: David Ahern <dsahern@kernel.org>\nLink: https://lore.kernel.org/r/20240523110257.334315-1-idosch@nvidia.com\nSigned-off-by: Jakub Kicinski <kuba@kernel.org>",
    title: null,
    url: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux',
    sentiment: {
      label: 'positive',
      mixed: 82,
      neutral: 82,
      negative: 7,
      positive: 12,
      sentiment: 72,
    },
    importHash: null,
    createdAt: '2024-05-31T19:04:18.059Z',
    updatedAt: '2024-05-31T19:04:18.059Z',
    deletedAt: null,
    memberId: '944ca2a0-1f80-11ef-b03b-65b2d81282bb',
    conversationId: '8c496570-1f80-11ef-8f04-49da565ca303',
    parentId: '8b85ee60-1f80-11ef-8f04-49da565ca303',
    tenantId: '875c38bd-2b1b-4e91-ad07-0cfbabb4c49f',
    createdById: null,
    updatedById: null,
    username: 'ysafadi@nvidia.com',
    objectMemberId: null,
    objectMemberUsername: null,
    segmentId: '8656081c-f2fc-485f-b5f2-389ffcd5621a',
    organizationId: null,
    searchSyncedAt: '2024-05-31T19:04:18.308Z',
    display: {
      default: 'Conducted an activity',
      short: 'conducted an activity',
      author: 'conducted by',
      channel: '',
    },
  },
  segments: [
    {
      id: '8656081c-f2fc-485f-b5f2-389ffcd5621a',
      name: 'The Linux Kernel Organization',
      activitycount: '1',
    },
  ],
});

const route = useRoute();

const tabs = ref('overview');

const notes = ref<any>(null);

const { id } = route.params;

const loading = ref<boolean>(true);

const fetchContributor = () => {
  if (!contributor.value) {
    loading.value = true;
  }
  getContributor(id)
    .finally(() => {
      loading.value = false;
    });
};

const controlScroll = (e) => {
  if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 10) {
    if (tabs.value === 'notes') {
      notes.value.loadMore();
    }
  }
};

onMounted(() => {
  // contributor.value = null;
  fetchContributor();
  getMemberCustomAttributes();
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsPage',
};
</script>

<style>
.contributor-details{
  max-width: 67.5rem;
  height: calc(100vh - 4.25rem);
  grid-template-rows: min-content auto;
  grid-template-columns: 20rem auto;
  @apply w-full mx-auto;
}
</style>

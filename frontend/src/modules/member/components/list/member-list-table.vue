<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    />
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="!hasIntegrations && !hasMembers"
        icon="ri-contacts-line"
        title="No community members yet"
        description="Please connect with one of our available data sources in order to start pulling data from a certain platform"
        secondary-btn="Add member"
        @secondary-click="onSecondaryBtnClick"
      />

      <app-empty-state-cta
        v-else-if="hasIntegrations && !hasMembers"
        icon="ri-contacts-line"
        title="No community members yet"
        description="Please consider that the first members may take a couple of minutes to be displayed"
        :has-warning-icon="true"
      />

      <app-empty-state-cta
        v-else-if="hasMembers && !totalMembers"
        icon="ri-contacts-line"
        title="No members found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <div v-else>
        <!-- Sorter -->
        <div class="mb-2">
          <app-pagination-sorter
            :page-size="Number(pagination.perPage)"
            :total="totalMembers"
            :current-page="pagination.page"
            :has-page-counter="false"
            :export="doExport"
            module="member"
            position="top"
            @change-sorter="doChangePaginationPageSize"
          />
        </div>

        <!-- Members list -->
        <div class="app-list-table panel">
          <transition name="el-fade-in">
            <div
              v-show="isScrollbarVisible"
              class="absolute z-20 top-0 left-0 w-full"
              @mouseover="onTableMouseover"
              @mouseleave="onTableMouseLeft"
            >
              <el-scrollbar
                id="custom-scrollbar"
                ref="scrollbarRef"
                height="10px"
                always
                @scroll="onCustomScrollbarScroll"
                @pointerdown="onScrollMousedown"
              >
                <div
                  :style="{
                    height: '10px',
                  }"
                />
              </el-scrollbar>
            </div>
          </transition>
          <app-member-list-toolbar
            @mouseover="onTableMouseover"
            @mouseleave="onTableMouseLeft"
          />
          <div
            class="-mx-6 -mt-6"
            @mouseover="onTableMouseover"
            @mouseleave="onTableMouseLeft"
          >
            <el-table
              id="members-table"
              ref="table"
              v-loading="loading"
              :data="members"
              :default-sort="defaultSort"
              row-key="id"
              border
              :row-class-name="rowClass"
              @sort-change="doChangeSort"
              @selection-change="selectedMembers = $event"
            >
              <el-table-column type="selection" width="75" fixed />

              <el-table-column
                label="Member"
                prop="displayName"
                width="250"
                sortable
                fixed
                class="-my-2"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <div class="flex items-center text-black">
                      <app-avatar :entity="scope.row" size="sm" class="mr-2" />
                      <span
                        class="font-semibold"
                        data-qa="members-name"
                        v-html="$sanitize(scope.row.displayName)"
                      />
                      <app-member-sentiment :member="scope.row" class="ml-2" />
                      <app-member-badge :member="scope.row" />
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <el-table-column label="Organization & Title" width="220">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <app-member-organizations
                      :member="scope.row"
                      :show-title="true"
                    />
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column
                label="# of Activities"
                prop="activityCount"
                width="200"
                sortable="custom"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block !text-gray-500"
                  >
                    {{ formatNumber(scope.row.activityCount) }}
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column
                label="Engagement Level"
                prop="score"
                width="200"
                sortable="custom"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <app-member-engagement-level :member="scope.row" />
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column
                label="Last activity"
                prop="lastActive"
                width="250"
                sortable="custom"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block !text-gray-500"
                  >
                    <app-member-last-activity
                      v-if="scope.row.lastActivity"
                      :member="scope.row"
                    />
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column
                v-if="showReach"
                label="Reach"
                prop="reach.total"
                width="150"
                sortable="custom"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block !text-gray-500"
                  >
                    <app-member-reach
                      :member="{
                        ...scope.row,
                        reach: scope.row.reach,
                      }"
                    />
                  </router-link>
                </template>
              </el-table-column>

              <!-- Joined Date -->
              <el-table-column
                label="Joined Date"
                width="200"
                prop="joinedAt"
                sortable
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <div
                      v-if="scope.row.joinedAt"
                      class="text-gray-900 text-sm"
                    >
                      {{ formatDateToTimeAgo(scope.row.joinedAt) }}
                    </div>
                    <span v-else class="text-gray-900">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- # of Open Source Contributions -->
              <el-table-column
                label="# of open source contributions"
                width="200"
                prop="numberOfOpenSourceContributions"
                sortable
              >
                <template #header>
                  <el-tooltip placement="top">
                    <template #content>
                      This refers to the total # of open source contributions a member did on GitHub.<br />
                      To receive this attribute you have to enrich your members.
                    </template>
                    # of open source contributions
                  </el-tooltip>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <div data-qa="member-oss-contributions" class="text-gray-900 text-sm member-oss-contributions">
                      {{
                        formatNumberToCompact(
                          scope.row.numberOfOpenSourceContributions,
                        )
                      }}
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <el-table-column label="Identities" width="240">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <app-member-identities :username="scope.row.username" />
                  </router-link>
                </template>
              </el-table-column>

              <el-table-column label="Emails" :width="emailsColumnWidth">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <div
                      v-if="scope.row.emails?.length && scope.row.emails?.some((e) => !!e)"
                      class="text-sm cursor-auto flex flex-wrap gap-1"
                    >
                      <el-tooltip
                        v-for="email of scope.row.emails"
                        :key="email"
                        :disabled="!email"
                        popper-class="custom-identity-tooltip"
                        placement="top"
                      >
                        <template #content>
                          <span>Send email
                            <i
                              v-if="email"
                              class="ri-external-link-line text-gray-400"
                            /></span>
                        </template>
                        <div @click.prevent>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            class="badge--interactive"
                            :href="`mailto:${email}`"
                            @click.stop="trackEmailClick"
                          >{{ email }}</a>
                        </div>
                      </el-tooltip>
                    </div>
                    <span v-else class="text-gray-500">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <el-table-column
                :width="tagsColumnWidth"
                :label="translate('entities.member.fields.tag')"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <app-tag-list :member="scope.row" />
                  </router-link>
                </template>
              </el-table-column>

              <el-table-column fixed="right">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block w-full"
                  >
                    <div class="h-full flex items-center justify-center w-full">
                      <app-member-dropdown :member="scope.row" />
                    </div>
                  </router-link>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="!!totalMembers" class="mt-8 px-6">
              <app-pagination
                :total="totalMembers"
                :page-size="Number(pagination.perPage)"
                :current-page="pagination.page || 1"
                module="member"
                @change-current-page="doChangePaginationCurrentPage"
                @change-page-size="doChangePaginationPageSize"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  computed, onMounted, onUnmounted, ref, defineProps, watch,
} from 'vue';
import { i18n } from '@/i18n';
import AppMemberListToolbar from '@/modules/member/components/list/member-list-toolbar.vue';
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue';
import AppTagList from '@/modules/tag/components/tag-list.vue';
import { formatDateToTimeAgo } from '@/utils/date';
import { formatNumberToCompact, formatNumber } from '@/utils/number';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { MemberService } from '@/modules/member/member-service';
import AppMemberBadge from '../member-badge.vue';
import AppMemberDropdown from '../member-dropdown.vue';
import AppMemberIdentities from '../member-identities.vue';
import AppMemberReach from '../member-reach.vue';
import AppMemberEngagementLevel from '../member-engagement-level.vue';
import AppMemberLastActivity from '../member-last-activity.vue';
import AppMemberSentiment from '../member-sentiment.vue';

const store = useStore();
const table = ref(null);
const scrollbarRef = ref();
const tableBodyRef = ref();
const tableHeaderRef = ref();
const isScrollbarVisible = ref(false);
const isTableHovered = ref(false);
const isCursorDown = ref(false);

const emit = defineEmits(['onAddMember']);
const props = defineProps({
  hasIntegrations: {
    type: Boolean,
    default: () => false,
  },
  hasMembers: {
    type: Boolean,
    default: () => false,
  },
  isPageLoading: {
    type: Boolean,
    default: () => true,
  },
});

const memberStore = useMemberStore();
const {
  members, totalMembers, filters, selectedMembers, savedFilterBody,
} = storeToRefs(memberStore);

const defaultSort = computed(() => ({
  field: 'lastActive',
  order: 'descending',
}));

const integrations = computed(
  () => store.getters['integration/activeList'] || {},
);

const showReach = computed(
  () => integrations.value.twitter?.status === 'done'
    || integrations.value.github?.status === 'done',
);

const loading = computed(
  () => props.isPageLoading,
);

const tagsColumnWidth = computed(() => {
  let maxTabWidth = 0;
  members.value.forEach((row) => {
    if (row.tags) {
      const tabWidth = row.tags
        .map((tag) => tag.name.length * 20)
        .reduce((a, b) => a + b, 0);

      if (tabWidth > maxTabWidth) {
        maxTabWidth = tabWidth;
      }
    }
  });

  return Math.min(maxTabWidth + 100, 500);
});

const emailsColumnWidth = computed(() => {
  let maxTabWidth = 0;

  members.value.forEach((row) => {
    const tabWidth = row.emails
      .map((email) => (email ? email.length * 12 : 0))
      .reduce((a, b) => a + b, 0);

    if (tabWidth > maxTabWidth) {
      maxTabWidth = tabWidth > 400 ? 400 : tabWidth;
    }
  });

  return maxTabWidth;
});

const selectedRows = computed(() => selectedMembers.value);
const pagination = computed(() => filters.value.pagination);

const tableWidth = ref(0);

document.onmouseup = () => {
  // As soon as mouse is released, set scrollbar visibility
  // according to wether the mouse is hovering the table or not
  isScrollbarVisible.value = isTableHovered.value;
  isCursorDown.value = false;
};

function doChangeSort(sorter) {
  filters.value.order = {
    prop: sorter.prop,
    order: sorter.order,
  };
}

function doChangePaginationCurrentPage(currentPage) {
  filters.value.pagination.page = currentPage;
}

function doChangePaginationPageSize(pageSize) {
  filters.value.pagination.perPage = pageSize;
}

function translate(key) {
  return i18n(key);
}

function rowClass({ row }) {
  const isSelected = selectedRows.value.find((r) => r.id === row.id) !== undefined;

  return isSelected ? 'is-selected' : '';
}

function onSecondaryBtnClick() {
  emit('onAddMember');
}

// On custom scrollbar scroll, set the table scroll with the same value
const onCustomScrollbarScroll = ({ scrollLeft }) => {
  table.value.setScrollLeft(scrollLeft);
};

// On table body scroll, set the custom scrollbar scroll with the same value
const onTableBodyScroll = () => {
  scrollbarRef.value.setScrollLeft(tableBodyRef.value.scrollLeft);
};

// On table header scroll, set the custom scrollbar scroll with the same value
const onTableHeaderScroll = () => {
  scrollbarRef.value.setScrollLeft(tableHeaderRef.value.scrollLeft);
  table.value.setScrollLeft(tableHeaderRef.value.scrollLeft);
};

const onScrollMousedown = () => {
  isCursorDown.value = true;
};

const onTableMouseover = () => {
  isTableHovered.value = true;
  isScrollbarVisible.value = true;
};

const onTableMouseLeft = () => {
  isTableHovered.value = false;
  isScrollbarVisible.value = isCursorDown.value;
};

const trackEmailClick = () => {
  window.analytics.track('Click Member Contact', {
    channel: 'Email',
  });
};

watch(table, (newValue) => {
  if (newValue) {
    tableWidth.value = table.value;
  }

  // Add scroll events to table, it's not possible to access it from 'el-table'
  // as the overflowed element is within it
  const tableBodyEl = document.querySelector(
    '#members-table .el-scrollbar__wrap',
  );
  const tableHeaderEl = document.querySelector(
    '#members-table .el-table__header-wrapper',
  );

  if (tableBodyEl) {
    tableBodyRef.value = tableBodyEl;
    tableBodyRef.value.addEventListener('scroll', onTableBodyScroll);
  }

  if (tableHeaderEl) {
    tableHeaderEl.style.overflow = 'auto';
    tableHeaderRef.value = tableHeaderEl;
    tableHeaderRef.value.addEventListener('scroll', onTableHeaderScroll);
  }
});

const doExport = () => MemberService.export(
  savedFilterBody.value.filter,
  savedFilterBody.value.orderBy,
  0,
  null,
  false,
);

onMounted(async () => {
  if (store.state.integration.count === 0) {
    await store.dispatch('integration/doFetch');
  }
});

// Remove listeners on unmount
onUnmounted(() => {
  tableBodyRef.value?.removeEventListener('scroll', onTableBodyScroll);
  tableHeaderRef.value?.removeEventListener('scroll', onTableHeaderScroll);
});
</script>

<script>
export default {
  name: 'AppMemberListTable',
};
</script>

<style lang="scss">
// Hide table header scrollbar
#members-table .el-table__header-wrapper {
  // IE, Edge and Firefox
  -ms-overflow-style: none;
  scrollbar-width: none;

  // Chrome, Safari and Opera
  &::-webkit-scrollbar {
    display: none;
  }
}
#members-table .el-table__cell:not(.el-table-column--selection) {
  padding: 0;
}

.el-table tbody .cell {
  display: block !important;
  @apply p-0;

  &,
  & > a {
    @apply h-full w-full flex items-center;
  }

  & > a {
    @apply px-2.5 py-2;
  }
}
.el-table__body {
  height: 1px;
}
</style>

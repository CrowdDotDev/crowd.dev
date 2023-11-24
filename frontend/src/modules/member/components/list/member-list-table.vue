<template>
  <div>
    <div
      v-if="loading"
      class="h-16 !relative !min-h-5 flex justify-center items-center"
    >
      <div class="animate-spin w-fit">
        <div class="custom-spinner" />
      </div>
    </div>
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="!hasIntegrations && !hasMembers"
        icon="ri-contacts-line"
        title="No contributors yet"
        description="Please connect with one of our available data sources in order to start pulling data from a certain platform"
        secondary-btn="Add contributor"
        @secondary-click="onSecondaryBtnClick"
      />

      <app-empty-state-cta
        v-else-if="hasIntegrations && !hasMembers"
        icon="ri-contacts-line"
        title="No contributors yet"
        description="Please consider that the first contributors may take a couple of minutes to be displayed"
        :has-warning-icon="true"
      />

      <app-empty-state-cta
        v-else-if="hasMembers && !totalMembers"
        icon="ri-contacts-line"
        title="No contributors found"
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

              <!-- Contacts -->
              <el-table-column
                label="Contributor"
                prop="displayName"
                width="250"
                fixed
                class="-my-2"
                sortable="custom"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
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

              <!-- Organization & Title -->
              <el-table-column label="Organization & Title" width="220">
                <template #header>
                  <div class="flex items-center">
                    <div class="mr-2">
                      Organization & Title
                    </div>
                    <el-tooltip content="Source: Enrichment & GitHub" placement="top" trigger="hover">
                      <app-svg name="source" class="h-3 w-3" />
                    </el-tooltip>
                  </div>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
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

              <!-- Identities -->
              <el-table-column label="Identities" width="240">
                <template #header>
                  <span>Identities</span>
                  <el-tooltip placement="top">
                    <template #content>
                      Identities can be profiles on social platforms, emails, phone numbers,<br>
                      or unique identifiers from internal sources (e.g. web app log-in email).
                    </template>
                    <i class="ri-information-line text-xs ml-1" />
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
                    <app-member-identities :username="scope.row.username" :member="scope.row" />
                  </router-link>
                </template>
              </el-table-column>

              <!-- Emails -->
              <el-table-column label="Emails" :width="emailsColumnWidth">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      v-if="scope.row.emails?.length && scope.row.emails?.some((e) => !!e)"
                      class="text-sm cursor-auto flex flex-wrap gap-1"
                    >
                      <el-tooltip
                        v-for="email of scope.row.emails.slice(0, 3)"
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
                      <el-popover
                        v-if="scope.row.emails?.length > 3"
                        placement="top"
                        :width="400"
                        trigger="hover"
                        popper-class="support-popover"
                      >
                        <template #reference>
                          <span
                            class="badge--interactive hover:text-gray-900"
                          >+{{ scope.row.emails.length - 3 }}</span>
                        </template>
                        <div class="flex flex-wrap gap-3 my-1">
                          <el-tooltip
                            v-for="email of scope.row.emails.slice(3)"
                            :key="email"
                            :disabled="!email"
                            popper-class="custom-identity-tooltip flex "
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
                      </el-popover>
                    </div>
                    <span v-else class="text-gray-500">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Engagement level -->
              <el-table-column
                label="Engagement Level"
                prop="score"
                width="210"
                sortable="custom"
              >
                <template #header>
                  <span>Engagement Level</span>
                  <el-tooltip placement="top">
                    <template #content>
                      Calculated based on the recency and importance of the activities<br>
                      a contact has performed in relation to all other contacts.
                      <br>E.g. a higher engagement level will be given to a contact who has written
                      <br>in your Slack yesterday vs. someone who did so three weeks ago.
                    </template>
                    <i class="ri-information-line text-xs ml-1" />
                  </el-tooltip>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <app-member-engagement-level :member="scope.row" />
                  </router-link>
                </template>
              </el-table-column>

              <!-- # of Activities -->
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
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block !text-gray-500"
                  >
                    {{ formatNumber(scope.row.activityCount) }}
                  </router-link>
                </template>
              </el-table-column>

              <!-- Last activity -->
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
                      query: { projectGroup: selectedProjectGroup?.id },
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
                      query: { projectGroup: selectedProjectGroup?.id },
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

              <!-- Location -->
              <el-table-column
                label="Location"
                width="200"
              >
                <template #header>
                  <div class="flex items-center">
                    <div class="mr-2">
                      Location
                    </div>
                    <el-tooltip content="Source: Enrichment & GitHub" placement="top" trigger="hover">
                      <app-svg name="source" class="h-3 w-3" />
                    </el-tooltip>
                  </div>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      v-if="scope.row.attributes?.location?.default"
                      class="text-gray-900 text-sm"
                    >
                      {{ scope.row.attributes.location.default }}
                    </div>
                    <span v-else class="text-gray-900">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Reach -->
              <el-table-column
                v-if="showReach"
                label="Reach"
                prop="reach"
                width="180"
                sortable="custom"
              >
                <template #header>
                  <span>Reach</span>
                  <div class="inline-flex items-center ml-1 gap-2">
                    <el-tooltip placement="top">
                      <template #content>
                        Reach is the combined followers across social platforms (e.g. GitHub or Twitter).
                      </template>
                      <i class="ri-information-line text-xs" />
                    </el-tooltip>
                    <el-tooltip content="Source: GitHub" placement="top" trigger="hover">
                      <app-svg name="source" class="h-3 w-3" />
                    </el-tooltip>
                  </div>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
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

              <!-- Seniority Level -->
              <el-table-column
                label="Seniority Level"
                width="200"
              >
                <template #header>
                  <div class="flex items-center">
                    <div class="mr-2">
                      Seniority Level
                    </div>
                    <el-tooltip
                      content="Source: Enrichment"
                      placement="top"
                      trigger="hover"
                    >
                      <app-svg name="source" class="h-3 w-3" />
                    </el-tooltip>
                  </div>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      v-if="scope.row.attributes?.seniorityLevel?.default"
                      class="text-gray-900 text-sm"
                    >
                      {{ scope.row.attributes.seniorityLevel.default }}
                    </div>
                    <span v-else class="text-gray-900">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Programming Languages -->
              <el-table-column
                label="Programming Languages"
                width="250"
              >
                <template #header>
                  <div class="flex items-center">
                    <div class="mr-2">
                      Programming Languages
                    </div>
                    <el-tooltip
                      content="Source: Enrichment"
                      placement="top"
                      trigger="hover"
                    >
                      <app-svg name="source" class="h-3 w-3" />
                    </el-tooltip>
                  </div>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <app-shared-tag-list
                      v-if="scope.row.attributes.programmingLanguages?.default?.length"
                      :list="scope.row.attributes.programmingLanguages.default"
                      :slice-size="5"
                    >
                      <template #itemSlot="{ item }">
                        <span class="border border-gray-200 px-2.5 text-xs rounded-md h-6 text-gray-900 inline-flex break-keep">
                          {{ item }}
                        </span>
                      </template>
                    </app-shared-tag-list>
                    <span v-else class="text-gray-500">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Skills -->
              <el-table-column
                label="Skills"
                width="250"
              >
                <template #header>
                  <div class="flex items-center">
                    <div class="mr-2">
                      Skills
                    </div>
                    <el-tooltip
                      content="Source: Enrichment"
                      placement="top"
                      trigger="hover"
                    >
                      <app-svg name="source" class="h-3 w-3" />
                    </el-tooltip>
                  </div>
                </template>
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                    }"
                    class="block"
                  >
                    <app-shared-tag-list
                      v-if="scope.row.attributes.skills?.default?.length"
                      :list="scope.row.attributes.skills.default"
                      :slice-size="5"
                    >
                      <template #itemSlot="{ item }">
                        <span class="border border-gray-200 px-2.5 text-xs rounded-md h-6 text-gray-900 inline-flex break-keep">
                          {{ item }}
                        </span>
                      </template>
                    </app-shared-tag-list>
                    <span v-else class="text-gray-500">-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Tags -->
              <el-table-column
                :width="tagsColumnWidth"
                :label="translate('entities.member.fields.tag')"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <app-tag-list :member="scope.row" @edit="handleEditTagsDialog(scope.row)" />
                  </router-link>
                </template>
              </el-table-column>

              <!-- Action button -->
              <el-table-column fixed="right">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'memberView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block w-full"
                  >
                    <div class="h-full flex items-center justify-center w-full">
                      <button
                        :id="`buttonRef-${scope.row.id}`"
                        :ref="(el) => setActionBtnsRef(el, scope.row.id)"
                        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
                        type="button"
                        @click.prevent.stop="() => onActionBtnClick(scope.row)"
                      >
                        <i
                          :id="`buttonRefIcon-${scope.row.id}`"
                          class="text-xl ri-more-fill"
                        />
                      </button>
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
    <el-popover
      ref="memberDropdownPopover"
      placement="bottom-end"
      popper-class="popover-dropdown"
      :virtual-ref="actionBtnRefs[selectedActionMember?.id]"
      trigger="click"
      :visible="showMemberDropdownPopover"
      virtual-triggering
      @hide="onHide"
    >
      <div v-click-outside="onClickOutside">
        <app-member-dropdown-content
          v-if="selectedActionMember"
          :member="selectedActionMember"
          @merge="isMergeDialogOpen = selectedActionMember"
          @close-dropdown="closeDropdown"
        />
      </div>
    </el-popover>
    <app-member-merge-dialog v-model="isMergeDialogOpen" />
    <app-tag-popover v-model="isEditTagsDialogOpen" :member="editTagMember" @reload="fetchMembers({ reload: true })" />
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  computed, onMounted, onUnmounted, ref, defineProps, watch,
} from 'vue';
import { ClickOutside as vClickOutside } from 'element-plus';
import { storeToRefs } from 'pinia';
import { i18n } from '@/i18n';
import AppMemberListToolbar from '@/modules/member/components/list/member-list-toolbar.vue';
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue';
import AppTagList from '@/modules/tag/components/tag-list.vue';
import { formatDateToTimeAgo } from '@/utils/date';
import { formatNumber } from '@/utils/number';
import { useMemberStore } from '@/modules/member/store/pinia';
import { MemberService } from '@/modules/member/member-service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import AppMemberMergeDialog from '@/modules/member/components/member-merge-dialog.vue';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';
import AppPagination from '@/shared/pagination/pagination.vue';
import AppSharedTagList from '@/shared/tag/tag-list.vue';
import AppSvg from '@/shared/svg/svg.vue';
import AppMemberBadge from '../member-badge.vue';
import AppMemberDropdownContent from '../member-dropdown-content.vue';
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

const isMergeDialogOpen = ref(null);
const isEditTagsDialogOpen = ref(false);
const editTagMember = ref(null);

const showMemberDropdownPopover = ref(false);
const memberDropdownPopover = ref(null);
const actionBtnRefs = ref({});
const selectedActionMember = ref(null);

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
  pagination: {
    type: Object,
    default: () => ({
      page: 1,
      perPage: 20,
    }),
  },
});

const emit = defineEmits(['onAddMember', 'update:pagination']);

const memberStore = useMemberStore();
const {
  members, totalMembers, filters, selectedMembers, savedFilterBody,
} = storeToRefs(memberStore);
const { fetchMembers } = memberStore;

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const defaultSort = computed(() => ({
  prop: 'lastActive',
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
      maxTabWidth = tabWidth > 300 ? 300 : tabWidth;
    }
  });

  return maxTabWidth;
});

const selectedRows = computed(() => selectedMembers.value);
const pagination = computed({
  get() {
    return props.pagination;
  },
  set(value) {
    emit('update:pagination', value);
  },
});

const tableWidth = ref(0);

document.onmouseup = () => {
  // As soon as mouse is released, set scrollbar visibility
  // according to wether the mouse is hovering the table or not
  isScrollbarVisible.value = isTableHovered.value;
  isCursorDown.value = false;
};

const setActionBtnsRef = (el, id) => {
  if (el) {
    actionBtnRefs.value[id] = el;
  }
};

const onActionBtnClick = (member) => {
  if (selectedActionMember.value?.id === member.id) {
    showMemberDropdownPopover.value = false;

    setTimeout(() => {
      selectedActionMember.value = null;
    }, 200);
  } else {
    showMemberDropdownPopover.value = true;
    selectedActionMember.value = member;
  }
};

const closeDropdown = () => {
  showMemberDropdownPopover.value = false;

  setTimeout(() => {
    selectedActionMember.value = null;
  }, 200);
};

const onClickOutside = (el) => {
  if (!el.target?.id.includes('buttonRef')) {
    closeDropdown();
  }
};

function handleEditTagsDialog(member) {
  isEditTagsDialogOpen.value = true;
  editTagMember.value = member;
}

function doChangeSort(sorter) {
  filters.value.order = {
    prop: sorter.prop,
    order: sorter.order,
  };
}

function doChangePaginationCurrentPage(currentPage) {
  emit('update:pagination', {
    ...pagination.value,
    page: currentPage,
  });
}

function doChangePaginationPageSize(pageSize) {
  emit('update:pagination', {
    page: 1,
    perPage: pageSize,
  });
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

const doExport = () => MemberService.export({
  filter: savedFilterBody.value.filter,
  orderBy: savedFilterBody.value.orderBy,
  limit: 0,
  offset: null,
});

onMounted(async () => {
  await store.dispatch('integration/doFetch', getSegmentsFromProjectGroup(selectedProjectGroup.value));
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

.popover-dropdown {
  padding: 0.5rem !important;
  width: fit-content !important;
}
</style>

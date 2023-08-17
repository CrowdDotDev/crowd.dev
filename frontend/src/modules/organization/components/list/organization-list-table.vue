<template>
  <div class="pt-3">
    <div
      v-if="isLoading"
      v-loading="isLoading"
      class="app-page-spinner h-16 !relative !min-h-5"
    />
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="!hasOrganizations"
        icon="ri-community-line"
        title="No organizations yet"
        description="We couldn't track any organizations related to your community contributors."
        cta-btn="Add organization"
        @cta-click="onCtaClick"
      />

      <app-empty-state-cta
        v-else-if="hasOrganizations && !totalOrganizations"
        icon="ri-community-line"
        title="No organizations found"
        description="We couldn't find any results that match your search criteria, please try a different query."
      />

      <div v-else>
        <!-- Sorter -->
        <div class="mb-2">
          <app-pagination-sorter
            :page-size="Number(pagination.perPage)"
            :total="totalOrganizations"
            :current-page="pagination.page"
            :has-page-counter="false"
            module="organization"
            position="top"
            @change-sorter="doChangePaginationPageSize"
          />
        </div>

        <!-- Organizations list -->
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

          <app-organization-list-toolbar
            @mouseover="onTableMouseover"
            @mouseleave="onTableMouseLeft"
          />

          <div
            class="-mx-6 -mt-6"
            @mouseover="onTableMouseover"
            @mouseleave="onTableMouseLeft"
          >
            <el-table
              id="organizations-table"
              ref="table"
              :data="organizations"
              :default-sort="defaultSort"
              row-key="id"
              border
              :row-class-name="rowClass"
              @sort-change="doChangeSort"
              @selection-change="selectedOrganizations = $event"
            >
              <!-- Checkbox -->
              <el-table-column
                type="selection"
                width="75"
                fixed
              />

              <!-- Organization logo and name -->
              <el-table-column
                label="Organization"
                prop="displayName"
                width="260"
                fixed
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block mr-4"
                  >
                    <app-organization-name
                      class="w-full"
                      :organization="scope.row"
                    />
                  </router-link>
                </template>
              </el-table-column>

              <!-- Headline -->
              <el-table-column
                label="Headline"
                prop="headline"
                width="300"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div class="mr-4">
                      <span
                        v-if="scope.row.headline || scope.row.description"
                        class="text-sm h-full flex items-center text-gray-900"
                      >
                        {{ scope.row.headline || scope.row.description }}
                      </span>
                      <span
                        v-else
                        class="text-gray-500"
                      >-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Website -->
              <el-table-column label="Website" width="220">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-sm h-full flex items-center"
                    >
                      <a
                        v-if="scope.row.website"
                        class="text-gray-500 hover:!text-brand-500"
                        :href="withHttp(scope.row.website)"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click.stop
                      >{{ scope.row.website }}</a>
                      <span
                        v-else
                        class="text-gray-500"
                      >-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Number of members -->
              <el-table-column
                label="# Contributors"
                width="150"
                prop="memberCount"
                sortable
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-gray-900 text-sm h-full flex items-center"
                    >
                      {{
                        formatNumberToCompact(
                          scope.row.memberCount,
                        )
                      }}
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Number of activities -->
              <el-table-column
                label="# Activities"
                width="150"
                prop="activityCount"
                sortable
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-gray-900 text-sm h-full flex items-center"
                    >
                      {{
                        formatNumberToCompact(
                          scope.row.activityCount,
                        )
                      }}
                    </div>
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
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      v-if="scope.row.joinedAt"
                      class="text-gray-900 text-sm h-full flex items-center"
                    >
                      {{
                        formatDateToTimeAgo(
                          scope.row.joinedAt,
                        )
                      }}
                    </div>
                    <span
                      v-else
                      class="text-gray-900"
                    >-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Identities -->
              <el-table-column
                label="Identities"
                width="240"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div class="h-full flex items-center">
                      <app-organization-identities
                        v-if="hasIdentities(scope.row)"
                        :organization="scope.row"
                      />
                      <span
                        v-else
                        class="text-gray-900"
                      >-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Emails -->
              <el-table-column
                label="Emails"
                :width="emailsColumnWidth"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
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
                        v-for="email of scope.row.emails
                          || []"
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
                    <span
                      v-else
                      class="text-gray-500"
                    >-</span>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Location -->
              <el-table-column
                label="Location"
                width="150"
                prop="location"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-sm h-full flex items-center"
                    >
                      <span v-if="scope.row.location" class="text-gray-900">
                        {{
                          scope.row.location
                        }}
                      </span>
                      <span v-else class="text-gray-500">-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Industry -->
              <el-table-column
                label="Industry"
                width="150"
                prop="industry"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-sm h-full flex items-center"
                    >
                      <span v-if="scope.row.industry" class="text-gray-900">
                        {{
                          toSentenceCase(scope.row.industry)
                        }}
                      </span>
                      <span v-else class="text-gray-500">-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Size -->
              <el-table-column
                label="Headcount"
                width="150"
                prop="size"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-sm h-full flex items-center"
                    >
                      <span v-if="scope.row.size" class="text-gray-900">
                        {{
                          scope.row.size
                        }}
                      </span>
                      <span v-else class="text-gray-500">-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Type -->
              <el-table-column
                label="Type"
                width="150"
                prop="type"
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-sm h-full flex items-center"
                    >
                      <span v-if="scope.row.type" class="text-gray-900">
                        {{
                          toSentenceCase(scope.row.type)
                        }}
                      </span>
                      <span v-else class="text-gray-500">-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Founded -->
              <el-table-column
                label="Founded"
                width="150"
                prop="founded"
                sortable
              >
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="block"
                  >
                    <div
                      class="text-sm h-full flex items-center"
                    >
                      <span v-if="scope.row.founded" class="text-gray-900">
                        {{
                          scope.row.founded
                        }}
                      </span>
                      <span v-else class="text-gray-500">-</span>
                    </div>
                  </router-link>
                </template>
              </el-table-column>

              <!-- Actions -->
              <el-table-column fixed="right">
                <template #default="scope">
                  <router-link
                    :to="{
                      name: 'organizationView',
                      params: { id: scope.row.id },
                      query: { projectGroup: selectedProjectGroup?.id },
                    }"
                    class="flex justify-center"
                  >
                    <app-organization-dropdown
                      :organization="scope.row"
                    />
                  </router-link>
                </template>
              </el-table-column>
            </el-table>

            <div
              v-if="showBottomPagination"
              class="mt-8 px-6"
            >
              <app-pagination
                :total="totalOrganizations"
                :page-size="Number(pagination.perPage)"
                :current-page="pagination.page || 1"
                module="organization"
                @change-current-page="
                  doChangePaginationCurrentPage
                "
                @change-page-size="
                  doChangePaginationPageSize
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineProps,
  ref,
  watch,
  onUnmounted,
} from 'vue';
import { formatDateToTimeAgo } from '@/utils/date';
import { formatNumberToCompact } from '@/utils/number';
import { withHttp, toSentenceCase } from '@/utils/string';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppOrganizationIdentities from '../organization-identities.vue';
import AppOrganizationListToolbar from './organization-list-toolbar.vue';
import AppOrganizationName from '../organization-name.vue';
import AppOrganizationDropdown from '../organization-dropdown.vue';

const emit = defineEmits(['onAddOrganization']);
const props = defineProps({
  hasOrganizations: {
    type: Boolean,
    default: () => false,
  },
  isPageLoading: {
    type: Boolean,
    default: () => true,
  },
});

const organizationStore = useOrganizationStore();
const {
  organizations, selectedOrganizations, filters, totalOrganizations,
} = storeToRefs(organizationStore);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const table = ref(null);
const scrollbarRef = ref();
const tableBodyRef = ref();
const tableHeaderRef = ref();
const isScrollbarVisible = ref(false);
const isTableHovered = ref(false);
const isCursorDown = ref(false);

const pagination = computed(() => filters.value.pagination);

const defaultSort = computed(() => ({
  field: filters.value.order.prop,
  order: filters.value.order.order,
}));

const showBottomPagination = computed(() => (
  !!totalOrganizations.value
    && Math.ceil(
      totalOrganizations.value / Number(filters.value.pagination.perPage),
    ) > 1
));
const isLoading = computed(() => props.isPageLoading);

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

const onCtaClick = () => {
  emit('onAddOrganization');
};

const rowClass = ({ row }) => {
  const isSelected = selectedOrganizations.value.find((r) => r.id === row.id)
    !== undefined;

  return isSelected ? 'is-selected' : '';
};

const hasIdentities = (row) => (
  !!row.github
    || !!row.linkedin
    || !!row.twitter
    || !!row.crunchbase
    || !!row.facebook
    || !!row.phoneNumbers?.length
);

// On custom scrollbar scroll, set the table scroll with the same value
const onCustomScrollbarScroll = ({ scrollLeft }) => {
  table.value.setScrollLeft(scrollLeft);
};

// On table body scroll, set the custom scrollbar scroll with the same value
const onTableBodyScroll = () => {
  scrollbarRef.value.setScrollLeft(
    tableBodyRef.value.scrollLeft,
  );
};

// On table header scroll, set the custom scrollbar scroll with the same value
const onTableHeaderScroll = () => {
  scrollbarRef.value.setScrollLeft(
    tableHeaderRef.value.scrollLeft,
  );
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

const emailsColumnWidth = computed(() => {
  let maxTabWidth = 0;
  organizations.value.forEach((row) => {
    const tabWidth = row.emails
      ?.map((email) => (email ? email.length * 12 : 0))
      .reduce((a, b) => a + b, 0);

    if (tabWidth > maxTabWidth) {
      maxTabWidth = tabWidth > 400 ? 400 : tabWidth;
    }
  });
  return maxTabWidth;
});

const trackEmailClick = () => {
  window.analytics.track('Click Organization Contact', {
    channel: 'Email',
  });
};

watch(table, (newValue) => {
  // Add scroll events to table, it's not possible to access it from 'el-table'
  // as the overflowed element is within it
  const tableBodyEl = document.querySelector(
    '#organizations-table .el-scrollbar__wrap',
  );
  const tableHeaderEl = document.querySelector(
    '#organizations-table .el-table__header-wrapper',
  );

  if (tableBodyEl) {
    tableBodyRef.value = tableBodyEl;
    tableBodyRef.value.addEventListener(
      'scroll',
      onTableBodyScroll,
    );
  }

  if (tableHeaderEl) {
    tableHeaderEl.style.overflow = 'auto';
    tableHeaderRef.value = tableHeaderEl;
    tableHeaderRef.value.addEventListener(
      'scroll',
      onTableHeaderScroll,
    );
  }
});

// Remove listeners on unmount
onUnmounted(() => {
  tableBodyRef.value?.removeEventListener(
    'scroll',
    onTableBodyScroll,
  );
  tableHeaderRef.value?.removeEventListener(
    'scroll',
    onTableHeaderScroll,
  );
});
</script>

<script>
export default {
  name: 'AppOrganizationListTable',
};
</script>

<style lang="scss">
// Hide table header scrollbar
#organizations-table .el-table__header-wrapper {
  // IE, Edge and Firefox
  -ms-overflow-style: none;
  scrollbar-width: none;

  // Chrome, Safari and Opera
  &::-webkit-scrollbar {
    display: none;
  }
}

#organizations-table
.el-table__cell:not(.el-table-column--selection) {
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

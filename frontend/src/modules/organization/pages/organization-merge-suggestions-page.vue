<template>
  <app-page-wrapper>
    <div class="pb-40">
      <app-back-link
        :default-route="{
          path: '/organizations',
          query: { projectGroup: selectedProjectGroup?.id },
        }"
        class="font-semibold"
      >
        <template #default>
          Organizations
        </template>
      </app-back-link>
      <div class="flex items-center">
        <h4 class="text-xl font-semibold leading-9">
          Merge suggestions <span v-if="!loading" class="font-light text-gray-500">({{ total }})</span>
        </h4>
        <el-tooltip
          placement="top"
          content="LFX is constantly checking your community for duplicate organizations. Here you can check all the merge suggestions."
        >
          <i class="ri-question-line text-lg text-gray-500 flex items-center ml-2 h-5" />
        </el-tooltip>
      </div>

      <div
        v-if="page <= 1 && loading && mergeSuggestions.length === 0"
        class="flex justify-center pt-8"
      >
        <cr-spinner />
      </div>

      <cr-table v-else class="mt-6">
        <thead>
          <tr>
            <th colspan="2">
              Organizations
            </th>
            <th>Confidence level</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(suggestion, si) of mergeSuggestions" :key="si">
            <td>
              <div class="flex items-center">
                <router-link
                  :to="{
                    name: 'organizationView',
                    params: { id: suggestion.organizations[0].id },
                    query: { projectGroup: selectedProjectGroup?.id },
                  }"
                  target="_blank"
                  class="text-black hover:text-brand-500"
                >
                  <div class="flex items-center gap-2">
                    <app-avatar
                      size="xs"
                      :entity="{
                        ...suggestion.organizations[0],
                        avatar: suggestion.organizations[0].logo,
                        displayName: (suggestion.organizations[0].displayName || suggestion.organizations[0].name)?.replace('@', ''),
                      }"
                    />

                    <p class="text-xs leading-5 font-semibold whitespace-nowrap">
                      {{ suggestion.organizations[0].displayName }}
                    </p>
                  </div>
                </router-link>
              </div>
            </td>
            <td>
              <div class="flex items-center">
                <router-link
                  :to="{
                    name: 'organizationView',
                    params: { id: suggestion.organizations[1].id },
                    query: { projectGroup: selectedProjectGroup?.id },
                  }"
                  target="_blank"
                  class="text-black hover:text-brand-500"
                >
                  <div class="flex items-center gap-2">
                    <i class="text-xl ri-subtract-line text-gray-300" />
                    <app-avatar
                      size="xs"
                      :entity="{
                        ...suggestion.organizations[1],
                        avatar: suggestion.organizations[1].logo,
                        displayName: (suggestion.organizations[1].displayName || suggestion.organizations[1].name)?.replace('@', ''),
                      }"
                    />
                    <p class="text-xs leading-5 font-semibold whitespace-nowrap">
                      {{ suggestion.organizations[1].displayName }}
                    </p>
                  </div>
                </router-link>
              </div>
            </td>
            <td>
              <app-member-merge-similarity :similarity="suggestion.similarity" />
            </td>
            <td class="w-48">
              <div class="flex justify-end items-center gap-3">
                <cr-button size="small" type="tertiary" @click="openDetails(si)">
                  View suggestion
                </cr-button>
                <cr-dropdown placement="bottom-end" width="15rem">
                  <template #trigger>
                    <cr-button
                      size="small"
                      type="tertiary-light-gray"
                      :loading="sending === `${suggestion.organizations[0].id}:${suggestion.organizations[1].id}`"
                      :icon-only="true"
                    >
                      <i class="ri-more-fill" />
                    </cr-button>
                  </template>

                  <cr-dropdown-item @click="merge(suggestion)">
                    <i class="ri-shuffle-line" /> Merge suggestion
                  </cr-dropdown-item>

                  <cr-dropdown-item @click="ignore(suggestion)">
                    <i class="ri-close-circle-line" />Ignore suggestion
                  </cr-dropdown-item>
                </cr-dropdown>
              </div>
            </td>
          </tr>
        </tbody>
      </cr-table>

      <div v-if="total > mergeSuggestions.length" class="mt-6 flex justify-center">
        <cr-button type="tertiary" size="small" :loading="loading" @click="loadMore()">
          <i class="ri-arrow-down-line" />Load more
        </cr-button>
      </div>
    </div>
  </app-page-wrapper>
  <app-organization-merge-suggestions-dialog
    v-model="isModalOpen"
    :offset="detailsOffset"
    @reload="reload()"
  />
</template>

<script setup lang="ts">
import AppBackLink from '@/shared/modules/back-link/components/back-link.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { onMounted, ref } from 'vue';
import Message from '@/shared/message/message';
import { OrganizationService } from '@/modules/organization/organization-service';
import CrButton from '@/ui-kit/button/Button.vue';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrTable from '@/ui-kit/table/Table.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import AppMemberMergeSimilarity from '@/modules/member/components/suggestions/member-merge-similarity.vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppOrganizationMergeSuggestionsDialog
  from '@/modules/organization/components/organization-merge-suggestions-dialog.vue';
import useOrganizationMergeMessage from '@/shared/modules/merge/config/useOrganizationMergeMessage';
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const mergeSuggestions = ref<any[]>([]);

const isModalOpen = ref<boolean>(false);

const total = ref<number>(0);
const limit = ref<number>(10);
const page = ref<number>(1);
const loading = ref<boolean>(false);

const loadMergeSuggestions = () => {
  loading.value = true;
  OrganizationService.fetchMergeSuggestions(limit.value, (page.value - 1) * limit.value)
    .then((res) => {
      total.value = +res.count;
      if (+res.offset > 0) {
        mergeSuggestions.value = mapSuggestions([...mergeSuggestions.value, ...res.rows]);
      } else {
        mergeSuggestions.value = mapSuggestions(res.rows);
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const mapSuggestions = (suggestions: any[]) => suggestions
  .filter((s) => s.similarity > 0)
  .map((s) => {
    const suggestion = { ...s };
    if (s.organizations.length >= 2 && ((s.organizations[0].identities.length < s.organizations[1].identities.length)
      || (s.organizations[0].activityCount < s.organizations[1].activityCount))) {
      suggestion.organizations.reverse();
    }
    return suggestion;
  });

const detailsOffset = ref<number>(0);

const openDetails = (index: number) => {
  detailsOffset.value = index;
  isModalOpen.value = true;
};

const reload = () => {
  page.value = 1;
  loadMergeSuggestions();
};

const loadMore = () => {
  page.value += 1;
  loadMergeSuggestions();
};

const sending = ref<string>('');

const merge = (suggestion: any) => {
  if (sending.value.length) {
    return;
  }
  const primaryOrganization = suggestion.organizations[0];
  const secondaryOrganization = suggestion.organizations[1];
  sending.value = `${primaryOrganization.id}:${secondaryOrganization.id}`;

  const { loadingMessage, successMessage } = useOrganizationMergeMessage;

  loadingMessage();

  OrganizationService.mergeOrganizations(primaryOrganization.id, secondaryOrganization.id)
    .then(() => {
      successMessage({
        primaryOrganization,
        secondaryOrganization,
      });
    })
    .finally(() => {
      reload();
      sending.value = '';
    });
};

const ignore = (suggestion: any) => {
  if (sending.value.length) {
    return;
  }
  const primaryMember = suggestion.members[0];
  const secondaryMember = suggestion.members[1];
  sending.value = `${primaryMember.id}:${secondaryMember.id}`;
  OrganizationService.addToNoMerge(...suggestion.members)
    .then(() => {
      Message.success('Merging suggestion ignored successfuly');
      reload();
    })
    .finally(() => {
      sending.value = '';
    });
};

onMounted(() => {
  loadMergeSuggestions();
});
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationMergeSuggestionsPage',
};
</script>

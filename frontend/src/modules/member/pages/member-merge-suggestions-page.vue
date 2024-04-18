<template>
  <app-page-wrapper>
    <div>
      <app-back-link
        :default-route="{
          path: '/contributors',
          query: { projectGroup: selectedProjectGroup?.id },
        }"
        class="font-semibold"
      >
        <template #default>
          Contributors
        </template>
      </app-back-link>
      <div class="flex items-center">
        <h4 class="text-xl font-semibold leading-9">
          Merge suggestions <span v-if="!loading" class="font-light text-gray-500">({{ total }})</span>
        </h4>
        <el-tooltip
          placement="top"
          content="LFX is constantly checking your community for duplicate contributors. Here you can check all the merging suggestions."
        >
          <i class="ri-question-line text-lg text-gray-400 flex items-center ml-2 h-5" />
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
              Contributors
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
                    name: 'memberView',
                    params: { id: suggestion.members[0].id },
                    query: { projectGroup: selectedProjectGroup?.id },
                  }"
                  target="_blank"
                  class="text-black hover:text-primary-500"
                >
                  <div class="flex items-center gap-2">
                    <app-avatar
                      :entity="suggestion.members[0]"
                      size="xs"
                    />
                    <p class="text-xs leading-5 font-semibold whitespace-nowrap">
                      {{ suggestion.members[0].displayName }}
                    </p>
                  </div>
                </router-link>
              </div>
            </td>
            <td>
              <div class="flex items-center">
                <router-link
                  :to="{
                    name: 'memberView',
                    params: { id: suggestion.members[0].id },
                    query: { projectGroup: selectedProjectGroup?.id },
                  }"
                  target="_blank"
                  class="text-black hover:text-primary-500"
                >
                  <div class="flex items-center gap-2">
                    <i class="text-xl ri-subtract-line text-gray-300" />
                    <app-avatar
                      :entity="suggestion.members[1]"
                      size="xs"
                    />
                    <p class="text-xs leading-5 font-semibold whitespace-nowrap">
                      {{ suggestion.members[1].displayName }}
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
                      :loading="sending === `${suggestion.members[0].id}:${suggestion.members[1].id}`"
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
  <app-member-merge-suggestions-dialog
    v-model="isModalOpen"
    :offset="detailsOffset"
    @reload="reload()"
  />
</template>

<script setup lang="ts">
import AppBackLink from '@/shared/modules/back-link/components/back-link.vue';
import CrTable from '@/ui-kit/table/Table.vue';
import { MemberService } from '@/modules/member/member-service';
import { onMounted, ref } from 'vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import CrButton from '@/ui-kit/button/Button.vue';
import AppMemberMergeSimilarity from '@/modules/member/components/suggestions/member-merge-similarity.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import AppMemberMergeSuggestionsDialog from '@/modules/member/components/member-merge-suggestions-dialog.vue';
import useMemberMergeMessage from '@/shared/modules/merge/config/useMemberMergeMessage';
import Message from '@/shared/message/message';
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
  MemberService.fetchMergeSuggestions(limit.value, (page.value - 1) * limit.value)
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
    if (s.members.length >= 2 && ((s.members[0].identities.length < s.members[1].identities.length)
        || (s.members[0].activityCount < s.members[1].activityCount))) {
      suggestion.members.reverse();
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
  const primaryMember = suggestion.members[0];
  const secondaryMember = suggestion.members[1];
  sending.value = `${primaryMember.id}:${secondaryMember.id}`;

  const { loadingMessage, successMessage } = useMemberMergeMessage;

  loadingMessage();

  MemberService.merge(primaryMember, secondaryMember)
    .then(() => {
      successMessage({
        primaryMember,
        secondaryMember,
        selectedProjectGroupId: selectedProjectGroup.value?.id as string,
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
  MemberService.addToNoMerge(...suggestion.members)
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
  name: 'AppMemberMergeSuggestionsPage',
};
</script>

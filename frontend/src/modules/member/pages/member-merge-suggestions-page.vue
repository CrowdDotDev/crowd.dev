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
          Merging suggestions <span class="font-light text-gray-500">({{ total }})</span>
        </h4>
        <el-tooltip
          placement="top"
          content="LFX is constantly checking your community for duplicate contributors. Here you can check all the merging suggestions."
        >
          <i class="ri-question-line text-lg text-gray-500 flex items-center ml-2 h-5" />
        </el-tooltip>
      </div>

      <cr-table class="mt-6">
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
              <div class="flex items-center gap-2">
                <app-avatar
                  :entity="suggestion.members[0]"
                  size="xs"
                />
                <p class="text-xs leading-5 font-semibold">
                  {{ suggestion.members[0].displayName }}
                </p>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <i class="text-xl ri-subtract-line text-gray-300" />
                <app-avatar
                  :entity="suggestion.members[1]"
                  size="xs"
                />
                <p class="text-xs leading-5 font-semibold">
                  {{ suggestion.members[1].displayName }}
                </p>
              </div>
            </td>
            <td>
              <app-member-merge-similarity :similarity="suggestion.similarity" />
            </td>
            <td class="w-48">
              <div class="flex justify-end items-center gap-3">
                <cr-button size="small" type="tertiary">
                  View suggestion
                </cr-button>
                <cr-button size="small" type="tertiary-light-gray" :icon-only="true">
                  <i class="ri-more-fill" />
                </cr-button>
              </div>
            </td>
          </tr>
        </tbody>
      </cr-table>
    </div>
  </app-page-wrapper>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppBackLink from '@/shared/modules/back-link/components/back-link.vue';
import CrTable from '@/ui-kit/table/Table.vue';
import { MemberService } from '@/modules/member/member-service';
import { onMounted, ref } from 'vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import CrButton from '@/ui-kit/button/Button.vue';
import AppMemberMergeSimilarity from '@/modules/member/components/suggestions/member-merge-similarity.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const mergeSuggestions = ref<any[]>([]);

const total = ref<number>(0);
const limit = ref<number>(10);
const offset = ref<number>(0);

const loadMergeSuggestions = () => {
  MemberService.fetchMergeSuggestions(limit.value, offset.value)
    .then((res) => {
      total.value = +res.count;
      mergeSuggestions.value = res.rows;
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

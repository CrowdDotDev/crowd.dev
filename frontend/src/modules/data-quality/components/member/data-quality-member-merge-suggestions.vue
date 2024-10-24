<template>
  <div>
    <div v-if="loading && offset === 0" class="flex justify-center py-20">
      <lf-spinner />
    </div>
    <div v-else-if="mergeSuggestions.length > 0">
      <lf-data-quality-member-merge-suggestions-item
        v-for="(suggestion, si) in mergeSuggestions"
        :key="suggestion.id"
        :suggestion="suggestion"
      >
        <template #action>
          <lf-button type="secondary" size="small" @click="isModalOpen = true; detailsOffset = si">
            <lf-icon name="eye-line" />View merge suggestion
          </lf-button>
        </template>
      </lf-data-quality-member-merge-suggestions-item>
      <div v-if="mergeSuggestions.length < total" class="pt-4">
        <lf-button type="primary-ghost" size="small" :loading="loading" @click="loadMore()">
          <i class="ri-arrow-down-line" />Load more
        </lf-button>
      </div>
    </div>
    <div v-else class="flex flex-col items-center pt-16">
      <div
        class="ri-shuffle-line text-gray-200 text-10xl h-40 flex items-center mb-8"
      />
      <h5 class="text-center text-lg font-semibold mb-4">
        No merge suggestions
      </h5>
      <p class="text-sm text-center text-gray-600 leading-5">
        We couldn't find any duplicated profiles
      </p>
    </div>
  </div>
  <app-member-merge-suggestions-dialog
    v-model="isModalOpen"
    :offset="detailsOffset"
    :query="{
      orderBy: ['activityCount_DESC'],
    }"
    @reload="offset = 0; loadMergeSuggestions()"
  />
</template>

<script lang="ts" setup>
import { MemberService } from '@/modules/member/member-service';
import { onMounted, ref, watch } from 'vue';
import LfDataQualityMemberMergeSuggestionsItem
  from '@/modules/data-quality/components/member/data-quality-member-merge-suggestions-item.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppMemberMergeSuggestionsDialog from '@/modules/member/components/member-merge-suggestions-dialog.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';

const props = defineProps<{
  projectGroup: string,
}>();

const loading = ref(true);
const limit = ref(20);
const offset = ref(0);
const total = ref(0);
const mergeSuggestions = ref<any[]>([]);

const isModalOpen = ref<boolean>(false);
const detailsOffset = ref<number>(0);

const { projectGroups } = storeToRefs(useLfSegmentsStore());

const loadMergeSuggestions = () => {
  loading.value = true;
  const projectGroup = projectGroups.value.list.find((g) => g.id === props.projectGroup);
  const segments = [
    ...getSegmentsFromProjectGroup(projectGroup),
    props.projectGroup,
  ];
  MemberService.fetchMergeSuggestions(limit.value, offset.value, {
    orderBy: ['activityCount_DESC'],
    detail: false,
    segments,
  })
    .then((res) => {
      total.value = +res.count;
      const rows = res.rows.filter((s: any) => s.similarity > 0);
      if (+res.offset > 0) {
        mergeSuggestions.value = [...mergeSuggestions.value, ...rows];
      } else {
        mergeSuggestions.value = rows;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const loadMore = () => {
  offset.value = mergeSuggestions.value.length;
  loadMergeSuggestions();
};

watch(() => props.projectGroup, () => {
  offset.value = 0;
  loadMergeSuggestions();
});

onMounted(() => {
  loadMergeSuggestions();
});
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMemberMergeSuggestions',
};
</script>

<template>
  <div>
    <div v-if="props.types.length > 1" class="pt-4 gap-2 flex flex-col pb-4">
      <lf-radio
        v-for="type of props.types"
        :key="type"
        v-model="selectedType"
        :value="type"
        name="issueType"
      >
        {{ dataIssueTypes[type].label }}
      </lf-radio>
    </div>
    <div v-if="loading && offset === 0" class="flex justify-center py-20">
      <lf-spinner />
    </div>
    <div v-else-if="members.length > 0">
      <lf-data-quality-member-issues-item
        v-for="(member) of members"
        :key="member.id"
        :member="member"
        :type="selectedType"
      />
      <div v-if="members.length < total" class="pt-4">
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
        No member issues found
      </h5>
      <p class="text-sm text-center text-gray-600 leading-5">
        We couldn't find any issues with members
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { DataIssueType } from '@/modules/data-quality/types/DataIssueType';
import LfRadio from '@/ui-kit/radio/Radio.vue';
import { DataQualityApiService } from '@/modules/data-quality/services/data-quality.api.service';
import LfDataQualityMemberIssuesItem
  from '@/modules/data-quality/components/member/data-quality-member-issues-item.vue';
import { dataIssueTypes } from '../../config/data-issue-types';

const props = defineProps<{
  types: DataIssueType[]
}>();

const loading = ref(true);
const limit = ref(20);
const offset = ref(0);
const total = ref(0);
const members = ref<any[]>([]);

const selectedType = ref<string>(props.types?.[0] || '');

const loadDataIssues = () => {
  loading.value = true;
  DataQualityApiService.findMemberIssues({
    type: selectedType.value,
    limit: limit.value,
    offset: offset.value,
  }, [])
    .then((res) => {
      if (offset.value > 0) {
        members.value = [...members.value, ...res];
      } else {
        members.value = res;
      }
      if (res.length < limit.value) {
        total.value = members.value.length;
      } else {
        total.value = members.value.length + 1;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const loadMore = () => {
  offset.value = members.value.length;
  loadDataIssues();
};

watch(selectedType, () => {
  offset.value = 0;
  loadDataIssues();
});

onMounted(() => {
  loadDataIssues();
});
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMemberIssues',
};
</script>

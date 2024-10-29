<template>
  <div>
    <div v-if="loading && offset === 0" class="flex justify-center py-20">
      <lf-spinner />
    </div>
    <div v-else-if="members.length > 0">
      <lf-data-quality-member-issues-item
        v-for="(member) of members"
        :key="member.id"
        :member="member"
        :type="props.type"
      >
        <template #action>
          <router-link
            :to="{
              name: 'memberView',
              params: { id: member.id },
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            target="_blank"
          >
            <lf-button type="secondary" size="small">
              <lf-icon-old name="external-link-line" />Review profile
            </lf-button>
          </router-link>
        </template>
      </lf-data-quality-member-issues-item>
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
import { DataQualityApiService } from '@/modules/data-quality/services/data-quality.api.service';
import LfDataQualityMemberIssuesItem
  from '@/modules/data-quality/components/member/data-quality-member-issues-item.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const props = defineProps<{
  type: DataIssueType,
  projectGroup: string,
}>();

const loading = ref(true);
const limit = ref(20);
const offset = ref(0);
const total = ref(0);
const members = ref<any[]>([]);

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const loadDataIssues = () => {
  loading.value = true;
  if (offset.value === 0) {
    members.value = [];
  }
  DataQualityApiService.findMemberIssues({
    type: props.type,
    limit: limit.value,
    offset: offset.value,
  }, [props.projectGroup])
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

watch(() => props.type, () => {
  offset.value = 0;
  loadDataIssues();
});

watch(() => props.projectGroup, () => {
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

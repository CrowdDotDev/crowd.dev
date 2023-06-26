<template>
  <div :class="`${computedModule}-filter`">
    <app-filter-list
      module="activity"
      :placeholder="computedPlaceholder"
      :search-filter="search"
    >
      <template #dropdown>
        <app-filter-dropdown
          module="activity"
          :attributes="attributes"
        />
      </template>
    </app-filter-list>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { onMounted, defineProps, computed } from 'vue';
import { ActivityModel } from '@/modules/activity/activity-model';
import { ConversationModel } from '@/modules/conversation/conversation-model';
import SentimentField from '@/shared/fields/sentiment-field';

const store = useStore();
const props = defineProps({
  module: {
    type: String,
    required: true,
  },
});
const activeView = computed(
  () => store.getters['activity/activeView'],
);
const computedModule = computed(() => {
  if (props.module === 'activities') {
    return 'activity';
  }

  return 'conversation';
});

const computedPlaceholder = computed(() => {
  if (props.module === 'activities') {
    return 'Search activities...';
  }

  return 'Search conversations...';
});

const search = computed(() => {
  const fields = props.module === 'activities'
    ? ActivityModel.fields
    : ConversationModel.fields;

  return fields.search.forFilter();
});

const attributes = computed(() => {
  const fields = props.module === 'activities'
    ? ActivityModel.fields
    : ConversationModel.fields;

  return Object.values(fields).filter((f) => f.filterable);
});

async function doFetch() {
  const { filter } = store.state.activity;

  await store.dispatch('activity/doFetch', {
    filter,
    keepPagination: false,
  });
}

onMounted(async () => {
  // Ob Conversations tab, the fetch is already done on the changeActiveView action
  if (activeView.value.type !== 'conversations') {
    await doFetch();
  }

  const params = new URLSearchParams(window.location.search);

  if (
    params.get('sentiment')
    && activeView.value.type === 'activities'
  ) {
    const sentimentField = new SentimentField(
      'sentiment',
      'Sentiment',
    );
    await store.dispatch('activity/addFilterAttribute', {
      ...sentimentField.forFilter(),
      value: [
        sentimentField
          .dropdownOptions()
          .find((o) => o.value === params.get('sentiment')),
      ],
    });
  }
});
</script>

<script>
export default {
  name: 'AppActivityListFilter',
};
</script>

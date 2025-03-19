<template>
  <app-drawer
    v-model="model"
    has-border
    :has-padding="false"
    :size="600"
    :show-footer="false"
  >
    <template #header>
      <div v-if="!loading" class="flex items-center gap-1.5">
        <img :alt="platform?.name" class="min-w-6 h-6" :src="platform?.image" />
        <span class="text-lg font-medium text-black">{{
          configuration?.conversationTitle
        }}</span>
      </div>
    </template>
    <template #header-label>
      <component
        :is="configuration?.conversationActivityLink"
        v-if="!loading && configuration?.conversationActivityLink"
        :activity="conversation.conversationStarter"
      />
      <app-activity-link
        v-else-if="!loading"
        :activity="conversation.conversationStarter"
      />
    </template>
    <template #content>
      <article v-if="loading" class="px-6 pt-8 flex flex-col gap-6">
        <div v-for="el of Array(3)" :key="el" class="flex relative">
          <app-loading height="32px" width="32px" radius="50%" />
          <div class="flex-grow pl-3 pt-2.5">
            <app-loading height="12px" width="320px" class="mb-3" />
            <app-loading height="12px" width="280px" />
          </div>
        </div>
      </article>
      <div v-else class="flex flex-col">
        <component
          :is="configuration?.conversationDrawerHeaderContent"
          :conversation="conversation"
        />
        <component
          :is="configuration?.conversationDrawerContent"
          :conversation="conversation"
        />
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Conversation } from '@/shared/modules/conversation/types/Conversation';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
import config from '@/modules/conversation/config/display/main';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { lfIdentities } from '@/config/identities';

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();
const props = defineProps<{
  modelValue: boolean;
  conversation: Conversation;
  loading: boolean;
}>();

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const platform = computed(
  () => props.conversation
    && lfIdentities[props.conversation.platform],
);
const configuration = computed(() => config.git);
</script>

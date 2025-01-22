Z<template>
  <slot
    name="footer"
    v-bind="{
      sourceId,
      attributes,
      replyContent,
    }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IdentityConfig, lfIdentities } from '@/config/identities';

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});

const attributes = computed(() => props.conversation.conversationStarter?.attributes);
const sourceId = computed(() => {
  if (props.conversation.conversationStarter.type === 'authored-commit') {
    return props.conversation.conversationStarter.sourceId;
  }

  return props.conversation.conversationStarter.parent?.sourceId;
});

const platformConfig = computed<IdentityConfig>(() => lfIdentities[props.conversation.conversationStarter?.platform]);

const replyContent = computed(() => platformConfig.value?.conversation?.replyContent?.(props.conversation));
</script>

<script lang="ts">
export default {
  name: 'AppConversationParentFooter',
};
</script>

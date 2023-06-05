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

<script setup>
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});

const attributes = computed(() => props.conversation.conversationStarter?.attributes);
const sourceId = computed(() => props.conversation.conversationStarter?.sourceId);

const platformConfig = computed(() => CrowdIntegrations.getConfig(
  props.conversation.conversationStarter?.platform,
));

const replyContent = computed(() => platformConfig.value?.conversationDisplay?.replyContent(props.conversation));
</script>

<script>
export default {
  name: 'AppConversationParentFooter',
};
</script>

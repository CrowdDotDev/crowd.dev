<template>
  <lf-dropdown placement="bottom-end" width="15rem">
    <template #trigger>
      <lf-button
        size="small"
        type="secondary-ghost"
        :icon-only="true"
      >
        <lf-icon-old name="more-fill" />
      </lf-button>
    </template>

    <lf-dropdown-item @click="merge(props.suggestion)">
      <i class="ri-shuffle-line" /> Merge suggestion
    </lf-dropdown-item>

    <lf-dropdown-item @click="ignore(props.suggestion)">
      <i class="ri-close-circle-line" />Ignore suggestion
    </lf-dropdown-item>
  </lf-dropdown>
</template>

<script setup lang="ts">
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import useMemberMergeMessage from '@/shared/modules/merge/config/useMemberMergeMessage';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { ref } from 'vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';

const props = defineProps<{
  suggestion: any,
}>();

const emit = defineEmits<{(e: 'reload'): void}>();

const { trackEvent } = useProductTracking();

const sending = ref<string>('');

const merge = (suggestion: any) => {
  if (sending.value.length) {
    return;
  }

  trackEvent({
    key: FeatureEventKey.MERGE_MEMBER_MERGE_SUGGESTION,
    type: EventType.FEATURE,
    properties: {
      similarity: suggestion.similarity,
    },
  });

  const primaryMember = suggestion.members[0];
  const secondaryMember = suggestion.members[1];
  sending.value = `${primaryMember.id}:${secondaryMember.id}`;

  const { loadingMessage } = useMemberMergeMessage;

  loadingMessage();

  MemberService.merge(primaryMember, secondaryMember)
    .then(() => {
      Message.closeAll();
      Message.info(
        "We're finalizing profiles merging. We will let you know once the process is completed.",
        {
          title: 'Profiles merging in progress',
        },
      );
    })
    .finally(() => {
      emit('reload');
      sending.value = '';
    });
};

const ignore = (suggestion: any) => {
  if (sending.value.length) {
    return;
  }

  trackEvent({
    key: FeatureEventKey.IGNORE_MEMBER_MERGE_SUGGESTION,
    type: EventType.FEATURE,
    properties: {
      similarity: suggestion.similarity,
    },
  });

  const primaryMember = suggestion.members[0];
  const secondaryMember = suggestion.members[1];
  sending.value = `${primaryMember.id}:${secondaryMember.id}`;
  MemberService.addToNoMerge(...suggestion.members)
    .then(() => {
      Message.success('Merging suggestion ignored successfully');
      emit('reload');
    })
    .finally(() => {
      sending.value = '';
    });
};

</script>

<script lang="ts">
export default {
  name: 'LfMemberMergeSuggestionDropdown',
};
</script>

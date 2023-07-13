<template>
  <app-dialog
    v-model="isModalOpen"
    title="Merge member"
    size="2extra-large"
  >
    <template #content>
      <div class="p-6 relative border-t">
        <div class="flex -mx-3">
          <div class="w-1/2 px-3">
            <app-member-suggestions-details
              v-if="props.modelValue"
              :member="props.modelValue"
              :compare-member="memberToMerge"
              :is-primary="originalMemberPrimary"
              @make-primary="originalMemberPrimary = true"
            />
          </div>
          <div class="w-1/2 px-3">
            <app-member-selection-dropdown
              v-if="memberToMerge === null"
              :id="props.modelValue?.id"
              v-model="memberToMerge"
              style="margin-right: 5px"
            />
            <app-member-suggestions-details
              v-else
              :member="memberToMerge"
              :compare-member="props.modelValue"
              :is-primary="!originalMemberPrimary"
              @make-primary="originalMemberPrimary = false"
            >
              <template #action>
                <button
                  class="btn btn-link btn-link--sm btn-link--primary leading-5 !px-4 !py-1"
                  type="button"
                  @click="changeMember()"
                >
                  <span class="ri-refresh-line text-base text-brand-500 mr-2" />
                  <span class="text-brand-500">Change contributor</span>
                </button>
              </template>
            </app-member-suggestions-details>
          </div>
        </div>
        <div class="pt-6 flex justify-end">
          <el-button class="btn btn--secondary btn--lg mr-4" @click="emit('update:modelValue', null)">
            Cancel
          </el-button>
          <el-button
            class="btn btn--primary btn--lg"
            :disabled="!memberToMerge"
            :loading="sendingMerge"
            @click="mergeSuggestion()"
          >
            Merge contributors
          </el-button>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useMemberStore } from '@/modules/member/store/pinia';
import AppMemberSelectionDropdown from './member-selection-dropdown.vue';
import AppMemberSuggestionsDetails from './suggestions/member-merge-suggestions-details.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const route = useRoute();

const { doFind } = mapActions('member');
const { fetchMembers } = useMemberStore();

const originalMemberPrimary = ref(true);
const sendingMerge = ref(false);

const memberToMerge = ref(null);

const isModalOpen = computed({
  get() {
    return props.modelValue !== null;
  },
  set() {
    emit('update:modelValue', null);
    memberToMerge.value = null;
  },
});

const changeMember = () => {
  memberToMerge.value = null;
  originalMemberPrimary.value = true;
};

const mergeSuggestion = () => {
  if (sendingMerge.value) {
    return;
  }

  sendingMerge.value = true;

  MemberService.merge(
    originalMemberPrimary.value ? props.modelValue : memberToMerge.value,
    originalMemberPrimary.value ? memberToMerge.value : props.modelValue,
  )
    .then(() => {
      Message.success('Members merged successfuly');

      emit('update:modelValue', null);

      if (route.name === 'memberView') {
        doFind((originalMemberPrimary.value ? props.modelValue : memberToMerge.value).id);
      } else if (route.name === 'member') {
        fetchMembers({ reload: true });
      }
    })
    .catch(() => {
      Message.error('There was an error merging contributors');
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

</script>

<script>
export default {
  name: 'AppMemberMergeDialog',
};
</script>

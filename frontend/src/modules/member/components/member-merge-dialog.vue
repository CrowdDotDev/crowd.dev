<template>
  <app-dialog
    v-if="isModalOpen"
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
import { useRoute, useRouter } from 'vue-router';
import { MemberService } from '@/modules/member/member-service';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import useMemberMergeMessage from '@/shared/modules/merge/config/useMemberMergeMessage';
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
const router = useRouter();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

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

  const primaryMember = originalMemberPrimary.value ? props.modelValue : memberToMerge.value;
  const secondaryMember = originalMemberPrimary.value ? memberToMerge.value : props.modelValue;

  const { loadingMessage, successMessage, apiErrorMessage } = useMemberMergeMessage;

  loadingMessage();

  MemberService.merge(primaryMember, secondaryMember)
    .then(() => {
      emit('update:modelValue', null);

      if (route.name === 'memberView') {
        successMessage({
          primaryMember,
          secondaryMember,
          selectedProjectGroupId: selectedProjectGroup.value?.id,
        });

        doFind(id).then(() => {
          router.replace({
            params: {
              id: primaryMember.id,
            },
          });
        });
      } else if (route.name === 'member') {
        successMessage({
          primaryMember,
          secondaryMember,
          selectedProjectGroupId: selectedProjectGroup.value?.id,
        });

        fetchMembers({ reload: true });
      }
    })
    .catch((error) => {
      apiErrorMessage({ error });
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

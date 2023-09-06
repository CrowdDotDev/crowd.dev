<template>
  <app-dialog
    v-if="isModalOpen"
    v-model="isModalOpen"
    title="Merge organization"
    size="2extra-large"
  >
    <template #content>
      <div class="p-6 relative border-t">
        <div class="flex -mx-3">
          <div class="w-1/2 px-3">
            <app-organization-merge-suggestions-details
              v-if="props.modelValue"
              :organization="props.modelValue"
              :compare-organization="organizationToMerge"
              :is-primary="originalOrganizationPrimary"
              @make-primary="originalOrganizationPrimary = true"
            />
          </div>
          <div class="w-1/2 px-3">
            <!--            <app-member-selection-dropdown-->
            <!--              v-if="memberToMerge === null"-->
            <!--              :id="props.modelValue?.id"-->
            <!--              v-model="memberToMerge"-->
            <!--              style="margin-right: 5px"-->
            <!--            />-->
            <!--            <app-member-suggestions-details-->
            <!--              v-else-->
            <!--              :member="memberToMerge"-->
            <!--              :compare-member="props.modelValue"-->
            <!--              :is-primary="!originalMemberPrimary"-->
            <!--              @make-primary="originalMemberPrimary = false"-->
            <!--            >-->
            <!--              <template #action>-->
            <!--                <button-->
            <!--                  class="btn btn&#45;&#45;transparent btn&#45;&#45;sm leading-5 !px-4 !py-1"-->
            <!--                  type="button"-->
            <!--                  @click="changeMember()"-->
            <!--                >-->
            <!--                  <span class="ri-refresh-line text-base text-brand-500 mr-2" />-->
            <!--                  <span class="text-brand-500">Change member</span>-->
            <!--                </button>-->
            <!--              </template>-->
            <!--            </app-member-suggestions-details>-->
            <!--          </div>-->
          </div>
        </div>
        <div class="pt-6 flex justify-end">
          <el-button class="btn btn--bordered btn--lg mr-4" @click="emit('update:modelValue', null)">
            Cancel
          </el-button>
          <el-button
            class="btn btn--primary btn--lg"
            :disabled="!organizationToMerge"
            :loading="sendingMerge"
            @click="mergeSuggestion()"
          >
            Merge members
          </el-button>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import Message from '@/shared/message/message';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import AppDialog from '@/shared/dialog/dialog.vue';
import AppOrganizationMergeSuggestionsDetails
  from '@/modules/organization/components/suggestions/organization-merge-suggestions-details.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { OrganizationService } from '@/modules/organization/organization-service';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const route = useRoute();

const { doFind } = mapActions('organization');
const { fetchOrganizations } = useOrganizationStore();

const originalOrganizationPrimary = ref(true);
const sendingMerge = ref(false);

const organizationToMerge = ref(null);

const isModalOpen = computed({
  get() {
    return props.modelValue !== null;
  },
  set() {
    emit('update:modelValue', null);
    organizationToMerge.value = null;
  },
});

const mergeSuggestion = () => {
  if (sendingMerge.value) {
    return;
  }

  sendingMerge.value = true;

  OrganizationService.mergeOrganizations(
    originalOrganizationPrimary.value ? props.modelValue?.id : organizationToMerge.value?.id,
    originalOrganizationPrimary.value ? organizationToMerge.value?.id : props.modelValue?.id,
  )
    .then(() => {
      Message.success('Organizations merged successfuly');

      emit('update:modelValue', null);

      if (route.name === 'organizationView') {
        doFind((originalOrganizationPrimary.value ? props.modelValue : organizationToMerge.value).id);
      } else if (route.name === 'organization') {
        fetchOrganizations({ reload: true });
      }
    })
    .catch(() => {
      Message.error('There was an error merging organizations');
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

</script>

<script>
export default {
  name: 'AppOrganizationMergeDialog',
};
</script>

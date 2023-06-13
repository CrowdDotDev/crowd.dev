<template>
  <div class="grid gap-x-12 grid-cols-3 mb-16">
    <div>
      <h6>Activities affiliation</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Affiliate contributor activities to organizations they belong to based
        on associated projects.
        <br />
        <br />
        If updated, only future activities will be affected. Past activities
        need to be updated manually and individually.
      </p>
    </div>
    <div class="col-span-2">
      <div class="flex gap-3 border-b h-8 items-center">
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-1/2"
        >Sub-project</span>
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide grow"
        >Affiliated organization
        </span>
      </div>
      <div class="flex mb-2 flex-col">
        <div
          v-for="(affiliation, index) in affiliationsList"
          :key="affiliation.segmentId"
          class="py-6 border-b border-gray-200 last:border-none"
        >
          <div class="flex gap-3 items-center">
            <div class="w-1/2">
              <div class="font-medium text-sm text-gray-900">
                {{ affiliation.segmentName }}
              </div>
              <div v-if="affiliation.segmentParentName" class="text-2xs">
                <span class="font-medium text-gray-400">Parent project: </span>
                <span class="text-gray-600">{{ affiliation.segmentParentName }}</span>
              </div>
            </div>

            <div class="grow">
              <el-select
                v-model="affiliation.organizationId"
                filterable
                class="w-full"
              >
                <template
                  v-if="affiliation.organizationId
                    && (affiliation.organizationLogo || getOrganization(affiliation.organizationId).logo)"
                  #prefix
                >
                  <img
                    :src="affiliation.organizationLogo || getOrganization(affiliation.organizationId).logo"
                    :alt="`${affiliation.organizationName || getOrganization(affiliation.organizationId).name} Logo`"
                    class="w-5 h-5"
                  />
                </template>
                <el-option
                  v-for="organization in availableOrganizations"
                  :key="organization.id"
                  :label="organization.name"
                  :value="organization.id"
                  class="!px-3"
                >
                  <div class="flex gap-2 items-center">
                    <img
                      v-if="organization.logo"
                      :src="organization.logo"
                      :alt="`${organization.name} Logo`"
                      class="w-5 h-5"
                    />
                    <div>{{ organization.name }}</div>
                  </div>
                </el-option>
              </el-select>
            </div>

            <el-button
              class="btn btn--md btn--transparent w-10 h-10"
              @click="deleteAffiliation(index)"
            >
              <i
                class="ri-delete-bin-line text-lg text-gray-600"
              />
            </el-button>
          </div>
        </div>
        <div class="mt-5">
          <el-button
            class="btn btn-link btn-link--primary"
            :disabled="!availableSubprojects.length"
            @click="isSubProjectsModalOpen = true"
          >
            + Add sub-project
          </el-button>
        </div>
      </div>
    </div>
  </div>
  <app-member-form-subprojects-modal
    v-if="isSubProjectsModalOpen"
    v-model="isSubProjectsModalOpen"
    :subprojects="availableSubprojects"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import AppMemberFormSubprojectsModal from './member-form-subprojects-modal.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  record: {
    type: Object,
    default: () => {},
  },
});

const isSubProjectsModalOpen = ref(false);
const affiliationsList = computed({
  get() {
    return props.modelValue.affiliations;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const availableSubprojects = computed(() => props.record.segments.filter(
  (segment) => !affiliationsList.value.some((affiliation) => affiliation.segmentId === segment.id),
));

const availableOrganizations = computed(() => [
  {
    id: null,
    name: 'Individual (no affiliation)',
  },
  ...props.record.organizations]);

const getOrganization = (id) => availableOrganizations.value.find((organization) => organization.id === id);

const onSubProjectSelection = (subproject) => {
  isSubProjectsModalOpen.value = false;
  affiliationsList.value.push({
    memberId: props.record.id,
    segmentId: subproject.id,
    segmentName: subproject.name,
    segmentParentName: subproject.parentName,
    organizationId: null,
  });
};

const deleteAffiliation = (index) => {
  affiliationsList.value.splice(index, 1);
};
</script>

<script>
export default {
  name: 'AppMemberFormAffiliations',
};
</script>

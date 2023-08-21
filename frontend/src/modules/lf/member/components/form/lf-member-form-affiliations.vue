<template>
  <div class="grid gap-x-12 grid-cols-4 mb-16">
    <div>
      <h6>Manual activities affiliation</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Activities organization affiliation can either be updated individually or here per project over a specific time span.
        <br />
        <br />
        <span class="font-semibold">Important note:</span>
        any manual affiliation updates won’t be overwritten by new organizations through work experience enrichments.
      </p>
    </div>
    <div class="col-span-3">
      <div class="flex gap-3 border-b h-8 items-center">
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-1/3"
        >ASSOCIATED PROJECT</span>
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide grow"
        >AFFILIATED ORGANIZATION / PERIOD
        </span>
      </div>
      <div class="flex mb-2 flex-col">
        <div
          v-for="(affiliation) in uniqueProjects"
          :key="affiliation.segmentId"
          class="py-6 border-b border-gray-200 last:border-none"
        >
          <div class="flex gap-3 items-center">
            <div class="w-1/3 self-start">
              <div class="font-medium text-sm text-gray-900">
                {{ affiliation.segmentName }}
              </div>
              <div v-if="affiliation.segmentParentName" class="text-2xs">
                <span class="font-medium text-gray-400">Parent project: </span>
                <span class="text-gray-600">{{ affiliation.segmentParentName }}</span>
              </div>
            </div>

            <div class="grow">
              <template v-for="(org, oi) in affiliationsList" :key="`${affiliation.segmentId}-${oi}`">
                <div v-if="affiliation.segmentId === org.segmentId" class="flex items-center mb-3">
                  <div class="grow">
                    <el-select
                      v-model="org.organizationId"
                      filterable
                      class="w-full grow"
                    >
                      <template
                        v-if="org.organizationId
                          && getOrganization(org.organizationId)?.logo"
                        #prefix
                      >
                        <img
                          :src="getOrganization(org.organizationId)?.logo"
                          :alt="`${getOrganization(org.organizationId)?.name} Logo`"
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
                  <div class="flex items-center h-10 basis-48 ml-3">
                    <el-date-picker
                      v-model="org.dateStart"
                      type="month"
                      placeholder="From"
                      class="!w-auto custom-date-range-picker date-from -mr-px !h-10"
                      popper-class="date-picker-popper"
                      format="MMM YYYY"
                      :clearable="false"
                      :disabled-date="(date) => org.dateEnd && moment(date).isAfter(org.dateEnd)"
                    />
                    <el-date-picker
                      v-model="org.dateEnd"
                      type="month"
                      :placeholder="org.dateStart ? '(Present)' : 'To'"
                      class="!w-auto custom-date-range-picker date-to !h-10"
                      popper-class="date-picker-popper"
                      format="MMM YYYY"
                      :clearable="false"
                      :disabled-date="(date) => org.dateStart && moment(date).isBefore(org.dateStart)"
                    />
                  </div>
                  <el-button
                    class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
                    @click="deleteOrganization(oi)"
                  >
                    <i
                      class="ri-delete-bin-line text-lg text-gray-600"
                    />
                  </el-button>
                </div>
              </template>

              <div>
                <el-button
                  class="btn btn-link btn-link--primary"
                  @click="addOrganization(affiliation)"
                >
                  + Add organization
                </el-button>
              </div>
            </div>
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
  <app-lf-member-form-subprojects-modal
    v-if="isSubProjectsModalOpen"
    v-model="isSubProjectsModalOpen"
    :subprojects="availableSubprojects"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup>
import {
  computed, ref,
} from 'vue';
import moment from 'moment';
import AppLfMemberFormSubprojectsModal from '@/modules/lf/member/components/form/lf-member-form-subprojects-modal.vue';

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

const availableSubprojects = computed(() => props.record.segments.filter(
  (segment) => !affiliationsList.value.some((affiliation) => affiliation.segmentId === segment.id),
));

const affiliationsList = computed({
  get() {
    return props.modelValue.affiliations;
  },
  set(v) {
    emit('update:modelValue', {
      ...props.modelValue,
      affiliations: v,
    });
  },
});

const uniqueProjects = computed(() => affiliationsList.value.filter(
  (value, index, self) => self.findIndex((v) => v.segmentId === value.segmentId) === index,
));

const availableOrganizations = computed(() => [
  {
    id: null,
    name: 'Individual (no affiliation)',
  },
  ...props.record.organizations]);

const getOrganization = (id) => availableOrganizations.value.find((organization) => organization.id === id);

const addOrganization = (affiliation) => {
  affiliationsList.value.push({
    segmentId: affiliation.segmentId,
    segmentName: affiliation.segmentName,
    segmentParentName: affiliation.segmentParentName,
    organizationId: null,
    dateStart: '',
    dateEnd: '',
  });
};

const onSubProjectSelection = (subproject) => {
  isSubProjectsModalOpen.value = false;
  affiliationsList.value.push({
    segmentId: subproject.id,
    segmentName: subproject.name,
    segmentParentName: subproject.parentName,
    organizationId: null,
    dateStart: '',
    dateEnd: '',
  });
};

const deleteOrganization = (index) => {
  affiliationsList.value.splice(index, 1);
};
</script>

<script>
export default {
  name: 'AppLfMemberFormAffiliations',
};
</script>

<style lang="scss">
.custom-date-range-picker{
  .el-icon{
    @apply hidden;
  }
  &.date-from{
    .el-input__wrapper{
      @apply rounded-r-none h-10 #{!important};
    }
  }
  &.date-to{
    .el-input__wrapper{
      @apply rounded-l-none h-10 #{!important};
    }
  }
}
</style>

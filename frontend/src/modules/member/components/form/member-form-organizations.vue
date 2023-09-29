<template>
  <div class="grid gap-x-12 grid-cols-4">
    <div>
      <h6>Organizations</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Organizations’ data is automatically obtained via enrichement (work experience).<br>
        <br>
        The config period will define each activity affiliation.
      </p>
    </div>
    <div
      class="col-span-3"
    >
      <div class="flex  border-b h-8 items-center">
        <div class="flex items-center flex-grow">
          <span
            class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-1/3"
          >Organization</span>
          <span
            class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-1/3"
          >Job Title</span>
          <span
            class="uppercase text-gray-400 text-2xs font-semibold tracking-wide grow w-1/3"
          >Period</span>
        </div>
        <div class="w-18" />
      </div>

      <div v-for="(config, oi) in organizations" :key="organization.id" class="flex gap-3 border-b h-8 items-center min-h-17">
        <div class="flex items-center w-full">
          <div class="w-1/3 flex items-center">
            <app-avatar
              :entity="{
                displayName: organization.displayName || organization.name,
                avatar: organization.logo,
              }"
              size="xxs"
              class="mr-2"
            />
            <p class="text-xs leading-5 pl-2">
              {{ config.displayName || config.name }}
            </p>
          </div>
          <div class="w-1/3">
            <p class="text-xs leading-5 pl-2">
              {{ config.memberOrganizations.title }}
            </p>
          </div>
          <div class="w-1/3">
            <p class="text-xs leading-5 pl-2">
              <span>
                {{ config.memberOrganizations.dateStart
                  ? moment(config.memberOrganizations.dateStart).utc().format('MMMM YYYY')
                  : 'Unknown' }}
              </span>
              <span class="mx-1 whitespace-nowrap">-></span>
              <span>
                {{ config.memberOrganizations.dateEnd
                  ? moment(config.memberOrganizations.dateEnd).utc().format('MMMM YYYY')
                  : config.memberOrganizations.dateStart ? 'Present' : 'Unknown' }}
              </span>
            </p>
          </div>
        </div>
        <div class="flex items-center">
          <div class="cursor-pointer h-8 w-8 mr-2 group" @click="edit(oi)">
            <span class="ri-pencil-line text-lg text-gray-400 group-hover:text-gray-500" />
          </div>
          <div class="cursor-pointer h-8 w-8 group" @click="organizations.splice(oi, 1)">
            <span class="ri-delete-bin-line text-lg text-gray-400 group-hover:text-gray-500" />
          </div>
        </div>
      </div>

      <div class="flex justify-start">
        <el-button class="btn btn-link btn-link--primary mt-5" @click="isOrganizationFormModalOpen = true">
          + Add config
        </el-button>
      </div>
    </div>
  </div>
  <app-member-form-organizations-create
    v-if="isOrganizationFormModalOpen"
    v-model="isOrganizationFormModalOpen"
    :organization="editOrganization !== null ? organizations[editOrganization] : null"
    @add="organizations.push($event)"
    @edit="update($event)"
    @update:model-value="!$event ? editOrganization = null : null"
  />
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import { Member } from '@/modules/member/types/Member';
import { Organization } from '@/modules/organization/types/Organization';
import moment from 'moment';
import AppMemberFormOrganizationsCreate from '@/modules/member/components/form/member-form-organizations-create.vue';

const emit = defineEmits<{(e: 'update:modelValue', value: Member): any}>();
const props = defineProps<{
  modelValue: Member,
}>();

const isOrganizationFormModalOpen = ref<boolean>(false);
const editOrganization = ref<number | null>(null);

const organizations = computed<Organization[]>({
  get() {
    return props.modelValue.organizations;
  },
  set(v) {
    emit('update:modelValue', {
      ...props.modelValue,
      organizations: v,
    });
  },
});

const edit = (organizationIndex: number) => {
  editOrganization.value = organizationIndex;
  isOrganizationFormModalOpen.value = true;
};

const update = (config: Organization) => {
  organizations.value[editOrganization.value] = organization;
  editOrganization.value = null;
};
</script>

<style lang="scss">
.custom-date-picker.organization {
  &.left {
    .el-input__wrapper {
      @apply rounded-l-md rounded-r-none h-10 border-r-0;
    }
  }

  &.right {
    .el-input__wrapper {
      @apply rounded-r-md rounded-l-none h-10 border-l-0;
    }
  }

  .el-input__wrapper {
    @apply h-10 flex flex-row;

    .el-input__prefix {
      @apply hidden;
    }
  }
}

.organization-input {
  .el-input__suffix-inner {
    @apply bg-white;
  }
}
</style>

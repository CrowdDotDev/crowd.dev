<template>
  <div class="grid gap-x-12 grid-cols-4">
    <div>
      <h6>Organizations</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Associate organizations to members to enhance their profile
      </p>
    </div>
    <div
      class="col-span-3"
    >
      <div class="flex gap-3 border-b h-8 items-center">
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-2/5"
        >Organization</span>
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-1/3"
        >Job Title</span>
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide grow w-1/3"
        >Period</span>
        <span class="w-10" />
      </div>

      <div
        v-if="!!organizations.length"
        class="flex mt-4 mb-2 flex-col gap-3"
      >
        <div
          v-for="(organization, index) in organizations"
          :key="organization.id"
          class="flex gap-3"
        >
          <div class="w-2/5">
            <app-autocomplete-one-input
              v-model="organizations[index]"
              :fetch-fn="fetchOrganizationsFn"
              :create-fn="createOrganizationFn"
              placeholder="Select or create an organization"
              input-class="organization-input"
              :create-if-not-found="true"
              :in-memory-filter="false"
              :clearable="false"
            >
              <template v-if="organization.displayName" #prefix>
                <div class="flex items-center">
                  <app-avatar
                    :entity="{
                      displayName: organization.displayName,
                      avatar: organization.logo,
                    }"
                    size="xxs"
                    class="mr-2"
                  />
                </div>
              </template>
              <template #option="{ item }">
                <div class="flex items-center">
                  <app-avatar
                    :entity="{
                      displayName: item.label,
                      avatar: item.logo,
                    }"
                    size="xxs"
                    class="mr-2"
                  />
                  {{ item.label }}
                </div>
              </template>
            </app-autocomplete-one-input>
          </div>

          <div class="w-1/3">
            <el-input
              v-model="organizations[index].memberOrganizations.title"
              clearable
            />
          </div>

          <div class="w-1/3">
            <el-date-picker
              v-model="dateRange[index]"
              type="daterange"
              start-placeholder="From"
              end-placeholder="To"
              format="MMM YYYY"
              class="custom-date-picker"
              popper-class="date-picker-popper"
              :prefix-icon="DateRangePickerPrefix"
              @change="(val: string[]) => onDatePickerChange(val, index)"
            >
              <template #range-separator>
                <el-divider direction="vertical" />
              </template>
            </el-date-picker>
          </div>

          <button
            type="button"
            class="btn btn--md btn--transparent w-10 h-10"
            @click="removeOrganization(index)"
          >
            <i
              class="ri-delete-bin-line text-lg text-gray-600"
            />
          </button>
        </div>
      </div>
      <div class="flex justify-start">
        <el-button class="btn btn-link btn-link--primary mt-4" @click="addOrganization">
          + Add organization
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, h, reactive, watch,
} from 'vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppAvatar from '@/shared/avatar/avatar.vue';
import { Member } from '@/modules/member/types/Member';
import { Organization } from '@/modules/organization/types/Organization';
import moment from 'moment';

const emit = defineEmits<{(e: 'update:modelValue', value: Member): any}>();
const props = defineProps<{
  modelValue: Member,
}>();

const dateRange = reactive<string[][]>([]);

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

const DateRangePickerPrefix = h(
  'span',
  [],
);

watch(() => props.modelValue.organizations, (updatedOrganizations) => {
  dateRange.splice(0, dateRange.length, ...updatedOrganizations.map((o) => [o.memberOrganizations?.dateStart, o.memberOrganizations?.dateEnd]));
}, {
  deep: true,
  immediate: true,
});

const fetchOrganizationsFn = (query: number, limit:number) => OrganizationService.listAutocomplete(query, limit)
  .then((options: Organization[]) => options.filter((m) => m.id !== props.modelValue.id).map((o) => ({
    ...o,
    displayName: o.label,
    memberOrganizations: {
      title: '',
      dateStart: '',
      dateEnd: '',
    },
  })))
  .catch(() => []);

const createOrganizationFn = (value: string) => OrganizationService.create({
  name: value,
})
  .then((newOrganization) => ({
    id: newOrganization.id,
    label: newOrganization.displayName,
  }))
  .catch(() => null);

const onDatePickerChange = (value: string[], index: number) => {
  organizations.value[index].memberOrganizations.dateStart = moment(value[0]).utc().toISOString();
  organizations.value[index].memberOrganizations.dateEnd = moment(value[1]).utc().toISOString();
};

const addOrganization = () => {
  organizations.value.push({
    id: '',
    name: '',
    memberOrganizations: {
      title: '',
      dateStart: '',
      dateEnd: '',
    },
  });
};

const removeOrganization = (index: number) => {
  organizations.value.splice(index, 1);
};
</script>

<style lang="scss">
.custom-date-picker.el-input__wrapper {
  @apply rounded-md;

  &.el-range-editor.is-active {
    box-shadow: none;
    border: 1px solid #4b5563;
  }

  .el-range__icon, .el-range__close-icon {
    @apply hidden;
  }

  .el-divider {
    @apply h-full;
  }

  input {
    @apply h-full w-full text-left px-1;
  }
}

.organization-input {
  .el-input__suffix-inner {
    @apply bg-white;
  }
}
</style>

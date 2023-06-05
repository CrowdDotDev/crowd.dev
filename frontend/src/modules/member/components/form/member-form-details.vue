<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Personal details</h6>
    <div class="col-span-2 personal-details-form">
      <el-form-item :label="fieldsValue.displayName.label">
        <el-input
          v-model="model[fieldsValue.displayName.name]"
        />
      </el-form-item>
      <el-form-item
        :label="fieldsValue.joinedAt.label"
        class="w-6/12 grow-0"
      >
        <el-date-picker
          v-model="model[fieldsValue.joinedAt.name]"
          :clearable="false"
          :prefix-icon="CalendarIcon"
          class="custom-date-picker"
          popper-class="date-picker-popper"
          type="date"
          placeholder="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item
        class="grow"
        :label="fieldsValue.jobTitle.label"
      >
        <el-input v-model="model.jobTitle" />
      </el-form-item>

      <el-form-item
        class="grow"
        :label="fieldsValue.organizations.label"
      >
        <app-autocomplete-many-input
          v-model="model.organizations"
          :fetch-fn="fetchOrganizationsFn"
          :create-fn="createOrganizationFn"
          placeholder="Type to search or create organizations"
          input-class="w-full"
          :create-if-not-found="true"
          :in-memory-filter="false"
        >
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
        </app-autocomplete-many-input>
      </el-form-item>

      <el-form-item :label="fieldsValue.bio.label">
        <el-input
          v-model="model.bio"
          type="textarea"
          :rows="4"
        />
      </el-form-item>

      <el-form-item :label="fieldsValue.location.label">
        <el-input v-model="model.location" />
      </el-form-item>

      <el-form-item :label="fieldsValue.tags.label">
        <app-tag-autocomplete-input
          v-model="model[fieldsValue.tags.name]"
          :fetch-fn="fieldsValue.tags.fetchFn"
          :mapper-fn="fieldsValue.tags.mapperFn"
          :create-if-not-found="true"
          placeholder="Enter tags..."
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import {
  defineEmits, defineProps, computed, h,
} from 'vue';
import AppTagAutocompleteInput from '@/modules/tag/components/tag-autocomplete-input.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppAvatar from '@/shared/avatar/avatar.vue';

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400',
  }, // props
  [],
);

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  fieldsValue: {
    type: Object,
    default: () => {},
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(newModel) {
    emit('update:modelValue', newModel);
  },
});

const fetchOrganizationsFn = (query, limit) => OrganizationService.listAutocomplete(query, limit)
  .then((options) => options.filter((m) => m.id !== props.id))
  .catch(() => []);

const createOrganizationFn = (value) => OrganizationService.create({
  name: value,
})
  .then((newOrganization) => ({
    id: newOrganization.id,
    label: newOrganization.displayName,
  }))
  .catch(() => null);
</script>

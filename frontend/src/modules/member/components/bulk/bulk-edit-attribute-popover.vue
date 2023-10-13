<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit attribute">
    <template #content>
      <div class="px-6 pb-6">
        <el-form
          ref="formRef"
          :model="formModel"
          class="attributes-form mt-1 mb-5"
          label-position="top"
        >
          <el-form-item
            label="Choose attribute"
            class="mb-6"
            required="true"
          >
            <app-bulk-edit-attribute-dropdown v-model="attributesData" @change="handleDropdownChange" @clear="handleDropdownClear" />
          </el-form-item>

          <!-- Show value field only if attribute is selected -->
          <div v-if="Object.keys(selectedAttribute).length > 0">
            <el-form-item
              label="New value"
              required="true"
            >
              <app-autocomplete-many-input
                v-if="selectedAttribute.type === 'multiSelect'"
                v-model="formModel[selectedAttribute.name]"
                :fetch-fn="multiSelectFetchFn"
                :create-fn="multiSelectCreateFn"
                :placeholder="multiSelectPlaceholder"
                :input-class="multiSelectClassName"
                :create-if-not-found="true"
                :in-memory-filter="false"
              >
                <template v-if="selectedAttribute.name === 'organizations'" #default="{ item }">
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
              <el-date-picker
                v-else-if="selectedAttribute.type === 'date'"
                v-model="formModel[selectedAttribute.name]"
                :prefix-icon="CalendarIcon"
                class="custom-date-picker attribute-date-picker"
                size="large"
                popper-class="date-picker-popper"
                type="date"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                placeholder="YYYY-MM-DD"
              />
              <el-select
                v-else-if="selectedAttribute.type === 'boolean'"
                v-model="formModel[selectedAttribute.name]"
                class="w-full"
                clearable
                placeholder="Select option"
              >
                <el-option key="true" label="True" :value="true" @mouseleave="onSelectMouseLeave" />
                <el-option key="false" label="False" :value="false" @mouseleave="onSelectMouseLeave" />
              </el-select>
              <el-input v-else v-model="formModel[selectedAttribute.name]" placeholder="Enter value" :type="selectedAttribute.type" clearable />
            </el-form-item>

            <div v-if="selectedAttribute.type === 'multiSelect'" class="flex items-center gap-2 -mt-2">
              <i class="ri-information-line text-gray-400 text-lg " />
              <span class="text-xs leading-5 text-gray-500">
                Values will be added to each selected contact and the existing ones won’t be overwritten.
              </span>
            </div>

            <div v-else class="rounded-md bg-yellow-50 border border-yellow-100 flex items-center gap-2 py-2 px-4 mt-6">
              <i class="ri-alert-fill text-yellow-500 text-base " />
              <span class="text-xs leading-5 text-gray-900">Changes will overwrite the current attribute value of the selected contacts.</span>
            </div>
          </div>
        </el-form>
      </div>

      <div class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6">
        <el-button class="btn btn--bordered btn--md mr-3" @click="handleCancel">
          Cancel
        </el-button>
        <el-button class="btn btn--primary btn--md" :disabled="!hasFormChanged" @click="handleSubmit">
          Submit
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { useStore } from 'vuex';
import { storeToRefs } from 'pinia';
import {
  computed, h, ref, watch,
} from 'vue';
import isEqual from 'lodash/isEqual';
import { MemberModel } from '@/modules/member/member-model';
import AppDialog from '@/shared/dialog/dialog.vue';
import { FormSchema } from '@/shared/form/form-schema';
import { useMemberStore } from '@/modules/member/store/pinia';
import { onSelectMouseLeave } from '@/utils/select';
import { MemberService } from '@/modules/member/member-service';
import { OrganizationService } from '@/modules/organization/organization-service';
import getCustomAttributes from '@/shared/fields/get-custom-attributes';
import getParsedAttributes from '@/shared/attributes/get-parsed-attributes';
import AppBulkEditAttributeDropdown from '@/modules/member/components/bulk/bulk-edit-attribute-dropdown.vue';

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400',
  }, // props
  [],
);

const memberStore = useMemberStore();
const store = useStore();
const { selectedMembers, customAttributes } = storeToRefs(memberStore);

const { fields } = MemberModel;
const formSchema = computed(
  () => new FormSchema([
    fields.joinedAt,
    fields.organizations,
    fields.attributes,
    ...getCustomAttributes({
      customAttributes: customAttributes.value,
      considerShowProperty: false,
    }),
  ]),
);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['reload', 'update:modelValue']);

const computedVisible = computed({
  get() {
    return props.modelValue;
  },
  set() {
    emits('update:modelValue', false);
  },
});

function filteredAttributes(attributes) {
  return attributes.filter(
    ({ name }) => !['bio', 'karma', 'url', 'name', 'education', 'websiteUrl',
      'avatarUrl', 'sourceId', 'awards', 'workExperiences', 'certifications'].includes(name),
  );
}

function getInitialModel() {
  return JSON.parse(
    JSON.stringify(
      formSchema.value.initialValues({
        joinedAt: '',
        attributes: {},
        organizations: [],
      }),
    ),
  );
}

const selectedAttribute = ref({});
const formModel = ref(getInitialModel());
const hasFormChanged = computed(() => !isEqual(getInitialModel(), formModel.value));

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      selectedAttribute.value = {};
      formModel.value = getInitialModel();
    }
  },
);

// since we have multi-select input for both the organizations and custom attributes,
// need to dynamically set the appropriate methods based on the context.
const multiSelectFetchFn = computed(() => {
  if (selectedAttribute.value.name === 'organizations') {
    return fetchOrganizationsFn;
  }
  return () => fetchCustomAttribute(selectedAttribute.value.id);
});

const multiSelectCreateFn = computed(() => {
  if (selectedAttribute.value.name === 'organizations') {
    return createOrganizationFn;
  }
  return (value) => updateCustomAttribute(selectedAttribute.value, value);
});

const multiSelectPlaceholder = computed(() => {
  if (selectedAttribute.value.name === 'organizations') {
    return 'Select or create an config';
  }
  return 'Enter option(s) or create one';
});

const multiSelectClassName = computed(() => {
  if (selectedAttribute.value.name === 'organizations') {
    return 'config-input w-full';
  }
  return 'w-full multi-select-field';
});

const defaultAttributes = [
  {
    name: 'joinedAt',
    label: 'Joined at',
    type: 'date',
  },
  {
    name: 'organizations',
    label: 'Organizations',
    type: 'multiSelect',
  },
];

const computedCustomAttributes = computed(() => filteredAttributes(customAttributes.value));

// map attributes to name and label
const mapAttributes = (attributes) => attributes.map(({ name, label }) => ({ name, label }));

const attributesData = computed(() => ({
  default: mapAttributes(defaultAttributes),
  custom: mapAttributes(computedCustomAttributes.value),
}));

const handleDropdownChange = (value) => {
  // clear form when attribute is changed
  formModel.value = getInitialModel();

  if (value.default) {
    const selected = defaultAttributes.find((attribute) => attribute.name === value.default.name);
    selectedAttribute.value = selected;
  } else if (value.custom) {
    const selected = computedCustomAttributes.value.find((attribute) => attribute.name === value.custom.name);
    selectedAttribute.value = selected;
  }
};

const fetchOrganizationsFn = (query, limit) => OrganizationService.listAutocomplete(query, limit)
  .then((options) => options.map((o) => ({
    ...o,
    displayName: o.label,
    name: o.label,
    memberOrganizations: {
      title: '',
      dateStart: '',
      dateEnd: '',
    },
  })))
  .catch(() => []);

const createOrganizationFn = (value) => OrganizationService.create({
  name: value,
})
  .then((newOrganization) => ({
    id: newOrganization.id,
    label: newOrganization.displayName || newOrganization.name,
    displayName: newOrganization.displayName || newOrganization.name,
    name: newOrganization.displayName || newOrganization.name,
    memberOrganizations: {
      title: '',
      dateStart: '',
      dateEnd: '',
    },
  }))
  .catch(() => null);

const fetchCustomAttribute = (id) => MemberService.getCustomAttribute(id)
  .then((response) => response.options.sort().map((o) => ({
    id: o,
    label: o,
  })))
  .catch(() => []);

const updateCustomAttribute = (attribute, value) => {
  const options = [...attribute.options];

  options.push(value);

  return MemberService.updateCustomAttribute(attribute.id, {
    options,
  }).then(() => ({
    id: value,
    label: value,
  }));
};

const handleSubmit = async () => {
  const formattedAttributes = getParsedAttributes(
    computedCustomAttributes.value,
    formModel.value,
  );

  // Remove any existent empty data
  const data = {
    ...formModel.value.joinedAt && {
      joinedAt: formModel.value.joinedAt,
    },
    ...formModel.value.organizations.length && {
      organizations: formModel.value.organizations.map(
        (o) => ({
          id: o.id,
          name: o.name,
          ...o.memberOrganizations?.title && {
            title: o.memberOrganizations?.title,
          },
          ...o.memberOrganizations?.dateStart && {
            startDate: o.memberOrganizations?.dateStart,
          },
          ...o.memberOrganizations?.dateEnd && {
            endDate: o.memberOrganizations?.dateEnd,
          },
        }),
      ).filter(
        (o) => !!o.id,
      ),
    },
    ...(Object.keys(formattedAttributes).length
      || formModel.value.attributes) && {
      attributes: {
        ...(Object.keys(formattedAttributes).length
          && formattedAttributes),
      },
    },
  };

  await store.dispatch('member/doBulkUpdateMembersAttribute', {
    members: [...selectedMembers.value],
    attributesToSave: data,
  });

  computedVisible.value = false;
  emits('reload', true);

  return null;
};

const handleDropdownClear = () => {
  selectedAttribute.value = {};
};

const handleCancel = () => {
  // clear form
  formModel.value = {};
  computedVisible.value = false;
};

</script>

<script>
export default {
  name: 'AppBulkEditAttributePopover',
};
</script>

<style>
.custom-date-picker.attribute-date-picker {
  width: 100% !important;
}
</style>

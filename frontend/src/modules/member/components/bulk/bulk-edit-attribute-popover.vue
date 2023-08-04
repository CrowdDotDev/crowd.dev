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
          <div class="mb-2">
            <el-form-item
              label="Choose attribute"
              required="true"
            >
              <app-bulk-edit-attribute-dropdown v-model="attributesData" @change="handleDropdownChange" @clear="handleDropdownClear" />
            </el-form-item>
          </div>

          <!-- Show value field only if attribute is selected -->
          <div v-if="Object.keys(selectedAttribute).length > 0">
            <el-form-item
              label="New value"
              required="true"
            >
              <app-autocomplete-many-input
                v-if="selectedAttribute.name === 'organizations' && selectedAttribute.type === 'multiSelect'"
                v-model="formModel[selectedAttribute.name]"
                :fetch-fn="fetchOrganizationsFn"
                :create-fn="createOrganizationFn"
                placeholder="Select or create an organization"
                input-class="organization-input w-full"
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
              <app-autocomplete-many-input
                v-else-if="selectedAttribute.type === 'multiSelect'"
                v-model="formModel[selectedAttribute.name]"
                :fetch-fn="
                  () => fetchCustomAttribute(selectedAttribute.id)
                "
                :create-fn="
                  (value) =>
                    updateCustomAttribute(selectedAttribute, value)
                "
                placeholder="Select an option or create one"
                input-class="w-full multi-select-field"
                :create-if-not-found="true"
                :collapse-tags="true"
                :parse-model="true"
                :are-options-in-memory="true"
              />
              <el-date-picker
                v-else-if="selectedAttribute.type === 'date'"
                v-model="formModel[selectedAttribute.name]"
                :prefix-icon="CalendarIcon"
                class="custom-date-picker"
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

            <div class="rounded-md bg-yellow-50 border border-yellow-100 flex items-center gap-2 py-2 px-4 mt-6">
              <i class="ri-alert-fill text-yellow-500 text-base " />
              <span class="text-xs leading-5 text-gray-900">Changes will overwrite the current attribute value of the selected members.</span>
            </div>
          </div>
        </el-form>
      </div>

      <div class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6">
        <el-button class="btn btn--bordered btn--md mr-3" @click="handleCancel">
          Cancel
        </el-button>
        <el-button class="btn btn--primary btn--md" @click="handleSubmit">
          Submit
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { mapActions } from 'vuex';
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
import getAttributesModel from '@/shared/attributes/get-attributes-model';
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

const attributesTypes = {
  string: 'Text',
  number: 'Number',
  email: 'E-mail',
  url: 'URL',
  date: 'Date',
  boolean: 'Boolean',
  multiSelect: 'Multi-select',
};

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
// const hasFormChanged = computed(() => !isEqual(getInitialModel(), formModel.value));

console.log('formModel under', formModel.value);

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      selectedAttribute.value = {};
      formModel.value = getInitialModel();
    }
  },
);

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

  console.log('selectedAttribute', selectedAttribute.value);
  console.log('organization fetch', fetchOrganizationsFn("c", 20));
};

const handleDropdownClear = () => {
  selectedAttribute.value = {};
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

const { doBulkUpdateMembersAttributes } = mapActions('member', ['doBulkUpdateMembersAttributes']);

const handleSubmit = async () => {
  // computedVisible.value = false;
  // emits('reload', true);
  console.log('handleSubmit', formModel.value);
  return null;
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
.custom-date-picker {
  width: 100% !important;
}
</style>

<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit attributes">
    <template #content>
      <div class="px-6 pb-6">
        <el-form :model="formModel" class="attributes-form">
          <div class="rounded-md bg-yellow-50 border border-yellow-100 flex items-center gap-2 py-3 px-4 mt-2">
            <i class="ri-alert-fill text-yellow-500 text-base " />
            <span class="text-xs leading-5 text-gray-900">Some changes may overwrite current attributes from the
              selected members.</span>
          </div>
          <div class="mt-6 mb-8 flex flex-col gap-4">
            <h6 class="text-xs text-gray-400">
              DEFAULT ATTRIBUTES
            </h6>

            <div v-for="(attribute, index) in defaultAttributes" :key="index" class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-gray-900">{{ attribute.label }}</span>
                <p class="text-2xs text-gray-500">
                  {{ attributesTypes[attribute.type] }}
                </p>
              </div>

              <app-autocomplete-many-input
                v-if="attribute.type === 'multiSelect'"
                v-model="formModel[attribute.name]"
                :fetch-fn="fetchOrganizationsFn"
                :create-fn="createOrganizationFn"
                placeholder="Select an option or create one"
                input-class="w-full multi-select-field"
                store-key="memberOrganizations"
                :create-if-not-found="true"
                :collapse-tags="true"
                :parse-model="true"
                :are-options-in-memory="true"
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

              <el-date-picker
                v-else-if="attribute.type === 'date'"
                v-model="formModel[attribute.name]"
                :prefix-icon="CalendarIcon"
                :clearable="false"
                class="custom-date-picker"
                size="large"
                popper-class="date-picker-popper"
                type="date"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div class="mb-10 flex flex-col gap-4">
            <h6 class="text-xs text-gray-400 pb-3">
              CUSTOM ATTRIBUTES
            </h6>

            <div v-for="(attribute, index) in computedCustomAttributes" :key="index" class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-gray-900">{{ attribute.label }}</span>
                <p class="text-2xs text-gray-500">
                  {{ attributesTypes[attribute.type] }}
                </p>
              </div>

              <app-autocomplete-many-input
                v-if="attribute.type === 'multiSelect'"
                v-model="formModel[attribute.name]"
                :fetch-fn="
                  () => fetchCustomAttribute(attribute.id)
                "
                :create-fn="
                  (value) =>
                    updateCustomAttribute(attribute, value)
                "
                placeholder="Select an option or create one"
                input-class="w-full multi-select-field"
                :create-if-not-found="true"
                :collapse-tags="true"
                :parse-model="true"
                :are-options-in-memory="true"
              />
              <el-select
                v-else-if="attribute.type === 'boolean'"
                v-model="formModel[attribute.name]"
                class="w-full"
                clearable
                placeholder="Select option"
              >
                <el-option key="true" label="True" :value="true" @mouseleave="onSelectMouseLeave" />
                <el-option key="false" label="False" :value="false" @mouseleave="onSelectMouseLeave" />
              </el-select>
              <el-input v-else v-model="formModel[attribute.name]" :type="attribute.type" clearable />
            </div>
          </div>

          <div class="flex justify-start">
            <el-button class="btn btn-link btn-link--primary btn--sm mt-2" @click="toggleShowAttributes">
              {{ showAllAttributes ? 'Show Less' : 'Show More' }}
            </el-button>
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

const showAllAttributes = ref(false);

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
  return Object.keys(attributes).reduce((acc, item) => {
    if (
      ![
        'bio',
        'url',
        'name',
        'education',
        'websiteUrl',
        'avatarUrl',
        'sourceId',
        'emails',
        'workExperiences',
        'education',
        'certifications',
        'awards',
      ].includes(item)
    ) {
      acc[item] = attributes[item];
    }
    return acc;
  }, {});
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

const formModel = ref(getInitialModel());
const hasFormChanged = computed(() => !isEqual(getInitialModel(), formModel.value));

console.log('formModel', formModel.value);
console.log('getInitialModel', getInitialModel());
console.log('hasFormChanged', hasFormChanged.value);

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
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

const computedCustomAttributes = computed(() => {
  // Exclude custom attributes that are not useful for bulk edit
  const filteredAttributes = customAttributes.value.filter(
    ({ name }) => !['bio', 'url', 'name', 'education', 'websiteUrl',
      'avatarUrl', 'sourceId', 'awards', 'workExperiences', 'certifications'].includes(name),
  );

  return showAllAttributes.value ? filteredAttributes : filteredAttributes.slice(0, 5);
});

// TODO: look into this func the props are not being passed
const fetchOrganizationsFn = (query, limit) => OrganizationService.listAutocomplete(query, limit)
  .then((options) => options.filter((m) => m.id !== props.modelValue.id).map((o) => ({
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

const toggleShowAttributes = () => {
  showAllAttributes.value = !showAllAttributes.value;
};

const { doBulkUpdateMembersAttributes } = mapActions('member', ['doBulkUpdateMembersAttributes']);

const handleSubmit = async () => {
  const formattedAttributes = getParsedAttributes(
    computedCustomAttributes.value,
    formModel.value,
  );

  console.log('formModel', formModel.value);

  console.log('formattedAttributes', formattedAttributes);

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
          && formattedAttributes)
      },
    },
  };

  console.log('data as payload', data);
  console.log('hasFormChanged inside', hasFormChanged.value);


  // computedVisible.value = false;
  // emits('reload', true);

  return null;
};

const handleCancel = () => {
  // clear form
  formModel.value = {};
  computedVisible.value = false;
};

</script>

<style>
.custom-date-picker {
  width: 100% !important;
}
</style>

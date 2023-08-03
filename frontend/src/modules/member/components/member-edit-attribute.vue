<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit attribute">
    <template #content>
      <div class="px-6 pb-6">
        <el-form
          ref="formRef"
          :model="formModel"
          class="attributes-form"
          label-position="top"
        >
          <!-- <div class="rounded-md bg-yellow-50 border border-yellow-100 flex items-center gap-2 py-3 px-4 mt-2">
            <i class="ri-alert-fill text-yellow-500 text-base " />
            <span class="text-xs leading-5 text-gray-900">Some changes may overwrite current attributes from the
              selected members.</span>
          </div> -->
          <div class="mt-2 mb-5">
            <el-form-item
              label="Choose attribute"
              required="true"
            >
              <el-select
                ref="focus"
                class="w-full"
                clearable
                placeholder="Select option"
                v-model="formModel.name"
              />
            </el-form-item>
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
          && formattedAttributes),
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

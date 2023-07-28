<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit attributes">
    <template #content>
      <div class="px-6 pb-6">
        <el-form :model="model" class="attributes-form">
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

              <el-input
                v-model="model[attribute.name]"
                :type="attribute.type"
                clearable
              />
            </div>
          </div>
          <div class="mt-6 mb-10 flex flex-col gap-4">
            <h6 class="text-xs text-gray-400 pb-4">
              CUSTOM ATTRIBUTES
            </h6>

            <div v-for="(attribute, index) in customAttributes" :key="index" class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-gray-900">{{ attribute.label }}</span>
                <p class="text-2xs text-gray-500">
                  {{ attributesTypes[attribute.type] }}
                </p>
              </div>

              <el-date-picker
                v-if="attribute.type === 'date'"
                v-model="model[attribute.name]"
                :prefix-icon="CalendarIcon"
                :clearable="false"
                class="custom-date-picker"
                popper-class="date-picker-popper"
                type="date"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                placeholder="YYYY-MM-DD"
              />
              <!-- <app-autocomplete-many-input
                v-else-if="attribute.type === 'multiSelect'"
                v-model="model[attribute.name]"
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
              /> -->
              <el-select
                v-else-if="attribute.type === 'boolean'"
                v-model="model[attribute.name]"
                class="w-full"
                clearable
                placeholder="Select option"
              >
                <el-option
                  key="true"
                  label="True"
                  :value="true"
                  @mouseleave="onSelectMouseLeave"
                />
                <el-option
                  key="false"
                  label="False"
                  :value="false"
                  @mouseleave="onSelectMouseLeave"
                />
              </el-select>

              <el-input
                v-else
                v-model="model[attribute.name]"
                :type="attribute.type"
                clearable
              />
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
  reactive, ref, computed, h,
} from 'vue';
import { MemberModel } from '@/modules/member/member-model';
import AppDialog from '@/shared/dialog/dialog.vue';
import { FormSchema } from '@/shared/form/form-schema';
import { useMemberStore } from '@/modules/member/store/pinia';
import { onSelectMouseLeave } from '@/utils/select';

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400',
  }, // props
  [],
);

const memberStore = useMemberStore();
const { selectedMembers } = storeToRefs(memberStore);

const { fields } = MemberModel;
const formSchema = new FormSchema([fields.attributes]);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['reload', 'update:modelValue']);

const attributesTypes = {
  string: 'Text',
  number: 'Number',
  email: 'E-mail',
  url: 'URL',
  date: 'Date',
  boolean: 'Boolean',
  multiSelect: 'Multi-select',
};

const loading = ref(false);

const model = ref({
  bio: '',
  jobTitle: '',
  location: '',
  yearsOfExperience: '',
  country: '',
  isHireable: '',
  expertise: '',
  seniorityLevel: '',
});


const attributes = [
{
    label: 'Bio', name: 'bio', type: 'string', isDefault: true,
  },
  {
    label: 'Job Title', name: 'jobTitle', type: 'string', isDefault: true,
  },
  {
    label: 'Location', name: 'location', type: 'string', isDefault: true,
  },
  {
    label: 'Years of Experience', name: 'yearsOfExperience', type: 'number', isDefault: false,
  },
  {
    label: 'Country', name: 'country', type: 'string', isDefault: false,
  },
  {
    label: 'is Hireable', name: 'isHireable', type: 'boolean', isDefault: false,
  },
  {
    label: 'Expertise', name: 'expertise', type: 'multiSelect', isDefault: false,
  },
  {
    label: 'Skills', name: 'skills', type: 'multiSelect', isDefault: false,
  },
  {
    label: 'Seniority Level', name: 'seniorityLevel', type: 'string', isDefault: false,
  },
];

const defaultAttributes = attributes.filter((attribute) => attribute.isDefault);
const customAttributes = attributes.filter((attribute) => !attribute.isDefault);

const handleSubmit = async () => {
  loading.value = true;
  // do something
  console.log('helo', model.value);
};

const handleCancel = () => {
  computeVisible.value = false;
};

const computedVisible = computed({
  get() {
    return props.modelValue;
  },
  set() {
    emits['update:modelValue'](false);
  },
});

</script>

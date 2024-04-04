<template>
  <app-drawer
    v-model="isVisible"
    :size="480"
    :title="isEdit ? 'Edit activity' : 'Add activity'"
  >
    <template #content>
      <div class="-mt-4">
        <app-form-item
          class="mb-4"
          label="Contributor"
          :validation="$v.member"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <app-autocomplete-one-input
            v-model="form.member"
            :fetch-fn="searchMembers"
            placeholder="Select option"
            input-class="w-full"
            @change="$v.member.$touch"
            @blur="$v.member.$touch"
          >
            <template v-if="form.member" #prefix>
              <app-avatar
                :entity="{
                  displayName: form.member.label,
                  avatar: form.member.avatar,
                }"
                size="xxs"
              />
            </template>
            <template #option="{ item }">
              <div class="flex items-center">
                <app-avatar
                  :entity="{
                    displayName: item.label,
                    avatar: item.avatar,
                  }"
                  size="xxs"
                  class="mr-2"
                />
                {{ item.label }}
              </div>
            </template>
          </app-autocomplete-one-input>
        </app-form-item>

        <app-form-item
          class="mb-4"
          label="When"
          :validation="$v.datetime"
          :required="true"
          :error-messages="{
            required: 'This field is required',
            inPast: 'Selected date must be in the past',
          }"
        >
          <el-date-picker
            v-model="form.datetime"
            type="datetime"
            placeholder="Select date & time"
            :prefix-icon="CalendarIcon"
            class="custom-date-picker !h-10"
            popper-class="date-picker-popper"
            @blur="$v.datetime.$touch"
            @change="$v.datetime.$touch"
          />
        </app-form-item>

        <app-form-item
          class="mb-4"
          label="Activity type"
          :validation="$v.activityType"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <el-select
            v-model="form.activityType"
            placeholder="Select option"
            class="w-full"
            @blur="$v.activityType.$touch"
            @change="$v.activityType.$touch"
          >
            <el-option
              :value="null"
              class="px-3 py-2.5 text-brand-500 text-xs leading-5 transition hover:bg-gray-50 cursor-pointer"
              @click="emit('add-activity-type')"
            >
              + Add activity type
            </el-option>
            <div
              v-if="types.custom.other ? Object.keys(types.custom.other).length > 0 : Object.keys(types.custom).length > 0"
              class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
            >
              Custom
            </div>
            <template
              v-for="(
                activityTypes, platform
              ) in types.custom"
              :key="platform"
            >
              <el-option
                v-for="(display, type) in activityTypes"
                :key="type"
                :label="display.display.short"
                :value="type"
              >
                {{ display.display.short }}
              </el-option>
            </template>
          </el-select>
        </app-form-item>

        <app-form-item class="mb-4" label="Title">
          <el-input v-model="form.config.title" />
        </app-form-item>

        <app-form-item class="mb-4" label="Body">
          <el-input
            v-model="form.config.body"
            type="textarea"
            rows="5"
          />
        </app-form-item>

        <app-form-item
          class="mb-4"
          label="URL"
          :validation="$v.config.url"
          :error-messages="{ url: 'Url is not valid' }"
        >
          <el-input
            v-model="form.config.url"
            @blur="$v.config.url.$touch"
            @change="$v.config.url.$touch"
          />
        </app-form-item>
      </div>
    </template>
    <template #footer>
      <el-button
        class="btn btn--secondary btn--md mr-4"
        @click="emit('update:modelValue', false)"
      >
        Cancel
      </el-button>
      <el-button
        class="btn btn--primary btn--md"
        :disabled="$v.$invalid || !hasFormChanged"
        @click="submit()"
      >
        <span v-if="isEdit">Update</span>
        <span v-else>Add activity</span>
      </el-button>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  computed,
  reactive,
  h,
  watch,
} from 'vue';
import { required, url } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { storeToRefs } from 'pinia';
import moment from 'moment';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { MemberService } from '@/modules/member/member-service';
import AppAvatar from '@/shared/avatar/avatar.vue';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { ActivityService } from '@/modules/activity/activity-service';
import Message from '@/shared/message/message';
import formChangeDetector from '@/shared/form/form-change';
import AppAutocompleteOneInput from '@/shared/form/autocomplete-one-input.vue';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

// Props & emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  activity: {
    type: Object,
    required: false,
    default: () => null,
  },
  subprojectId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  'update:modelValue',
  'add-activity-type',
]);

// Store
const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);
const { fetchActivityTypes } = activityTypeStore;

const activityStore = useActivityStore();
const { fetchActivities, fetchActivityChannels } = activityStore;

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

// Form control
const form = reactive({
  member: null,
  datetime: '',
  activityType: '',
  config: {
    title: '',
    body: '',
    url: '',
  },
});

const rules = {
  member: {
    required,
  },
  datetime: {
    required,
    inPast: (date) => moment(date).isBefore(moment()),
  },
  activityType: {
    required,
  },
  config: {
    url: {
      url,
    },
  },
  name: {},
};

const $v = useVuelidate(rules, form);

// Members field
const searchMembers = ({ query, limit }) => MemberService.listAutocomplete({
  query,
  limit,
  segments: [props.subprojectId],
}).catch(
  () => [],
);

// Datetime field
const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400',
  }, // props
  [],
);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const isEdit = computed(() => props.activity);

const fillForm = (activity) => {
  form.member = {
    ...activity.member,
    label: activity.member.displayName,
    avatar: activity.member.attributes.avatarUrl.default,
  } || '';
  form.datetime = activity?.timestamp || '';
  form.activityType = activity?.type || '';
  form.config.title = activity?.title || '';
  form.config.body = activity?.body || '';
  form.config.url = activity?.url || '';
  formSnapshot();
};

const reset = () => {
  form.member = '';
  form.datetime = '';
  form.activityType = '';
  form.config.title = '';
  form.config.body = '';
  form.config.url = '';
  $v.value.$reset();
};
const generateSourceId = () => {
  const randomNumbers = (`${Math.random()}`).substring(2);
  return `gen-${randomNumbers}`;
};

const platformsForActivityType = computed(() => Object.entries({
  ...types.value.custom,
  ...types.value.default,
})
  .map(([platform, typeList]) => Object.keys(typeList).map((type) => ({
    platform,
    type,
  })))
  .flat()
  .reduce((object, { platform, type }) => ({
    ...object,
    [type]: platform,
  }), {}));

// Submit
const submit = () => {
  if ($v.value.$invalid) {
    return;
  }

  const segments = [props.subprojectId];
  const data = {
    member: form.member.id,
    timestamp: form.datetime,
    type: form.activityType,
    platform:
      platformsForActivityType.value[form.activityType],
    ...form.config,
  };

  if (!isEdit.value) {
    // Create
    ActivityService.create({
      data: {
        ...data,
        sourceId: generateSourceId(),
      },
    }, segments)
      .then(() => {
        reset();
        emit('update:modelValue', false);
        fetchActivities({ reload: true });
        Message.success('Activity successfully created!');
      })
      .catch(() => {
        Message.error(
          'There was an error creating activity',
        );
      });
  } else {
    // Update
    ActivityService.update(props.activity.id, data, segments)
      .then(() => {
        reset();
        emit('update:modelValue', false);
        fetchActivities({ reload: true });
        Message.success('Activity successfully updated!');
      })
      .catch(() => {
        Message.error(
          'There was an error updating activity',
        );
      });
  }
};

// Is drawer visible
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    if (!value) {
      reset();
    }
    emit('update:modelValue', value);
  },
});

watch(
  () => props.subprojectId,
  (subprojectId) => {
    if (subprojectId) {
      fetchActivityTypes([selectedProjectGroup.value.id]);
      fetchActivityChannels([selectedProjectGroup.value.id]);
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.activity,
  (activity) => {
    if (activity) {
      fillForm(activity);
    } else {
      reset();
    }
  },
  { immediate: true, deep: true },
);

</script>

<script>
export default {
  name: 'AppActivityFormDrawer',
};
</script>

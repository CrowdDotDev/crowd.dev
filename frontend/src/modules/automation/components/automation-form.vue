<template>
  <app-drawer
    v-model="isDrawerOpen"
    title=""
    :size="600"
  >
    <template #header>
      <div>
        <div v-if="type === 'webhook'" class="flex items-center">
          <img alt="Webhook" src="/images/automation/webhook.png" class="w-4 max-w-4">
          <p class="pl-2 text-xs text-gray-900">
            Webhook
          </p>
        </div>
        <div v-else-if="type === 'slack'" class="flex items-center">
          <img alt="Slack" src="https://cdn-icons-png.flaticon.com/512/3800/3800024.png" class="w-4 max-w-4">
          <p class="pl-2 text-xs text-gray-900">
            Slack notification
          </p>
        </div>
        <h4 class="text-lg font-medium mt-1 text-gray-900">
          Add automation
        </h4>
      </div>
    </template>
    <template #content>
      <div class="border-t border-gray-200 -mx-6 -mt-6 p-6">
        <app-form-item
          class="mb-8"
          label="Automation name"
        >
          <el-input
            v-model="form.name"
          />
        </app-form-item>
        <hr>
        <div class="py-6">
          <h5 class="text-base leading-5 text-brand-500 font-semibold mb-1">
            Trigger
          </h5>
          <p v-if="type === 'webhook'" class="text-2xs text-gray-500">
            Define the event that triggers your webhook
          </p>
          <p v-else-if="type === 'slack'" class="text-2xs text-gray-500">
            Define the event that triggers your Slack notification.
          </p>
        </div>
        <app-form-item
          class="mb-4"
          label="Choose trigger"
          :required="true"
          :validation="$v.trigger"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <el-select
            v-model="form.trigger"
            placeholder="Select option"
            class="w-full"
            @change="collapseOpen = 'filterOptions'"
            @blur="$v.trigger.$touch"
          >
            <el-option
              v-for="{ value, label } of triggerOptions"
              :key="value"
              :value="value"
              :label="label"
            />
          </el-select>
        </app-form-item>
        <div class="filter-options pb-8">
          <el-collapse v-if="form.trigger" v-model="collapseOpen">
            <el-collapse-item
              title="Filter options"
              name="filterOptions"
            >
              <app-new-activity-filter-options v-if="form.trigger === 'new_activity'" v-model="form.settings" />
              <app-new-member-filter-options v-if="form.trigger === 'new_member'" v-model="form.settings" />
            </el-collapse-item>
          </el-collapse>
        </div>
        <hr>
        <div class="py-6">
          <h5 class="text-base leading-5 text-brand-500 font-semibold mb-1">
            Action
          </h5>
          <p v-if="type === 'webhook'" class="text-2xs text-gray-500">
            Define the endpoint where the webhook payload should be sent to
          </p>
          <p v-else-if="type === 'slack'" class="text-2xs text-gray-500">
            Receive a notification in your Slack workspace every time the event is triggered.
          </p>
        </div>
        <div>
          <app-automation-webhook-action v-if="type === 'webhook'" v-model="form.settings" />
          <app-automation-slack-action v-else-if="type === 'slack'" v-model="form.settings" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between">
        <div>
          <el-button
            v-if="isEdit && hasFormChanged"
            class="btn btn-link btn-link--primary btn--md"
            @click="fillForm(automation)"
          >
            <i class="ri-arrow-go-back-line" />
            <span>Reset changes</span>
          </el-button>
        </div>
        <div class="flex items-center">
          <el-button
            :disabled="sending"
            class="btn btn--md btn--secondary mr-4"
            @click="emit('update:modelValue', null)"
          >
            Cancel
          </el-button>

          <el-button
            :disabled="$v.$invalid || sending || !hasFormChanged"
            :loading="sending"
            class="btn btn--md btn--primary"
            @click="doSubmit"
          >
            <span v-if="isEdit">Update</span>
            <span v-else-if="type === 'webhook'">Add webhook</span>
            <span v-else-if="type === 'slack'">Add Slack notification</span>
            <span v-else>Add automation</span>
          </el-button>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  computed, defineProps, defineEmits, reactive, ref, watch, onMounted,
} from 'vue';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';
import AppNewActivityFilterOptions
  from '@/modules/automation/components/filter-options/new-activity-filter-options.vue';
import AppNewMemberFilterOptions from '@/modules/automation/components/filter-options/new-member-filter-options.vue';
import AppAutomationWebhookAction from '@/modules/automation/components/action/webhook-action.vue';
import AppAutomationSlackAction from '@/modules/automation/components/action/slack-action.vue';
import { useAutomationStore } from '@/modules/automation/store';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import formChangeDetector from '@/shared/form/form-change';
import { useStore } from 'vuex';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: false,
    default: false,
  },
  type: {
    type: String,
    required: false,
    default: 'webhook',
  },
  automation: {
    type: Object,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'update:automation']);

const { createAutomation, updateAutomation, getAutomations } = useAutomationStore();

const store = useStore();
const fetchIntegrations = () => store.dispatch('integration/doFetch');

const isDrawerOpen = computed({
  get() {
    return props.modelValue;
  },
  set() {
    emit('update:modelValue', false);
    emit('update:automation', null);
  },
});

const type = computed(() => props.automation?.type || props.type);

const isEdit = computed(() => props.automation !== null);

const triggerOptions = ref([
  {
    label: 'New activity happened in your community',
    value: 'new_activity',
  },
  {
    label: 'New contributor joined your community',
    value: 'new_member',
  },
]);

const collapseOpen = ref('filterOptions');

// Setup and validation
const form = reactive({
  name: '',
  trigger: '',
  settings: {},
});

const rules = {
  trigger: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);

// Prefill form
const fillForm = (automation) => {
  form.name = automation.name || '';
  form.trigger = automation.trigger || '';
  form.settings = automation.settings || {};
  formSnapshot();
};

const reset = () => {
  form.name = '';
  form.trigger = '';
  form.settings = {};
  formSnapshot();
};

// Submit form
const sending = ref(false);

const doSubmit = () => {
  if ($v.value.$invalid) {
    return;
  }
  sending.value = true;
  const data = {
    name: form.name ?? i18n(`entities.automation.triggers.${form.trigger}`),
    type: type.value,
    trigger: form.trigger,
    settings: {
      ...form.settings,
    },
  };
  if (!isEdit.value) {
    createAutomation(data)
      .then(() => {
        getAutomations();
        emit('update:modelValue', null);
      })
      .catch(() => {
        Message.error('There was an error creating automation, please try again later.');
      })
      .finally(() => {
        sending.value = false;
      });
  } else {
    updateAutomation(props.automation.id, data)
      .then(() => {
        getAutomations();
        emit('update:modelValue', null);
      })
      .catch(() => {
        Message.error('There was an error updating automation, please try again later.');
      })
      .finally(() => {
        sending.value = false;
      });
  }
};

onMounted(() => {
  fetchIntegrations();
  if (type.value && props.automation) {
    fillForm(props.automation);
  } else {
    reset();
  }
});
</script>

<script>
export default {
  name: 'AppAutomationForm',
};
</script>

<style lang="scss">
.filter-options {
  .el-collapse {
    @apply border-none bg-gray-50 rounded p-4;
    overflow: unset;

    .el-collapse-item {
      @apply bg-gray-50;
    }

    .el-collapse-item__header {
      @apply text-gray-600 bg-gray-50 text-xs flex flex-row-reverse justify-end leading-tight h-6 p-0 font-medium border-none;
      .el-collapse-item__arrow {
        margin: 0 8px 0 0;
      }
    }
    .el-collapse-item__content {
      @apply pb-0 pt-6 leading-none;
    }
    .el-collapse-item__wrap {
      @apply border-none leading-none bg-gray-50;
    }
  }
  .el-form-item {
    @apply mb-0;
  }
}
</style>

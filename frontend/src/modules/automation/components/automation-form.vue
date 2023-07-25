<template>
  <app-drawer
    v-if="typeData"
    v-model="isDrawerOpen"
    title=""
    :size="600"
  >
    <template #header>
      <div>
        <div class="flex items-center">
          <img :alt="typeData.name" :src="typeData.icon" class="w-4 max-w-4">
          <p class="pl-2 text-xs text-gray-900">
            {{ typeData.name }}
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
          <p class="text-2xs text-gray-500">
            {{ typeData.triggerText }}
          </p>
        </div>
        <section class="pb-8">
          <component :is="typeData.triggerComponent" v-model:settings="form.settings" v-model:trigger="form.trigger" />
        </section>

        <hr>
        <div class="py-6">
          <h5 class="text-base leading-5 text-brand-500 font-semibold mb-1">
            Action
          </h5>
          <p class="text-2xs text-gray-500">
            {{ typeData.actionText }}
          </p>
        </div>
        <div>
          <component :is="typeData.actionComponent" v-model="form.settings" :trigger="form.trigger" />
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
            class="btn btn--md btn--bordered mr-4"
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
            <span v-else-if="typeData && typeData.createButtonText">
              {{ typeData.createButtonText }}
            </span>
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
import { email, required } from "@vuelidate/validators";
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';
import { useAutomationStore } from '@/modules/automation/store';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import formChangeDetector from '@/shared/form/form-change';
import { useStore } from 'vuex';
import { automationTypes } from '../config/automation-types';

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

const typeData = computed(() => props.type && automationTypes[props.type]);

const type = computed(() => props.automation?.type || props.type);

const isEdit = computed(() => props.automation !== null);

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

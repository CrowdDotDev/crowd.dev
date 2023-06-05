<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="Stack Overflow"
    size="600px"
    pre-title="Integration"
    has-border
    @close="isVisible = false"
  >
    <template #beforeTitle>
      <img
        class="w-6 h-6 mr-2"
        :src="logoUrl"
        alt="Stack Overflow logo"
      />
    </template>
    <template #content>
      <el-form
        label-position="top"
        class="form integration-stackoverflow-form"
        @submit.prevent
      >
        <div class="flex flex-col items-start gap-2">
          <span class="block text-sm font-semibold">Track tags</span>
          <span class="text-2xs font-light text-gray-600">
            Monitor questions and answers related to your
            community.
            <a
              href="https://stackoverflow.com/tags"
              target="__blank"
            >Explore tags</a><br />
          </span>
          <el-form-item
            v-for="(tag, index) of model"
            :key="index"
            class="w-full no-margin"
            :class="{
              'is-error':
                (tag.touched && !tag.valid)
                || (tag.touched && tag.volumeTooLarge),
              'is-success': tag.touched && tag.valid,
            }"
          >
            <div class="flex w-full">
              <el-input
                v-model="tag.value"
                placeholder="Enter tag"
                @blur="handleTagValidation(index)"
              >
                <template #suffix>
                  <div
                    v-if="tag.validating"
                    v-loading="tag.validating"
                    class="flex items-center justify-center w-6 h-6"
                  />
                </template>
              </el-input>
              <el-button
                v-if="model.length > 1"
                class="btn btn--md btn--transparent w-10 h-10"
                @click="deleteItem(index)"
              >
                <i
                  class="ri-delete-bin-line text-lg text-black"
                />
              </el-button>
            </div>
            <span
              v-if="tag.touched && !tag.valid"
              class="el-form-item__error pt-1 flex gap-1"
            ><i class="ri-error-warning-line" />
              This tag does not exist
            </span>
            <span
              v-if="tag.touched && tag.volumeTooLarge"
              class="el-form-item__error pt-1 flex gap-1"
            ><i class="ri-error-warning-line" />
              Volume of questions is too big. Try something
              more specific.
            </span>
          </el-form-item>
          <el-tooltip
            :disabled="!isMaxTagsReached"
            popper-class="w-60"
            effect="dark"
            content="You reached the limit of 3 tags allowed"
            placement="top-start"
          >
            <div>
              <el-button
                :disabled="isMaxTagsReached"
                class="btn btn-link btn-link--primary"
                @click="addNewTag"
              >
                + Add Tag
              </el-button>
            </div>
          </el-tooltip>
          <span class="text-sm font-medium mt-6">Track keywords</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor questions and answers containing the
            selected keywords.
          </span>
          <app-keywords-input
            v-model="modelKeywords"
            placeholder="Enter keywords"
            :is-error="!isKeywordsValid"
          >
            <template #error>
              <span class="text-xs text-red-500 flex gap-1"><i class="ri-error-warning-line" />
                Volume of questions is too big. Try
                something more specific.</span>
            </template>
          </app-keywords-input>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div
        class="flex grow items-center"
        :class="
          hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <el-button
          v-if="hasFormChanged"
          class="btn btn-link btn-link--primary"
          @click="doReset"
        >
          <i class="ri-arrow-go-back-line" />
          <span>Reset changes</span>
        </el-button>
        <div class="flex gap-4">
          <el-button
            class="btn btn--md btn--bordered"
            @click="doCancel"
          >
            <app-i18n code="common.cancel" />
          </el-button>
          <el-button
            :loading="isVolumeUpdating"
            class="btn btn--md btn--primary"
            :class="{
              disabled: !hasFormChanged || connectDisabled,
            }"
            @click="
              hasFormChanged && !connectDisabled
                ? connect()
                : undefined
            "
          >
            {{
              integration.settings?.tags.length > 0
                ? 'Update'
                : 'Connect'
            }}
          </el-button>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  computed, defineEmits, defineProps, ref, watch,
} from 'vue';
import { useThrottleFn } from '@vueuse/core';
import { useStore } from 'vuex';
import Nango from '@nangohq/frontend';
import isEqual from 'lodash/isEqual';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import config from '@/config';
import { IntegrationService } from '@/modules/integration/integration-service';

const MAX_STACK_OVERFLOW_QUESTIONS_PER_TAG = 350000;
const MAX_STACK_OVERFLOW_QUESTIONS_FOR_KEYWORDS = 1100;

const store = useStore();

const tenantId = computed(() => AuthCurrentTenant.get());

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  integration: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['update:modelValue']);
const tags = computed(() => {
  if (props.integration.settings?.tags?.length > 0) {
    return props.integration.settings?.tags.map((i) => ({
      value: i,
      valid: true,
      validating: false,
      touched: true,
      volumeTooLarge: false,
    }));
  }
  return [
    {
      value: '',
      loading: false,
    },
  ];
});

const keywords = computed(
  () => props.integration.settings?.keywords || [],
);

const model = ref(JSON.parse(JSON.stringify(tags.value)));
const modelKeywords = ref(
  JSON.parse(JSON.stringify(keywords.value)),
);
const keywordsCount = computed(
  () => modelKeywords.value.length,
);

const calculateVolume = () => IntegrationService.stackOverflowVolume(
  modelKeywords.value.join(';'),
);

const isVolumeUpdating = ref(false);
const isKeywordsValid = ref(true);

const logoUrl = CrowdIntegrations.getConfig('stackoverflow').image;

const hasFormChanged = computed(
  () => !isEqual(
    tags.value.map((i) => i.value),
    model.value.map((i) => i.value),
  ) || !isEqual(keywords.value, modelKeywords.value),
);

const isValidating = computed(() => model.value.filter((s) => s.validating).length > 0);

// connect disabled when
const tagsInputInvalid = computed(() => (
  model.value.filter((s) => (
    s.valid === false
        || s.value === ''
        || s.touched !== true
        || s.volumeTooLarge === true
  )).length > 0 || isValidating.value
));

const keywordsInputValid = computed(() => (
  isKeywordsValid.value
    && !isVolumeUpdating.value
    && modelKeywords.value.filter((s) => s === '').length === 0
));

const tagsInputUntouched = computed(() => (
  model.value.length === 1
    && model.value[0].value === ''
    && model.value[0].touched === undefined
));

// checking if both tags and keywords are: both valid or one valid and the other empty
const connectEnabled = computed(() => (
  (!tagsInputInvalid.value && keywordsInputValid.value)
    || (tagsInputUntouched.value
      && keywordsInputValid.value)
    || (!tagsInputInvalid.value
      && modelKeywords.value.length === 0)
));

const connectDisabled = computed(() => !connectEnabled.value);

watch(
  () => keywordsCount.value,
  async () => {
    isVolumeUpdating.value = true;
    if (keywordsCount.value > 0) {
      const volume = await calculateVolume();

      isKeywordsValid.value = volume <= MAX_STACK_OVERFLOW_QUESTIONS_FOR_KEYWORDS;
    } else {
      isKeywordsValid.value = true;
    }
    isVolumeUpdating.value = false;
  },
  { immediate: true, deep: true },
);

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});

const maxId = computed(() => Math.max(...model.value.map((i) => i.id), 0));

const isMaxTagsReached = computed(() => model.value.length >= 3);

const deleteItem = (index) => {
  model.value.splice(index, 1);
};

const addNewTag = (tag) => {
  model.value.push({
    id: maxId.value + 1,
    tag:
      typeof tag === 'string' || tag instanceof String
        ? tag
        : '',
    touched: false,
    valid: false,
    validating: false,
  });
};

const doReset = () => {
  model.value = JSON.parse(JSON.stringify(tags.value));
  modelKeywords.value = JSON.parse(
    JSON.stringify(keywords.value),
  );
  isKeywordsValid.value = true;
};

const doCancel = () => {
  isVisible.value = false;
  doReset();
};

const handleTagValidation = async (index) => {
  try {
    const tag = model.value[index].value;
    model.value[index].validating = true;
    const data = await IntegrationService.stackOverflowValidate(tag);
    const { count } = data.items[0];
    if (count > MAX_STACK_OVERFLOW_QUESTIONS_PER_TAG) {
      model.value[index].volumeTooLarge = true;
    } else {
      model.value[index].volumeTooLarge = false;
    }
    model.value[index].valid = true;
  } catch (e) {
    console.error(e);
    model.value[index].valid = false;
  } finally {
    model.value[index].validating = false;
    model.value[index].touched = true;
  }
};

const callOnboard = useThrottleFn(async () => {
  if (tagsInputUntouched.value) {
    await store.dispatch(
      'integration/doStackOverflowOnboard',
      {
        tags: [],
        keywords: modelKeywords.value,
      },
    );
  } else {
    await store.dispatch(
      'integration/doStackOverflowOnboard',
      {
        tags: model.value.map((i) => i.value),
        keywords: modelKeywords.value,
      },
    );
  }
}, 2000);

const connect = async () => {
  const nango = new Nango({ host: config.nangoUrl });
  try {
    await nango.auth(
      'stackexchange',
      `${tenantId.value}-stackoverflow`,
    );
    await callOnboard();
    isVisible.value = false;
  } catch (e) {
    console.error(e);
  }
};

watch(isVisible, (newValue, oldValue) => {
  if (newValue) {
    window.analytics.track(
      'Stack Ooverflow: connect drawer',
      {
        action: 'open',
      },
    );
  } else if (newValue === false && oldValue) {
    window.analytics.track(
      'Stack Overflow: connect drawer',
      {
        action: 'close',
      },
    );
  }
});
</script>

<script>
export default {
  name: 'AppStackOverflowConnectDrawer',
};
</script>

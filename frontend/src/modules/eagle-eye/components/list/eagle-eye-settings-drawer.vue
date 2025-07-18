<template>
  <app-drawer
    v-model="drawerModel"
    title="Feed settings"
    size="600px"
  >
    <template #content>
      <div class="pt-2">
        <h5 class="text-base leading-5 font-semibold pb-6">
          Keywords
        </h5>

        <el-form @submit.prevent>
          <!-- include -->
          <section class="pb-8">
            <p
              class="text-2xs leading-4.5 font-semibold text-gray-400 uppercase tracking-1 pb-3"
            >
              Include
              <span class="text-red-500 font-normal">*</span>
            </p>
            <app-eagle-eye-settings-include
              v-for="(include, ii) of form.include"
              :key="ii"
              v-model="form.include[ii]"
            >
              <template #after>
                <lf-button
                  type="primary"
                  size="medium"
                  class="w-10 h-10"
                  :disabled="form.include.length === 1"
                  @click="removeInclude(ii)"
                >
                  <lf-icon name="trash-can" :size="20" />
                </lf-button>
              </template>
            </app-eagle-eye-settings-include>
            <div class="flex">
              <p
                class="text-sm leading-5 text-primary-500 cursor-pointer hover:underline"
                @click="addInclude()"
              >
                + Add keyword
              </p>
            </div>
          </section>

          <!-- exclude -->
          <section class="pb-10">
            <p
              class="text-2xs leading-4.5 font-semibold text-gray-400 uppercase tracking-1 pb-3"
            >
              Exclude
            </p>
            <article
              v-for="(exclude, ei) of form.exclude"
              :key="ei"
              class="pb-3 flex items-center"
            >
              <app-form-item
                class="mr-3 mb-0 no-margin flex-grow"
              >
                <el-input
                  v-model="exclude.keyword"
                  placeholder="Keyword"
                />
              </app-form-item>
              <lf-button
                type="primary-link"
                size="medium"
                class="w-10 h-10"
                @click="removeExclude(ei)"
              >
                <lf-icon name="trash-can" :size="20" />
              </lf-button>
            </article>
            <div class="flex">
              <p
                class="text-sm leading-5 text-primary-500 cursor-pointer hover:underline"
                @click="addExclude()"
              >
                + Add keyword
              </p>
            </div>
          </section>
          <hr />
          <h5
            class="text-base leading-5 font-semibold py-6"
          >
            Platforms
          </h5>

          <!-- date published -->
          <section>
            <h6
              class="text-xs leading-5 font-semibold pb-2"
            >
              Date published
            </h6>
            <div class="pb-7">
              <app-eagle-eye-published-date
                v-model:date-published="form.datePublished"
              />
            </div>
          </section>

          <!-- platforms -->
          <section>
            <p class="mb-3 text-xs text-gray-500">
              For better results, we recommend choosing at
              least 3 platforms.
            </p>
            <app-eagle-eye-platforms
              v-model:platforms="form.platforms"
            />
          </section>

          <hr />
          <div class="flex items-center justify-between">
            <h5
              class="text-base leading-5 font-semibold py-6"
            >
              AI replies
              <span
                class="font-light text-xs ml-1 text-purple-500"
              >
                Alpha
              </span>
            </h5>
            <el-tooltip
              placement="top"
              content="Learn more"
            >
              <a
                aria-label="Question"
                class="btn btn-link btn-link--primary !h-8 !w-8 !text-gray-400 hover:!text-gray-600 hover:no-underline"
                href="https://docs.crowd.dev/docs/eagle-eye#ai-replies"
                target="_blank"
                rel="noopener noreferrer"
              >
                <lf-icon name="circle-question" :size="20" class="text-gray-400" />
              </a>
            </el-tooltip>
          </div>
          <div
            class="h-12 flex items-center border-b last:border-none border-gray-200 hover:cursor-pointer"
          >
            <div
              class="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center"
            >
              <lf-icon name="lightbulb" :size="14" class="text-white" />
            </div>
            <lf-switch v-model="form.aiReplies" class="ml-4 flex-grow justify-between">
              <template #inactive>
                AI replies
              </template>
            </lf-switch>
          </div>
        </el-form>
      </div>
    </template>

    <template #footer>
      <div style="flex: auto" class="-my-2">
        <lf-button
          type="primary-link"
          size="medium"
          class="mr-3"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </lf-button>
        <lf-button
          type="primary"
          size="medium"
          :loading="loadingUpdateSettings"
          :disabled="$v.$invalid || !hasFormChanged"
          @click="onSubmit()"
        >
          Update
        </lf-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  computed,
  defineEmits,
  defineProps,
  onMounted,
  reactive,
  watch,
  defineExpose,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import AppDrawer from '@/shared/drawer/drawer.vue';

import { ToastStore } from '@/shared/message/notification';
import {
  mapActions,
  mapState,
} from '@/shared/vuex/vuex.helpers';
import AppEagleEyePlatforms from '@/modules/eagle-eye/components/eagle-eye-platforms-drawers.vue';
import AppEagleEyePublishedDate from '@/modules/eagle-eye/components/eagle-eye-published-date.vue';
import AppEagleEyeSettingsInclude from '@/modules/eagle-eye/components/form/eagle-eye-settings-include.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import formChangeDetector from '@/shared/form/form-change';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfSwitch from '@/ui-kit/switch/Switch.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const eagleEyeSettings = computed(
  () => user?.value?.tenants.find(
    (tu) => tu.tenantId === tenant?.value.id,
  )?.settings.eagleEye,
);

const { doUpdateSettings } = mapActions('eagleEye');
const { loadingUpdateSettings } = mapState('eagleEye');

const form = reactive({
  include: [],
  exclude: [],
  datePublished: '',
  platforms: [],
  aiReplies: true,
});
const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const $v = useVuelidate({}, form);

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const addInclude = () => {
  form.include.push({
    keyword: '',
    match: 'semantic',
  });
};

const removeInclude = (index) => {
  form.include.splice(index, 1);
};

const addExclude = () => {
  form.exclude.push({
    keyword: '',
  });
};

const removeExclude = (index) => {
  form.exclude.splice(index, 1);
};

const fillForm = (user) => {
  if (!user) {
    return;
  }
  const { feed } = eagleEyeSettings.value;

  form.include = [
    ...feed.keywords.map((keyword) => ({
      keyword,
      match: 'semantic',
    })),
    ...feed.exactKeywords.map((keyword) => ({
      keyword,
      match: 'exact',
    })),
  ];
  form.exclude = feed.excludedKeywords.map((keyword) => ({
    keyword,
  }));
  form.platforms = feed.platforms;

  form.datePublished = feed.publishedDate;
  form.aiReplies = eagleEyeSettings.value.aiReplies || false;
  formSnapshot();
};

const onSubmit = async () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    const data = {
      keywords: form.include
        .filter((i) => i.match === 'semantic')
        .map((i) => i.keyword),
      exactKeywords: form.include
        .filter((i) => i.match === 'exact')
        .map((i) => i.keyword),
      excludedKeywords: form.exclude
        .filter((e) => e.keyword.trim().length > 0)
        .map((e) => e.keyword),
      publishedDate: form.datePublished,
      platforms: form.platforms,
    };
    doUpdateSettings({
      data: {
        ...eagleEyeSettings.value,
        feed: data,
        aiReplies: form.aiReplies,
      },
    }).then(() => {
      ToastStore.success('Feed settings updated!');
      emit('update:modelValue', false);
    });
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fillForm(user.value);
    }
  },
);

onMounted(() => {
  fillForm(user.value);
});

defineExpose({
  $v,
});
</script>

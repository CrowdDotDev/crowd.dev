<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-twitter-drawer"
    title="Twitter"
    size="600px"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="Twitter logo"
    @close="isVisible = false"
  >
    <template #content>
      <el-form label-position="top" class="form integration-twitter-form" @submit.prevent>
        <el-form-item :label="hashtagField.label">
          <el-input v-model="model.hashtag" clearable class="hashtag-input">
            <template #prefix>
              <span>#</span>
            </template>
          </el-input>

          <div class="app-form-hint leading-tight mt-2">
            Tip: Choose a hashtag that's specific to your
            company/community for better data
          </div>
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <div
        class="flex grow items-center"
        :class="hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <el-button v-if="hasFormChanged" class="btn btn-link btn-link--primary" @click="doReset">
          <i class="ri-arrow-go-back-line" />
          <span>Reset changes</span>
        </el-button>
        <div class="flex gap-4">
          <el-button class="btn btn--md btn--bordered" @click="isVisible = false">
            <app-i18n code="common.cancel" />
          </el-button>
          <a
            class="btn btn--md btn--primary"
            :class="{
              disabled: !hasFormChanged,
            }"
            :href="hasFormChanged
              ? computedConnectUrl
              : undefined
            "
          >
            Update
          </a>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  ref,
} from 'vue';
import isEqual from 'lodash/isEqual';
import { FormSchema } from '@/shared/form/form-schema';
import StringField from '@/shared/fields/string-field';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  hashtags: {
    type: Array,
    default: () => [],
  },
  connectUrl: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const parsedHashtags = computed(() => (props.hashtags.length
  ? props.hashtags[props.hashtags.length - 1]
  : ''));
const hashtagField = new StringField(
  'hashtag',
  'Track hashtag',
);
const formSchema = ref(new FormSchema([hashtagField]));
const model = ref(
  formSchema.value.initialValues({
    hashtag: parsedHashtags.value,
  }),
);

const logoUrl = CrowdIntegrations.getConfig('twitter').image;

const hasFormChanged = computed(
  () => !isEqual(
    formSchema.value.initialValues({
      hashtag: parsedHashtags.value,
    }),
    model.value,
  ),
);

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});

const computedConnectUrl = computed(() => {
  const encodedHashtags = model.value.hashtag
    ? `&hashtags[]=${model.value.hashtag}`
    : '';

  return `${props.connectUrl}${encodedHashtags}`;
});

const doReset = () => {
  model.value = formSchema.value.initialValues({
    hashtag: parsedHashtags.value,
  });
};
</script>

<script>
export default {
  name: 'AppTwitterConnectDrawer',
};
</script>

<style lang="scss">
.integration-twitter-form {
    .el-form-item {
        @apply mb-3;

        &__content {
            @apply mb-0;

            .hashtag-input .el-input__inner {
                @apply pl-1;
            }
        }
    }

    .el-input-group__prepend {
        @apply px-3;
    }
}
</style>

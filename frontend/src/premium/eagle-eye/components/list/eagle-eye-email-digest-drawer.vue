<template>
  <app-drawer
    v-model="drawerModel"
    title="Email Digest"
    size="600px"
  >
    <template #beforeTitle>
      <i
        class="ri-mail-open-line text-xl h-6 text-gray-900 flex items-center mr-3"
      />
    </template>
    <template #content>
      <div class="pb-8">
        <!-- active header -->
        <div
          class="bg-gray-100 px-6 py-4 -mx-6 flex justify-between -mt-5"
        >
          <div>
            <h5 class="text-sm font-medium mb-1">
              Active
            </h5>
            <p class="text-2xs text-gray-500">
              If active, you will receive an email with up
              to 10 most relevant results from Eagle Eye,
              based on your settings.
            </p>
          </div>
          <div>
            <el-switch v-model="form.active" />
          </div>
        </div>
        <div :class="{ 'opacity-50': !form.active }">
          <el-form
            label-position="top"
            class="form pt-6 pb-10"
            @submit.prevent="doSubmit"
          >
            <app-form-item
              class="col-span-2 mb-6"
              :validation="$v.email"
              label="Email"
              :required="true"
              :error-messages="{
                required: 'This field is required',
                email: 'Enter valid email',
              }"
            >
              <el-input
                ref="focus"
                v-model="form.email"
                :disabled="!form.active"
                @blur="$v.email.$touch"
                @change="$v.email.$touch"
              />
            </app-form-item>
            <app-form-item class="mb-6" label="Frequency">
              <el-radio-group
                v-model="form.frequency"
                :disabled="!form.active"
              >
                <el-radio
                  label="daily"
                  size="large"
                  class="frequency-radio !flex items-start mb-3"
                >
                  <h6
                    class="text-sm leading-5 font-medium mb-1"
                  >
                    Daily
                  </h6>
                  <p
                    class="text-2xs leading-4.5 text-gray-500"
                  >
                    From Monday to Friday (results from
                    previous day)
                  </p>
                </el-radio>
                <el-radio
                  label="weekly"
                  size="large"
                  class="frequency-radio !flex items-start"
                >
                  <h6
                    class="text-sm leading-5 font-medium mb-1"
                  >
                    Weekly
                  </h6>
                  <p
                    class="text-2xs leading-4.5 text-gray-500"
                  >
                    Every Monday (results from previous
                    week)
                  </p>
                </el-radio>
              </el-radio-group>
            </app-form-item>
            <app-form-item class="mb-6" label="Time">
              <div class="w-36">
                <el-time-select
                  v-model="form.time"
                  start="00:00"
                  step="00:30"
                  end="23:59"
                  placeholder="Select time"
                  format="HH:mm"
                  :disabled="!form.active"
                  :clearable="false"
                />
              </div>
            </app-form-item>

            <el-checkbox
              v-model="form.updateResults"
              class="filter-checkbox"
              :disabled="!form.active"
            >
              <span class="text-sm text-gray-900">Update email results based on your current
                feed settings</span>
            </el-checkbox>
          </el-form>
          <hr />
          <!-- Results summary -->
          <div v-if="results">
            <h4
              class="text-base font-semibold text-gray-900 py-6"
            >
              Results summary
            </h4>
            <!-- update feed warning -->
            <div
              v-if="displayFeedWarning"
              class="bg-yellow-50 border border-yellow-100 rounded-md py-2.5 px-3 flex items-center justify-between mb-4"
            >
              <div class="flex items-center">
                <i
                  class="text-base ri-alert-fill text-yellow-500 mr-2"
                />
                <p class="text-2xs leading-5">
                  Current feed settings don’t match the
                  digest results
                </p>
              </div>
              <p
                class="text-xs text-yellow-600 font-medium cursor-pointer"
                @click="updateFeed()"
              >
                Update
              </p>
            </div>
            <section
              class="pt-3 pb-1 border-b border-gray-200"
            >
              <h6
                class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
              >
                Keywords
              </h6>
              <div class="flex flex-wrap">
                <div
                  v-for="semantic of results.keywords"
                  :key="semantic"
                  class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
                >
                  {{ semantic }}
                </div>
                <div
                  v-for="exact of results.exactKeywords"
                  :key="exact"
                  class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
                >
                  {{ exact }}
                </div>
              </div>
            </section>
            <section
              class="pt-3 pb-1 border-b border-gray-200"
            >
              <h6
                class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
              >
                Platforms
              </h6>
              <div class="flex flex-wrap">
                <div
                  v-for="platform of results.platforms"
                  :key="platform"
                  class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
                >
                  {{ platformOptions[platform].label }}
                </div>
              </div>
            </section>
            <section class="pt-3 pb-1">
              <h6
                class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
              >
                Date published
              </h6>
              <div class="text-xs leading-5">
                {{ results.publishedDate }}
              </div>
            </section>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--transparent mr-3"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :loading="loadingUpdateSettings"
          :disabled="
            $v.$invalid
              || (!hasFormChanged && !hasElementChanged)
          "
          @click="doSubmit()"
        >
          Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  ref,
  computed,
  reactive,
  defineEmits,
  defineProps,
  onMounted,
  watch,
} from 'vue';
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import moment from 'moment';
import AppDrawer from '@/shared/drawer/drawer.vue';
import {
  mapActions,
  mapGetters,
  mapState,
} from '@/shared/vuex/vuex.helpers';
import Message from '@/shared/message/message';
import platformOptions from '@/premium/eagle-eye/constants/eagle-eye-platforms.json';
import AppFormItem from '@/shared/form/form-item.vue';
import formChangeDetector from '@/shared/form/form-change';
import elementChangeDetector from '@/shared/form/element-change';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const { currentUser, currentTenant } = mapGetters('auth');

const eagleEyeSettings = computed(
  () => currentUser?.value?.tenants.find(
    (tu) => tu.tenantId === currentTenant?.value.id,
  )?.settings.eagleEye,
);

const { doUpdateSettings } = mapActions('eagleEye');
const { loadingUpdateSettings } = mapState('eagleEye');

const emit = defineEmits(['update:modelValue']);

const rules = {
  email: {
    required,
    email,
  },
};

const form = reactive({
  active: false,
  email: '',
  frequency: 'daily',
  time: '09:00',
  updateResults: true,
});
const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const feed = ref(null);
const { elementSnapshot, hasElementChanged } = elementChangeDetector(feed);

const $v = useVuelidate(rules, form);

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const results = computed(() => {
  if (!form.updateResults) {
    if (currentUser.value && feed.value) {
      return feed.value;
    }
  }
  return eagleEyeSettings.value.feed;
});

const displayFeedWarning = computed(() => {
  if (form.updateResults) {
    return false;
  }
  if (eagleEyeSettings.value.feed && feed.value) {
    return (
      JSON.stringify(eagleEyeSettings.value.feed)
      !== JSON.stringify(feed.value)
    );
  }
  return false;
});

const updateFeed = () => {
  feed.value = eagleEyeSettings.value.feed ?? null;
};

const fillForm = (user) => {
  form.active = eagleEyeSettings.value.emailDigestActive || false;
  form.email = eagleEyeSettings.value.emailDigest?.email || user.email;
  form.frequency = eagleEyeSettings.value.emailDigest?.frequency || 'daily';
  form.time = eagleEyeSettings.value.emailDigest?.time
    ? moment
      .utc(
        eagleEyeSettings.value.emailDigest?.time,
        'HH:mm',
      )
      .local()
      .format('HH:mm')
    : '09:00';
  form.updateResults = !eagleEyeSettings.value.emailDigest
    ? true
    : eagleEyeSettings.value.emailDigest?.matchFeedSettings;
  formSnapshot();
  feed.value = eagleEyeSettings.value?.emailDigest?.feed
    || eagleEyeSettings.value?.feed
    || null;
  elementSnapshot();
};
const doSubmit = async () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    const data = {
      email: form.email,
      frequency: form.frequency,
      time: moment(form.time, 'HH:mm')
        .utc()
        .format('HH:mm'),
      matchFeedSettings: form.updateResults,
      feed: !form.updateResults ? feed.value : undefined,
    };
    doUpdateSettings({
      data: {
        ...eagleEyeSettings.value,
        emailDigestActive: form.active,
        emailDigest: data,
      },
      fetchNewResults: false,
    }).then(() => {
      Message.success(
        'Email Digest settings successfully updated',
      );
      emit('update:modelValue', false);
    });
  }
};

const handleCancel = () => {
  emit('update:modelValue', false);
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fillForm(currentUser.value);
    }
  },
);

onMounted(() => {
  fillForm(currentUser.value);
});
</script>

<style lang="scss">
.frequency-radio {
  .el-radio__input {
    @apply pt-1;
  }
}
</style>

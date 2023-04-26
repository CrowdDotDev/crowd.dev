<template>
  <app-drawer
    v-model="isDrawerOpen"
    title=""
  >
    <template #header>
      <div>
        <div v-if="props.modelValue === 'webhook'" class="flex items-center">
          <img alt="Webhook" src="/images/automation/webhook.png" class="w-4 max-w-4">
          <p class="pl-2 text-xs text-gray-900">
            Webhook
          </p>
        </div>
        <div v-else-if="props.modelValue === 'slack'" class="flex items-center">
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
          <p v-if="props.modelValue === 'webhook'" class="text-2xs text-gray-500">
            Define the event that triggers your webhook
          </p>
          <p v-else-if="props.modelValue === 'slack'" class="text-2xs text-gray-500">
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
          <p v-if="props.modelValue === 'webhook'" class="text-2xs text-gray-500">
            Define the endpoint where the webhook payload should be sent to
          </p>
          <p v-else-if="props.modelValue === 'slack'" class="text-2xs text-gray-500">
            Receive a notification in your Slack workspace every time the event is triggered.
          </p>
        </div>
        <div>
          <app-automation-webhook-action v-if="props.modelValue === 'webhook'" v-model="form.action" />
          <app-automation-slack-action v-else-if="props.modelValue === 'slack'" v-model="form.action" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between">
        <div>
          <!--                <el-button-->
          <!--                        v-if="isEditing && isDirty"-->
          <!--                        class="btn btn-link btn-link&#45;&#45;primary"-->
          <!--                        @click="doReset"-->
          <!--                >-->
          <!--                    <i class="ri-arrow-go-back-line" />-->
          <!--                    <span>Reset changes</span>-->
          <!--                </el-button>-->
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
            :disabled="$v.$invalid || sending"
            :loading="sending"
            class="btn btn--md btn--primary"
            @click="doSubmit"
          >
            <span v-if="isEdit">Update</span>
            <span v-else-if="props.modelValue === 'webhook'">Add webhook</span>
            <span v-else-if="props.modelValue === 'slack'">Add Slack notification</span>
            <span v-else>Add automation</span>
          </el-button>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  computed, defineProps, defineEmits, reactive, ref,
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
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useAutomationStore } from '@/modules/automation/store';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';

const props = defineProps({
  modelValue: {
    type: String,
    required: false,
    default: null,
  },
  automation: {
    type: Object,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const { createAutomation } = useAutomationStore();

const isDrawerOpen = computed({
  get() {
    return props.modelValue !== null;
  },
  set(val) {
    if (!val) {
      emit('update:modelValue', null);
    } else {
      emit('update:modelValue', props.modelValue);
    }
  },
});

const isEdit = computed(() => props.automation !== null);

const triggerOptions = ref([
  {
    label: 'New activity happened in your community',
    value: 'new_activity',
  },
  {
    label: 'New member joined your community',
    value: 'new_member',
  },
]);

const collapseOpen = ref('filterOptions');

const form = reactive({
  name: '',
  trigger: '',
  settings: {},
  action: {},
});

const rules = {
  trigger: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const sending = ref(false);

const doSubmit = () => {
  if ($v.value.$invalid) {
    return;
  }
  sending.value = true;
  const data = {
    name: form.name ?? i18n(`entities.automation.triggers.${form.trigger}`),
    type: props.modelValue,
    trigger: form.trigger,
    settings: {
      ...form.settings,
      ...form.action,
    },
  };
  if (!isEdit.value) {
    createAutomation(data)
      .then(() => {
        emit('update:modelValue', null);
      })
      .catch(() => {
        Message.error('There was an error creating automation, please try again later.');
      })
      .finally(() => {
        sending.value = false;
      });
  }
};

</script>

<script>
export default {
  name: 'AppAutomationForm',
};
</script>

<!--<script>-->
<!--import { mapGetters, mapActions } from 'vuex';-->
<!--import isEqual from 'lodash/isEqual';-->
<!--import { AutomationModel } from '@/modules/automation/automation-model';-->
<!--import { FormSchema } from '@/shared/form/form-schema';-->
<!--import { i18n } from '@/i18n';-->
<!--import activityTypesJson from '@/jsons/activity-types.json';-->
<!--import UrlField from '@/shared/fields/url-field';-->
<!--import { onSelectMouseLeave } from '@/utils/select';-->
<!--import { CrowdIntegrations } from '@/integrations/integrations-config';-->

<!--const { fields } = AutomationModel;-->
<!--const formSchema = new FormSchema([-->
<!--  fields.id,-->
<!--  fields.type,-->
<!--  fields.trigger,-->
<!--  fields.status,-->
<!--  fields.settings,-->
<!--  new UrlField('settings.url', 'Webhook URL', {-->
<!--    required: true,-->
<!--  }),-->
<!--]);-->

<!--  emits: ['cancel', 'success', 'close'],-->
<!--  data() {-->
<!--    return {-->
<!--      rules: formSchema.rules(),-->
<!--      newActivityFilters: 'activityFilters',-->
<!--      newMemberFilters: 'memberFilters',-->
<!--      loadingIntegrations: false,-->
<!--      model: formSchema.initialValues(-->
<!--        JSON.parse(JSON.stringify(this.modelValue)),-->
<!--      ),-->
<!--    };-->
<!--  },-->

<!--  computed: {-->
<!--    isDrawerOpenComputed: {-->
<!--      get() {-->
<!--        return this.isDrawerOpen;-->
<!--      },-->
<!--      set(value) {-->
<!--        this.$emit('close');-->
<!--        return value;-->
<!--      },-->
<!--    },-->
<!--    ...mapGetters({-->
<!--      loading: 'automation/loading',-->
<!--      integrationsActive: 'integration/active',-->
<!--      integrationsCount: 'integration/count',-->
<!--    }),-->
<!--    fields() {-->
<!--      return fields;-->
<!--    },-->
<!--    isEditing() {-->
<!--      return this.modelValue.id !== undefined;-->
<!--    },-->
<!--    saveLoading() {-->
<!--      return this.loading('submit');-->
<!--    },-->
<!--    isFilled() {-->
<!--      return this.model.trigger && this.model.settings.url;-->
<!--    },-->
<!--    isDirty() {-->
<!--      return !isEqual(-->
<!--        formSchema.initialValues(-->
<!--          JSON.parse(JSON.stringify(this.modelValue)),-->
<!--        ),-->
<!--        this.model,-->
<!--      );-->
<!--    },-->

<!--    computedActivityTypeOptions() {-->
<!--      if (-->
<!--        !this.model.settings.platforms-->
<!--        || this.model.settings.platforms.length === 0-->
<!--      ) {-->
<!--        return [];-->
<!--      }-->

<!--      return this.model.settings.platforms.reduce(-->
<!--        (acc, platform) => {-->
<!--          const platformActivityTypes = activityTypesJson[platform];-->
<!--          acc.push(-->
<!--            ...platformActivityTypes.map((activityType) => ({-->
<!--              value: activityType,-->
<!--              label: i18n(-->
<!--                `entities.activity.${platform}.${activityType}`,-->
<!--              ),-->
<!--            })),-->
<!--          );-->
<!--          return acc;-->
<!--        },-->
<!--        [],-->
<!--      );-->
<!--    },-->
<!--  },-->

<!--  async created() {-->
<!--    if (this.integrationsCount === 0) {-->
<!--      this.loadingIntegrations = true;-->
<!--      await this.doFetchIntegrations();-->
<!--      this.loadingIntegrations = false;-->
<!--    }-->
<!--  },-->

<!--  methods: {-->
<!--    ...mapActions({-->
<!--      doFetchIntegrations: 'integration/doFetch',-->

<!--    }),-->
<!--    translate(key) {-->
<!--      return i18n(key);-->
<!--    },-->
<!--    async doSubmit() {-->
<!--      try {-->
<!--        await this.$refs.form.validate();-->
<!--      } catch (error) {-->
<!--        console.error(error);-->
<!--        return;-->
<!--      }-->

<!--      if (this.isEditing) {-->
<!--        await this.doUpdate({-->
<!--          id: this.model.id,-->
<!--          values: formSchema.cast(this.model),-->
<!--        });-->
<!--      } else {-->
<!--        await this.doCreate(formSchema.cast(this.model));-->
<!--      }-->

<!--      this.$emit('success');-->
<!--    },-->
<!--    doReset() {-->
<!--      this.model = formSchema.initialValues(-->
<!--        JSON.parse(JSON.stringify(this.modelValue)),-->
<!--      );-->
<!--    },-->
<!--    getPlatformDetails(platform) {-->
<!--      return CrowdIntegrations.getConfig(platform);-->
<!--    },-->

<!--    doCancel() {-->
<!--      this.$emit('cancel');-->
<!--    },-->

<!--    onSelectMouseLeave,-->
<!--  },-->
<!--};-->
<!--</script>-->

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

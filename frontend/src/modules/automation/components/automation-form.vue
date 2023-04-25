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
            Define the event that triggers your webkook
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
          >
            <el-option
              v-for="{ value, label } of triggerOptions"
              :key="value"
              :value="value"
              :label="label"
            />
          </el-select>
        </app-form-item>
        <div class="filter-options">
          <el-collapse v-if="form.trigger">
            <el-collapse-item
              title="Filter options"
              name="filterOptions"
            >
              <app-new-activity-filter-options v-if="form.trigger === 'new_activity'" v-model="form.settings" />
              <!--            <div class="flex items-start gap-4 mb-2">-->
              <!--              <el-form-item-->
              <!--                label="Matching activity platform(s)"-->
              <!--                class="grow"-->
              <!--              >-->
              <!--                <el-select-->
              <!--                  v-model="model.settings.platforms"-->
              <!--                  multiple-->
              <!--                  placeholder="Select option"-->
              <!--                >-->
              <!--                  <el-option-->
              <!--                    v-for="platform of computedPlatformOptions"-->
              <!--                    :key="platform.value"-->
              <!--                    :value="platform.value"-->
              <!--                    :label="platform.label"-->
              <!--                    @mouseleave="onSelectMouseLeave"-->
              <!--                  >-->
              <!--                    <div class="flex items-center">-->
              <!--                      <img-->
              <!--                        :alt="-->
              <!--                          getPlatformDetails(-->
              <!--                            platform.value,-->
              <!--                          ).name-->
              <!--                        "-->
              <!--                        :src="-->
              <!--                          getPlatformDetails(-->
              <!--                            platform.value,-->
              <!--                          ).image-->
              <!--                        "-->
              <!--                        class="w-4 h-4 mr-2"-->
              <!--                      />-->
              <!--                      {{ platform.label }}-->
              <!--                    </div>-->
              <!--                  </el-option>-->
              <!--                </el-select>-->
              <!--              </el-form-item>-->
              <!--              <el-form-item-->
              <!--                label="Matching activity type(s)"-->
              <!--                class="grow"-->
              <!--              >-->
              <!--                <el-select-->
              <!--                  v-model="model.settings.types"-->
              <!--                  multiple-->
              <!--                  placeholder="Select option"-->
              <!--                  :disabled="-->
              <!--                    model.settings.platforms.length === 0-->
              <!--                  "-->
              <!--                >-->
              <!--                  <el-option-->
              <!--                    v-for="platform of computedActivityTypeOptions"-->
              <!--                    :key="platform.value"-->
              <!--                    :value="platform.value"-->
              <!--                    :label="platform.label"-->
              <!--                    @mouseleave="onSelectMouseLeave"-->
              <!--                  />-->
              <!--                </el-select>-->
              <!--              </el-form-item>-->
              <!--            </div>-->
              <!--            <el-form-item label="Including keyword(s)">-->
              <!--              <app-keywords-input-->
              <!--                v-model="model.settings.keywords"-->
              <!--              />-->
              <!--            </el-form-item>-->
              <!--            <el-checkbox-->
              <!--              v-model="-->
              <!--                model.settings.teamMemberActivities-->
              <!--              "-->
              <!--              class="text-gray-900"-->
              <!--              label="Include activities from team members"-->
              <!--            />-->
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      <!--      <el-form-->
      <!--        v-if="model"-->
      <!--        ref="form"-->
      <!--        label-position="top"-->
      <!--        :model="model"-->
      <!--        :rules="rules"-->
      <!--        class="form automation-form"-->
      <!--        @submit.prevent="doSubmit"-->
      <!--      >-->
      <!--        <div v-else class="flex flex-col">-->

      <!--          <el-form-item-->
      <!--            :label="fields.trigger.label"-->
      <!--            :prop="fields.trigger.name"-->
      <!--            :required="fields.trigger.required"-->
      <!--            class="w-full"-->
      <!--          >-->
      <!--            <el-select-->
      <!--              v-model="model.trigger"-->
      <!--              placeholder="Select option"-->
      <!--            >-->
      <!--              <el-option-->
      <!--                key="new_activity"-->
      <!--                value="new_activity"-->
      <!--                :label="-->
      <!--                  translate(-->
      <!--                    'entities.automation.triggers.new_activity',-->
      <!--                  )-->
      <!--                "-->
      <!--                @mouseleave="onSelectMouseLeave"-->
      <!--              />-->
      <!--              <el-option-->
      <!--                key="new_member"-->
      <!--                value="new_member"-->
      <!--                :label="-->
      <!--                  translate(-->
      <!--                    'entities.automation.triggers.new_member',-->
      <!--                  )-->
      <!--                "-->
      <!--                @mouseleave="onSelectMouseLeave"-->
      <!--              />-->
      <!--            </el-select>-->
      <!--          </el-form-item>-->

      <!--          <el-collapse-->
      <!--            v-if="model.trigger === 'new_member'"-->
      <!--            v-model="newMemberFilters"-->
      <!--          >-->
      <!--            <el-collapse-item-->
      <!--              title="Filter options"-->
      <!--              name="memberFilters"-->
      <!--            >-->
      <!--              <el-form-item-->
      <!--                label="Matching member platform(s)"-->
      <!--                class="w-full"-->
      <!--              >-->
      <!--                <el-select-->
      <!--                  v-model="model.settings.platforms"-->
      <!--                  multiple-->
      <!--                  placeholder="Select option"-->
      <!--                >-->
      <!--                  <el-option-->
      <!--                    v-for="platform of computedPlatformOptions"-->
      <!--                    :key="platform.value"-->
      <!--                    :value="platform.value"-->
      <!--                    :label="platform.label"-->
      <!--                    @mouseleave="onSelectMouseLeave"-->
      <!--                  />-->
      <!--                </el-select>-->
      <!--              </el-form-item>-->
      <!--            </el-collapse-item>-->
      <!--          </el-collapse>-->

      <!--          <el-divider-->
      <!--            class="border-gray-200 mt-4 mb-6"-->
      <!--          />-->

      <!--          <div class="flex flex-col gap-1 mb-6">-->
      <!--            <span-->
      <!--              class="text-base font-semibold text-brand-500"-->
      <!--            >Action</span>-->
      <!--            <span class="text-gray-500 text-2xs">Define the endpoint where the webhook payload-->
      <!--              should be sent to</span>-->
      <!--          </div>-->

      <!--          <el-form-item-->
      <!--            label="Webhook URL"-->
      <!--            required-->
      <!--            prop="settings.url"-->
      <!--          >-->
      <!--            <el-input-->
      <!--              v-model="model.settings.url"-->
      <!--              type="text"-->
      <!--              placholder="https://somewebhook.url"-->
      <!--            />-->
      <!--          </el-form-item>-->
      <!--        </div>-->
      <!--      </el-form>-->
    </template>

    <template #footer>
      <!--      <div-->
      <!--        class="flex grow items-center"-->
      <!--        :class="-->
      <!--          isEditing && isDirty-->
      <!--            ? 'justify-between'-->
      <!--            : 'justify-end'-->
      <!--        "-->
      <!--      >-->
      <!--        <el-button-->
      <!--          v-if="isEditing && isDirty"-->
      <!--          class="btn btn-link btn-link&#45;&#45;primary"-->
      <!--          @click="doReset"-->
      <!--        >-->
      <!--          <i class="ri-arrow-go-back-line" />-->
      <!--          <span>Reset changes</span>-->
      <!--        </el-button>-->

      <!--        <div class="flex gap-4">-->
      <!--          <el-button-->
      <!--            :disabled="saveLoading"-->
      <!--            class="btn btn&#45;&#45;md btn&#45;&#45;bordered"-->
      <!--            @click="doCancel"-->
      <!--          >-->
      <!--            <app-i18n code="common.cancel" />-->
      <!--          </el-button>-->

      <!--          <el-button-->
      <!--            :disabled="saveLoading || !isFilled || !isDirty"-->
      <!--            class="btn btn&#45;&#45;md btn&#45;&#45;primary"-->
      <!--            @click="doSubmit"-->
      <!--          >-->
      <!--            {{ isEditing ? 'Update' : 'Add webhook' }}-->
      <!--          </el-button>-->
      <!--        </div>-->
      <!--      </div>-->
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

    computedActivityTypeOptions() {
      if (
        !this.model.settings.platforms
        || this.model.settings.platforms.length === 0
      ) {
        return [];
      }

      return this.model.settings.platforms.reduce(
        (acc, platform) => {
          const platformActivityTypes = activityTypesJson[platform];
          acc.push(
            ...platformActivityTypes.map((activityType) => ({
              value: activityType,
              label: i18n(
                `entities.activity.${platform}.${activityType}`,
              ),
            })),
          );
          return acc;
        },
        [],
      );
    },
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
<!--      doUpdate: 'automation/doUpdate',-->
<!--      doCreate: 'automation/doCreate',-->
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
      @apply text-gray-600 bg-gray-50 text-xs flex flex-row-reverse justify-end leading-tight h-6 font-medium border-none;
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

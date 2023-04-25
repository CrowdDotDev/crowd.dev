<template>
  <div>
    <div class="flex -mx-2">
      <div class="w-full lg:w-1/2 px-2">
        <app-form-item
          class="pb-4"
          label="Matching activity platform(s)"
        >
          <el-select
            v-model="form.platforms"
            class="w-full"
            multiple
            placeholder="Select option"
          >
            <el-option
              v-for="platform of computedPlatformOptions"
              :key="platform.value"
              :value="platform.value"
              :label="platform.label"
            >
              <div class="flex items-center">
                <img
                  :alt="
                    getPlatformDetails(
                      platform.value,
                    ).name
                  "
                  :src="
                    getPlatformDetails(
                      platform.value,
                    ).image
                  "
                  class="w-4 h-4 mr-2"
                />
                {{ platform.label }}
              </div>
            </el-option>
          </el-select>
        </app-form-item>
      </div>
      <div class="w-full lg:w-1/2 px-2">
        <app-form-item
          class="pb-4"
          label="Matching activity type(s)"
        >
          <el-select
            v-model="form.types"
            class="w-full"
            multiple
            placeholder="Select option"
            :disabled="
              form.platforms.length === 0
            "
          >
            <el-option
              v-for="platform of computedActivityTypeOptions"
              :key="platform.value"
              :value="platform.value"
              :label="platform.label"
            />
          </el-select>
        </app-form-item>
      </div>
    </div>
    <app-form-item
      label="Including keyword(s)"
    >
      <app-keywords-input
        v-model="form.keywords"
      />
    </app-form-item>
    <el-checkbox
      v-model="
        form.teamMemberActivities
      "
      class="text-gray-900"
      label="Include activities from team members"
    />
  </div>
</template>

<script setup>
import {
  computed, defineEmits, defineProps, onMounted,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';
import AppKeywordsInput from '@/shared/form/keywords-input.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const defaultValue = {
  platforms: [],
  types: [],
  keywords: [],
  teamMemberActivities: false,
};

const form = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const { active } = mapGetters('integration');

const { types } = storeToRefs(useActivityTypeStore());

const computedPlatformOptions = computed(() => active.value.map((item) => ({
  value: item.platform,
  label: CrowdIntegrations.getConfig(item.platform)
    .name,
})));

const computedActivityTypeOptions = computed(() => {
  if (
    !form.value.platforms
        || form.value.platforms.length === 0
  ) {
    return [];
  }
  return form.value.platforms.map(
    (platform) => Object.entries(types.value.default[platform]).map(([key, display]) => ({
      value: key,
      label: display.display.short,
    })),
  ).flat();
});

const getPlatformDetails = (platform) => CrowdIntegrations.getConfig(platform);

onMounted(() => {
  if (!props.modelValue) {
    emit('update:modelValue', defaultValue);
  }
});

</script>

<script>
export default {
  name: 'AppNewActivityFilterOptions',
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
<!--    computedPlatformOptions() {-->
<!--      return this.integrationsActive.map((item) => ({-->
<!--        value: item.platform,-->
<!--        label: CrowdIntegrations.getConfig(item.platform)-->
<!--          .name,-->
<!--      }));-->
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

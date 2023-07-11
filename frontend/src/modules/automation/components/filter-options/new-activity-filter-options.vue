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

// const computedPlatformOptions = computed(() => active.value.map((item) => ({
//   value: item.platform,
//   label: CrowdIntegrations.getConfig(item.platform)
//     .name,
// })));

const computedPlatformOptions = computed(() => CrowdIntegrations.enabledConfigs.map((i) => ({
    label: i.name,
    value: i.platform
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
  if (Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', defaultValue);
  }
});

</script>

<script>
export default {
  name: 'AppNewActivityFilterOptions',
};
</script>

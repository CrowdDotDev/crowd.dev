<template>
  <div>
    <app-form-item
      class="pb-4"
      label="Matching contributor platform(s)"
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
</template>

<script setup>
import {
  computed, onMounted,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const defaultValue = {
  platforms: [],
};

const form = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const computedPlatformOptions = computed(() => [...CrowdIntegrations.enabledConfigs.map((item) => ({
  value: item.platform,
  label: item.name,
})),
{
  value: 'twitter',
  label: 'X/Twitter',
},
]);

const getPlatformDetails = (platform) => CrowdIntegrations.getConfig(platform);

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', defaultValue);
  }
});

</script>

<script>
export default {
  name: 'AppNewMemberFilterOptions',
};
</script>

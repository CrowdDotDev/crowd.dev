<template>
  <div>
    <app-form-item
      class="pb-4"
      label="Matching member platform(s)"
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
  computed, defineEmits, defineProps, onMounted,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
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

const { active } = mapGetters('integration');

const computedPlatformOptions = computed(() => [...active.value.map((item) => ({
  value: item.platform,
  label: CrowdIntegrations.getConfig(item.platform)
    .name,
})),
{
  value: 'twitter',
  label: 'Twitter',
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

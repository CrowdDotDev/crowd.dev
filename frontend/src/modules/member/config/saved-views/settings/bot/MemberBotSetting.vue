<template>
  <article>
    <p class="text-xs font-semibold leading-5 mb-3">
      Bot contacts visibility
    </p>
    <el-radio-group v-model="value">
      <el-radio :label="IncludeEnum.EXCLUDE" class="!h-5">
        <span class="text-xs">Exclude bot contacts</span>
      </el-radio>
      <el-radio :label="IncludeEnum.INCLUDE" class="!h-5">
        <span class="text-xs">Include bot contacts</span>
      </el-radio>
    </el-radio-group>
  </article>
</template>

<script setup lang="ts">
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: IncludeEnum,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: IncludeEnum): any }>();

const value = computed<IncludeEnum>({
  get() {
    return props.modelValue;
  },
  set(val: IncludeEnum) {
    emit('update:modelValue', val);
  },
});
</script>

<script lang="ts">
export default {
  name: 'CrMemberTeamMemberSetting',
};
</script>

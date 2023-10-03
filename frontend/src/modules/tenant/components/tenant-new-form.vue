<template>
  <app-dialog
    v-model="model"
    title="Add workspace"
    size="small"
  >
    <template #content>
      <div class="px-6 pb-6">
        <app-form-item
          class="pb-8"
          label="Community name"
          :required="true"
          :validation="$v.tenantName"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <el-input
            v-model="tenantName"
            type="text"
            @blur="$v.tenantName.$touch"
            @change="$v.tenantName.$touch"
          />
        </app-form-item>
        <el-button class="btn btn--primary btn--md btn--full" :disabled="loading" @click="onBtnClick">
          <i v-if="loading" class="ri-loader-4-line animate-spin w-5 text-white" />
          <span>{{ buttonCta }}</span>
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script setup lang="ts">
import AppFormItem from '@/shared/form/form-item.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { computed, ref } from 'vue';
import { TenantService } from '@/modules/tenant/tenant-service';
import { useStore } from 'vuex';

const props = defineProps<{
  modelValue: boolean,
}>();
const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();

const store = useStore();

const loading = ref(false);
const tenantName = ref(null);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v: boolean) {
    emit('update:modelValue', v);
  },
});
const buttonCta = computed(() => (loading.value ? 'Creating workspace' : 'Add workspace'));

const rules = {
  tenantName: {
    required,
  },
};

const $v = useVuelidate(rules, { tenantName });

const onBtnClick = () => {
  loading.value = true;

  // Create new tenant and update onBoardedAt value to skip onboarding
  TenantService.create({
    name: tenantName.value,
    integrationsRequired: [],
  })
    .then((tenant) => TenantService.update(tenant.id, {
      onboardedAt: new Date(),
    })
      .then(() => TenantService.populateSampleData(tenant.id))
      .then(() => {
        // Close add workspace modal
        emit('update:modelValue', false);

        // Select tenant in app
        store.dispatch('auth/doSelectTenant', { tenant });
        return Promise.resolve();
      }))
    .finally(() => {
      loading.value = false;
    });
};
</script>

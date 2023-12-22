<template>
  <app-dialog
    v-model="model"
    title="Add workspace"
    size="large"
  >
    <template #content>
      <div class="px-6 pb-6">
        <app-form-item
          label="Workspace name"
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

        <div class="mt-4 w-full workspace-plans">
          <div class="flex justify-between items-center">
            <div class="font-semibold text-xs">
              <span class="text-gray-900">Choose plan</span>
              <span class="text-red-500 ml-1">*</span>
            </div>
            <el-radio-group v-model="selectedPaymentOption" size="small" class="radio-button-group-custom">
              <el-radio-button label="yearly">
                Yearly payment
              </el-radio-button>
              <el-radio-button label="monthly">
                Monthly payment
              </el-radio-button>
            </el-radio-group>
          </div>

          <div class="mb-10 shadow rounded-lg mt-3 workspace-plans">
            <el-radio-group v-model="selectedPlan">
              <el-radio label="essential" class="h-fit !flex gap-2 p-4 m-0">
                <div class="flex justify-between items-start">
                  <div class="flex flex-col gap-1">
                    <div class="font-semibold text-gray-900 text-sm">
                      Essential
                    </div>
                    <div class="text-gray-600 text-2xs">
                      Understand & manage your community
                    </div>
                  </div>

                  <div class="font-normal text-brand-500 text-sm">
                    {{ payments.essential }}
                  </div>
                </div>
              </el-radio>
              <el-divider class="my-1 border-gray-200" />
              <el-radio label="scale" class="h-fit !flex gap-2 p-4">
                <div class="flex justify-between items-start">
                  <div class="flex flex-col gap-1">
                    <div class="font-semibold text-gray-900 text-sm">
                      Scale
                    </div>
                    <div class="text-gray-600 text-2xs">
                      Commercialize your open source product
                    </div>
                  </div>

                  <div class="font-normal text-brand-500 text-sm">
                    {{ payments.scale }}
                  </div>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </div>

        <el-button class="btn btn--primary btn--md btn--full" :disabled="$v.$invalid || loading" @click="onBtnClick">
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
import {
  computed, ref,
} from 'vue';
import { TenantService } from '@/modules/tenant/tenant-service';
import { useStore } from 'vuex';

const props = defineProps<{
  modelValue: boolean,
}>();
const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void, (e: 'createdTenant', value: boolean): void }>();

const store = useStore();

const loading = ref(false);
const tenantName = ref(null);
const selectedPaymentOption = ref('yearly');
const selectedPlan = ref(null);

const payments = computed(() => {
  if (selectedPaymentOption.value === 'yearly') {
    return {
      essential: '$120/month',
      scale: '$400/month',
    };
  }

  return {
    essential: '$150/month',
    scale: '$450/month',
  };
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v: boolean) {
    emit('update:modelValue', v);
  },
});
const buttonCta = computed(() => (loading.value ? 'Creating workspace' : 'Start 30-days free trial'));

const rules = {
  tenantName: {
    required,
  },
  selectedPaymentOption: {
    required,
  },
  selectedPlan: {
    required,
  },
};

const $v = useVuelidate(rules, {
  tenantName,
  selectedPaymentOption,
  selectedPlan,
});

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
      .then(() => {
        // Close add workspace modal
        emit('update:modelValue', false);
        emit('createdTenant', true);

        // Select tenant in app
        store.dispatch('tenant/doFetch', {});
        store.dispatch('auth/doSelectTenant', { tenant });
        return Promise.resolve();
      }))
    .finally(() => {
      loading.value = false;
    });
};
</script>

<style lang="scss">
.workspace-plans {
  .el-radio-group .el-radio__label {
    @apply w-full;
  }

  .el-radio-group {
    @apply block;

    &.radio-button-group-custom {
      .el-radio-button {
        @apply border-gray-200;

        &__original-radio:checked + .el-radio-button__inner {
          @apply bg-gray-100 border-gray-600 text-gray-900;
          border-color: #E5E7EB !important;
          box-shadow: -1px 0 0 0 #E5E7EB;
        }

        .el-radio-button__inner {
          @apply w-full text-gray-600;
        }

        &:hover .el-radio-button__inner {
          @apply text-gray-900;
        }
      }

      &.is-small {
        .el-radio-button__inner {
          @apply p-2;
        }
      }
    }
  }
}
</style>

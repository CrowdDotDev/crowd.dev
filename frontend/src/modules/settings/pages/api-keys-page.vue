<template>
  <div class="panel mt-6 grid grid-cols-3 gap-12">
    <div class="col-span-1">
      <h6>API access</h6>
      <div class="text-2xs text-gray-500 mt-1">
        Read our
        <a
          href="https://app.swaggerhub.com/apis-docs/Crowd.dev/Crowd.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold hover:underline"
        >documentation</a>
        to get the most out of our API
      </div>
    </div>
    <el-form
      class="col-span-2 api-keys-form flex flex-col gap-2"
      label-position="top"
    >
      <el-form-item label="Tenant ID">
        <div
          class="text-2xs text-gray-500 leading-normal mb-1"
        >
          Workspace identifier
        </div>
        <el-input :value="tenantId" :readonly="true">
          <template #append>
            <el-tooltip
              content="Copy to clipboard"
              placement="top"
            >
              <el-button
                class="append-icon"
                @click="copyToClipboard('tenantId')"
              >
                <lf-icon name="copy" :size="16" class="!text-large" />
              </el-button>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="Auth Token">
        <el-input
          ref="inputRef"
          :value="jwtToken"
          readonly
          :type="showToken ? 'text' : 'password'"
        >
          <template #append>
            <el-tooltip
              v-if="!showToken"
              content="Show Auth Token"
              placement="top"
            >
              <el-button
                class="append-icon"
                @click="onShowToken"
              >
                <lf-icon name="eye" :size="16" class="!text-large" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-else
              content="Copy to clipboard"
              placement="top"
            >
              <el-button @click="copyToClipboard('token')">
                <lf-icon name="copy" :size="16" class="!text-large" />
              </el-button>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { AuthService } from '@/modules/auth/services/auth.service';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import Message from '@/shared/message/message';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const inputRef = ref();
const showToken = ref(false);

const tenantId = computed(() => AuthService.getTenantId());
const jwtToken = computed(() => AuthService.getToken());

const { trackEvent } = useProductTracking();

const copyToClipboard = async (type) => {
  const toCopy = type === 'token' ? jwtToken.value : tenantId.value;

  trackEvent({
    key: type === 'token' ? FeatureEventKey.COPY_AUTH_TOKEN : FeatureEventKey.COPY_TENANT_ID,
    type: EventType.FEATURE,
  });

  await navigator.clipboard.writeText(toCopy);

  Message.success(
    `${
      type === 'token' ? 'Auth Token' : 'Tenant ID'
    } successfully copied to your clipboard`,
  );
};

const onShowToken = () => {
  trackEvent({
    key: FeatureEventKey.SHOW_AUTH_TOKEN,
    type: EventType.FEATURE,
  });

  showToken.value = true;
  inputRef.value.focus();
};
</script>

<script>
export default {
  name: 'AppApiKeysPage',
};
</script>

<style lang="scss">
.api-keys-form.el-form {
  .el-form-item {
    @apply mb-0;
  }

  .el-form-item .el-input__wrapper .el-input__inner {
    @apply text-gray-500;
  }

  .el-form-item .el-form-item__label,
  .el-form--default.el-form--label-top
    .el-form-item
    .el-form-item__label:first-of-type {
    @apply mb-0;
  }
}
</style>

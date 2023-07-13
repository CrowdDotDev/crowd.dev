<template>
  <app-dialog v-model="isModalOpen" title="test" size="medium">
    <template #header>
      <div>
        <p class="text-2xs leading-5 text-gray-500 mb-0.5">
          Twitter integration
        </p>
        <h4 class="text-base font-semibold">
          Connect Twitter via Zapier
        </h4>
      </div>
    </template>
    <template #content>
      <div class="px-6 pb-6">
        <img src="/images/integrations/twitter-zapier.jpg" alt="Twitter Zapier integration" class="w-full mb-6">
        <p class="text-sm leading-5 text-gray-500 pb-8">
          Due to Twitter’s recent API changes, our native Twitter integration was discontinued on April 31st, 2023.
          To keep tracking Twitter activities, you will have to use Zapier.
          The Zapier workflow will require some manual set-up, and a Zapier premium account (starting from $19.99/month).
        </p>
        <a href="https://zapier.com/shared/create-activities-in-crowddev-from-new-twitter-followers/e61afb14fdd16e7235343aab9aa57b4d40a71ecf" target="_blank" rel="noopener noreferrer" class="mb-4 block">
          <el-button class="btn btn--primary btn--md w-full">
            Check our Zapier templates
          </el-button>
        </a>
        <a href="https://docs.crowd.dev/docs/twitter-integration-via-zapier" target="_blank" rel="noopener noreferrer" class="block">
          <el-button class="btn btn--secondary btn--md w-full text-gray-600">
            <span class="text-lg ri-book-open-line text-brand-500 mr-2" />
            Read our docs
          </el-button>
        </a>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue';
import AppDialog from '@/shared/dialog/dialog.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const isModalOpen = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

</script>

<script>
export default {
  name: 'AppTwitterConnectModal',
};
</script>

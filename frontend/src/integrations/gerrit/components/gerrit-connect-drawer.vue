<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-gerrit-drawer"
    title="Gerrit"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="Gerrit logo" />
    </template>
    <template #content>
      <div class="text-gray-900 text-sm font-medium">
        Remote URL
      </div>
      <div class="text-2xs text-gray-500">
        Connect remote Gerrit repository.
      </div>

      <el-form class="mt-2" @submit.prevent>
        <el-input
          id="devUrl"
          v-model="form.orgURL"
          class="text-green-500"
          spellcheck="false"
          placeholder="Enter Organization URL"
        />
        <el-input
          id="devUrl"
          v-model="form.projectName"
          class="text-green-500 mt-2"
          spellcheck="false"
          placeholder="Enter Project Name"
        />
        <el-input
            id="devUrl"
            v-model="form.user"
            class="text-green-500 mt-2"
            spellcheck="false"
            placeholder="Enter username"
        />
        <el-input
            id="devUrl"
            v-model="form.key"
            class="text-green-500 mt-2"
            spellcheck="false"
            placeholder="Enter Project key"
        />
      </el-form>
    </template>

    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--secondary mr-4"
          :disabled="loading"
          @click="cancel"
        >
          Cancel
        </el-button>
        <el-button
          id="gerritConnect"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="connect"
        >
          <app-i18n code="common.connect" />
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  integration: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const form = reactive({
  orgURL: '',
  projectName: '',
  user: '',
  key: ''
});

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const $v = useVuelidate({}, form, { $stopPropagation: true });

const { doGerritConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const logoUrl = computed(() => CrowdIntegrations.getConfig('gerrit').image);

onMounted(() => {
  if (props.integration?.settings?.remote) {
    form.orgURL = props.integration.settings.remote.orgURL;
    form.projectName = props.integration.settings.remote.projectName;
    form.user = props.integration.settings.remote.user;
    form.key = props.integration.settings.remote.key;
  }
  formSnapshot();
});

const cancel = () => {
  isVisible.value = false;
};

const connect = async () => {
  loading.value = true;

  doGerritConnect({
    orgURL: form.orgURL,
    projectName: form.projectName,
    user: form.user,
    key: form.key,
  })
    .then(() => {
      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<script>
export default {
  name: 'AppGerritConnectDrawer',
};
</script>

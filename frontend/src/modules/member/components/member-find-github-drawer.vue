<template>
  <app-drawer
    v-model="drawerModel"
    size="35%"
    :title="title"
    custom-class="identities-drawer"
  >
    <template #content>
      <p class="text-sm text-gray-600 mb-6">
        We have found the following profiles on GitHub that could match {{ modelValue.displayName }}.
        You can select the correct one to add it to the contact.
      </p>
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.url"
        class="flex items-center"
      >
        <div
          class="py-2 flex justify-between w-full px-4 cursor-pointer hover:bg-gray-50 rounded-md hover:shadow-sm"
          :class="{ selected: selected === suggestion.username }"
          @click="changeSelected(suggestion.username)"
        >
          <div class="flex">
            <app-avatar
              :entity="{
                displayName: suggestion.username,
                avatar: suggestion.avatarUrl,
              }"
              size="xs"
              class="mr-3"
            />
            <div class="flex flex-col justify-center">
              <p class="text-xs leading-4.5" v-html="$sanitize(suggestion.username)" />
            </div>
          </div>
          <div class="pt-1">
            <a :href="suggestion.url" target="_blank" class="text-gray-300">
              <i class="ri-external-link-line text-gray-400" />
            </a>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          :disabled="isSubmitBtnDisabled || loading"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="handleSubmit"
        >
          Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  ref,
  computed,
  onMounted,
  reactive,
} from 'vue';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import cloneDeep from 'lodash/cloneDeep';

const store = useStore();
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const memberModel = reactive(cloneDeep(props.modelValue));

const suggestions = ref([]);
const selected = ref('');

onMounted(async () => {
  suggestions.value = await MemberService.findGithub(props.modelValue.id);
});

const emit = defineEmits(['update:modelValue']);

const drawerModel = computed({
  get() {
    return props.modelValue !== null;
  },
  set() {
    emit('update:modelValue', null);
  },
});

const title = computed(() => `Find the GitHub identity for ${props.modelValue.displayName}`);

const loading = ref(false);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const changeSelected = (username) => {
  selected.value = username;
};

const handleSubmit = async () => {
  loading.value = true;
  console.log('member', memberModel);
  console.log(JSON.stringify({ ...memberModel.username, github: [selected.value] }));
  console.log(JSON.stringify({ ...memberModel.username }));

  MemberService.update(props.modelValue.id, {
    username: { ...memberModel.username, github: [selected.value] },
  }).then(() => {
    store.dispatch('member/doFind', props.modelValue.id).then(() => {
      Message.success('GitHub added successfully');
    });
  }).catch((err) => {
    Message.error(err.response.data);
  }).finally(() => {
    loading.value = false;
  });

  emit('update:modelValue', false);
};
</script>

<script>
export default {
  name: 'AppMemberFindGithbDrawer',
};
</script>

<style lang="scss">
.identities-drawer {
  .el-form-item,
  .el-form-item__content {
    @apply mb-0;
  }
}

.selected {
  @apply bg-brand-50 border-brand-400 hover:bg-brand-50 hover:border-brand-400
}

</style>

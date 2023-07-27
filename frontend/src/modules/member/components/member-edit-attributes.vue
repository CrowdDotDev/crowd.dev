<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit attributes">
    <template #content>
      <div class="px-6 pb-6">
        <el-form ref="form" :model="formInline" class="attributes-form">
          <div class="rounded-md bg-yellow-50 border border-yellow-100 flex items-center gap-2 py-3 px-4 mt-2">
            <i class="ri-alert-fill text-yellow-500 text-base " />
            <span class="text-xs leading-5 text-gray-900">Some changes may overwrite current attributes from the
              selected members.</span>
          </div>
          <!-- <h2 class="text-lg font-semibold mb-4">Attributes</h2> -->

          <div class="mt-6 mb-8 flex flex-col gap-4">
            <h6 class="text-xs text-gray-400">
              DEFAULT ATTRIBUTES
            </h6>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">{attribute}</span>
                <p class="text-2xs">
                  {attribute type}
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">{attribute}</span>
                <p class="text-2xs">
                  {attribute type}
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>

          </div>
          <div class="mt-4 flex flex-col gap-8">
            <h6 class="text-xs text-gray-400">
              CUSTOM ATTRIBUTES
            </h6>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">Organizations</span>
                <p class="text-2xs">
                  {attribute type}
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">Website</span>
                <p class="text-2xs">
                  URL
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">is Hireable</span>
                <p class="text-2xs">
                    Boolean
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">{attribute}</span>
                <p class="text-2xs">
                  {attribute type}
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>

            <div class="flex">
              <div class="flex flex-col flex-shrink-0 w-1/3">
                <span class="text-xs font-medium text-black">{attribute}</span>
                <p class="text-2xs">
                  {attribute type}
                </p>
              </div>
              <el-input v-model="computedVisible" type="text" class="flex-grow ml-4" />
            </div>
          </div>
        </el-form>
      </div>

      <div class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6">
        <el-button class="btn btn--bordered btn--md mr-3" @click="handleCancel">
          Cancel
        </el-button>
        <el-button class="btn btn--primary btn--md" @click="handleSubmit">
          Submit
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script>
import { mapActions } from 'vuex';
import { storeToRefs } from 'pinia';
import { reactive } from 'vue';
import { MemberModel } from '@/modules/member/member-model';
import AppDialog from '@/shared/dialog/dialog.vue';
import AppTagAutocompleteInput from '@/modules/tag/components/tag-autocomplete-input.vue';
import { FormSchema } from '@/shared/form/form-schema';
import { useMemberStore } from '@/modules/member/store/pinia';
import AppFormItem from '@/shared/form/form-item.vue';

const memberStore = useMemberStore();
const { selectedMembers } = storeToRefs(memberStore);

const { fields } = MemberModel;

const formInline = reactive({
  user: '',
  region: '',
  date: '',
});

export default {
  name: 'AppEditAttributesPopover',
  components: { AppDialog, AppFormItem },

  props: {
    modelValue: {
      type: Boolean,
      default: () => false,
    },
  },
  emits: ['reload', 'update:modelValue'],

  data() {
    return {
      loading: false,
    };
  },

  computed: {
    fields() {
      return fields;
    },
    computedVisible: {
      get() {
        return this.modelValue;
      },
      set() {
        this.$emit('update:modelValue', false);
      },
    },
  },

  methods: {
    async handleSubmit() {
      this.loading = true;
      // do something
    },

    handleCancel() {
      this.editTagsModel = [];
      this.editTagsInCommon = [];
      this.computedVisible = false;
    },
  },
};
</script>

<style scoped></style>

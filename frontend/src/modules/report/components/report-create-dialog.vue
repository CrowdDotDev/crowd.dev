<template>
  <app-dialog v-model="visible" title="Add report">
    <template #content>
      <el-form
        label-position="top"
        class="px-6 pb-6"
        :rules="rules"
        :model="model"
      >
        <el-form-item
          label="Name"
          :required="true"
          prop="name"
        >
          <el-input
            v-model="model.name"
            placeholder="Monthly investor report"
          />
        </el-form-item>
        <div class="flex items-start">
          <el-switch
            v-model="model.public"
            class="!grow-0 !ml-0"
          />
          <div class="ml-2 mt-1">
            <div class="text-gray-900 text-sm font-medium">
              Publish to web
            </div>
            <div class="text-gray-500 text-2xs">
              Anyone with the link can view the report
            </div>
          </div>
        </div>
      </el-form>
      <div
        class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6"
      >
        <el-button
          class="btn btn--bordered btn--md mr-3"
          @click="visible = false"
        >
          Cancel
        </el-button>
        <el-button
          class="btn btn--primary btn--md"
          @click="handleSubmit"
        >
          Submit
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  reactive,
} from 'vue';
import { useRouter } from 'vue-router';
import { ReportService } from '@/modules/report/report-service';
import { ReportModel } from '@/modules/report/report-model';
import { FormSchema } from '@/shared/form/form-schema';

const router = useRouter();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  subprojectId: {
    type: String,
    required: true,
  },
});
const emit = defineEmits('update:modelValue');

const { fields } = ReportModel;
const formSchema = new FormSchema([
  fields.name,
  fields.widgets,
  fields.settings,
  fields.public,
]);

const rules = reactive(formSchema.rules());

const visible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});

const model = reactive({});

const handleSubmit = async () => {
  const report = await ReportService.create({
    name: model.name,
    public: model.public,
    segments: [props.subprojectId],
  });
  await router.push({
    name: 'reportEdit',
    params: {
      id: report.id,
      segmentId: report.segmentId,
    },
  });
};
</script>

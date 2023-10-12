<template>
  <div
    class="report-grid-layout flex-grow"
    :class="editable ? 'report-grid-layout--editing' : '-m-2'"
  >
    <app-widget-cube-builder
      v-if="widgetDrawer.visible === true"
      v-model:widget="widgetDrawer.model"
      v-model:drawer="widgetDrawer.visible"
      :action="widgetDrawer.action"
      @submit="handleWidgetFormSubmit"
    />
    <div v-if="loadingCube" v-loading="loadingCube" class="app-page-spinner" />
    <div v-else>
      <div
        v-if="!layout.widgets?.length && !isPublicView"
        class="text-black flex flex-col items-center justify-center rounded border border-dashed border-gray-200 p-12 mx-4 my-8"
      >
        <i class="ri-bar-chart-line ri-6x text-gray-200" />
        <div class="font-semibold mt-8 mb-4">
          Add your first widget
        </div>
        <div class="text-sm text-gray-600">
          {{
            editable
              ? "Build a custom widget and start composing your report"
              : "Edit your report and compose your first custom widget"
          }}
        </div>
        <el-button
          v-if="editable"
          type="button"
          class="btn btn--primary btn--md !h-10 mt-6"
          @click="handleAddWidgetClick"
        >
          Add Widget
        </el-button>
        <router-link
          v-else
          :to="{
            name: 'reportEdit',
            params: { id: modelValue.id },
          }"
          class="btn btn--primary btn--md mt-6 !hover:text-white"
        >
          Edit report
        </router-link>
      </div>
      <div v-else class="h-fit">
        <grid-layout
          v-model:layout="layout.widgets"
          :col-num="12"
          :row-height="8"
          :is-draggable="editable"
          :is-resizable="editable"
          :margin="[16, 22]"
          :use-css-transforms="false"
          @layout-updated="layoutUpdatedEvent"
        >
          <grid-item
            v-for="item in layout.widgets"
            :key="item.i"
            class="pb-8"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            @moved="movedEvent"
            @move="isMoving = true"
            @resized="resizedEvent"
          >
            <app-widget-cube-renderer
              :show="!isMoving"
              class="panel"
              :editable="editable"
              :widget="item"
              :chart-options="{
                ...item,
                title: undefined,
              }"
              @edit="handleWidgetEdit(item)"
              @duplicate="handleWidgetDuplicate(item)"
              @delete="handleWidgetDelete(item)"
            />
          </grid-item>
        </grid-layout>
        <div v-if="editable" class="toolbar">
          <button
            type="button"
            class="btn btn-brand btn-brand--transparent btn--md"
            @click="handleAddWidgetClick"
          >
            <span class="flex items-center text-brand-500">
              <i class="ri-lg ri-add-line mr-1" />Add Widget
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { WidgetService } from '@/modules/widget/widget-service';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppWidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer.vue';
import AppWidgetCubeBuilder from '@/modules/widget/components/cube/widget-cube-builder.vue';
import {
  reactive, computed, onMounted, ref,
} from 'vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  editable: {
    type: Boolean,
    default: false,
  },
  isPublicView: {
    type: Boolean,
    default: false,
  },
});

const isMoving = ref(false);
const model = reactive({ ...props.modelValue });
const layout = reactive({ widgets: [] });
const widgetDrawer = reactive({
  visible: false,
  action: null,
  model: {},
});
const layoutUpdatedEvent = () => {
  isMoving.value = false;
};
const { cubejsToken, cubejsApi } = mapGetters('widget');
const { getCubeToken } = mapActions('widget');
const { doUpdate } = mapActions('report');

const loadingCube = computed(() => cubejsToken.value === null);

const resetWidgetDrawerForm = () => {
  widgetDrawer.model = {
    title: 'Untitled',
    type: 'cubejs',
    reportId: model.id,
  };
};

const updateLayout = () => {
  layout.widgets = model.widgets.map((w) => ({
    ...w,
    ...w.settings.layout,
    i: w.id,
  }));
};

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken();
  }

  resetWidgetDrawerForm();
  updateLayout();
});

const updateReport = async () => {
  await doUpdate({
    id: model.id,
    values: {
      ...model,
      widgets: model.widgets.map((w) => w.id),
    },
  });

  updateLayout();
};

const resizedEvent = async (i, newH, newW) => {
  const widget = model.widgets.find((w) => w.id === i);
  const widgetCopy = { ...widget };

  widgetCopy.settings.layout.h = newH;
  widgetCopy.settings.layout.w = newW;

  await WidgetService.update(widgetCopy.id, widgetCopy);
  await updateReport();
};

const movedEvent = async (i, newX, newY) => {
  const widget = model.widgets.find((w) => w.id === i);
  const widgetCopy = { ...widget };
  widgetCopy.settings.layout.x = newX;
  widgetCopy.settings.layout.y = newY;

  await WidgetService.update(widgetCopy.id, widgetCopy);
  await updateReport();
};

const handleAddWidgetClick = () => {
  Object.assign(widgetDrawer, {
    visible: true,
    action: 'add',
    model: JSON.parse(
      JSON.stringify({
        title: 'Untitled',
        type: 'cubejs',
        reportId: model.id,
        settings: {},
      }),
    ),
  });
};

const createWidget = (widgetModel, duplicate = false) => {
  const { length } = model.widgets;
  const widget = { ...widgetModel };
  const bottomWidget = model.widgets.reduce((minWidget, currWidget) => (currWidget.settings.layout.y > minWidget.settings.layout.y
    ? currWidget
    : minWidget));

  widget.settings.layout = {
    x: (length * 6) % 12,
    y: bottomWidget.settings.layout.y + bottomWidget.settings.layout.h, // puts it at the bottom
    w: 6,
    h: widget.settings.chartType === 'number' ? 6 : 21,
  };

  return WidgetService.create({
    title: duplicate ? `${widget.title} [Copy]` : widget.title,
    type: 'cubejs',
    settings: widget.settings,
    report: widget.reportId,
  });
};

const handleWidgetFormSubmit = async (widgetModel) => {
  if (widgetDrawer.action === 'add') {
    const widget = await createWidget(widgetModel);
    delete widget.report;

    model.widgets.push(widget);

    resetWidgetDrawerForm();
  } else {
    const widget = await WidgetService.update(widgetModel.id, widgetModel);
    const index = model.widgets.findIndex((w) => w.id === widget.id);

    model.widgets[index] = widget;
    resetWidgetDrawerForm();
  }

  await updateReport();
};

const handleWidgetDuplicate = async (widget) => {
  const result = await createWidget(widget, true);
  delete result.report;

  model.widgets.push(result);

  await updateReport();
};

const handleWidgetEdit = (widget) => {
  Object.assign(widgetDrawer, {
    action: 'edit',
    model: JSON.parse(JSON.stringify(widget)),
  });

  setTimeout(() => {
    widgetDrawer.visible = true;
  }, 200);
};

const handleWidgetDelete = async (widget) => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title: 'Delete widget',
      message: "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line',
    });

    await WidgetService.destroyAll([widget.id]);

    const index = model.widgets.findIndex((w) => w.id === widget.id);

    model.widgets.splice(index, 1);

    await updateReport();
  } catch (error) {
    // no
  }
};
</script>

<style lang="scss">
.vue-grid-item.vue-draggable-dragging { transition:none; z-index: 3; }
.report-grid-layout {
  @apply min-h-40 relative;
}
.vue-grid-item {
  transition: none;
}
.vue-grid-layout {
  position: relative;
  -webkit-transition: height 0.2s ease;
  transition: height 0.2s ease;
}
.vue-grid-item > div {
  overflow-y: auto;
  height: 100%;

  .widget-cube {
    height: fit-content;
  }

  .widget-table {
    overflow-y: auto;
    height: calc(100% - 44px);
  }
}
.vue-grid-item:not(.vue-grid-placeholder) {
  touch-action: none;
}
.vue-grid-item.vue-grid-placeholder {
  background: green !important;
}
.vue-grid-item .resizing {
  opacity: 0.9;
}
.vue-grid-item .static {
  background: #cce;
}
.vue-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
}
.vue-grid-item .no-drag {
  height: 100%;
  width: 100%;
}
.vue-grid-item .minMax {
  font-size: 12px;
}
.vue-grid-item .add {
  cursor: pointer;
}
.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  padding: 0 8px 8px 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
    no-repeat bottom right;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}
.vue-grid-item > .vue-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 5px;
  right: -8px;
}

.toolbar {
  @apply flex items-center justify-center pb-4;
}
</style>

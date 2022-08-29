<template>
  <div
    class="report-grid-layout"
    :class="
      editable ? 'report-grid-layout--editing' : '-m-2'
    "
  >
    <el-dialog
      v-model:visible="widgetModal.visible"
      :title="
        widgetModal.action === 'add'
          ? 'Add Widget'
          : 'Edit Widget'
      "
      custom-class="el-dialog--xl"
    >
      <div
        v-if="widgetModal.visible === false"
        v-loading="true"
        class="app-page-spinner"
      ></div>
      <app-widget-cube-builder
        v-else
        v-model="widgetModal.model"
        @submit="handleWidgetFormSubmit"
        @close="widgetModal.visible = false"
      />
    </el-dialog>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div
        v-if="!model.widgets || model.widgets.length === 0"
        class="text-black font-light absolute inset-0 flex flex-col items-center justify-center"
      >
        No widgets were added to the report yet.
        <button
          v-if="editable"
          type="button"
          class="btn btn--secondary mt-1"
          @click="handleAddWidgetClick"
        >
          <span class="flex items-center text-primary-900">
            <i class="ri-lg ri-add-line mr-1"></i>Add Widget
          </span>
        </button>
        <router-link
          v-else
          :to="{
            name: 'reportEdit',
            params: { id: value.id }
          }"
          class="btn btn--secondary mt-1"
        >
          <span class="flex items-center text-primary-900">
            <i class="ri-lg ri-pencil-line mr-1"></i>Edit
            Report
          </span>
        </router-link>
      </div>
      <div v-else>
        <grid-layout
          :layout="layout"
          :col-num="12"
          :row-height="8"
          :is-draggable="editable"
          :is-resizable="editable"
          :is-mirrored="false"
          :vertical-compact="true"
          :margin="[16, 16]"
          :use-css-transforms="true"
        >
          <grid-item
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            @move="
              (i, newX, newY) =>
                handleWidgetMove(
                  widgets[item.i],
                  newX,
                  newY
                )
            "
            @resize="
              (i, newH, newW) =>
                handleWidgetResize(
                  widgets[item.i],
                  newH,
                  newW
                )
            "
          >
            <app-widget-cube-renderer
              :editable="editable"
              :widget="widgets[item.i]"
              @edit="handleWidgetEdit(widgets[item.i])"
              @duplicate="
                handleWidgetDuplicate(widgets[item.i])
              "
              @delete="handleWidgetDelete(widgets[item.i])"
            ></app-widget-cube-renderer>
          </grid-item>
        </grid-layout>
        <div v-if="editable" class="toolbar">
          <button
            type="button"
            class="btn btn--secondary"
            @click="handleAddWidgetClick"
          >
            <span
              class="flex items-center text-primary-900"
            >
              <i class="ri-lg ri-add-line mr-1"></i>Add
              Widget
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import VueGridLayout from 'vue-grid-layout'
import WidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer'
import WidgetCubeBuilder from '@/modules/widget/components/cube/widget-cube-builder'
import { WidgetService } from '@/modules/widget/widget-service'
import { i18n } from '@/i18n'

export default {
  name: 'ReportGridLayout',
  components: {
    GridLayout: VueGridLayout.GridLayout,
    GridItem: VueGridLayout.GridItem,
    'app-widget-cube-builder': WidgetCubeBuilder,
    'app-widget-cube-renderer': WidgetCubeRenderer
  },
  props: {
    value: {
      type: Object,
      default: () => {}
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      cubejsToken: 'widget/cubejsToken',
      cubejsApi: 'widget/cubejsApi'
    }),
    loadingCube() {
      return this.cubejsToken === null
    },
    widgets() {
      return this.model.widgets.reduce((acc, item) => {
        item.settings.layout.i = item.id
        acc[item.id] = item
        return acc
      }, {})
    }
  },
  data() {
    return {
      model: this.value,
      widgetModal: {
        visible: false,
        action: null,
        model: {}
      },
      layout: []
    }
  },
  methods: {
    ...mapActions({
      getCubeToken: 'widget/getCubeToken'
    }),
    handleAddWidgetClick() {
      this.widgetModal = {
        visible: true,
        action: 'add',
        model: JSON.parse(
          JSON.stringify({
            title: 'Untitled',
            type: 'cubejs',
            reportId: this.value.id
              ? this.value.id
              : undefined
          })
        )
      }
    },

    async createWidget(widgetModel, duplicate = false) {
      const length = this.model.widgets.length
      widgetModel.settings.layout = {
        x: (length * 6) % 12,
        y: length + 12, // puts it at the bottom
        w: 6,
        h: widgetModel.settings.layout.h
      }
      return await WidgetService.create({
        title: duplicate
          ? widgetModel.title + ' [Copy]'
          : widgetModel.title,
        type: 'cubejs',
        settings: widgetModel.settings,
        report: widgetModel.reportId
      })
    },

    async handleWidgetFormSubmit(widgetModel) {
      if (this.widgetModal.action === 'add') {
        const widget = await this.createWidget(widgetModel)
        this.model.widgets.push(widget)
        this.resetWidgetModel()
      } else {
        const widget = await WidgetService.update(
          widgetModel.id,
          widgetModel
        )
        const index = this.model.widgets.findIndex(
          (w) => w.id === widget.id
        )
        Vue.set(this.model.widgets, index, widget)
        this.resetWidgetModel()
      }

      this.updateLayout()
    },

    async handleWidgetDuplicate(widget) {
      const result = await this.createWidget(widget, true)
      this.model.widgets.push(result)

      this.updateLayout()
    },

    async handleWidgetMove(widget, newX, newY) {
      widget.settings.layout.x = newX
      widget.settings.layout.y = newY
    },

    async handleWidgetResize(widget, newH, newW) {
      widget.settings.layout.h = newH
      widget.settings.layout.w = newW
    },

    async handleWidgetEdit(widget) {
      this.widgetModal = {
        visible: true,
        action: 'edit',
        model: JSON.parse(JSON.stringify(widget))
      }
    },
    async handleWidgetDelete(widget) {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        await WidgetService.destroyAll([widget.id])
        const index = this.model.widgets.findIndex(
          (w) => w.id === widget.id
        )
        this.model.widgets.splice(index, 1)
        this.updateLayout()
      } catch (error) {
        // no
      }
    },
    resetWidgetModel() {
      this.widgetModal.model = {
        title: 'Untitled',
        type: 'cubejs',
        reportId: this.value.id ? this.value.id : undefined
      }
    },
    updateLayout() {
      this.layout = this.model.widgets.map((w) => {
        return {
          ...w.settings.layout,
          i: w.id
        }
      })
      for (const widget of this.layout) {
        this.widgets[widget.i].settings.layout = widget
      }
    }
  },
  async created() {
    if (this.cubejsApi === null) {
      await this.getCubeToken()
    }
    this.resetWidgetModel()
    this.updateLayout()
  }
}
</script>

<style lang="scss">
.report-grid-layout {
  @apply min-h-40 relative;
}
.vue-grid-layout {
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
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
    no-repeat;
  background-position: bottom right;
  padding: 0 8px 8px 0;
  background-repeat: no-repeat;
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

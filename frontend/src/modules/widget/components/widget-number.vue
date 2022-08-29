<template>
  <app-widget
    :config="config"
    :editable="editable"
    :number="true"
    @trigger-duplicate-widget="
      (w) => $emit('trigger-duplicate-widget', w)
    "
    @trigger-edit-widget="
      (w) => $emit('trigger-edit-widget', w)
    "
    @trigger-delete-widget="
      (w) => $emit('trigger-delete-widget', w)
    "
    @open-settings-modal="modal = true"
  >
    <div class="widget--number">
      <i class="ri-lg mr-4" :class="iconClass"></i>
      <div class="widget--number-values">
        <div class="flex items-center">
          <el-tooltip
            :content="`${value.target} ${value.unit}`"
            effect="dark"
            placement="top"
          >
            <div class="widget--number-values-current">
              {{ value.current }} {{ value.suffix }}
            </div>
          </el-tooltip>
          <div
            v-if="growth.target !== null"
            class="widget--number-values-growth"
            :class="
              growth.target >= 0
                ? 'widget--number-values-growth--positive'
                : 'widget--number-values-growth--negative'
            "
          >
            ({{ growth.target >= 0 ? '+' : '-'
            }}{{ growth.current }}%)
          </div>
        </div>
        <div class="text-sm">{{ config.title }}</div>
      </div>
    </div>
    <el-dialog
      v-model:visible="modal"
      :title="`${config.title} Settings`"
      @close="modal = false"
    ></el-dialog>
  </app-widget>
</template>

<script>
import Widget from './widget'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppWidgetNumber',

  components: {
    'app-widget': Widget
  },

  props: {
    config: {
      type: Object,
      default: () => {
        return {
          name: 'name',
          type: 'number',
          label: 'Label',
          data: {
            value: 60
          },
          speed: 200
        }
      }
    },
    dashboard: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({
      widgetFind: 'widget/find'
    }),

    widget() {
      return this.widgetFind(this.config.id)
    },

    iconClass() {
      const widgetIcon = {
        'active-members':
          'ri-user-follow-fill bg-green-50 text-green-900 ',
        'new-members':
          'ri-user-add-fill bg-secondary-50 text-secondary-900 ',
        'new-activities':
          'ri-radar-fill bg-purple-50 text-purple-900 ',
        'avg-time-to-first-interaction':
          'ri-timer-flash-fill bg-yellow-50 text-yellow-900 ',
        members:
          'ri-user-fill bg-secondary-50 text-secondary-900 ',
        activities:
          'ri-radar-fill bg-purple-50 text-purple-900 '
      }

      const widgetType = this.config.title
        .toLowerCase()
        .split(' ')
        .join('-')

      let iconKey

      if (this.dashboard) {
        iconKey = Object.keys(widgetIcon).find((k) => {
          return k.includes(widgetType)
        })
      } else {
        const measure =
          this.config.measures.length > 0
            ? this.config.measures[0]
            : null
        iconKey = measure
          ? measure.toLowerCase().includes('activit')
            ? 'activities'
            : 'members'
          : null
      }

      return `${widgetIcon[iconKey]} h-16 w-16 rounded-full flex items-center justify-center`
    }
  },

  data() {
    return {
      modal: false,
      value: {
        current: 0,
        target: null,
        suffix: this.config.suffix,
        unit: this.config.unit
      },
      growth: {
        current: 0,
        target: null
      },
      speed: this.config.speed ? this.config.speed : 200
    }
  },

  watch: {
    config: {
      deep: true,
      async handler() {
        this.setValues()
      }
    }
  },

  methods: {
    ...mapActions({
      doFind: 'widget/doFind'
    }),
    calculateGrowth() {
      const growth =
        this.widget.cache[1] - this.widget.cache[0]

      this.growth.target = this.widget.cache[0]
        ? Math.floor((growth / this.value.target) * 100)
        : null
    },
    updateValue() {
      const inc = this.value.target / this.speed

      if (this.value.current < this.value.target) {
        this.value.current += Math.ceil(inc)
        setTimeout(this.updateValue, 1)
      } else {
        this.value.current = this.value.target
      }
    },
    updateGrowth() {
      const inc = Math.abs(this.growth.target) / this.speed

      if (
        Math.abs(this.growth.current) <
        Math.abs(this.growth.target)
      ) {
        this.growth.current += Math.ceil(inc)
        setTimeout(this.updateGrowth, 1)
      } else {
        this.growth.current = Math.abs(this.growth.target)
      }
    },
    setValues() {
      if (this.widget) {
        this.value.target = this.widget.cache
          ? Math.ceil(this.widget.cache[1])
          : 0
        this.growth.target = this.widget.cache
          ? Math.ceil(this.widget.cache[0])
          : null
        this.calculateGrowth()
        this.updateValue()
        this.updateGrowth()
      } else {
        this.value.target = Math.ceil(
          this.config.data.value
        )
        this.updateValue()
      }
    }
  },

  async created() {
    this.setValues()
  }
}
</script>

<style lang="scss">
.widget--number {
  @apply h-16 flex items-center relative -mt-4;

  &-values {
    @apply flex flex-col;

    &-current {
      @apply text-2xl text-gray-600 font-semibold;
    }

    &-growth {
      @apply text-center ml-2 font-light text-gray-600;
    }
  }
}
</style>

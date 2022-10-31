<template>
  <app-widget :config="config" class="custom-height">
    <div class="widget-builder">
      <div
        class="absolute inset-0 flex flex-col items-center justify-center"
      >
        <button class="btn btn--primary">
          Create First Flow
        </button>
        <span class="block mt-4 text-sm text-gray-500">
          Set up your first flow using our builder to
          integrate data from multiple sources.
        </span>
      </div>
    </div>
  </app-widget>
</template>

<script>
import Widget from '../widget'
import { mapGetters } from 'vuex'

export default {
  name: 'WidgetBuilder',
  components: {
    'app-widget': Widget
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters({
      widgetFindByType: 'widget/findByType'
    }),
    widget() {
      return this.widgetFindByType('builder')
    },
    config() {
      return {
        id: this.widget.id,
        type: this.widget.type,
        title: 'Builder',
        loading: this.loading
      }
    }
  }
}
</script>

<style>
.widget-builder {
  @apply h-full relative;
}
</style>

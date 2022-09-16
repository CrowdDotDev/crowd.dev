<template>
  <div>
    <label class="block leading-none mb-1">Order</label>
    <draggable
      v-model="list"
      class="list-group"
      @end="handleDragEnd"
    >
      <template #item="{ element }">
        <div class="order-element">
          <div class="order-element-name">
            <i class="ri-drag-move-2-line"></i>
            <span>{{ element.title }}</span>
          </div>
          <el-radio-group
            :model-value="element.order"
            size="small"
            @input="
              (value) =>
                $emit('orderChange', element.id, value)
            "
          >
            <el-radio-button label="asc" :name="element.id"
              >Asc</el-radio-button
            >
            <el-radio-button label="desc" :name="element.id"
              >Desc</el-radio-button
            >
            <el-radio-button label="none" :name="element.id"
              >None</el-radio-button
            >
          </el-radio-group>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'AppQueryBuilderOrder',
  components: {
    draggable
  },
  props: {
    orderMembers: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['reorder', 'orderChange'],
  data() {
    return {
      dialog: false
    }
  },
  computed: {
    list: {
      get() {
        return this.orderMembers
      },
      set(value) {
        return value
      }
    }
  },
  methods: {
    handleDragEnd(event) {
      this.$emit('reorder', event.oldIndex, event.newIndex)
    }
  }
}
</script>

<style scoped>
.order-element {
  @apply flex justify-between items-center w-full;
}
.order-element-name {
  @apply flex items-center cursor-move;
}
.order-element-name > i {
  @apply mr-1;
}
</style>

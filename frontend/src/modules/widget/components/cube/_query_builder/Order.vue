<template>
  <div>
    <label class="block leading-none mb-1">Order</label>
    <draggable
      v-model="list"
      class="list-group"
      @end="handleDragEnd"
    >
      <div
        v-for="member in list"
        :key="member.id"
        class="order-member"
      >
        <div class="order-member-name">
          <i class="ri-drag-move-2-line"></i>
          <span>{{ member.title }}</span>
        </div>
        <el-radio-group
          :value="member.order"
          size="small"
          @input="
            (value) =>
              $emit('orderChange', member.id, value)
          "
        >
          <el-radio-button label="asc" :name="member.id"
            >Asc</el-radio-button
          >
          <el-radio-button label="desc" :name="member.id"
            >Desc</el-radio-button
          >
          <el-radio-button label="none" :name="member.id"
            >None</el-radio-button
          >
        </el-radio-group>
      </div>
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
.order-member {
  @apply flex justify-between items-center w-full;
}
.order-member-name {
  @apply flex items-center cursor-move;
}
.order-member-name > i {
  @apply mr-1;
}
</style>

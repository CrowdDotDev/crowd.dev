<template>
  <div
    class="rounded-lg mt-4 px-4 p-2.5 border relative"
    :class="alertClass"
  >
    <div class="flex items-start">
      <i
        class="mr-2.5 flex items-center h-3.5 pt-1"
        :class="iconClass"
      />
      <div class="text-xs flex-grow">
        <div class="font-semibold inline-flex pr-1">
          <slot name="title">
            Action Required:
          </slot>
        </div>
        <slot name="body">
          This is the body
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAlert',
  props: {
    title: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'warning',
    },
  },
  computed: {
    alertClass() {
      switch (this.type) {
        case 'warning':
          return 'bg-yellow-50 border-yellow-100';
        default:
          return 'bg-blue-50 border-blue-100';
      }
    },
    iconClass() {
      switch (this.type) {
        case 'warning':
          return 'text-yellow-500 ri-alert-fill';
        default:
          return 'text-blue-500 ri-information-fill';
      }
    },
  },
};
</script>

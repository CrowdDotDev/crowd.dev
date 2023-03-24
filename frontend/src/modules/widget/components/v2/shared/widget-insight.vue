<template>
  <div
    class="flex items-start gap-3 w-full p-6 bg-gray-50 rounded-b-lg"
  >
    <div
      class="rounded-full bg-purple-100 flex items-center justify-center min-h-8 min-w-[2rem]"
    >
      <i
        class="ri-lightbulb-line text-purple-600 text-lg"
      />
    </div>
    <div>
      <div class="text-black text-sm">Insight</div>
      <div class="mt-1 text-gray-600 text-xs">
        <slot name="description" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppWidgetInsight'
}
</script>

<script setup></script>

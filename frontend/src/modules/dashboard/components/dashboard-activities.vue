<template>
  <div class="widget panel">
    <div class="flex justify-between">
      <div class="flex items-center">
        <div
          class="w-10 h-10 rounded-md bg-gray-900 flex items-center justify-center mr-4"
        >
          <i class="ri-radar-line text-xl text-white"></i>
        </div>
        <div>
          <h6
            class="text-base font-semibold leading-5 mb-0.5"
          >
            Activities
          </h6>
          <p class="text-xs leading-5 text-gray-600">
            Total: 2,450
          </p>
        </div>
      </div>
      <div>
        <!-- TODO: filters -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppDashboardActivities'
}
</script>

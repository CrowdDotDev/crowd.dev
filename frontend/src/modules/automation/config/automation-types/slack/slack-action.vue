<template>
  <div class="border border-gray-200 rounded-md flex items-center py-3 px-5">
    <div class="w-12">
      <img src="/images/automation/slack.png" class="min-w-full w-10" alt="">
    </div>
    <div class="flex-grow pl-4">
      <h6 class="text-sm font-medium">
        LFX notifier
      </h6>
      <p class="text-2xs leading-4.5 text-gray-600">
        Required to receive notifications in your workspace
      </p>
    </div>
    <div class="pl-3">
      <div class="flex items-center whitespace-nowrap">
        <span class="ri-check-line text-lg text-darkgreen-900 mr-2" />
        <span class="text-darkgreen-900 text-sm font-medium">App installed</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAutomationSlackAction',
};
</script>

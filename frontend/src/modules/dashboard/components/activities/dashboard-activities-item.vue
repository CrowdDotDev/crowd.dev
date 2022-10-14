<template>
  <article class="py-5 border-b border-gray-200">
    <div class="flex">
      <!-- avatar -->
      <div class="pr-3">
        <div
          class="h-8 w-8 rounded-full object-cover overflow-hidden"
        >
          <img
            src="https://www.clevelanddentalhc.com/wp-content/uploads/2018/03/sample-avatar.jpg"
          />
        </div>
      </div>
      <div class="flex">
        <div>
          <!-- Name -->
          <p class="text-2xs leading-4 text-gray-600">
            Stella Skiles
          </p>
          <div class="flex items-center">
            <div>
              <img
                class="w-4 h-4"
                src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
              />
            </div>
            <div class="text-2xs leading-4 pl-2">
              Starred
              <span class="text-red"
                >CrowdDotDev/awesome-oss-investors</span
              >
              ・ 2 days ago
            </div>
          </div>
          <div class="mt-4 bg-gray-50 rounded-lg p-4">
            <p>
              Styling for Conversations/Community Help
              Center ### What problem are you trying to
              solve? The representation of conversations
              when published publicly is in markdow... Show
              more
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'AppDashboardActivitiesItem',
  props: {
    activity: {
      type: Object,
      required: true
    }
  }
}
</script>

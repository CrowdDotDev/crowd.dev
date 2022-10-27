<template>
  <div class="flex grow flex-col justify-between p-5">
    <div class="p-5 flex flex-col gap-16 md:gap-12">
      <div class="pb-4 md:pb-2">
        <img
          class="h-6 w-auto"
          src="/images/crowd-logo.svg"
          alt="crowd.dev logo"
        />
      </div>
      <div class="flex flex-col gap-4">
        <h4>
          The community-led growth platform for developer
          tools
        </h4>
        <p class="text-sm leading-6">
          An open source suite of community and data tools
          built to unlock community-led growth for your
          organization
        </p>
      </div>
      <div>
        <img
          src="/images/auth/partners.png"
          alt="partners"
        />
      </div>
    </div>
    <div>
      <div class="bg-brand-500 rounded-lg p-6">
        <p class="text-white text-sm font-medium pb-6">
          “Building and engaging community is my top
          priority as a founder of an open-source startup.
          Crowd.dev is basically the operating system for
          that.”
        </p>
        <div class="flex items-center">
          <div class="pr-4">
            <img
              src="/images/auth/testimonial.png"
              class="h-11 w-11"
            />
          </div>
          <div>
            <h6
              class="text-sm font-semibold text-white leading-5"
            >
              Johannes Hötter
            </h6>
            <p class="text-white text-xs leading-5">
              Co-Founder & CEO, kern.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAuthLayoutSide'
}
</script>

<style scoped></style>

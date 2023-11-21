<template>
  <div class="flex grow flex-col justify-between p-5">
    <div class="p-5 flex flex-col gap-16 md:gap-12">
      <div class="pb-4 md:pb-2">
        <img
          class="h-6 w-auto"
          src="/images/logo/crowd.svg"
          alt="crowd.dev logo"
        />
      </div>
      <div class="flex flex-col gap-4">
        <h4>
          Find high-intent accounts in your developer data
        </h4>
        <p class="text-sm leading-6">
          Combine data from GitHub, LinkedIn, your product, and many other sources to understand which companies
          engage with your developer product. Sync insights with your CRM to prioritize the right accounts and build pipeline.
        </p>
      </div>
      <div class="grid grid-rows-2 gap-8">
        <div class="grid grid-cols-3 gap-4 col-span-1">
          <div class="flex items-center">
            <img
              src="/images/auth/thelinuxfoundation.png"
              alt="thelinuxfoundation logo"
              class="h-7"
            />
          </div>
          <div class="flex items-center justify-end">
            <img
              src="/images/auth/openbb.png"
              alt="openbb logo"
              class="h-6"
            />
          </div>
          <div class="flex items-center justify-end">
            <img
              src="/images/auth/kernai.png"
              alt="kernai logo"
              class="h-5"
            />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="flex items-center">
            <img
              src="/images/auth/drant.png"
              alt="drant logo"
              class="h-7"
            />
          </div>
          <div class="flex items-center justify-end">
            <img
              src="/images/auth/drant.png"
              alt="drant logo"
              class="h-7"
            />
          </div>
          <div class="flex items-center justify-end">
            <img
              src="/images/auth/openbb.png"
              alt="openbb logo"
              class="h-6"
            />
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="bg-brand-500 rounded-lg p-6">
        <p class="text-white text-sm font-medium pb-6">
          “crowd.dev uncovers companies that already use our product but haven't
          engaged with our Go-To-Market team yet. This helped us to 4x the opportunities in our sales pipeline.”
        </p>
        <div class="flex items-center">
          <div class="pr-4">
            <img
              alt="Testimonials Crowd.dev"
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
              Co-Founder & CEO, Kern AI
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAuthLayoutSide',
};
</script>

<style scoped></style>

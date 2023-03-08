<template>
  <div>
    <header class="flex py-2 border-b border-gray-200">
      <div class="w-5/12">
        <p
          class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
        >
          Platform
        </p>
      </div>
      <div class="w-7/12">
        <p
          class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
        >
          Type
        </p>
      </div>
    </header>
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppActivityTypeList'
}
</script>

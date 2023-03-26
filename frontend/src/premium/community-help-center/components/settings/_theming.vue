<template>
  <div>
    <hr class="pb-6" />
    <div class="font-semibold text-sm text-brand-500 mb-6">
      Theming
    </div>
    <el-form-item
      label="Logo URL"
      prop="logoUrl"
      class="w-full"
    >
      <el-input
        v-model="computedLogoUrl"
        placeholder="https://logourl.com"
      />
      <div class="app-form-hint">
        Recommended size: 240x60 pixels
      </div>
    </el-form-item>
    <el-form-item
      label="Favicon URL"
      prop="faviconUrl"
      class="w-full"
    >
      <el-input
        v-model="computedFaviconUrl"
        placeholder="https://faviconurl.com"
      />
      <div class="app-form-hint">
        Recommended size: 32x32 pixels
      </div>
    </el-form-item>
    <el-form-item
      label="Brand Colors"
      class="theming-colors"
    >
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker
            v-model="computedTheme.primary"
          />

          <span class="text-xs text-gray-600 ml-2">Primary</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
    </el-form-item>
    <el-form-item
      label="Text Colors"
      class="theming-colors"
    >
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker v-model="computedTheme.text" />
          <span class="text-xs text-gray-600 ml-2">Primary</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker
            v-model="computedTheme.textSecondary"
          />
          <span class="text-xs text-gray-600 ml-2">Secondary</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker
            v-model="computedTheme.textCta"
          />
          <span class="text-xs text-gray-600 ml-2">CTA</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
    </el-form-item>

    <el-form-item
      label="Background Colors"
      class="theming-colors"
    >
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker v-model="computedTheme.bg" />
          <span class="text-xs text-gray-600 ml-2">Normal</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker
            v-model="computedTheme.bgHighlight"
          />
          <span class="text-xs text-gray-600 ml-2">Highlight</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
      <div
        class="flex items-center justify-between leading-normal mb-2"
      >
        <div class="flex items-center">
          <el-color-picker v-model="computedTheme.bgNav" />
          <span class="text-xs text-gray-600 ml-2">Navigation</span>
        </div>
        <div class="text-2xs text-gray-500">
          Aliquam aliquam eget odio dui dictumst eget.
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  theme: {
    type: Object,
    default: () => {},
  },
  logoUrl: {
    type: String,
    default: null,
  },
  faviconUrl: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:theme',
  'update:logoUrl',
  'update:faviconUrl',
]);

const computedLogoUrl = computed({
  get() {
    return props.logoUrl;
  },
  set(value) {
    emit('update:logoUrl', value);
  },
});

const computedFaviconUrl = computed({
  get() {
    return props.faviconUrl;
  },
  set(value) {
    emit('update:faviconUrl', value);
  },
});

const computedTheme = computed({
  get() {
    return props.theme;
  },
  set(value) {
    emit('update:theme', value);
  },
});
</script>

<style lang="scss">
.theming-colors {
  .el-form-item__content {
    @apply block;
  }
}
</style>

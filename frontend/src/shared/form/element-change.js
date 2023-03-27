import { ref, computed } from 'vue';

export default function elementChangeDetector(element) {
  const temporaryElement = ref('');

  function elementSnapshot() {
    temporaryElement.value = JSON.stringify(element.value);
  }

  const hasElementChanged = computed(() => (
    temporaryElement.value
      !== JSON.stringify(element.value)
  ));

  return {
    temporaryElement,
    elementSnapshot,
    hasElementChanged,
  };
}

import { ref, computed } from 'vue';

export default function formChangeDetector(form) {
  const temporaryForm = ref('');

  function formSnapshot() {
    temporaryForm.value = JSON.stringify(form);
  }

  const hasFormChanged = computed(() => temporaryForm.value !== JSON.stringify(form), { deep: true });

  return {
    temporaryForm,
    formSnapshot,
    hasFormChanged,
  };
}

import { ref, computed } from 'vue';

export default function formChangeDetector(form) {
  const temporaryForm = ref('');

  function formSnapshot() {
    temporaryForm.value = JSON.stringify(form);
  }

  const hasFormChanged = computed(() => {
    console.log(temporaryForm.value, JSON.stringify(form));
    return temporaryForm.value !== JSON.stringify(form);
  }, { deep: true });

  return {
    temporaryForm,
    formSnapshot,
    hasFormChanged,
  };
}

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Project, ProjectGroup } from '@/modules/lf/segments/types/Segments'

export const useOverviewStore = defineStore('overview', () => {
  const selectedProjectGroup = ref<ProjectGroup | null>(null)
  const selectedProject = ref<Project | null>(null)
  const selectedIntegrationId = ref<string | null>(null)
  const integrationStatusCount = ref<Record<string, number>>({})

  return {
    selectedProjectGroup,
    selectedProject,
    selectedIntegrationId,
    integrationStatusCount,
  }
})

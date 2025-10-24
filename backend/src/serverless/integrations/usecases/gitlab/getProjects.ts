import axios from 'axios'

export async function fetchAllGitlabGroups(accessToken: string) {
  const groups = []
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const response = await axios.get('https://gitlab.com/api/v4/groups', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, per_page: 100 },
    })
    groups.push(...response.data)
    hasMorePages = response.headers['x-next-page'] !== ''
    page++
  }

  return groups.map((group) => ({
    id: group.id,
    name: group.name as string,
    path: group.path as string,
    avatarUrl: group.avatar_url as string,
  }))
}

export async function fetchGitlabGroupProjects(accessToken: string, groups: any[]) {
  const groupProjects = {}

  for (const group of groups) {
    const projects = []
    let page = 1
    let hasMorePages = true

    while (hasMorePages) {
      const response = await axios.get(`https://gitlab.com/api/v4/groups/${group.id}/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page, per_page: 100, archived: false },
      })
      projects.push(...response.data)
      hasMorePages = response.headers['x-next-page'] !== ''
      page++
    }

    groupProjects[group.id] = projects.map((project) => ({
      groupId: group.id,
      groupName: group.name,
      groupPath: group.path,
      id: project.id,
      name: project.name,
      path_with_namespace: project.path_with_namespace,
      enabled: false,
      forkedFrom: project?.forked_from_project?.web_url || null,
    }))
  }

  return groupProjects as Record<number, any[]>
}

export async function fetchGitlabUserProjects(accessToken: string, userId: number) {
  const projects = []
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const response = await axios.get(`https://gitlab.com/api/v4/users/${userId}/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, per_page: 100, archived: false },
    })
    projects.push(...response.data)
    hasMorePages = response.headers['x-next-page'] !== ''
    page++
  }

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    path_with_namespace: project.path_with_namespace,
    enabled: false,
    forkedFrom: project?.forked_from_project?.web_url || null,
  }))
}

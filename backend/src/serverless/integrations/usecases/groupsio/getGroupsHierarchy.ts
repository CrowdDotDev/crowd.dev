interface GroupsInput {
  id: number
  name: string
  slug: string
}

type GroupsArray = GroupsInput[]

interface GroupHierarchy {
  [mainGroup: string]: {
    mainGroup: GroupsInput | null
    subGroups: GroupsInput[]
  }
}

export const getGroupsHierarchy = (groups: GroupsArray): GroupHierarchy => {
  const hierarchy: GroupHierarchy = {}

  groups.forEach((group) => {
    const [mainGroupSlug, subGroupSlug] = group.slug.split('+')

    if (!hierarchy[mainGroupSlug]) {
      hierarchy[mainGroupSlug] = {
        mainGroup: null,
        subGroups: [],
      }
    }

    if (subGroupSlug) {
      hierarchy[mainGroupSlug].subGroups.push(group)
    } else {
      hierarchy[mainGroupSlug].mainGroup = group
    }
  })

  return hierarchy
}

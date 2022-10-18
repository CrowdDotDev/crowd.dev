export function computedArgs(activity) {
  if (activity.type === 'hashtag') {
    return [`#${activity.hashtag}`]
  }
  return []
}

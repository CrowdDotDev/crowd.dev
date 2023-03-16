export function computedArgs(activity) {
  if (activity.type === 'hashtag' && activity.channel) {
    return [`#${activity.channel}`]
  }
  return []
}

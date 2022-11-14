import GithubConnect from './components/github-connect'
import GithubActivityMessage from './components/activity/github-activity-message'

export default {
  enabled: true,
  name: 'GitHub',
  backgroundColor: '#E5E7EB',
  borderColor: '#E5E7EB',
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  image:
    'https://cdn-icons-png.flaticon.com/512/25/25231.png',
  connectComponent: GithubConnect,
  activityMessage: GithubActivityMessage
}

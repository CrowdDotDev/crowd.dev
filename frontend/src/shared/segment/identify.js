export default function identify(user) {
  window.analytics.identify(user.id, {
    name: user.fullName,
    email: user.email
  })
}

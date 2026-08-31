export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const isPublicRoute = to.path === '/login'
  const isInviteRoute = to.path.startsWith('/invite/')

  // Not logged in -> redirect to login (unless public/invite route)
  if (!loggedIn.value) {
    if (!isPublicRoute && !isInviteRoute) {
      return navigateTo('/login')
    }
    return
  }

  // Logged in, trying to visit login or root
  if (to.path === '/login' || to.path === '/') {
    return navigateTo('/calendar')
  }
})

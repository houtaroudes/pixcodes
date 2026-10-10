/**
 * PixCodes static worker: serves the prebuilt Vite output and falls back to
 * index.html for client-side routes, since the app is a React SPA.
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request)
  },
}

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'nuxt-auth-utils',
  ],

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },

  runtimeConfig: {
    tursoUrl: '',
    tursoAuthToken: '',
    geminiApiKey: '',
    sessionPassword: '',
    public: {
      appUrl: 'http://localhost:3000',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()

type Mode = 'signin' | 'register'
const mode = ref<Mode>('signin')

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const loading = ref(false)
const errorMessage = ref('')

watch(mode, () => {
  errorMessage.value = ''
})

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true

  try {
    if (mode.value === 'register') {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          password: form.password,
        },
      })
    } else {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
        },
      })
    }

    // Refresh session on client
    await auth.fetchUserSession()

    // Check if there is a pending invite
    const pendingCookie = useCookie('pending_invite')
    if (pendingCookie.value) {
      const code = pendingCookie.value
      pendingCookie.value = null
      return navigateTo(`/invite/${code}`)
    }

    return navigateTo('/calendar')
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    errorMessage.value = msg || 'Authentication failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1.1fr_480px] bg-slate-50 font-sans">

    <!-- Left: brand hero statement -->
    <div
      class="relative hidden lg:flex flex-col justify-between p-16 border-r border-slate-200 bg-white"
    >
      <div class="flex items-center gap-2">
        <span class="w-3.5 h-3.5 rounded-full bg-rose-600 inline-block" />
        <span class="text-sm font-bold uppercase tracking-widest text-slate-900 font-mono">
          Twolander
        </span>
      </div>

      <div>
        <h1
          class="text-[4.5rem] leading-none font-extrabold tracking-tight text-slate-950"
          style="font-family: var(--font-display)"
        >
          One calendar,<br><span class="text-rose-600">two lives.</span>
        </h1>
        <p class="mt-6 text-lg leading-relaxed text-slate-600 max-w-[40ch] font-medium">
          Coordinate schedules, protect shared time, and maintain harmony with a unified perspective.
        </p>
      </div>

      <div class="flex flex-col gap-3.5 border-t border-slate-200 pt-8">
        <div class="flex items-center gap-3 text-sm font-semibold text-slate-800">
          <span class="w-2 h-2 rounded-full bg-rose-600" />
          <span>Real-time bidirectional calendar synchronization</span>
        </div>
        <div class="flex items-center gap-3 text-sm font-semibold text-slate-800">
          <span class="w-2 h-2 rounded-full bg-teal-600" />
          <span>Daily state and mood context sharing</span>
        </div>
        <div class="flex items-center gap-3 text-sm font-semibold text-slate-800">
          <span class="w-2 h-2 rounded-full bg-purple-600" />
          <span>Protected shared time blocks with conflict detection</span>
        </div>
      </div>
    </div>

    <!-- Right: sign-in / registration form -->
    <div class="flex flex-col items-start justify-center p-8 sm:p-12 lg:p-16 bg-slate-50">
      <div class="lg:hidden flex items-center gap-2 mb-8">
        <span class="w-3 h-3 rounded-full bg-rose-600 inline-block" />
        <span class="text-sm font-bold uppercase tracking-widest text-slate-900 font-mono">
          Twolander
        </span>
      </div>

      <div class="w-full max-w-sm bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <!-- Tab selector -->
        <div class="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 mb-6 w-full">
          <button
            type="button"
            class="flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
            :class="mode === 'signin'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'"
            @click="mode = 'signin'"
          >
            Sign in
          </button>
          <button
            type="button"
            class="flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
            :class="mode === 'register'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'"
            @click="mode = 'register'"
          >
            Create account
          </button>
        </div>

        <h2
          class="text-xl font-bold text-slate-900 mb-1"
          style="font-family: var(--font-display)"
        >
          {{ mode === 'signin' ? 'Welcome back' : 'Start your shared calendar' }}
        </h2>
        <p class="text-xs text-slate-600 mb-6">
          {{ mode === 'signin' ? 'Enter your credentials to access your schedule.' : 'Create an account to invite your partner.' }}
        </p>

        <!-- Direct Email/Password Form -->
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'" class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-900">Your name</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="First name"
              class="px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900
                     placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-900">Email address</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="name@example.com"
              class="px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900
                     placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-900">Password</label>
            <input
              v-model="form.password"
              type="password"
              required
              minlength="6"
              placeholder="At least 6 characters"
              class="px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900
                     placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
            />
          </div>

          <p v-if="errorMessage" class="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-lg border border-rose-200">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 px-4 rounded-lg bg-rose-600
                   text-white text-xs font-bold hover:bg-rose-700
                   transition-all duration-150 active:scale-[0.98] disabled:opacity-50 mt-2 shadow-xs cursor-pointer"
          >
            {{ loading ? 'Processing...' : (mode === 'signin' ? 'Sign in' : 'Create account') }}
          </button>
        </form>

        <!-- Separator -->
        <div class="relative flex py-5 items-center">
          <div class="flex-grow border-t border-slate-200"></div>
          <span class="flex-shrink mx-4 text-xs font-mono uppercase font-bold text-slate-400">Or</span>
          <div class="flex-grow border-t border-slate-200"></div>
        </div>

        <!-- Optional Google OAuth button -->
        <a
          href="/auth/google"
          class="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg
                 bg-white border border-slate-300 text-xs font-bold text-slate-700
                 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>
      </div>
    </div>
  </div>
</template>

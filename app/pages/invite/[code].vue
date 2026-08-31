<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const code = route.params.code as string
const auth = useAuthStore()

const { data: invite, error } = await useFetch(`/api/couple/info/${code}`)

const joining = ref(false)
const joinError = ref('')

async function join() {
  joining.value = true
  joinError.value = ''
  try {
    await $fetch('/api/couple/join', { method: 'POST', body: { code } })
    await auth.fetchUserSession()
    await navigateTo('/calendar')
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    joinError.value = msg || 'Failed to join calendar.'
    joining.value = false
  }
}

function goToLogin() {
  const pendingCookie = useCookie('pending_invite', { maxAge: 3600, sameSite: 'lax' })
  pendingCookie.value = code
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-8 bg-slate-50 font-sans">
    <div class="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md text-center">

      <div class="flex items-center justify-center gap-2 mb-4">
        <span class="w-3 h-3 rounded-full bg-rose-600 inline-block" />
        <span class="text-xs font-mono uppercase tracking-widest text-slate-900 font-bold">
          Twolander
        </span>
      </div>

      <!-- Invite not found / expired -->
      <template v-if="error">
        <h1
          class="mt-4 text-2xl font-bold text-slate-900"
          style="font-family: var(--font-display)"
        >
          {{
            (error as { statusCode?: number })?.statusCode === 410
              ? 'Calendar is full'
              : 'Invite not found'
          }}
        </h1>
        <p class="mt-2 text-sm text-slate-600 leading-relaxed">
          {{
            (error as { statusCode?: number })?.statusCode === 410
              ? 'This shared calendar already has two connected partners.'
              : 'This invite link is invalid or has expired.'
          }}
        </p>
        <NuxtLink
          to="/login"
          class="mt-6 inline-block text-xs font-bold text-rose-600 hover:underline"
        >
          Return to sign in
        </NuxtLink>
      </template>

      <!-- Valid invite -->
      <template v-else-if="invite">
        <div
          class="mx-auto mt-4 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-rose-100 text-rose-700 ring-4 ring-rose-50"
        >
          {{ invite.creatorName?.charAt(0).toUpperCase() }}
        </div>

        <h1
          class="mt-4 text-2xl font-bold text-slate-950"
          style="font-family: var(--font-display)"
        >
          {{ invite.creatorName }} invited you
        </h1>
        <p class="mt-1.5 text-xs text-slate-600">
          Join their shared calendar to coordinate your schedules together.
        </p>

        <div class="mt-8">
          <button
            v-if="auth.loggedIn"
            class="w-full px-5 py-3 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50"
            :disabled="joining"
            @click="join"
          >
            {{ joining ? 'Joining calendar...' : `Join ${invite.creatorName}'s calendar` }}
          </button>

          <button
            v-else
            class="w-full px-5 py-3 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
            @click="goToLogin"
          >
            Sign in or create account to join
          </button>
        </div>

        <p v-if="joinError" class="mt-4 text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">{{ joinError }}</p>
      </template>

      <template v-else>
        <p class="mt-6 text-xs font-bold text-slate-500">Loading invitation details...</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()

type Tab = 'create' | 'join'
const activeTab = ref<Tab>('create')

const inviteLink = ref('')
const creating = ref(false)
const createError = ref('')
const copied = ref(false)

async function generateInvite() {
  creating.value = true
  createError.value = ''
  try {
    const { inviteCode } = await $fetch<{ inviteCode: string }>('/api/couple/invite', {
      method: 'POST',
    })
    const base = useRuntimeConfig().public.appUrl || window.location.origin
    inviteLink.value = `${base}/invite/${inviteCode}`
  } catch {
    createError.value = 'Something went wrong. Please try again.'
  } finally {
    creating.value = false
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const joinCode = ref('')
const joining = ref(false)
const joinError = ref('')

async function joinCouple() {
  if (!joinCode.value.trim()) return
  joining.value = true
  joinError.value = ''
  try {
    await $fetch('/api/couple/join', {
      method: 'POST',
      body: { code: joinCode.value.trim() },
    })
    await auth.fetchUserSession()
    await navigateTo('/calendar')
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    joinError.value = msg || 'Invalid or expired invite code.'
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-8 bg-slate-50 font-sans">
    <div class="w-full max-w-lg bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md">

      <!-- Header -->
      <div class="flex items-center gap-2 mb-2">
        <span class="w-3 h-3 rounded-full bg-rose-600 inline-block" />
        <span class="text-xs font-mono uppercase tracking-widest text-slate-900 font-bold">
          Twolander
        </span>
      </div>

      <h1
        class="mt-3 text-2xl font-bold tracking-tight text-slate-950"
        style="font-family: var(--font-display)"
      >
        Connect with your partner
      </h1>
      <p class="mt-1 text-xs text-slate-600">
        Share your calendar link or join with an invite code.
      </p>

      <!-- Tab switcher -->
      <div
        class="mt-6 inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 w-full"
      >
        <button
          class="flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
          :class="activeTab === 'create'
            ? 'bg-white text-rose-600 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'create'"
        >
          Invite partner
        </button>
        <button
          class="flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
          :class="activeTab === 'join'
            ? 'bg-white text-rose-600 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'join'"
        >
          Join calendar
        </button>
      </div>

      <!-- Create panel -->
      <div v-if="activeTab === 'create'" class="mt-6">
        <p class="text-xs text-slate-600 mb-4 leading-relaxed">
          Generate an invitation link to share with your partner. Once they accept, both accounts will sync together.
        </p>

        <div v-if="!inviteLink">
          <button
            class="px-5 py-2.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50"
            :disabled="creating"
            @click="generateInvite"
          >
            {{ creating ? 'Generating link...' : 'Generate invite link' }}
          </button>
          <p v-if="createError" class="mt-3 text-xs text-rose-600 font-bold">{{ createError }}</p>
        </div>

        <div v-else class="mt-2">
          <p class="text-xs font-bold text-slate-900 mb-2">Share this link with your partner:</p>
          <div
            class="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-300"
          >
            <span class="flex-1 text-xs text-slate-900 truncate font-mono select-all font-semibold">
              {{ inviteLink }}
            </span>
            <button
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer shadow-xs"
              @click="copyLink"
            >
              {{ copied ? 'Copied' : 'Copy link' }}
            </button>
          </div>
          <div class="mt-4 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span class="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Waiting for partner to join...</span>
            </div>
            <NuxtLink to="/calendar" class="text-xs font-bold text-rose-600 hover:underline">
              Go to Calendar →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Join panel -->
      <div v-else class="mt-6">
        <p class="text-xs text-slate-600 mb-4 leading-relaxed">
          Paste the invite code you received from your partner.
        </p>

        <div class="flex gap-2">
          <input
            v-model="joinCode"
            type="text"
            placeholder="Enter invite code"
            class="flex-1 px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900
                   placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
            @keydown.enter="joinCouple"
          />
          <button
            class="px-5 py-2.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
            :disabled="joining || !joinCode.trim()"
            @click="joinCouple"
          >
            {{ joining ? 'Joining...' : 'Join' }}
          </button>
        </div>

        <p v-if="joinError" class="mt-3 text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">{{ joinError }}</p>
      </div>

      <!-- Sign out / skip -->
      <div class="mt-8 border-t border-slate-200 pt-5 flex justify-between items-center">
        <NuxtLink to="/calendar" class="text-xs font-bold text-slate-700 hover:text-slate-900">
          Skip to calendar
        </NuxtLink>
        <button
          class="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          @click="auth.logout()"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

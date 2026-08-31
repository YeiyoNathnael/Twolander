<script setup lang="ts">
import { PhCopy, PhCheck, PhLink, PhUser, PhCalendar, PhSignOut, PhHeart, PhArrowsClockwise, PhTrash, PhQrCode } from '@phosphor-icons/vue'
import QrCodeModal from '~/components/couple/QrCodeModal.vue'

definePageMeta({ layout: 'default' })

const auth = useAuthStore()
const eventsStore = useEventsStore()
const cal = useCalendarStore()
const haptics = useHaptics()

const inviteCode = ref('')
const inviteLink = ref('')
const copied = ref(false)
const loadingInvite = ref(true)
const qrModalOpen = ref(false)

// Google Sync State
const syncStatus = ref<{ connected: boolean; syncedEventsCount: number }>({ connected: false, syncedEventsCount: 0 })
const syncing = ref(false)
const syncFeedback = ref('')
const disconnecting = ref(false)

async function loadInvite() {
  loadingInvite.value = true
  try {
    const res = await $fetch<{ inviteCode: string }>('/api/couple/invite', { method: 'POST' })
    inviteCode.value = res.inviteCode
    const base = useRuntimeConfig().public.appUrl || window.location.origin
    inviteLink.value = `${base}/invite/${res.inviteCode}`
  } catch (err) {
    console.error(err)
  } finally {
    loadingInvite.value = false
  }
}

async function loadSyncStatus() {
  try {
    const res = await $fetch<{ connected: boolean; syncedEventsCount: number }>('/api/calendar/sync-status')
    syncStatus.value = res
  } catch (err) {
    console.error(err)
  }
}

async function triggerGoogleSync() {
  haptics.medium()
  syncing.value = true
  syncFeedback.value = ''
  try {
    const res = await $fetch<{ success: boolean; count: number; totalFound: number }>('/api/calendar/google-sync', {
      method: 'POST',
    })
    haptics.success()
    syncFeedback.value = `Successfully synced ${res.totalFound} events (${res.count} new).`
    await loadSyncStatus()
    await eventsStore.fetchForRange(cal.rangeFrom, cal.rangeTo)
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    syncFeedback.value = msg || 'Failed to sync with Google Calendar.'
  } finally {
    syncing.value = false
  }
}

async function disconnectGoogle() {
  haptics.light()
  disconnecting.value = true
  try {
    await $fetch('/api/calendar/google-disconnect', { method: 'POST' })
    syncStatus.value = { connected: false, syncedEventsCount: 0 }
    syncFeedback.value = 'Google Calendar disconnected.'
    await eventsStore.fetchForRange(cal.rangeFrom, cal.rangeTo)
  } catch (err) {
    console.error(err)
  } finally {
    disconnecting.value = false
  }
}

async function copyLink() {
  haptics.light()
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

onMounted(() => {
  loadInvite()
  loadSyncStatus()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10 font-sans w-full flex flex-col gap-6">
    <!-- Header -->
    <div class="pb-6 border-b border-gray-100">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-black font-serif italic tracking-tight">
        Calendar Settings
      </h1>
      <p class="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
        Manage partner connection, Google synchronization, and couple space.
      </p>
    </div>

    <div class="flex flex-col gap-6">
      <!-- 1. Partner Connection & Shared Link -->
      <section class="app-card p-6 sm:p-8 bg-white flex flex-col gap-6">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <PhHeart :size="22" weight="fill" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-black">Partner connection</h2>
            <p class="text-xs text-gray-500 font-medium">Connect both lives into one unified calendar.</p>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-bold text-black mb-1.5 block">Shared invitation link</label>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                :value="loadingInvite ? 'Generating link...' : inviteLink"
                class="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-black font-mono select-all font-medium"
              />
              <button
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
                title="Show QR Code"
                @click="haptics.light(); qrModalOpen = true"
              >
                <PhQrCode :size="16" weight="bold" />
                <span class="hidden sm:inline">QR Code</span>
              </button>
              <button
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                @click="copyLink"
              >
                <component :is="copied ? PhCheck : PhCopy" :size="15" weight="bold" />
                <span>{{ copied ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <span class="text-xs font-bold text-gray-600">Couple Invite Code</span>
            <span class="text-xs font-mono font-extrabold text-rose-600 select-all bg-white px-2.5 py-1 rounded-lg border border-gray-200">{{ inviteCode || '...' }}</span>
          </div>
        </div>
      </section>

      <!-- 2. Profile Details -->
      <section class="app-card p-6 sm:p-8 bg-white flex flex-col gap-6">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <PhUser :size="22" weight="bold" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-black">Profile & identity</h2>
            <p class="text-xs text-gray-500 font-medium">Your identity on the shared couple calendar.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-1">Your Name</span>
            <span class="text-sm font-bold text-black">{{ auth.user?.name }}</span>
          </div>

          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-1">Email Address</span>
            <span class="text-sm font-bold text-black">{{ auth.user?.email }}</span>
          </div>
        </div>
      </section>

      <!-- 3. Google Calendar Synchronization -->
      <section class="app-card p-6 sm:p-8 bg-white flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-gray-100 text-black flex items-center justify-center shrink-0">
              <PhCalendar :size="22" weight="bold" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base sm:text-lg font-bold text-black">Google Calendar sync</h2>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
                  :class="syncStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500'"
                >
                  {{ syncStatus.connected ? 'Connected' : 'Not connected' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 font-medium mt-0.5">
                {{ syncStatus.connected
                  ? `${syncStatus.syncedEventsCount} external events imported as read-only blocks.`
                  : 'Optionally import your external schedule as read-only blocks.' }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <template v-if="syncStatus.connected">
              <button
                type="button"
                :disabled="syncing"
                class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
                @click="triggerGoogleSync"
              >
                <PhArrowsClockwise :size="14" :class="{ 'animate-spin': syncing }" />
                <span>{{ syncing ? 'Syncing...' : 'Sync Now' }}</span>
              </button>

              <button
                type="button"
                :disabled="disconnecting"
                class="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95"
                title="Disconnect Google Calendar"
                @click="disconnectGoogle"
              >
                <PhTrash :size="16" />
              </button>
            </template>

            <template v-else>
              <a
                href="/auth/google"
                class="px-5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-black hover:bg-gray-50 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                Connect Account
              </a>
            </template>
          </div>
        </div>

        <p v-if="syncFeedback" class="text-xs font-bold text-slate-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
          {{ syncFeedback }}
        </p>
      </section>

      <!-- 4. Session Action -->
      <div class="flex justify-end pt-2">
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer active:scale-95"
          @click="auth.logout()"
        >
          <PhSignOut :size="16" />
          <span>Sign out of Twolander</span>
        </button>
      </div>
    </div>

    <!-- QR Code Scan Modal -->
    <QrCodeModal
      :open="qrModalOpen"
      :invite-url="inviteLink"
      :invite-code="inviteCode"
      @close="qrModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { PhCopy, PhCheck, PhUser, PhCalendar, PhSignOut, PhHeart, PhArrowsClockwise, PhTrash, PhQrCode } from '@phosphor-icons/vue'
import QrCodeModal from '~/components/couple/QrCodeModal.vue'

definePageMeta({ layout: 'default' })

const auth = useAuthStore()
const eventsStore = useEventsStore()
const cal = useCalendarStore()
const haptics = useHaptics()

const inviteCode = ref('')
const inviteLink = ref('')
const copied = ref(false)
const codeCopied = ref(false)
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

async function copyCode() {
  haptics.light()
  if (!inviteCode.value) return
  await navigator.clipboard.writeText(inviteCode.value)
  codeCopied.value = true
  setTimeout(() => (codeCopied.value = false), 2000)
}

onMounted(() => {
  loadInvite()
  loadSyncStatus()
})
</script>

<template>
  <div class="max-w-2xl mx-auto w-full min-w-0 py-2 sm:py-6 font-sans flex flex-col gap-4 sm:gap-6">
    <!-- Header -->
    <div class="pb-3 border-b border-gray-100 min-w-0">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-black font-serif italic tracking-tight">
        Calendar Settings
      </h1>
      <p class="text-xs text-gray-500 font-medium mt-0.5">
        Manage partner connection, Google synchronization, and couple space.
      </p>
    </div>

    <div class="flex flex-col gap-4 sm:gap-5 w-full min-w-0">
      <!-- 1. Partner Connection & Shared Link -->
      <section class="app-card p-4 sm:p-6 bg-white flex flex-col gap-4 w-full min-w-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <PhHeart :size="20" weight="fill" />
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-bold text-black truncate">Partner connection</h2>
            <p class="text-xs text-gray-500 font-medium truncate">Connect both lives into one unified calendar.</p>
          </div>
        </div>

        <div class="flex flex-col gap-3 w-full min-w-0">
          <!-- Fluid Invitation Link Input & Actions -->
          <div class="flex flex-col gap-1.5 w-full min-w-0">
            <label class="text-xs font-bold text-black">Shared invitation link</label>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
              <input
                type="text"
                readonly
                :value="loadingInvite ? 'Generating link...' : inviteLink"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black font-mono select-all truncate min-w-0 font-medium"
              />
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Show QR Code"
                  @click="haptics.light(); qrModalOpen = true"
                >
                  <PhQrCode :size="15" weight="bold" />
                  <span>QR Code</span>
                </button>
                <button
                  type="button"
                  class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                  @click="copyLink"
                >
                  <component :is="copied ? PhCheck : PhCopy" :size="14" weight="bold" />
                  <span>{{ copied ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Compact Code Block -->
          <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
            <span class="text-xs font-bold text-gray-600 shrink-0">Couple Invite Code:</span>
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs font-mono font-extrabold text-rose-600 select-all bg-white px-2.5 py-1 rounded-lg border border-gray-200 truncate min-w-0">
                {{ inviteCode || '...' }}
              </span>
              <button
                type="button"
                class="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-black transition-all active:scale-90 shrink-0 cursor-pointer"
                title="Copy code"
                @click="copyCode"
              >
                <component :is="codeCopied ? PhCheck : PhCopy" :size="13" weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Profile Details -->
      <section class="app-card p-4 sm:p-6 bg-white flex flex-col gap-4 w-full min-w-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <PhUser :size="20" weight="bold" />
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-bold text-black truncate">Profile & identity</h2>
            <p class="text-xs text-gray-500 font-medium truncate">Your identity on the shared couple calendar.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
          <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 min-w-0">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-0.5">Your Name</span>
            <span class="text-xs font-bold text-black truncate block">{{ auth.user?.name }}</span>
          </div>

          <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 min-w-0">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-0.5">Email Address</span>
            <span class="text-xs font-bold text-black truncate block">{{ auth.user?.email }}</span>
          </div>
        </div>
      </section>

      <!-- 3. Google Calendar Synchronization -->
      <section class="app-card p-4 sm:p-6 bg-white flex flex-col gap-3 w-full min-w-0">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full min-w-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-gray-100 text-black flex items-center justify-center shrink-0">
              <PhCalendar :size="20" weight="bold" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-black truncate">Google Calendar</h2>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0"
                  :class="syncStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500'"
                >
                  {{ syncStatus.connected ? 'Connected' : 'Off' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 font-medium truncate mt-0.5">
                {{ syncStatus.connected
                  ? `${syncStatus.syncedEventsCount} events imported.`
                  : 'Import external schedule as read-only blocks.' }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
            <template v-if="syncStatus.connected">
              <button
                type="button"
                :disabled="syncing"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95 shrink-0"
                @click="triggerGoogleSync"
              >
                <PhArrowsClockwise :size="13" :class="{ 'animate-spin': syncing }" />
                <span>{{ syncing ? 'Syncing...' : 'Sync Now' }}</span>
              </button>

              <button
                type="button"
                :disabled="disconnecting"
                class="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Disconnect Google Calendar"
                @click="disconnectGoogle"
              >
                <PhTrash :size="15" />
              </button>
            </template>

            <template v-else>
              <a
                href="/auth/google"
                class="px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-black hover:bg-gray-50 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                Connect Account
              </a>
            </template>
          </div>
        </div>

        <p v-if="syncFeedback" class="text-xs font-bold text-slate-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          {{ syncFeedback }}
        </p>
      </section>

      <!-- 4. Session Action -->
      <div class="flex justify-end pt-1">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer active:scale-95"
          @click="auth.logout()"
        >
          <PhSignOut :size="15" />
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

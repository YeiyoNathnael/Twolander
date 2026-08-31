<script setup lang="ts">
import { PhX, PhQrCode, PhHeart, PhCopy, PhCheck } from '@phosphor-icons/vue'

const props = defineProps<{
  open: boolean
  inviteUrl: string
  inviteCode: string
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)
const haptics = useHaptics()

// Generate high-resolution QR code image using safe Google Charts / standard QR API
const qrImageUrl = computed(() => {
  if (!props.inviteUrl) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(props.inviteUrl)}&color=0-0-0&bgcolor=255-255-255&margin=1`
})

async function copyLink() {
  haptics.light()
  await navigator.clipboard.writeText(props.inviteUrl)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" @click="emit('close')" />

      <!-- QR Card -->
      <div class="relative z-10 w-full max-w-sm bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center gap-4">
        <!-- Header -->
        <div class="w-full flex items-center justify-between pb-2 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <h3 class="text-base font-bold text-black font-serif italic">Scan to Connect</h3>
          </div>
          <button
            class="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <PhX :size="16" />
          </button>
        </div>

        <p class="text-xs text-gray-500 font-medium">
          Have your partner scan this QR code with their phone camera to instantly join your couple space.
        </p>

        <!-- QR Code Frame -->
        <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-2xs">
          <img
            :src="qrImageUrl"
            alt="Couple Invite QR Code"
            class="w-48 h-48 rounded-xl object-contain"
          />
        </div>

        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-mono font-bold">
          <span>Code: {{ inviteCode }}</span>
        </div>

        <!-- Copy Action -->
        <button
          class="w-full py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
          @click="copyLink"
        >
          <component :is="copied ? PhCheck : PhCopy" :size="14" weight="bold" />
          <span>{{ copied ? 'Link copied!' : 'Copy Invite Link' }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

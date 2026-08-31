<script setup lang="ts">
import FloatingDock from '~/components/navigation/FloatingDock.vue'

const auth = useAuthStore()
const { isConnected } = useRealtime()
</script>

<template>
  <div class="min-h-[100dvh] w-full max-w-full bg-[#f8fafc] text-black flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900 pb-28 overflow-x-hidden">
    <!-- Top Minimalist Brand Header -->
    <header
      class="h-16 w-full max-w-full bg-[#f8fafc]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shrink-0 border-b border-gray-100/60"
    >
      <!-- Brand & Live Indicator -->
      <div class="flex items-center gap-2.5 min-w-0">
        <NuxtLink to="/calendar" class="flex items-center gap-2 group min-w-0">
          <span class="w-3 h-3 rounded-full bg-rose-600 inline-block transition-transform group-hover:scale-110 shadow-xs shrink-0" />
          <span class="text-xl font-bold font-serif tracking-tight text-black italic truncate">
            Twolander
          </span>
        </NuxtLink>

        <!-- Live Sync Status -->
        <span
          class="w-2 h-2 rounded-full transition-colors shrink-0 ml-0.5"
          :class="isConnected ? 'bg-emerald-500' : 'bg-gray-300'"
          :title="isConnected ? 'Live sync connected' : 'Connecting...'"
        />
      </div>

      <!-- Right: User Avatar -->
      <div class="flex items-center gap-3 shrink-0">
        <NuxtLink
          to="/settings"
          class="flex items-center gap-2 p-1 rounded-full hover:bg-white transition-colors"
          title="Account settings"
        >
          <div
            v-if="auth.user?.avatar"
            class="w-8 h-8 rounded-full overflow-hidden ring-2 shrink-0 ring-rose-500 shadow-xs"
          >
            <img
              :src="auth.user.avatar"
              :alt="auth.user.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold bg-rose-50 text-rose-600 ring-2 ring-rose-200 shadow-xs shrink-0"
          >
            {{ auth.user?.name?.charAt(0).toUpperCase() }}
          </div>
        </NuxtLink>
      </div>
    </header>

    <!-- Page Content Container -->
    <main class="flex-1 max-w-7xl mx-auto w-full min-w-0 px-4 sm:px-8 flex flex-col">
      <slot />
    </main>

    <!-- Floating Dock -->
    <FloatingDock />
  </div>
</template>

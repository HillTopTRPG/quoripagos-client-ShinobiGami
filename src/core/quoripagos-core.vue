<template>
  <socket-provider>
    <login-provider :modules="modules">
      <slot />
    </login-provider>
  </socket-provider>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import IgnoreWatchUpdateKeyStore from '@/core/data/ignore-watch-update-key'
import LoginProvider from '@/core/provider/LoginProvider.vue'
import { MadeStore } from '@/core/utility/vue3'
import SocketProvider from '@/core/provider/SocketProvider.vue'

export default defineComponent({
  name: 'quorpagos-core',
  components: {
    SocketProvider,
    LoginProvider
  },
  setup() {
    IgnoreWatchUpdateKeyStore.provider()
    const modules = inject<[MadeStore<{ ready: boolean }>[], MadeStore<{ ready: boolean }>[]]>('$featureStores')
    return {
      modules
    }
  }
})
</script>

<template>
  <template v-if="types.some(t => t === 'pc')">
    <template v-for="d in pcListWrap" :key="d.raw._characterKey">
      <label class="secret-owner-label" v-if="d.raw._characterKey !== characterKey">
        <input
          type="checkbox"
          v-if="isGm"
          :checked="jurisdictionList?.some(o => o === d.raw._characterKey)"
          @change.prevent="$event.target.checked
          ? pushList(d.raw._characterKey)
          : removeFilter(jurisdictionList, i => i === d.raw._characterKey)"
        >
        <input type="checkbox" v-else :checked="jurisdictionList?.some(o => o === d.raw._characterKey)" @click.prevent>
        <span>PC {{ d.raw.name }} {{ d.character?.sheetInfo.characterName || '' }}</span>
      </label>
    </template>
  </template>
  <template v-if="types.some(t => t === 'npc')">
    <template v-for="d in npcListWrap" :key="d.raw._characterKey">
      <label class="secret-owner-label" v-if="d.raw._characterKey !== characterKey && !d.raw.secretcheck">
        <input
          type="checkbox"
          v-if="isGm"
          :checked="jurisdictionList?.some(o => o === d.raw._characterKey)"
          @change.prevent="$event.target.checked
            ? pushList(d.raw._characterKey)
            : removeFilter(jurisdictionList, i => i === d.raw._characterKey)"
        >
        <input type="checkbox" v-else :checked="jurisdictionList?.some(o => o === d.raw._characterKey)" @click.prevent>
        <span>NPC {{ d.raw.name || '' }}</span>
      </label>
    </template>
  </template>
  <template v-if="types.some(t => t === 'right-hand')">
    <template v-for="d in rightHandListWrap" :key="d.raw._characterKey">
      <label class="secret-owner-label" v-if="d.raw._characterKey !== characterKey && !d.raw._secretCheck">
        <input
          type="checkbox"
          v-if="isGm"
          :checked="jurisdictionList?.some(o => o === d.raw._characterKey)"
          @change.prevent="$event.target.checked
            ? pushList(d.raw._characterKey)
            : removeFilter(jurisdictionList, i => i === d.raw._characterKey)"
        >
        <input type="checkbox" v-else :checked="jurisdictionList?.some(o => o === d.raw._characterKey)" @click.prevent>
        <span>腹心 {{ d.raw.name || '' }}</span>
      </label>
    </template>
  </template>
  <template v-if="(
    pcListWrap.filter(c => c.raw._characterKey !== characterKey).length +
    npcListWrap.filter(c => c.raw._characterKey !== characterKey && !c.raw.secretcheck).length +
    rightHandListWrap.filter(c => c.raw._characterKey !== characterKey && !c.raw._secretCheck).length
  ) === 0">
    <template v-if="mode === 'scenario'">選択肢なし</template>
    <template v-if="mode === 'character'">なし</template>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import UserStore from '../../core/data/user'
import { removeFilter } from '@/core/utility/typescript'
import ScenarioStore from '@/feature/scenario/data'
import { NPC, PC } from '@/core/utility/shinobigamiScenario'

export default defineComponent({
  name: 'scenario-jurisdiction-check',
  props: {
    types: {
      type: Array as PropType<('pc' | 'npc' | 'right-hand')[]>,
      required: true
    },
    type: {
      type: String as PropType<('pc' | 'npc' | 'right-hand')>,
      required: true
    },
    characterKey: {
      type: String,
      required: true
    },
    jurisdictionList: {
      type: Array as PropType<string[]>
    },
    mode: {
      type: String as PropType<'scenario' | 'character'>,
      required: true
    }
  },
  setup(props) {
    const scenarioState = ScenarioStore.injector()
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const {
      pcListWrap,
      npcListWrap,
      rightHandListWrap
    } = scenarioState.makeWrapLists()

    const isOwn = ref(false)
    watch([
      () => props.type,
      () => props.characterKey,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma
    ], () => {
      const { isOwn: isOwnRaw } = scenarioState.getChitStatus(
        props.type,
        props.characterKey,
        userState.selfUser?.key || null
      )
      isOwn.value = isOwnRaw
    }, { immediate: true, deep: true })

    return {
      isOwn,
      pcListWrap,
      npcListWrap,
      rightHandListWrap,
      isGm,
      removeFilter,
      getPcChitStatus: (pc: PC) => scenarioState.getChitStatus('pc', pc._characterKey, userState.selfUser?.key || null),
      getNpcChitStatus: (npc: NPC) => scenarioState.getChitStatus('npc', npc._characterKey, userState.selfUser?.key || null),
      pushList: (key: string) => {
        const list = props.jurisdictionList
        list?.push(key)
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

label {
  cursor: pointer;
  width: 100%;
  height: 100%;
  @include common.flex-box(row, flex-start, center);

  &.secret-owner-label {
    height: auto;
  }
}

input:not([type='checkbox']) {
  padding: 0;
  margin: 0;
  cursor: inherit;
  width: 100%;
  box-sizing: border-box;
  font-size: inherit;

  &:not([multiple]) {
    height: 2em;
  }
}
</style>

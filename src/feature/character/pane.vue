<template>
  <div class="character-pane-container">
    <div v-if="(pcList.length + npcList.length + rightHandList.length + enigmaList.length) === 0">ゲームマスターがシナリオ情報を追加することで設定できます。</div>
    <div v-else>コマを選択して、情報を確認／編集してください。</div>
    <div class="h-box">
      <template v-for="(p, idx) in pcList" :key="idx">
        <character-chit-name :view-name="true" type="pc" :target="p._characterKey" label="PC" @select="onSelectEditChit(p._characterKey, 'pc')" />
      </template>
      <template v-for="(n, idx) in npcList" :key="idx">
        <character-chit-name :view-name="true" type="npc" :target="n._characterKey" label="NPC" @select="onSelectEditChit(n._characterKey, 'npc')" v-if="isGm || !n.secretcheck" />
      </template>
      <template v-for="(r, idx) in rightHandList" :key="idx">
        <character-chit-name :view-name="true" type="right-hand" :target="r._characterKey" label="腹心" @select="onSelectEditChit(r._characterKey, 'right-hand')" v-if="isGm || !r._secretCheck" />
      </template>
      <template v-for="(e, idx) in enigmaList" :key="idx">
        <character-chit-name :view-name="true" type="enigma" :target="e.name" label="エニグマ" @select="onSelectEditChit(e.name, 'enigma')" />
      </template>
    </div>
    <character-form
      v-if="selectTarget || selectType"
      :target="selectTarget"
      :type="selectType"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
// import Store from './data'
import ScenarioStore from '@/feature/scenario/data'
import CharacterForm from '@/feature/character/character-form.vue'
import CharacterChitName from '@/feature/character/character-chit-name.vue'
import UserStore from '@/core/data/user'

export default defineComponent({
  name: 'character-pane',
  emits: ['close'],
  components: { CharacterChitName, CharacterForm },
  setup() {
    const scenarioState = ScenarioStore.injector()

    type ChitType = 'pc' | 'npc' | 'right-hand' | 'enigma'
    const selectTarget = ref<string | null>(null)
    const selectType = ref<ChitType | null>(null)
    const onSelectEditChit = (target: string, type: ChitType) => {
      selectTarget.value = target
      selectType.value = type
    }

    // データ編集により不可視状態になるべき場合の不可視化処理
    watch(
      [
        () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
        () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
        () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand,
        () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma
      ],
      () => {
        const sheetInfo = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo
        const resetValue = () => {
          selectType.value = null
          selectTarget.value = null
        }
        if (selectType.value === 'pc') {
          const d = sheetInfo?.pc.find(d => d._characterKey === selectTarget.value)
          if (!d) return resetValue()
        }
        if (selectType.value === 'npc') {
          const d = sheetInfo?.npc.find(d => d._characterKey === selectTarget.value)
          if (!d) return resetValue()
          if (d.secretcheck) return resetValue()
          if (!sheetInfo?.pc
            .filter(p => d._sheetOpenList.some(so => so === p._characterKey))
            .some(pc => pc._userKey === userState.selfUser?.key)) return resetValue()
        }
        if (selectType.value === 'right-hand') {
          const d = sheetInfo?.righthand.find(d => d._characterKey === selectTarget.value)
          if (!d) return resetValue()
          if (d._secretCheck) return resetValue()
          if (!sheetInfo?.pc
            .filter(p => d._sheetOpenList.some(so => so === p._characterKey))
            .some(pc => pc._userKey === userState.selfUser?.key)) return resetValue()
        }
        if (selectType.value === 'enigma') {
          const d = sheetInfo?.enigma.find(d => d.name === selectTarget.value)
          if (!d) return resetValue()
        }
      },
      { deep: true }
    )

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      isGm,
      selectTarget,
      selectType,
      onSelectEditChit,
      pcList: computed(() => scenarioState.currentScenario.sheetInfo.pc),
      npcList: computed(() => scenarioState.currentScenario.sheetInfo.npc),
      rightHandList: computed(() => scenarioState.currentScenario.sheetInfo.righthand),
      enigmaList: computed(() => scenarioState.currentScenario.sheetInfo.enigma)
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.character-pane-container {
  @include common.flex-box(column, stretch, flex-start);
  padding-top: 0.5rem;
  gap: 0.5rem;
  width: 100%;
}

@include common.deep(".chit") {
  cursor: pointer;
}

details {
  margin: 0 0.5rem;

  summary {
    background-color: lightblue;
    vertical-align: center;
    text-align: left;
    line-height: 2em;
    height: 2em;
    box-sizing: border-box;
    cursor: pointer;
    padding: 0 0.5em;
    overflow: hidden;
    font-weight: bold;
  }
}

.v-box {
  @include common.flex-box(column, stretch, flex-start);
  gap: 0.5rem
}

.h-box {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5rem
}
</style>

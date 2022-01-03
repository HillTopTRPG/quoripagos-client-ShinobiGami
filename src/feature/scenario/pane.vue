<template>
  <div class="url-block" v-if="isGm">
    <label class="url">
      <span>キャラクターシート倉庫URL</span>
      <input
        type="text"
        autocomplete="url"
        v-model="scenario.url"
        placeholder="https://character-sheets.appspot.com/sgScenario/edit.html?key="
      >
    </label>
    <label class="sheet-view-pass">
      <span>秘匿情報閲覧パス</span>
      <input type="text" v-model="scenario.sheetViewPass" placeholder="">
      <button @click="onReadSheet()" :disabled="!scenario.url">読込</button>
    </label>
  </div>
  <scenario-base />

  <div class="v-box">
    <scenario-prize />
    <scenario-character />
  </div>

  <div class="v-box">
    <scenario-enigma target="" mode="scenario" />
    <scenario-right-hand target="" mode="scenario" />
  </div>

  <div class="v-box">
    <scenario-summary />
  </div>

  <div class="v-box">
    <scenario-pc target="" mode="scenario" />
  </div>

  <div class="v-box">
    <scenario-npc target="" mode="scenario" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import Store from './data'
import UserStore from '@/core/data/user'
import CharacterStore from '@/feature/character/data'
import { ShinobigamiScenarioHelper } from '@/core/utility/shinobigamiScenario'
import { errorDialog } from '@/core/utility/dialog'
import { v4 as uuidV4 } from 'uuid'
import { removeFilter } from '@/core/utility/typescript'
import ScenarioPc from '@/feature/scenario/scenario-pc.vue'
import ScenarioNpc from '@/feature/scenario/scenario-npc.vue'
import ScenarioEnigma from '@/feature/scenario/scenario-enigma.vue'
import ScenarioSummary from '@/feature/scenario/scenario-summary.vue'
import ScenarioBase from '@/feature/scenario/scenario-base.vue'
import ScenarioPrize from '@/feature/scenario/scenario-prize.vue'
import ScenarioCharacter from '@/feature/scenario/scenario-character.vue'
import ScenarioRightHand from '@/feature/scenario/scenario-right-hand.vue'

export default defineComponent({
  name: 'scenario-pane',
  components: { ScenarioRightHand, ScenarioCharacter, ScenarioPrize, ScenarioBase, ScenarioSummary, ScenarioEnigma, ScenarioNpc, ScenarioPc },
  emits: ['close'],
  setup() {
    const elmId = uuidV4()
    const state = Store.injector()
    const scenario = computed(() => state.currentScenario)
    const characterState = CharacterStore.injector()

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const onReadSheet = async () => {
      // console.log(scenario.value.url)
      if (!scenario.value.url) return
      const helper = new ShinobigamiScenarioHelper(scenario.value.url, scenario.value.sheetViewPass)
      if (!helper.isThis()) {
        await errorDialog({
          title: 'Loading Error',
          text: 'URLが誤っています。'
        })
        return
      }
      const {
        data: rd
        // , jsons
      } = await helper.getData()
      // console.log(jsons)
      // console.log(rd)

      if (!rd) {
        await errorDialog({
          title: 'Loading Error',
          text: 'URLまたは秘匿情報閲覧パスが誤っています。'
        })
        return
      }

      // 直列の非同期で全部実行する
      await rd.pc
        .map(pc => async () => {
          pc._type = 'pc'
          pc._secretOpenList = []
          pc._placementOpenList = []
          pc._userKey = ''
          pc.plot = -2
          pc.isFumble = false
          pc.isActed = false
          pc.chitImageList = []
          pc.standImageList = []
          pc.currentChitImage = -1
          pc.currentStandImage = -1
          pc.color = '#3E2723'

          // キャラクターシート
          const oldPc = scenario.value.sheetInfo?.pc.find(p => p.name === pc.name)
          if (oldPc) {
            pc._characterKey = oldPc._characterKey
            return
          }
          pc._characterKey = await characterState.insertEmptyCharacter()
        })
        .reduce((prev, curr) => prev.then(curr), Promise.resolve())

      // 直列の非同期で全部実行する
      await rd.npc
        .map(npc => async () => {
          npc._type = 'npc'
          npc._secretOpenList = []
          npc._placementOpenList = []
          npc._hasSheet = false
          npc._sheetOpenList = []
          npc.plot = -2
          npc.isFumble = false
          npc.isActed = false
          npc.chitImageList = []
          npc.standImageList = []
          npc.currentChitImage = -1
          npc.currentStandImage = -1
          npc.color = '#3E2723'

          // キャラクターシート
          const oldNpc = scenario.value.sheetInfo?.npc.find(n => n.name === npc.name)
          if (oldNpc) {
            npc._characterKey = oldNpc._characterKey
            return
          }
          npc._characterKey = await characterState.insertEmptyCharacter()
        })
        .reduce((prev, curr) => prev.then(curr), Promise.resolve())

      // 直列の非同期で全部実行する
      await rd.righthand
        .map(rightHand => async () => {
          rightHand._type = 'right-hand'
          rightHand._secretCheck = false
          rightHand._hasSheet = false
          rightHand._sheetOpenList = []
          rightHand.plot = -2
          rightHand.isFumble = false
          rightHand.isActed = false
          rightHand.chitImageList = []
          rightHand.standImageList = []
          rightHand.currentChitImage = -1
          rightHand.currentStandImage = -1
          rightHand.color = '#3E2723'

          // キャラクターシート
          const oldRightHand = scenario.value.sheetInfo?.righthand.find(r => r.name === rightHand.name)
          if (oldRightHand) {
            rightHand._characterKey = oldRightHand._characterKey
            return
          }
          rightHand._characterKey = await characterState.insertEmptyCharacter()
        })
        .reduce((prev, curr) => prev.then(curr), Promise.resolve())

      rd.enigma.forEach(enigma => {
        enigma._type = 'enigma'
        enigma._targetId = ''
        enigma._open = false
        enigma._disarm = false
        enigma._disarmMethod = ''
        enigma._targetSkill = ''
        enigma._effect = ''
        enigma.chitImageList = []
        enigma.standImageList = []
        enigma.currentChitImage = -1
        enigma.currentStandImage = -1
        enigma.color = '#3E2723'
      })

      rd.summary.forEach(summary => {
        summary._imageKey = null
      })

      scenario.value.sheetInfo = rd
    }

    const openEnigmaIdxList = ref<number[]>([])
    const openEnigma = (idx: number) => {
      if (openEnigmaIdxList.value.some(i => i === idx)) {
        removeFilter(openEnigmaIdxList.value, i => i === idx)
      } else {
        openEnigmaIdxList.value.push(idx)
      }
    }

    return {
      openEnigmaIdxList,
      openEnigma,
      characterList: computed(() => characterState.characterList),
      removeFilter,
      elmId,
      isGm,
      scenario,
      onReadSheet
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.url-block {
  @include common.flex-box(column, stretch, flex-start);
  width: 100%;

  > label {
    @include common.flex-box(row, flex-start, center);

    input {
      flex: 1;
    }
  }
}

.v-box {
  @include common.flex-box(column, flex-start, flex-start, wrap);
  gap: 0.5em;

  @include common.deep("h2") {
    margin-bottom: -0.5rem;
  }
}

.h-box {
  @include common.flex-box(row, flex-start, center);

  input {
    width: auto;
    flex: 1;
  }
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  width: 45em;
  max-width: 45em;
  min-width: 45em;
  box-sizing: border-box;

  textarea {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 7em;
    font-size: inherit;
    resize: vertical;
  }

  tr.space {
    min-height: 0.5em;
    height: 0.5em;
  }

  label {
    cursor: pointer;
  }

  caption {
    text-align: center;
    background-color: #252525;
    color: white;
    font-weight: bold;
    font-size: 110%;
  }

  tfoot td {
    text-align: left;
    border: none;
  }

  input:not([type='checkbox']),
  select {
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

  thead tr,
  th {
    background-color: #252525;
    color: white;
  }

  td {
    height: 1.9em;
    text-align: left;
  }

  th {
    text-align: center;
  }

  td, th {
    position: relative;
    border-style: solid;
    border-width: 1px;
    border-color: black;
    padding: 0;
    margin: 0;
    white-space: pre-wrap;

    > * {
      vertical-align: middle;
    }
  }
}
</style>

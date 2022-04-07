<template>
  <div class="scene-status-area">
    <cycle-select :limit="limit" v-model="cycle" />
    <span>/{{limit}}</span>
    <round-select v-model="round" />
    <label>
      <span>プロット</span>
      <template v-if="isPrePlot === 'none'">
        <button class="plot-button" v-if="isGm" @click="onStartPrePlot()">開始</button>
        <div v-else class="text">済</div>
      </template>
      <template v-else-if="isPrePlot === 'pre-plot' || isPrePlot === 'pre-plot-re'">
        <div class="text">入力中</div>
      </template>
      <template v-else-if="isPrePlot === 'pre-plot-end'">
        <button class="plot-button" v-if="isGm" @click="onOpenPrePlot()">公開</button>
        <div v-else class="text">GM操作待ち</div>
      </template>
      <template v-else-if="isPrePlot === 'select' || isPrePlot === 'select-re'">
        <div class="text">選択中</div>
      </template>
      <template v-else-if="isPrePlot === 'select-end'">
        <button class="plot-button" v-if="isGm" @click="onFixPrePlot()">確定</button>
        <div v-else class="text">GM操作待ち</div>
      </template>
    </label>
    <battle-field-select v-model="battleField" />
    <label>
      <span>シーン</span>
      <select v-model="currentScene" v-if="isGm">
        <option :value="s.key" v-for="s in sceneList" :key="s.key">{{ s.data?.name }}</option>
      </select>
      <div class="readonly-scene" v-else>
        {{ sceneList.find(s => s.key === currentScene)?.data?.name || '' }}
      </div>
    </label>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import CycleSelect from '@/components/the-play/select/cycle-select.vue'
import BattleFieldSelect from '@/components/the-play/select/battle-field-select.vue'
import RoundSelect from '@/components/the-play/select/round-select.vue'
import ScenarioStore from '@/feature/scenario/data'
import RoomSettingStore from '@/feature/room-setting/data'
import SceneStore from '@/feature/scene/data'
import UserStore from '@/core/data/user'
import { infoDialog } from '@/core/utility/dialog'
import { PrePlotIsReady, VelocityChitBase } from '@/core/utility/shinobigamiScenario'

export default defineComponent({
  name: 'scene-status-area',
  components: { RoundSelect, BattleFieldSelect, CycleSelect },
  setup() {
    const scenarioState = ScenarioStore.injector()
    const roomSettingState = RoomSettingStore.injector()
    const limit = computed(() => scenarioState.currentScenario.sheetInfo.base.limit)
    const sceneState = SceneStore.injector()
    const sceneList = computed(() => sceneState.list)

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const cycle = ref(0)
    const round = ref(0)
    const battleField = ref(0)
    const currentScene = ref(roomSettingState.roomSetting?.sceneKey)
    const roundPhase = ref('')

    watch(() => roomSettingState.roomSetting, () => {
      cycle.value = roomSettingState.roomSetting?.cycle || 0
      round.value = roomSettingState.roomSetting?.round || 0
      battleField.value = roomSettingState.roomSetting?.battleField || 0
      currentScene.value = roomSettingState.roomSetting?.sceneKey || null
      roundPhase.value = roomSettingState.roomSetting?.isPrePlot !== 'none' ? 'プロット中' : ''
    }, { immediate: true, deep: true })

    const isPrePlot = computed(() => roomSettingState.roomSetting?.isPrePlot)
    let timeoutId: number | null = null
    watch(isPrePlot, async () => {
      let title = ''
      let text = ''
      if (isPrePlot.value === 'pre-plot') {
        title = 'プロット宣言開始'
        text = 'プロット宣言をお願いします。\n\nプレイ画面の自分のコマの下の選択肢でプロット値を入力して、決定ボタンを押してください。'
      } else if (isPrePlot.value === 'select') {
        title = 'プロット選択開始'
        text = 'プロットが公開されました。\n\nヴェロシティシステム上で、複数のプロットを行ったコマの位置を決定してください。'
      } else if (isPrePlot.value === 'none') {
        title = 'プロット決定'
        text = 'プロットが決定しました。\n\nプロットの高い人から行動どうぞ。'
      }
      if (title && text && timeoutId === null) {
        await infoDialog({ title, text })
        timeoutId = window.setTimeout(() => { timeoutId = null }, 100)
      }
    })

    watch([cycle, round, battleField, currentScene], () => {
      if (roomSettingState.roomSetting) {
        roomSettingState.roomSetting.cycle = cycle.value
        roomSettingState.roomSetting.round = round.value
        roomSettingState.roomSetting.battleField = battleField.value
        roomSettingState.roomSetting.sceneKey = currentScene.value || null
      }
    })

    const onStartPrePlot = () => {
      if (!roomSettingState.roomSetting) return
      roomSettingState.roomSetting.isPrePlot = 'pre-plot'
      const procVelocity = (data: VelocityChitBase) => {
        data.prePlotIsReady = 'none'
        data.plot = -2
        data.prePlot1 = -2
        data.prePlot2 = -2
        data.isActed = false
        data.isFumble = false
      }
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.forEach(procVelocity)
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.forEach(procVelocity)
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.forEach(procVelocity)
    }

    const onFixPrePlot = () => {
      if (!roomSettingState.roomSetting) return

      const velocityToNone = (data: VelocityChitBase) => {
        data.prePlotIsReady = 'none'
        if (data.plot === -2) {
          data.plot = data.prePlot1 > -2 ? data.prePlot1 : data.prePlot2
        }
        data.prePlot1 = -2
        data.prePlot2 = -2
      }

      roomSettingState.roomSetting.isPrePlot = 'none'
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.forEach(velocityToNone)
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.forEach(velocityToNone)
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.forEach(velocityToNone)
    }

    const onOpenPrePlot = () => {
      if (!roomSettingState.roomSetting) return
      const sheetInfo = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo
      const cl = (list?: VelocityChitBase[]) => list?.some(
        n => n.prePlot1 > -2 && n.prePlot2 > -2
      ) || false
      if (cl(sheetInfo?.pc) || cl(sheetInfo?.npc) || cl(sheetInfo?.righthand)) {
        roomSettingState.roomSetting.isPrePlot = 'select'
      } else {
        onFixPrePlot()
      }
    }

    watch([
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand
    ], () => {
      if (!isGm.value) return
      if (!roomSettingState.roomSetting) return
      const pcList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc
      const npcList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc
      const rightHandList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand
      // const isFullEq = (list: VelocityChitBase[] | undefined, prePlotIsReady: PrePlotIsReady): boolean => (list?.filter(v => v.prePlotIsReady === prePlotIsReady).length || 0) === (list?.length || 0)
      const isFullNe = (list: VelocityChitBase[] | undefined, prePlotIsReady: PrePlotIsReady): boolean => (list?.filter(v => v.prePlotIsReady !== prePlotIsReady).length || 0) === (list?.length || 0)
      const someEq = (list: VelocityChitBase[] | undefined, prePlotIsReady: PrePlotIsReady): boolean => list?.some(v => v.prePlotIsReady === prePlotIsReady) || false
      const someBothSelect = (list: VelocityChitBase[] | undefined): boolean => !list ? false : list.some(d => d.prePlot1 > -2 && d.prePlot1 !== d.plot && d.prePlot2 > -2 && d.prePlot2 !== d.plot)

      setTimeout(() => {
        if (!roomSettingState.roomSetting) return
        switch (roomSettingState.roomSetting.isPrePlot) {
          case 'pre-plot':
          case 'pre-plot-re':
            if (isFullNe(pcList, 'none')) {
              roomSettingState.roomSetting.isPrePlot = 'pre-plot-end'
            }
            break
          case 'pre-plot-end':
            if (someEq(pcList, 'none')) {
              roomSettingState.roomSetting.isPrePlot = 'pre-plot-re'
            }
            break
          case 'select':
          case 'select-re':
            if (!someBothSelect(pcList) && !someBothSelect(npcList) && !someBothSelect(rightHandList)) {
              roomSettingState.roomSetting.isPrePlot = 'select-end'
            }
            break
          case 'select-end':
            if (someBothSelect(pcList) || someBothSelect(npcList) || someBothSelect(rightHandList)) {
              roomSettingState.roomSetting.isPrePlot = 'select-re'
            }
            break
          default:
            break
        }
      })
    }, { deep: true, immediate: true })

    return {
      isGm,
      cycle,
      round,
      battleField,
      limit,
      sceneList,
      currentScene,
      roundPhase,
      isPrePlot,
      onStartPrePlot,
      onFixPrePlot,
      onOpenPrePlot
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.scene-status-area {
  @include common.flex-box(row, flex-start, center);
  gap: 0.5rem;

  > span {
    margin-left: -0.5rem;
  }

  label {
    @include common.flex-box(column, null, flex-start);
  }

  span {
    font-size: 80%;
  }

  button,
  select {
    height: 2em;
  }

  .text,
  .readonly-scene {
    height: 2em;
    @include common.flex-box(column, center, center);
  }
}
</style>

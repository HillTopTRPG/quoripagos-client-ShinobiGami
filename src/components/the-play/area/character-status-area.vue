<template>
  <div class="character-status-area">
    <template v-for="d in pcList" :key="d._characterKey">
      <div class="character-status">
        <character-chit-name
          type="pc"
          label="PC"
          :target="d._characterKey"
          :view-name="true"
          @select="onSelectChit('pc', d._characterKey)"
        />
        <template v-if="isPrePlot === 'pre-plot' || isPrePlot === 'select' || isPrePlot === 'finish'">
          <plot-select mode="plot" :readonly="d.prePlotIsReady !== 'none'" v-model="d.prePlot1" />
          <plot-select mode="plot" :readonly="d.prePlotIsReady !== 'none'" v-model="d.prePlot2" />
          <button v-if="d.prePlotIsReady !== 'none'" @click="d.prePlotIsReady = 'none'">解除</button>
          <button v-else @click="onFixPcPrePlot(d._characterKey)">決定</button>
        </template>
        <template v-if="isPrePlot === 'none'">
          <select v-model="d.isActed">
            <option disabled>行動</option>
            <option :value="false">未</option>
            <option :value="true">済</option>
          </select>
          <plot-select mode="normal" v-model="d.plot" />
          <select v-model="d.isFumble">
            <option disabled>凪</option>
            <option :value="false">通常</option>
            <option :value="true">逆凪</option>
          </select>
        </template>
      </div>
    </template>
    <template v-for="d in npcList" :key="d._characterKey">
      <div class="npc-status" v-if="!d.secretcheck">
        <character-chit-name
          type="npc"
          label="NPC"
          :target="d._characterKey"
          :view-name="true"
          @select="onSelectChit('npc', d._characterKey)"
        />
        <template v-if="isPrePlot === 'pre-plot' || isPrePlot === 'select' || isPrePlot === 'finish'">
          <plot-select mode="plot" :readable="isGm" v-model="d.prePlot1" />
          <plot-select mode="plot" :readable="isGm" v-model="d.prePlot2" />
        </template>
        <template v-if="isPrePlot === 'none'">
          <select v-model="d.isActed">
            <option disabled>行動</option>
            <option :value="false">未</option>
            <option :value="true">済</option>
          </select>
          <plot-select mode="normal" v-model="d.plot" />
          <select v-model="d.isFumble">
            <option disabled>凪</option>
            <option :value="false">通常</option>
            <option :value="true">逆凪</option>
          </select>
        </template>
      </div>
    </template>
    <template v-for="d in rightHandList" :key="d._characterKey">
      <div class="npc-status" v-if="!d._secretCheck">
        <character-chit-name
          type="right-hand"
          label="腹心"
          :target="d._characterKey"
          :view-name="true"
          @select="onSelectChit('right-hand', d._characterKey)"
        />
        <template v-if="isPrePlot === 'pre-plot' || isPrePlot === 'select' || isPrePlot === 'finish'">
          <plot-select mode="plot" :readable="isGm" v-model="d.prePlot1" />
          <plot-select mode="plot" :readable="isGm" v-model="d.prePlot2" />
        </template>
        <template v-if="isPrePlot === 'none'">
          <select v-model="d.isActed">
            <option disabled>行動</option>
            <option :value="false">未</option>
            <option :value="true">済</option>
          </select>
          <plot-select mode="normal" v-model="d.plot" />
          <select v-model="d.isFumble">
            <option disabled>凪</option>
            <option :value="false">通常</option>
            <option :value="true">逆凪</option>
          </select>
        </template>
      </div>
    </template>
    <template v-for="(e, idx) in enigmaList" :key="`${idx}-${e.name}`">
      <div class="enigma-status">
        <character-chit-name
          type="enigma"
          label="エニグマ"
          :target="e.name"
          :view-name="true"
          @select="onSelectChit('enigma', e.name)"
        />
      </div>
    </template>
    <button class="plot-button" v-if="isGm && isPrePlot === 'none'" @click="onStartPrePlot()">プロット<br />開始</button>
    <button class="plot-button" v-if="isGm && isPrePlot === 'select'" @click="onOpenPrePlot()">プロット<br />公開<br />影分身{{ bothSelectNum }}</button>
    <button class="plot-button" v-if="isGm && isPrePlot === 'finish'" @click="onFixPrePlot()">プロット<br />公開<br />影分身{{ bothSelectNum }}</button>
    <button class="plot-button" v-if="isGm && isPrePlot === 'finished'" @click="onFixPrePlot()">プロット<br />決定</button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, watch, ref } from 'vue'
import CharacterStore from '@/feature/character/data'
import ScenarioStore from '@/feature/scenario/data'
import RoomSettingStore from '@/feature/room-setting/data'
import UserStore from '@/core/data/user'
import PlotSelect from '@/components/the-play/select/plot-select.vue'
import CharacterChitName from '@/feature/character/character-chit-name.vue'
import { infoDialog } from '@/core/utility/dialog'
import { PrePlotIsReady, VelocityChitBase } from '@/core/utility/shinobigamiScenario'

export default defineComponent({
  name: 'character-status-area',
  components: { CharacterChitName, PlotSelect },
  setup() {
    const characterState = CharacterStore.injector()

    const scenarioState = ScenarioStore.injector()
    const pcList = computed(() => scenarioState.currentScenario.sheetInfo.pc)
    const npcList = computed(() => scenarioState.currentScenario.sheetInfo.npc)
    const rightHandList = computed(() => scenarioState.currentScenario.sheetInfo.righthand)
    const enigmaList = computed(() => scenarioState.currentScenario.sheetInfo.enigma)
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const roomSettingState = RoomSettingStore.injector()

    const onSelectChit = (type: string, target: string) => {
      const elmId = `${type}-detail-${target}`
      document.getElementById(elmId)?.scrollIntoView(true)
    }

    const isPrePlot = computed(() => roomSettingState.roomSetting?.isPrePlot)
    watch(isPrePlot, async () => {
      if (isPrePlot.value === 'pre-plot') {
        await infoDialog({
          title: 'プロット宣言開始',
          text: 'プロット宣言をお願いします。\n\nプレイ画面の自分のコマの下の選択肢でプロット値を入力して、決定ボタンを押してください。'
        })
      } else if (isPrePlot.value === 'selecting') {
        await infoDialog({
          title: 'プロット選択開始',
          text: 'プロットが公開されました。\n\nヴェロシティシステム上で、複数のプロットを行ったコマの位置を決定してください。'
        })
      } else if (isPrePlot.value === 'none') {
        await infoDialog({
          title: 'プロット決定',
          text: 'プロットが決定しました。\n\nプロットの高い人から行動どうぞ。'
        })
      }
    })

    const bothSelectNum = ref(0)

    watch([
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand
    ], () => {
      const pcList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc
      const npcList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc
      const rightHandList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand
      if (!roomSettingState.roomSetting) return
      const isFullEq = (list: VelocityChitBase[] | undefined, prePlotIsReady: PrePlotIsReady): boolean => (list?.filter(v => v.prePlotIsReady === prePlotIsReady).length || 0) === (list?.length || 0)
      const isFullNe = (list: VelocityChitBase[] | undefined, prePlotIsReady: PrePlotIsReady): boolean => (list?.filter(v => v.prePlotIsReady !== prePlotIsReady).length || 0) === (list?.length || 0)
      const someEq = (list: VelocityChitBase[] | undefined, prePlotIsReady: PrePlotIsReady): boolean => list?.some(v => v.prePlotIsReady === prePlotIsReady) || false
      const someBothSelect = (list: VelocityChitBase[] | undefined): boolean => !list ? false : list.some(d => d.prePlot1 > -2 && d.prePlot2 > -2)
      const getBothSelectNum = (list: VelocityChitBase[] | undefined): number => !list ? 0 : list.filter(d => d.prePlot1 > -2 && d.prePlot2 > -2).length

      bothSelectNum.value = getBothSelectNum(pcList) + getBothSelectNum(npcList) + getBothSelectNum(rightHandList)

      switch (roomSettingState.roomSetting.isPrePlot) {
        case 'pre-plot':
          if (isFullNe(pcList, 'none')) {
            if (someEq(pcList, 'select') || someBothSelect(npcList) || someBothSelect(rightHandList)) {
              roomSettingState.roomSetting.isPrePlot = 'select'
            } else {
              roomSettingState.roomSetting.isPrePlot = 'finish'
            }
          }
          break
        case 'select':
        // eslint-disable-next-line no-fallthrough
        case 'finish':
          if (someEq(pcList, 'none')) {
            roomSettingState.roomSetting.isPrePlot = 'pre-plot'
          }
          if (someEq(pcList, 'select') || someBothSelect(npcList) || someBothSelect(rightHandList)) {
            roomSettingState.roomSetting.isPrePlot = 'select'
          } else {
            roomSettingState.roomSetting.isPrePlot = 'finish'
          }
          break
        case 'selecting':
          pcList?.forEach(d => console.log('PC', d.name, d.prePlotIsReady))
          npcList?.forEach(d => console.log('NPC', d.name, d.prePlotIsReady))
          rightHandList?.forEach(d => console.log('腹心', d.name, d.prePlotIsReady))
          if (
            isFullEq(pcList, 'finished') &&
            isFullEq(npcList, 'finished') &&
            isFullEq(rightHandList, 'finished')
          ) {
            roomSettingState.roomSetting.isPrePlot = 'finished'
          }
          break
        default:
          break
      }
    }, { deep: true })

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

    const onOpenPrePlot = () => {
      if (!roomSettingState.roomSetting) return
      roomSettingState.roomSetting.isPrePlot = 'selecting'
      const procVelocity = (data: VelocityChitBase) => {
        if (data.prePlotIsReady === 'none' && !(data.prePlot1 > -2 && data.prePlot2 > -2)) {
          data.prePlotIsReady = 'finished'
          data.plot = data.prePlot1 === -2 ? data.prePlot2 : data.prePlot1
        }
      }
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.forEach(procVelocity)
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.forEach(procVelocity)
    }

    const onFixPrePlot = () => {
      if (!roomSettingState.roomSetting) return
      roomSettingState.roomSetting.isPrePlot = 'none'
      const procVelocity = (data: VelocityChitBase) => {
        if (data.prePlotIsReady !== 'finished') {
          data.plot = data.prePlot1 > -2 ? data.prePlot1 : data.prePlot2
        }
      }
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.forEach(procVelocity)
      scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.forEach(procVelocity)
    }

    const onFixPcPrePlot = (target: string) => {
      const pc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.find(p => p._characterKey === target)
      if (!pc) return
      if (pc.prePlot1 > -2 && pc.prePlot2 > -2) {
        pc.prePlotIsReady = 'select'
      } else {
        pc.prePlotIsReady = 'finished'
        pc.plot = pc.prePlot1 > -2 ? pc.prePlot1 : pc.prePlot2
      }
    }

    return {
      characterList: characterState.makeWrapCharacterList(),
      pcList,
      npcList,
      rightHandList,
      enigmaList,
      onSelectChit,
      getChitStatus: (type: 'pc' | 'npc' | 'right-hand' | 'enigma', target: string) => scenarioState.getChitStatus(type, target, userState.selfUser?.key || ''),
      isGm,
      isPrePlot,
      onOpenPrePlot,
      onFixPrePlot,
      onStartPrePlot,
      onFixPcPrePlot,
      bothSelectNum
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.chit:deep() {
  cursor: pointer;
}

button.plot-button {
  align-self: flex-start;
}

.character-status-area {
  @include common.flex-box(row);
  max-width: 100vw;
  overflow-x: auto;
  gap: 0 0.2rem;

  .character-status,
  .npc-status,
  .enigma-status {
    min-width: 3em;
    width: 5em;
    overflow: hidden;
    position: relative;
    @include common.flex-box(column, null, stretch);

    select {
      height: 2em;
    }
  }
}
</style>

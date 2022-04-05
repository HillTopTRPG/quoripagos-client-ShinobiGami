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
        <template v-if="isPrePlot === 'pre-plot' || isPrePlot === 'pre-plot-re' || isPrePlot === 'pre-plot-end'">
          <template v-if="(isGm && !d._userKey) || getChitStatus('pc', d._characterKey).isOwn">
            <plot-select mode="plot" v-model="d.prePlot1" />
            <plot-select mode="plot" v-model="d.prePlot2" default-text="未使用" />
            <button v-if="d.prePlotIsReady !== 'none'" @click="d.prePlotIsReady = 'none'">決定解除</button>
            <button v-else @click="onFixPcPrePlot(d._characterKey)">決定</button>
          </template>
          <template v-else>
            <span>{{ d.prePlotIsReady !== 'none' ? '決定済' : 'プロット中' }}</span>
            <template v-if="isGm">
              <button v-if="d.prePlotIsReady !== 'none'" @click="d.prePlotIsReady = 'none'">強制解除</button>
              <button v-else @click="onFixPcPrePlot(d._characterKey)">強制決定</button>
            </template>
          </template>
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
        <template v-if="isPrePlot === 'pre-plot' || isPrePlot === 'pre-plot-re' || isPrePlot === 'pre-plot-end'">
          <template v-if="isGm">
            <plot-select mode="plot" v-model="d.prePlot1" />
            <plot-select mode="plot" v-model="d.prePlot2" default-text="未使用" />
          </template>
          <template v-else>
            <span>{{ d.prePlot1 > -2 || d.prePlot2 > -2 ? '決定済' : 'プロット中' }}</span>
          </template>
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
        <template v-if="isPrePlot === 'pre-plot' || isPrePlot === 'pre-plot-re' || isPrePlot === 'pre-plot-end'">
          <template v-if="isGm">
            <plot-select mode="plot" v-model="d.prePlot1" />
            <plot-select mode="plot" v-model="d.prePlot2" default-text="未使用" />
          </template>
          <template v-else>
            <span>{{ d.prePlot1 > -2 || d.prePlot2 > -2 ? '決定済' : 'プロット中' }}</span>
          </template>
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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import CharacterStore from '@/feature/character/data'
import ScenarioStore from '@/feature/scenario/data'
import RoomSettingStore from '@/feature/room-setting/data'
import UserStore from '@/core/data/user'
import PlotSelect from '@/components/the-play/select/plot-select.vue'
import CharacterChitName from '@/feature/character/character-chit-name.vue'

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

    const onFixPcPrePlot = (target: string) => {
      const pc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.find(p => p._characterKey === target)
      if (!pc) return
      pc.prePlotIsReady = 'selected'
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
      onFixPcPrePlot
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

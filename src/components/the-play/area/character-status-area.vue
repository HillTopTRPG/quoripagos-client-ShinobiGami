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
        <select v-model="d.isActed">
          <option disabled>行動</option>
          <option :value="false">未</option>
          <option :value="true">済</option>
        </select>
        <plot-select v-model="d.plot" />
        <select v-model="d.isFumble">
          <option disabled>凪</option>
          <option :value="false">通常</option>
          <option :value="true">逆凪</option>
        </select>
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
        <select v-model="d.isActed">
          <option disabled>行動</option>
          <option :value="false">未</option>
          <option :value="true">済</option>
        </select>
        <plot-select v-model="d.plot" />
        <select v-model="d.isFumble">
          <option disabled>凪</option>
          <option :value="false">通常</option>
          <option :value="true">逆凪</option>
        </select>
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
        <select v-model="d.isActed">
          <option disabled>行動</option>
          <option :value="false">未</option>
          <option :value="true">済</option>
        </select>
        <plot-select v-model="d.plot" />
        <select v-model="d.isFumble">
          <option disabled>凪</option>
          <option :value="false">通常</option>
          <option :value="true">逆凪</option>
        </select>
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

    const onSelectChit = (type: string, target: string) => {
      const elmId = `${type}-detail-${target}`
      document.getElementById(elmId)?.scrollIntoView(true)
    }

    return {
      characterList: characterState.makeWrapCharacterList(),
      pcList,
      npcList,
      rightHandList,
      enigmaList,
      onSelectChit,
      getChitStatus: (type: 'pc' | 'npc' | 'right-hand' | 'enigma', target: string) => scenarioState.getChitStatus(type, target, userState.selfUser?.key || ''),
      isGm
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.chit:deep() {
  cursor: pointer;
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

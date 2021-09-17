<template>
  <div class="character-status-area">
    <template v-for="c in characterList" :key="c.key">
      <div class="character-status" v-if="c.data">
        <character-chit-name type="PC" :character="c.data" :view-name="true" :name="c.data.sheetInfo.characterName" />
        <select v-model="c.data.isActed">
          <option disabled>行動</option>
          <option :value="false">未</option>
          <option :value="true">済</option>
        </select>
        <plot-select v-model="c.data.plot" />
        <select v-model="c.data.isFumble">
          <option disabled>凪</option>
          <option :value="false">通常</option>
          <option :value="true">逆凪</option>
        </select>
      </div>
    </template>
    <template v-for="(n, idx) in npcList" :key="`${idx}-${n.name}`">
      <div class="npc-status" v-if="isGm || !n.secretcheck">
        <character-chit-name type="NPC" :character="n" :view-name="true" :name="n.name" />
        <select v-model="n.isActed">
          <option disabled>行動</option>
          <option :value="false">未</option>
          <option :value="true">済</option>
        </select>
        <plot-select v-model="n.plot" />
        <select v-model="n.isFumble">
          <option disabled>凪</option>
          <option :value="false">通常</option>
          <option :value="true">逆凪</option>
        </select>
      </div>
    </template>
    <template v-for="(e, idx) in enigmaList" :key="`${idx}-${e.name}`">
      <div class="enigma-status">
        <character-chit-name type="エニグマ" :character="e" :view-name="true" :name="e.name" />
        <select v-model="e.open">
          <option :value="false">非公開</option>
          <option :value="true">公開</option>
        </select>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import CharacterStore, { CharacterBase } from '@/feature/character/data'
import ScenarioStore from '@/feature/scenario/data'
import MediaListStore from '@/feature/media-list/data'
import UserStore from '@/core/data/user'
import PlotSelect from '@/components/the-play/select/plot-select.vue'
import CharacterChitName from '@/feature/character/character-chit-name.vue'

export default defineComponent({
  name: 'character-status-area',
  components: { CharacterChitName, PlotSelect },
  setup() {
    const characterState = CharacterStore.injector()
    const mediaListState = MediaListStore.injector()

    const scenarioState = ScenarioStore.injector()
    const npcList = computed(() => scenarioState.currentScenario.sheetInfo.npc)
    const enigmaList = computed(() => scenarioState.currentScenario.sheetInfo.enigma)
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getStyleObj = (c: CharacterBase | undefined): any => {
      if (!c || !c.chitImageList || !c.standImageList) return null
      const chitImageUrl = mediaListState.list.find(m => m.key === c.chitImageList[c.currentChitImage])?.data?.url
      const standImageUrl = mediaListState.list.find(m => m.key === c.standImageList[c.currentStandImage])?.data?.url
      return {
        '--color': c.color,
        '--chit-image': chitImageUrl ? `url('${chitImageUrl}')` : '',
        '--stand-image': standImageUrl ? `url('${standImageUrl}')` : ''
      }
    }

    return {
      getStyleObj,
      characterList: characterState.makeWrapCharacterList(),
      npcList,
      enigmaList,
      isGm
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

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

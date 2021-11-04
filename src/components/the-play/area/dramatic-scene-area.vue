<template>
  <template v-for="c in characterList" :key="c.key">
    <transition name="character-fade">
      <character-chit-name
        type="PC"
        :character="c.data"
        :view-name="false"
        :name="c.data.sheetInfo.characterName"
        v-if="c.data && c.data.plot === -1"
      />
    </transition>
  </template>
  <template v-for="(n, idx) in npcList" :key="`${idx}-${n.name}`">
    <transition name="character-fade">
      <character-chit-name
        type="NPC"
        :character="n"
        :view-name="false"
        :name="n.sheetInfo ? n.sheetInfo.characterName : n.name"
        v-if="n && n.plot === -1 && !n.secretcheck"
      />
    </transition>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import CharacterStore from '@/feature/character/data'
import ScenarioStore from '@/feature/scenario/data'
import UserStore from '@/core/data/user'
import CharacterChitName from '@/feature/character/character-chit-name.vue'

export default defineComponent({
  name: 'dramatic-scene-area',
  components: { CharacterChitName },
  setup() {
    const characterState = CharacterStore.injector()

    const scenarioState = ScenarioStore.injector()
    const npcList = computed(() => scenarioState.currentScenario.sheetInfo.npc)
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      characterList: characterState.makeWrapCharacterList(),
      npcList,
      isGm
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.character-fade-leave-active, .character-fade-enter-active {
  transition: opacity .5s;
}
.character-fade-leave-to, .character-fade-enter-from /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>

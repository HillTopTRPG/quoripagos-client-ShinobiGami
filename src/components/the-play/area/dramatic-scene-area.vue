<template>
  <template v-for="c in pcList" :key="c._characterKey">
    <transition name="character-fade">
      <character-chit-name
        type="pc"
        label="PC"
        :target="c._characterKey"
        :view-name="false"
        v-if="c.plot === -1"
      />
    </transition>
  </template>
  <template v-for="n in npcList" :key="n._characterKey">
    <transition name="character-fade">
      <character-chit-name
        type="npc"
        label="NPC"
        :target="n._characterKey"
        :view-name="false"
        v-if="n.plot === -1 && !n.secretcheck"
      />
    </transition>
  </template>
  <template v-for="r in rightHandList" :key="r._characterKey">
    <transition name="character-fade">
      <character-chit-name
        type="right-hand"
        label="腹心"
        :target="r._characterKey"
        :view-name="false"
        v-if="r.plot === -1 && !r._secretCheck"
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
    const pcList = computed(() => scenarioState.currentScenario.sheetInfo.pc)
    const npcList = computed(() => scenarioState.currentScenario.sheetInfo.npc)
    const rightHandList = computed(() => scenarioState.currentScenario.sheetInfo.righthand)
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      characterList: characterState.makeWrapCharacterList(),
      pcList,
      npcList,
      rightHandList,
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

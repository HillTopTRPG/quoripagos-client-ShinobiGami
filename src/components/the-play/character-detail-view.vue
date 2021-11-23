<template>
    <transition name="character-fade">
      <div
        class="character-detail-view"
        :id="elmId"
        :style="{ '--color': scenarioData?.color }"
        v-if="sheetInfoWrap"
      >
        <div class="header">
          <div class="main">
            <h2>
              <ruby>
                {{ sheetInfoWrap?.characterName }}
                <rp>（</rp>
                <rt>{{ sheetInfoWrap?.characterNameKana }}</rt>
                <rp>）</rp>
              </ruby>
            </h2>
            <div class="player">{{ sheetInfoWrap?.playerName }}</div>
          </div>
          <div class="other">
            <div class="style">{{ sheetInfoWrap?.upperStyle }} - {{ sheetInfoWrap?.subStyle || '上位流派' }} - {{ sheetInfoWrap?.level }}</div>
            <div class="style-rule">{{ sheetInfoWrap?.stylerule }}</div>
            <div class="personal">{{ sheetInfoWrap?.belief }} - {{ sheetInfoWrap?.cover }} - {{ sheetInfoWrap?.age }} - {{ sheetInfoWrap?.sex }}</div>
          </div>
        </div>
        <div class="backgrounds">
          <div class="background" v-for="(bg, idx) in sheetInfoWrap?.backgroundList" :key="idx">{{ bg.name }}</div>
        </div>

        <div class="part-wrap">
          <skill-table-set
            :type="type"
            :target="target"
            @clearArts="onClearArts()"
            :target-arts="selectedNinjaArtsIndex !== null ? sheetInfoWrap?.ninjaArtsList[selectedNinjaArtsIndex]?.name || null : null"
            v-model:other-character-key="otherCharacterKey"
            v-model:target-skill="targetSkill"
          />
        </div>
        <div class="part-wrap">
          <ninja-arts-table
            :type="type"
            :target="target"
            mode="normal"
            v-model:select-index="selectedNinjaArtsIndex"
          />
        </div>
      </div>
    </transition>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import CharacterStore from '@/feature/character/data'
import SkillTableSet from '@/components/shinobi-gami/skill-table-set.vue'
import NinjaArtsTable from '@/components/shinobi-gami/ninja-arts-table.vue'
import { ShinobiGami, SkillTable } from '@/core/utility/shinobigami'
import { ActorBase } from '@/core/utility/shinobigamiScenario'
import ScenarioStore from '@/feature/scenario/data'

export default defineComponent({
  name: 'character-detail-view',
  components: { NinjaArtsTable, SkillTableSet },
  props: {
    type: {
      type: String as PropType<'pc' | 'npc' | 'right-hand'>,
      required: true
    },
    target: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const characterState = CharacterStore.injector()
    const scenarioState = ScenarioStore.injector()
    const elmId = computed(() => `${props.type}-detail-${props.target}`)

    const scenarioData = ref<ActorBase | null>(null)
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand
    ], () => {
      if (props.type === 'pc') {
        scenarioData.value = scenarioState.currentScenario.sheetInfo.pc.find(d => d._characterKey === props.target) || null
      } else if (props.type === 'npc') {
        scenarioData.value = scenarioState.currentScenario.sheetInfo.npc.find(d => d._characterKey === props.target) || null
      } else if (props.type === 'right-hand') {
        scenarioData.value = scenarioState.currentScenario.sheetInfo.righthand.find(d => d._characterKey === props.target) || null
      } else {
        scenarioData.value = null
      }
    }, { immediate: true, deep: true })

    const sheetInfoWrap = ref<ShinobiGami | null>(null)
    watch(() => characterState.characterList.find(c => c.key === props.target)?.data?.sheetInfo, (data) => {
      sheetInfoWrap.value = data || null
    }, { immediate: true, deep: true })

    const selectedNinjaArtsIndex = ref<number | null>(null)
    const targetSkill = ref<string | null>(null)
    const otherCharacterKey = ref<string | null>(null)

    watch(selectedNinjaArtsIndex, () => {
      if (selectedNinjaArtsIndex.value === null) {
        targetSkill.value = null
        return
      }
      const targetSkillRaw = sheetInfoWrap.value?.ninjaArtsList[selectedNinjaArtsIndex.value || 0]?.targetSkill
      if (SkillTable.flatMap(tt => tt).some(t => t === targetSkillRaw)) {
        targetSkill.value = targetSkillRaw || null
      } else {
        targetSkill.value = null
      }
    })

    return {
      elmId,
      scenarioData,
      sheetInfoWrap,
      selectedNinjaArtsIndex,
      targetSkill,
      otherCharacterKey,
      onClearArts: () => {
        selectedNinjaArtsIndex.value = null
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

.character-fade-leave-active, .character-fade-enter-active {
  transition: opacity .5s;
}
.character-fade-leave-to, .character-fade-enter-from /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.header {
  @include common.flex-box(row, flex-start, center, wrap);
  gap: 0.5rem;
  width: 100%;
  background-color: var(--color);
  color: white;

  h2 {
    margin: 0;
    padding: 0;
    text-align: left;
    font-size: 1.3em;
    flex: 1;
    white-space: nowrap;

    &.style {
      font-size: 1em;
    }
  }

  .main {
    flex: 1;
    max-width: 100%;
    @include common.flex-box(column, flex-start, center);

    > * {
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      max-width: 100%;
    }
  }

  .other {
    @include common.flex-box(column, flex-start, center);
    > * {
      text-align: left;
      font-size: 1em;
    }
  }
}

.backgrounds {
  @include common.flex-box(row, flex-start, center, wrap);
  gap: 0.5rem;
  width: 100%;

  .background {
    border: 1px solid gray;
    border-radius: 5px;
    padding: 0 0.5rem;
  }
}

.part-wrap {
  max-width: 100%;
  overflow-x: auto;
}

.character-detail-view {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5em;
}
</style>

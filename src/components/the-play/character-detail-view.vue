<template>
    <transition name="character-fade">
      <div
        class="character-detail-view"
        :id="elmId"
        :style="{ '--color': scenarioData?.color }"
        v-if="type === 'enigma' || sheetInfoWrap"
      >
        <div class="header">
          <div class="main">
            <h2>
              <ruby v-if="type === 'pc'">
                {{ sheetInfoWrap?.characterName }}
                <rp>（</rp>
                <rt>{{ sheetInfoWrap?.characterNameKana }}</rt>
                <rp>）</rp>
              </ruby>
              <template v-else>{{ scenarioData.name }}</template>
            </h2>
            <div class="player">{{ ownerName }}</div>
          </div>
          <div class="other" v-if="type === 'pc' || scenarioData._hasSheet">
            <div class="style">{{ sheetInfoWrap?.upperStyle }} - {{ sheetInfoWrap?.subStyle || '上位流派' }} - {{ sheetInfoWrap?.level }}</div>
            <div class="style-rule">{{ sheetInfoWrap?.stylerule }}</div>
            <div class="personal">{{ sheetInfoWrap?.belief }} - {{ sheetInfoWrap?.cover }} - {{ sheetInfoWrap?.age }} - {{ sheetInfoWrap?.sex }}</div>
          </div>
        </div>

        <div class="part-wrap first">
          <scenario-pc v-if="type === 'pc'" :target="target" mode="detail" />
          <scenario-npc v-if="type === 'npc'" :target="target" mode="detail" />
          <scenario-right-hand v-if="type === 'right-hand'" :target="target" mode="detail" />
          <scenario-enigma v-if="type === 'enigma'" :target="target" mode="detail" />
        </div>

        <template v-if="type === 'pc' || scenarioData._hasSheet">

          <div class="backgrounds">
            <div class="background" v-for="(bg, idx) in sheetInfoWrap?.backgroundList" :key="idx">{{ bg.name }}</div>
          </div>

          <div class="part-wrap">
            <skill-table-set
              :id="`${elmId}-skill`"
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
          <div
            class="part-wrap"
            v-if="isGm || isOwn || sheetInfoWrap?.specialArtsList.some(sa => sa._openList.some(od => yourPcCharacterKeyList.some(cKey => cKey === od)))"
          >
            <special-arts-table
              :type="type"
              :target="target"
              mode="normal"
            />
          </div>
          <div class="part-wrap" v-if="isGm || isOwn">
            <ninja-tool-table
              :type="type"
              :target="target"
              mode="normal"
            />
          </div>
        </template>
      </div>
    </transition>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import CharacterStore from '@/feature/character/data'
import UserStore from '@/core/data/user'
import SkillTableSet from '@/components/shinobi-gami/skill-table-set.vue'
import NinjaArtsTable from '@/components/shinobi-gami/ninja-arts-table.vue'
import { ShinobiGami, SkillTable } from '@/core/utility/shinobigami'
import { ActorBase } from '@/core/utility/shinobigamiScenario'
import ScenarioStore from '@/feature/scenario/data'
import ScenarioPc from '@/feature/scenario/scenario-pc.vue'
import ScenarioRightHand from '@/feature/scenario/scenario-right-hand.vue'
import ScenarioNpc from '@/feature/scenario/scenario-npc.vue'
import SpecialArtsTable from '@/components/shinobi-gami/special-arts-table.vue'
import NinjaToolTable from '@/components/shinobi-gami/ninja-tool-table.vue'
import ScenarioEnigma from '@/feature/scenario/scenario-enigma.vue'

export default defineComponent({
  name: 'character-detail-view',
  components: { ScenarioEnigma, NinjaToolTable, SpecialArtsTable, ScenarioNpc, ScenarioRightHand, ScenarioPc, NinjaArtsTable, SkillTableSet },
  props: {
    type: {
      type: String as PropType<'pc' | 'npc' | 'right-hand' | 'enigma'>,
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
    const userState = UserStore.injector()

    const ownerName = ref('')

    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = ref(false)

    const scenarioData = ref<ActorBase | null>(null)
    const yourPcCharacterKeyList = ref<string[]>([])
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma
    ], () => {
      const { isOwn: isOwnRaw } = scenarioState.getChitStatus(
        props.type,
        props.target,
        userState.selfUser?.key || null
      )
      isOwn.value = isOwnRaw
      if (props.type === 'pc') {
        const pc = scenarioState.currentScenario.sheetInfo.pc.find(d => d._characterKey === props.target) || null
        const user = userState.userList.find(u => u.key === pc?._userKey)
        ownerName.value = `PC ${pc?.name} - ${user?.name || '[担当ユーザーなし]'}`
        scenarioData.value = pc
      } else if (props.type === 'npc') {
        scenarioData.value = scenarioState.currentScenario.sheetInfo.npc.find(d => d._characterKey === props.target) || null
        ownerName.value = 'NPC'
      } else if (props.type === 'right-hand') {
        scenarioData.value = scenarioState.currentScenario.sheetInfo.righthand.find(d => d._characterKey === props.target) || null
        ownerName.value = '腹心'
      } else if (props.type === 'enigma') {
        scenarioData.value = scenarioState.currentScenario.sheetInfo.enigma.find(d => d.name === props.target) || null
        ownerName.value = 'エニグマ'
      } else {
        scenarioData.value = null
        ownerName.value = ''
      }
      yourPcCharacterKeyList.value = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc
        .filter(p => p._userKey === userState.selfUser?.key)
        .map(p => p._characterKey) || []
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
      isGm,
      isOwn,
      yourPcCharacterKeyList,
      elmId,
      scenarioData,
      ownerName,
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
  @include common.flex-box(row, flex-start, center);
  overflow: hidden;
  gap: 0.5rem;
  width: 100%;
  background-color: var(--color);
  color: white;
  position: sticky;
  top: 0;
  z-index: 10000;
  height: 5rem;

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
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }
}

.backgrounds {
  @include common.flex-box(row, flex-start, center, wrap);
  gap: 0.5rem;
  width: 100%;

  .background {
    box-shadow: rgba(0, 0, 0, 0.05) 0 6px 24px 0, rgba(0, 0, 0, 0.08) 0 0 0 1px;
    border-radius: 5px;
    padding: 0 0.5rem;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.7);
  }
}

@include common.deep("h2") {
  margin-bottom: -0.5rem;
}

.character-detail-view .part-wrap {
  @include common.inline-flex-box(column, flex-start, flex-start);
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  overflow: auto;
  gap: 0.5rem;

  &:not(.first) {
    margin-top: -5rem;
    pointer-events: none;

    :deep(> *) {
      padding-top: 5rem;
    }
    &:deep(> * > *) {
      pointer-events: all;
    }
  }
}

.character-detail-view {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5rem;
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  padding-bottom: 0.5rem;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: var(--color);
    opacity: 0.1;
    z-index: -1;
  }

  &:last-child {
    margin-bottom: calc(100vh - 5rem - 0.5rem - #{common.$header-height});
  }
}
</style>

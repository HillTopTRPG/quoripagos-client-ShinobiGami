<template>
  <div class="velocity-column" v-for="(v, idx) in velocity" :key="v">
    <div class="label">
      <span class="k">{{ v.k }}</span>
      <span class="a">{{ v.a }}</span>
      <span class="e">{{ v.e }}</span>
    </div>
    <div class="field">
      <template v-for="p in pcList" :key="p._characterKey">
        <transition name="character-fade">
          <character-chit-name
            type="pc"
            label="PC"
            :target="p._characterKey"
            :view-name="false"
            v-if="!p.isFumble && ((isPrePlot === 'none' && p.plot === idx) || ((isPrePlot === 'select' || isPrePlot === 'select-re' || isPrePlot === 'select-end') && (p.prePlot1 === idx || p.prePlot2 === idx)))"
            :plot="idx"
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
            v-if="!n.isFumble && !n.secretcheck && ((isPrePlot === 'none' && n.plot === idx) || ((isPrePlot === 'select' || isPrePlot === 'select-re' || isPrePlot === 'select-end') && (n.prePlot1 === idx || n.prePlot2 === idx)))"
            :plot="idx"
          />
        </transition>
      </template>
      <template v-for="n in rightHandList" :key="n._characterKey">
        <transition name="character-fade">
          <character-chit-name
            type="right-hand"
            label="腹心"
            :target="n._characterKey"
            :view-name="false"
            v-if="!n.isFumble && ((isPrePlot === 'none' && n.plot === idx) || ((isPrePlot === 'select' || isPrePlot === 'select-re' || isPrePlot === 'select-end') && (n.prePlot1 === idx || n.prePlot2 === idx)))"
            :plot="idx"
          />
        </transition>
      </template>
      <span class="n">{{ idx }}</span>
    </div>
    <div class="fumble">
      <template v-for="p in pcList" :key="`${p._characterKey}-fumble`">
        <transition name="character-fade">
          <character-chit-name
            type="pc"
            label="PC"
            :target="p._characterKey"
            :view-name="false"
            v-if="p.isFumble && ((isPrePlot=== 'none' && p.plot === idx) || ((isPrePlot === 'select' || isPrePlot === 'select-re' || isPrePlot === 'select-end') && (p.prePlot1 === idx || p.prePlot2 === idx)))"
            :plot="idx"
          />
        </transition>
      </template>
      <template v-for="n in npcList" :key="`${n._characterKey}-fumble`">
        <transition name="character-fade">
          <character-chit-name
            type="npc"
            label="NPC"
            :target="n._characterKey"
            :view-name="false"
            v-if="n.isFumble && !n.secretcheck && ((isPrePlot === 'none' && n.plot === idx) || ((isPrePlot === 'select' || isPrePlot === 'select-re' || isPrePlot === 'select-end') && (n.prePlot1 === idx || n.prePlot2 === idx)))"
            :plot="idx"
          />
        </transition>
      </template>
      <template v-for="n in rightHandList" :key="`${n._characterKey}-fumble`">
        <transition name="character-fade">
          <character-chit-name
            type="right-hand"
            label="腹心"
            :target="n._characterKey"
            :view-name="false"
            v-if="n.isFumble && ((isPrePlot === 'none' && n.plot === idx) || ((isPrePlot === 'select' || isPrePlot === 'select-re' || isPrePlot === 'select-end') && (n.prePlot1 === idx || n.prePlot2 === idx)))"
            :plot="idx"
          />
        </transition>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from 'vue'
import CharacterStore from '@/feature/character/data'
import ScenarioStore from '@/feature/scenario/data'
import UserStore from '@/core/data/user'
import CharacterChitName from '@/feature/character/character-chit-name.vue'
import RoomSettingStore from '@/feature/room-setting/data'

type VelocityColumn = { k: string; a: string; e: string }
type Velocity = VelocityColumn[]

export default defineComponent({
  name: 'velocity-column',
  components: { CharacterChitName },
  emits: ['update:modelValue'],
  setup() {
    const characterState = CharacterStore.injector()

    const velocity = reactive<Velocity>([
      { k: '零', a: '静止した時間', e: 'Mundain' },
      { k: '壱', a: '幽霊歩き', e: 'Ghost Walk' },
      { k: '弐', a: '影走', e: 'Shadow Run' },
      { k: '参', a: '思考速度', e: 'Neuro Speed' },
      { k: '肆', a: '音速', e: 'Sonic Speed' },
      { k: '伍', a: '弾速', e: 'Bullet Speed' },
      { k: '陸', a: '光速', e: 'Light Speed' },
      { k: '死地', a: '超光速', e: 'F.T.L.' }
    ])

    const scenarioState = ScenarioStore.injector()
    const roomSettingState = RoomSettingStore.injector()

    const isPrePlot = computed(() => roomSettingState.roomSetting?.isPrePlot)

    const pcList = computed(() => scenarioState.currentScenario.sheetInfo.pc)
    const npcList = computed(() => scenarioState.currentScenario.sheetInfo.npc)
    const rightHandList = computed(() => scenarioState.currentScenario.sheetInfo.righthand)
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      characterList: characterState.makeWrapCharacterList(),
      velocity,
      pcList,
      npcList,
      rightHandList,
      isGm,
      isPrePlot
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

.velocity-column {
  flex: 1;
  @include common.flex-box(column);
  box-sizing: border-box;
  min-width: 3em;

  > * {
    &:last-child {
      margin-bottom: 3px;
    }
  }

  &:first-child .label,
  &:last-child .label {
    background-color: rgba(0, 0, 0, 0.5);
    color: white;

    > .e,
    > .a {
      color: white;
    }
  }

  .label {
    background-color: rgba(255, 255, 255, 0.5);
    @include common.flex-box(column, null, flex-srart);
    box-sizing: border-box;
    height: 4em;
    border-top: 1px solid black;
    border-left: 1px solid black;
    border-right: 1px solid black;
    border-bottom: 1px solid rgba(0, 0, 0, 0.4);

    .k {
      font-weight: bold;
    }
    .e {
      color: gray;
      white-space: nowrap;
      font-size: 50%;
      overflow: hidden;
    }
    .a {
      color: gray;
      white-space: nowrap;
      overflow: hidden;
      font-size: 50%;
    }
  }
  .field {
    position: relative;
    background-color: rgba(255, 255, 255, 0.5);
    box-sizing: border-box;
    min-height: 5em;
    @include common.flex-box(column);
    flex: 1;
    border-style: solid;
    border-color: black;
    border-width: 0 1px 1px 1px;
    margin-bottom: 5px;
    gap: 0.3rem;
    padding: 0.3rem 0.3rem 2em;

    .n {
      position: absolute;
      @include common.flex-box(column, null, center);
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2em;
      font-weight: bold;
    }
  }
  .fumble {
    background-color: rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
    min-height: 5em;
    border: 1px solid black;
    gap: 0.3rem;
    padding: 0.3rem;
  }
}
</style>

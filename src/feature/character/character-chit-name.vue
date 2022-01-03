<template>
  <div
    class="chit"
    :class="[type, viewName ? 'has-name' : 'non-name', isGm && secretCheck ? 'gm-only' : 'normal']"
    :style="styleObj"
    @click="onSelect()"
  >
    <div class="container">
      <div class="type" v-if="viewName">{{ label }}{{ type === 'pc' ? ` ${scenarioName}` : '' }}</div>
      <span class="message" v-if="isGm && secretCheck">PL不可視</span>
      <div class="image">{{ oneName }}</div>
      <div class="label" v-if="viewName">{{ characterSheetName }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, watch } from 'vue'
import MediaListStore from '@/feature/media-list/data'
import ScenarioStore from '@/feature/scenario/data'
import CharacterStore from '@/feature/character/data'
import { Enigma, NPC, PC, RightHand } from '@/core/utility/shinobigamiScenario'
import UserStore from '@/core/data/user'

export default defineComponent({
  name: 'character-chit-name',
  props: {
    label: {
      type: String,
      required: true
    },
    type: {
      type: String as PropType<'pc' | 'npc' | 'right-hand' | 'enigma'>,
      required: true
    },
    target: {
      type: String,
      required: true
    },
    viewName: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const mediaListState = MediaListStore.injector()
    const scenarioState = ScenarioStore.injector()
    const characterState = CharacterStore.injector()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styleObj = reactive<any>({})
    const oneName = ref('')
    const scenarioName = ref('')
    const characterSheetName = ref('')
    const secretCheck = ref(false)
    watch([
      () => props.type,
      () => props.target,
      () => characterState.characterList,
      () => scenarioState.currentScenario.sheetInfo.pc,
      () => scenarioState.currentScenario.sheetInfo.npc,
      () => scenarioState.currentScenario.sheetInfo.righthand,
      () => scenarioState.currentScenario.sheetInfo.enigma
    ], () => {
      let c: PC | NPC | RightHand | Enigma | undefined
      const sheetInfo = scenarioState.currentScenario.sheetInfo
      if (props.type === 'pc') {
        c = sheetInfo.pc.find(p => p._characterKey === props.target)
        secretCheck.value = false

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const character = characterState.characterList.find(character => character.key === (c as any)?._characterKey)
        characterSheetName.value = character?.data?.sheetInfo.characterName || ''
      }
      if (props.type === 'npc') {
        c = sheetInfo.npc.find(p => p._characterKey === props.target)
        secretCheck.value = c?.secretcheck || false
        characterSheetName.value = c?.name || ''
      }
      if (props.type === 'right-hand') {
        c = sheetInfo.righthand.find(p => p._characterKey === props.target)
        secretCheck.value = c?._secretCheck || false
        characterSheetName.value = c?.name || ''
      }
      if (props.type === 'enigma') {
        c = sheetInfo.enigma.find(p => p.name === props.target)
        secretCheck.value = false
        characterSheetName.value = c?.name || ''
      }
      if (c) {
        scenarioName.value = c.name

        const chitImageUrl: string | null | undefined = mediaListState.list.find(m => c && m.key === c.chitImageList[c.currentChitImage])?.data?.url
        styleObj['--color'] = c?.color
        styleObj['--chit-image'] = chitImageUrl ? `url('${chitImageUrl}')` : ''
        oneName.value = scenarioName.value ? scenarioName.value.substr(0, 1) : ''
      }
    }, { immediate: true, deep: true })

    return {
      isGm,
      secretCheck,
      styleObj,
      oneName,
      scenarioName,
      characterSheetName,
      onSelect: () => { emit('select') }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.chit {
  width: min(100%, 5em);
  overflow: hidden;
  box-sizing: border-box;
  @include common.flex-box(column, stretch, flex-start);
  color: var(--color);
  position: relative;

  &.has-name {
    padding: 0.88em 0 1.76em 0;
  }

  &.gm-only {
    padding: 0.88em 0 2.9em 0 !important;
  }

  &:before {
    content: '';
    display: block;
    padding-top: 100%;
  }

  .container {
    @include common.position-full-size();
    @include common.flex-box(column, stretch, flex-start);
  }

  .message {
    font-size: 80%;
  }

  .image {
    flex: 1;
    font-size: min(5vw, 1.5em);
    position: relative;
    @include common.flex-box(row, center, center);
    outline: 3px solid var(--color);
    outline-offset: -8px;
    background-color: transparent;
    background-image:
      repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4) 7px,transparent 0, transparent 14px);
    text-shadow: 1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff;

    &:before {
      content: '';
      @include common.position-full-size();
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center top;
      background-image: var(--chit-image);
    }
  }

  .type {
    height: 1.1em;
    text-align: center;
  }

  .label {
    height: 2.2em;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    display: -webkit-box;
    text-align: left;
  }

  .type,
  .label {
    overflow: hidden;
    font-size: 80%;
    line-height: 1.1em;
    color: var(--color);
    font-weight: bold;
    background-color: rgba(255, 255, 255, 0.5);
  }
}
</style>

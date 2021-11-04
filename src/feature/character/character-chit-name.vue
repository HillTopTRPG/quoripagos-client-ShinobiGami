<template>
  <div
    v-if="character"
    class="chit"
    :class="[character.type, viewName ? 'has-name' : 'non-name']"
    :style="styleObj"
    @click="onSelect()"
  >
    <div class="container">
      <div class="type" v-if="viewName">{{ type }}</div>
      <div class="image">{{ oneName }}</div>
      <div class="label" v-if="viewName">{{ name }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref, watch } from 'vue'
import { Character } from './data'
import MediaListStore from '@/feature/media-list/data'
import { Enigma, NPC } from '@/core/utility/shinobigamiScenario'

export default defineComponent({
  name: 'character-chit-name',
  props: {
    character: {
      type: Object as PropType<Character | NPC | Enigma>,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    viewName: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const mediaListState = MediaListStore.injector()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styleObj = reactive<any>({})
    const oneName = ref('')
    watch(() => props.character, () => {
      const c = props.character
      if (c.type === 'character' || c.type === 'npc') {
        const chitImageUrl = mediaListState.list.find(m => m.key === c.chitImageList[c.currentChitImage])?.data?.url
        const standImageUrl = mediaListState.list.find(m => m.key === c.standImageList[c.currentStandImage])?.data?.url
        styleObj['--color'] = c?.color
        styleObj['--chit-image'] = chitImageUrl ? `url('${chitImageUrl}')` : ''
        styleObj['--stand-image'] = standImageUrl ? `url('${standImageUrl}')` : ''
        if (chitImageUrl) {
          oneName.value = ''
        } else {
          let name: string
          if (c.type === 'character') name = c.sheetInfo.characterName
          else name = c.sheetInfo?.characterName || c.name
          oneName.value = name ? name.substr(0, 1) : ''
        }
      }
      if (c.type === 'enigma') {
        const imageUrl = mediaListState.list.find(m => m.key === c.imageKey)?.data?.url
        styleObj['--chit-image'] = imageUrl ? `url('${imageUrl}')` : ''
        oneName.value = c.name ? c.name.substr(0, 1) : ''
      }
    }, { immediate: true, deep: true })

    return {
      styleObj,
      oneName,
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

  &:before {
    content: '';
    display: block;
    padding-top: 100%;
  }

  .container {
    @include common.position-full-size();
    @include common.flex-box(column, stretch, flex-start);
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

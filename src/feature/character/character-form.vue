<template>
  <label class="url"><span>キャラクターシート倉庫URL</span><input type="text" v-model="characterWrap.sheetInfo.url" placeholder="https://character-sheets.appspot.com/shinobigami/edit.html?key="></label>
  <label class="sheet-view-pass"><span>秘匿情報閲覧パス</span><input type="text" v-model="characterWrap.sheetViewPass" placeholder=""><button @click="onReadSheet()">読込</button></label>
  <character-basic-info :character="characterWrap" mode="edit" />
  <skill-table :character="characterWrap" mode="edit" />
  <ninja-arts-table :character="characterWrap" mode="edit" />
  <background-table :character="characterWrap" />
  <special-arts-table :character="characterWrap" />
  <ninja-tool-table :character="characterWrap" />
  <label class="color">
    <span>チャット文字色</span>
    <font-color-select v-model="characterWrap.color" />
  </label>
  <div class="chit-image-box">
    <template v-for="(n, ind) in chitImageList" :key="n.key">
      <label>
        コマ画像{{ ind + 1 }}
        <image-input :image-info="n" type="chit" @update="value => onUpdateImage('chit', n.key, value)" />
      </label>
    </template>
  </div>
  <div class="stand-image-box">
    <template v-for="(n, ind) in standImageList" :key="n.key">
      <label>
        立ち絵画像{{ ind + 1 }}
        <image-input :image-info="n" type="stand" @update="value => onUpdateImage('stand', n.key, value)" />
      </label>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, reactive } from 'vue'
import { Character, ImageInfo } from '@/feature/character/data'
import MediaListStore from '@/feature/media-list/data'
import CharacterBasicInfo from '@/components/shinobi-gami/character-basic-info.vue'
import SkillTable from '@/components/shinobi-gami/skill-table.vue'
import NinjaArtsTable from '@/components/shinobi-gami/ninja-arts-table.vue'
import BackgroundTable from '@/components/shinobi-gami/background-table.vue'
import SpecialArtsTable from '@/components/shinobi-gami/special-arts-table.vue'
import NinjaToolTable from '@/components/shinobi-gami/ninja-tool-table.vue'
import FontColorSelect from '@/components/font-color-select.vue'
import ImageInput from '@/feature/character/image-input.vue'
import { v4 as uuidV4 } from 'uuid'
import { StoreData } from '@/core/utility/FileUtility'

export default defineComponent({
  name: 'character-form',
  components: { ImageInput, FontColorSelect, NinjaToolTable, SpecialArtsTable, BackgroundTable, NinjaArtsTable, SkillTable, CharacterBasicInfo },
  props: {
    character: {
      type: Object as PropType<Character>,
      required: true
    }
  },
  emits: [],
  setup(props, { emit }) {
    const mediaListState = MediaListStore.injector()

    const chitImageList = ref<ImageInfo[]>(props.character.chitImageList
      .map(ci => mediaListState.list.find(m => m.key === ci))
      .filter((m): m is StoreData<MediaListStore> => m && m.data)
      .map((m): ImageInfo => ({
        key: m.key,
        name: m.data?.name,
        type: 'uploaded',
        src: m.data?.url
      })))
    const standImageList = ref<ImageInfo[]>(props.character.standImageList
      .map(ci => mediaListState.list.find(m => m.key === ci))
      .filter((m): m is StoreData<MediaListStore> => m && m.data)
      .map((m): ImageInfo => ({
        key: m.key,
        name: m.data?.name,
        type: 'uploaded',
        src: m.data?.url
      })))

    const onUpdateImage = (type: 'chit' | 'stand', key: string, value: ImageInfo) => {
      const list: ImageInfo[] = type === 'chit' ? chitImageList.value : standImageList.value
      const index = list.findIndex(ci => ci.key === key)
      if (index > -1) {
        if (list[index].type === 'uploaded') {
          list[index].type = 'new-file'
          list[index].key = uuidV4()
        }
        list[index].name = value.name
        list[index].src = value.src
      }
      if (list[list.length - 1].name) {
        list.push({ key: uuidV4(), type: 'new-file', name: '', src: '' })
      }
      if (!value.name && index > -1) {
        list.splice(index, 1)
      }
    }

    return {
      characterWrap: reactive(props.character),
      chitImageList,
      standImageList,
      onUpdateImage
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.image-input {
  @include common.flex-box(column, stretch, flex-start);

  img {
    border: 1px solid gray;
  }

  &.chit img {
    width: 5em;
    height: 5em;
    object-fit: contain;
    object-position: center bottom;
  }

  &.stand img {
    width: 6em;
    height: 9em;
    object-fit: contain;
    object-position: center bottom;
  }
}
</style>

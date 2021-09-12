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
  <button v-if="mode === 'update'" @click="uploadImages()">Image Upload</button>
  <button v-if="mode === 'insert'" @click="insertCharacter()">Add</button>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, reactive } from 'vue'
import CharacterStore, { Character, ImageInfo } from '@/feature/character/data'
import MediaListStore, { MediaStore } from '@/feature/media-list/data'
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
import { ShinobigamiHelper } from '@/core/utility/shinobigami'
import { errorDialog } from '@/core/utility/dialog'
import { convertNumberNull } from '@/core/utility/PrimaryDataUtility'

export default defineComponent({
  name: 'character-form',
  components: { ImageInput, FontColorSelect, NinjaToolTable, SpecialArtsTable, BackgroundTable, NinjaArtsTable, SkillTable, CharacterBasicInfo },
  props: {
    character: {
      type: Object as PropType<Character>,
      required: true
    },
    mode: {
      type: String as PropType<'update' | 'insert'>,
      required: true
    }
  },
  emits: ['insert'],
  setup(props, { emit }) {
    const mediaListState = MediaListStore.injector()
    const characterState = CharacterStore.injector()

    console.log(props.character)

    const chitImageList = ref<ImageInfo[]>(props.character.chitImageList
      .map(ci => mediaListState.list.find(m => m.key === ci))
      .filter((m): m is StoreData<MediaStore> => (m && Boolean(m.data)) || false)
      .map((m): ImageInfo => ({
        key: m.key,
        name: m.data?.name || '',
        type: 'uploaded',
        src: m.data?.url || ''
      }))
      .concat({ key: uuidV4(), type: 'new-file', name: '', src: '' })
    )

    const standImageList = ref<ImageInfo[]>(props.character.standImageList
      .map(ci => mediaListState.list.find(m => m.key === ci))
      .filter((m): m is StoreData<MediaStore> => (m && Boolean(m.data)) || false)
      .map((m): ImageInfo => ({
        key: m.key,
        name: m.data?.name || '',
        type: 'uploaded',
        src: m.data?.url || ''
      }))
      .concat({ key: uuidV4(), type: 'new-file', name: '', src: '' })
    )

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

    const insertCharacter = () => {
      emit('insert', chitImageList.value, standImageList.value)
    }

    const uploadImages = () => {
      characterState.uploadCharacterImage(props.character, [chitImageList.value, standImageList.value])
    }

    const onReadSheet = async () => {
      console.log(props.character.sheetInfo.url)
      if (!props.character.sheetInfo.url) return
      const helper = new ShinobigamiHelper(props.character.sheetInfo.url, props.character.sheetViewPass)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) {
        await errorDialog({
          title: 'Loading Error',
          text: 'URLまたは秘匿情報閲覧パスが誤っています。'
        })
        return
      }

      const character = props.character
      character.pcNo = convertNumberNull(rd.scenario.pcno.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)))
      character.sheetInfo = rd
    }

    return {
      onReadSheet,
      insertCharacter,
      uploadImages,
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

.chit-image-box,
.stand-image-box {
  width: 100%;
  @include common.flex-box(row, flex-start, stretch, wrap);

  label {
    @include common.flex-box(column, flex-start, stretch);
  }
}

.url {
  text-align: left;
  @include common.flex-box(column, stretch, flex-start);
  width: 100%;
}

label.color {
  @include common.flex-box(column, flex-start, flex-start);
}
</style>

<template>
  <label v-if="mode === 'update' && (isGm || isOwn)">入力内容はリアルタイムで反映されます（画像はアップロードボタンで反映）</label>
  <label v-if="mode === 'update' && !isGm && !isOwn">他の人のキャラクターです。閲覧のみ可能です。</label>
  <div class="url-block">
    <label class="url">
      <span>キャラクターシート倉庫URL</span>
      <input v-if="isGm || isOwn" type="text" v-model="urlWrap" placeholder="https://character-sheets.appspot.com/shinobigami/edit.html?key=">
      <a v-else :href="urlWrap" target="_blank" rel="noopener noreferrer">{{ character.sheetInfo.characterName }}</a>
    </label>
    <label v-if="isGm || isOwn" class="sheet-view-pass"><span>秘匿情報閲覧パス</span><input type="text" v-model="sheetViewPassWrap" placeholder=""><button @click="onReadSheet()">読込</button></label>
  </div>
  <character-basic-info :sheet-info="character.sheetInfo" :character-key="characterKey" :mode="mode" />
  <skill-table :sheet-info="character.sheetInfo" :character-key="characterKey" :mode="mode" />
  <ninja-arts-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
  <background-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
  <special-arts-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
  <ninja-tool-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
  <label class="color">
    <span>チャット文字色</span>
    <font-color-select :editable="mode !== 'insert' && (isGm || isOwn)" v-model="colorWrap" />
  </label>
  <div class="chit-image-box" v-if="isGm || isOwn">
    <template v-for="(n, ind) in chitImageList" :key="n.key">
      <label>
        コマ画像{{ ind + 1 }}
        <image-input :image-info="n" type="chit" @update="value => onUpdateImage('chit', n.key, value)" />
      </label>
    </template>
  </div>
  <div class="stand-image-box" v-if="isGm || isOwn">
    <template v-for="(n, ind) in standImageList" :key="n.key">
      <label>
        立ち絵画像{{ ind + 1 }}
        <image-input :image-info="n" type="stand" @update="value => onUpdateImage('stand', n.key, value)" />
      </label>
    </template>
  </div>
  <button v-if="mode === 'update' && (isGm || isOwn)" @click="uploadImages()">Image Upload</button>
  <button v-if="mode === 'insert'" @click="insertCharacter()">Add</button>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, reactive, watch, computed } from 'vue'
import CharacterStore, { CharacterBase, ImageInfo } from '@/feature/character/data'
import MediaListStore, { MediaStore } from '@/feature/media-list/data'
import UserStore from '@/core/data/user'
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

export default defineComponent({
  name: 'character-form',
  components: { ImageInput, FontColorSelect, NinjaToolTable, SpecialArtsTable, BackgroundTable, NinjaArtsTable, SkillTable, CharacterBasicInfo },
  props: {
    character: {
      type: Object as PropType<CharacterBase>,
      required: true
    },
    characterKey: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    sheetViewPass: {
      type: String,
      required: true
    },
    mode: {
      type: String as PropType<'update' | 'insert'>,
      required: true
    }
  },
  emits: ['insert', 'update:url', 'update:sheetViewPass'],
  setup(props, { emit }) {
    const mediaListState = MediaListStore.injector()
    const characterState = CharacterStore.injector()

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))

    console.log(props.character)

    const urlWrap = ref(props.url)
    watch(() => props.url, () => {
      urlWrap.value = props.url
    })
    watch(urlWrap, () => {
      emit('update:url', urlWrap.value)
    })

    const sheetViewPassWrap = ref(props.sheetViewPass)
    watch(() => props.sheetViewPass, () => {
      sheetViewPassWrap.value = props.sheetViewPass
    })
    watch(sheetViewPassWrap, () => {
      emit('update:sheetViewPass', sheetViewPassWrap.value)
    })

    const colorWrap = ref(props.character.color)
    watch(() => props.character.color, () => {
      colorWrap.value = props.character.color
    })
    watch(colorWrap, () => {
      const character = props.character
      character.color = colorWrap.value
    })

    const makeImageList = (imageKeyList: string[]): ImageInfo[] => imageKeyList
      .map(ci => mediaListState.list.find(m => m.key === ci))
      .filter((m): m is StoreData<MediaStore> => (m && Boolean(m.data)) || false)
      .map((m): ImageInfo => ({
        key: m.key,
        name: m.data?.name || '',
        type: 'uploaded',
        src: m.data?.url || ''
      }))
      .concat({ key: uuidV4(), type: 'new-file', name: '', src: '' })

    const chitImageList = ref<ImageInfo[]>(makeImageList(props.character.chitImageList))
    const standImageList = ref<ImageInfo[]>(makeImageList(props.character.standImageList))
    watch(() => props.character, () => {
      chitImageList.value = makeImageList(props.character.chitImageList)
      standImageList.value = makeImageList(props.character.standImageList)
    })

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
      if (!isGm.value && !isOwn.value) return
      console.log(urlWrap.value)
      if (!urlWrap.value) return
      const helper = new ShinobigamiHelper(urlWrap.value, sheetViewPassWrap.value)
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
      character.sheetInfo = rd
    }

    return {
      isGm,
      isOwn,
      colorWrap,
      urlWrap,
      sheetViewPassWrap,
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

.url-block {
  @include common.flex-box(column, stretch, flex-start);
  width: 100%;

  > label {
    @include common.flex-box(row, flex-start, center);

    input {
      flex: 1;
    }
  }
}

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

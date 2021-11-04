<template>
  <label class="message" v-if="mode === 'update' && (isGm || isOwn)">入力内容はリアルタイムで反映されます（画像はアップロードボタンで反映）</label>
  <label class="message" v-if="mode === 'update' && !isGm && !isOwn">閲覧のみ可能です。</label>
  <div class="url-block" v-if="character.type !== 'enigma' && (isGm || isOwn || mode === 'insert' || isViewSheet)">
    <label class="url">
      <span>キャラクターシート倉庫URL</span>
      <input v-if="isGm || isOwn || mode === 'insert'" type="text" v-model="urlWrap" placeholder="https://character-sheets.appspot.com/shinobigami/edit.html?key=">
      <template v-else>
        <a v-if="urlWrap" :href="urlWrap" target="_blank" rel="noopener noreferrer">{{ character.sheetInfo?.characterName || character.name }}</a>
      </template>
    </label>
    <label v-if="isGm || isOwn || mode === 'insert'" class="sheet-view-pass">
      <span>秘匿情報閲覧パス</span>
      <input type="text" v-model="sheetViewPassWrap" placeholder="">
      <button @click="onReadSheet()">読込</button>
    </label>
  </div>
  <scenario-pc v-if="scenarioPcInfo" :character-key="characterKey" :pc-list="[scenarioPcInfo]" mode="character" />
  <scenario-npc v-if="scenarioNpcInfo" :npc-name="characterKey" :npc-list="[scenarioNpcInfo]" mode="character" />
  <template v-if="isGm || isViewSheet">
    <template v-if="character.type === 'character' || character.type === 'npc'">
      <template v-if="character.sheetInfo">
        <character-basic-info :sheet-info="character.sheetInfo" :character-key="characterKey" :mode="mode" />
        <skill-table :sheet-info="character.sheetInfo" :character-key="characterKey" :mode="mode" />
        <ninja-arts-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
        <background-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
        <special-arts-table :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
        <ninja-tool-table v-if="isGm || isOwn || mode === 'insert'" :sheet-info="character.sheetInfo" :character-key="characterKey" :url="character.sheetInfo.url" :sheet-view-pass="character.sheetViewPass" :mode="mode" />
      </template>

      <label class="color">
        <span>チャット文字色</span>
        <font-color-select :editable="mode === 'insert' || isGm || isOwn" v-model="colorWrap" />
      </label>

      <div class="chit-image-box" v-if="mode === 'insert' || isGm || isOwn">
        <template v-for="(n, idx) in chitImageList" :key="n.key">
          <label>
            コマ画像{{ idx + 1 }}
            <image-input :image-info="n" type="chit" @update="value => onUpdateImage('chit', n.key, value)" />
          </label>
        </template>
      </div>

      <div class="stand-image-box" v-if="mode === 'insert' || isGm || isOwn">
        <template v-for="(n, idx) in standImageList" :key="n.key">
          <label>
            立ち絵画像{{ idx + 1 }}
            <image-input :image-info="n" type="stand" @update="value => onUpdateImage('stand', n.key, value)" />
          </label>
        </template>
      </div>
      <button v-if="mode === 'update' && (isGm || isOwn)" @click="uploadImages()">Image Upload</button>
    </template>
  </template>
  <button v-if="mode === 'insert'" @click="insertCharacter()">Add</button>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, reactive, watch, computed } from 'vue'
import CharacterStore, { Character, ImageInfo } from '@/feature/character/data'
import MediaListStore, { MediaStore } from '@/feature/media-list/data'
import UserStore from '@/core/data/user'
import ScenarioStore from '@/feature/scenario/data'
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
import { Enigma, NPC, PC } from '@/core/utility/shinobigamiScenario'
import ScenarioPc from '@/feature/scenario/scenario-pc.vue'
import ScenarioNpc from '@/feature/scenario/scenario-npc.vue'

export default defineComponent({
  name: 'character-form',
  components: { ScenarioNpc, ScenarioPc, ImageInput, FontColorSelect, NinjaToolTable, SpecialArtsTable, BackgroundTable, NinjaArtsTable, SkillTable, CharacterBasicInfo },
  props: {
    character: {
      type: Object as PropType<Character | NPC | Enigma>,
      required: true
    },
    characterKey: {
      type: String,
      required: true
    },
    url: {
      type: String,
      default: null
    },
    sheetViewPass: {
      type: String,
      default: null
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

    const colorWrap = ref<string | null>(props.character.type === 'enigma' ? null : props.character.color)
    if (props.character.type !== 'enigma') {
      watch(() => props.character.type !== 'enigma' ? props.character.color : null, () => {
        colorWrap.value = props.character.type !== 'enigma' ? props.character.color : null
      })
      watch(colorWrap, () => {
        const character = props.character
        if (character.type !== 'enigma') character.color = colorWrap.value || ''
      })
    }

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

    const chitImageList = ref<ImageInfo[]>([])
    const standImageList = ref<ImageInfo[]>([])
    watch(() => props.character, () => {
      if (props.character.type !== 'enigma') {
        chitImageList.value = makeImageList(props.character.chitImageList)
        standImageList.value = makeImageList(props.character.standImageList)
      }
    }, { immediate: true })

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
      if (props.character.type !== 'enigma') {
        characterState.uploadCharacterImage(props.character, [chitImageList.value, standImageList.value])
      }
    }

    const onReadSheet = async () => {
      if (!isGm.value && !isOwn.value && props.mode === 'update') return
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
      if (character.type !== 'enigma') character.sheetInfo = rd
    }

    const scenarioState = ScenarioStore.injector()
    const scenarioPcInfo = ref<PC | null>(null)
    const scenarioNpcInfo = ref<NPC | null>(null)
    watch([
      () => scenarioState.currentScenario?.sheetInfo.pc,
      () => scenarioState.currentScenario?.sheetInfo.npc,
      () => props.characterKey
    ], () => {
      scenarioPcInfo.value = scenarioState.currentScenario?.sheetInfo.pc.find(pc => props.characterKey && pc.characterKey === props.characterKey) || null
      scenarioNpcInfo.value = scenarioState.currentScenario?.sheetInfo.npc.find(npc => props.characterKey && npc.name === props.characterKey) || null
    }, { deep: true, immediate: true })

    const isViewSheet = ref(false)
    watch([() => props.character, () => userState.selfUser?.refList], () => {
      isViewSheet.value =
        props.character.type === 'character' ||
        userState.selfUser?.refList.some(r => props.character.type === 'character' || (props.character.type === 'npc' && props.character.sheetOpenList.some(o => o === r.key))) ||
        false
    }, { deep: true, immediate: true })

    return {
      isViewSheet,
      isGm,
      isOwn,
      colorWrap,
      urlWrap,
      sheetViewPassWrap,
      onReadSheet,
      insertCharacter,
      uploadImages,
      characterWrap: reactive(props.character),
      scenarioPcInfo,
      scenarioNpcInfo,
      chitImageList,
      standImageList,
      onUpdateImage,
      isOpen: (openList: string[]) => userState.selfUser?.refList.some(r => openList.some(o => o === r.key)),
      refList: computed(() => userState.selfUser?.refList || [])
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.message {
  width: 100%;
  text-align: left;
  font-weight: bold;
}

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

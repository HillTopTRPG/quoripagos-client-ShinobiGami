<template>
  <scenario-pc v-if="type === 'pc'" :target="target" mode="character" />
  <scenario-npc v-if="type === 'npc'" :target="target" mode="character" />
  <scenario-right-hand v-if="type === 'right-hand'" :target="target" mode="character" />
  <scenario-enigma v-if="type === 'enigma'" :target="target" mode="character" />

  <label class="message" v-if="isOwn">入力内容はリアルタイムで反映されます（画像はアップロードボタンで反映）</label>
  <label class="message" v-else>閲覧のみ可能です。</label>

  <label class="color">
    <span>チャット文字色</span>
    <font-color-select :editable="isOwn" v-model="colorWrap" />
  </label>

  <div class="chit-image-box" v-if="isOwn">
    <template v-for="(n, idx) in chitImageList" :key="n.key">
      <div :class="[n.type, n.name, n.src]">
        <label :for="n.key">コマ画像{{ idx + 1 }}</label>
        <label class="image-index-radio-container">
          <input
            type="radio"
            :id="n.key"
            v-if="n.type === 'uploaded'"
            :name="`current-chit-image`"
            @change="currentChitImage = $event.target.value"
            :checked="chitImageList.filter(d => d.type === 'uploaded').findIndex(d => d.key === n.key) === Number(currentChitImage)"
            :value="chitImageList.filter(d => d.type === 'uploaded').findIndex(d => d.key === n.key)"
          >
        </label>
        <image-input
          :key="n.key"
          :image-info="n"
          type="chit"
          @update="value => onUpdateImage('chit', n.key, value)"
          @delete="onDeleteImage('chit', n.key)"
        />
      </div>
    </template>
  </div>

  <div class="stand-image-box" v-if="isOwn">
    <template v-for="(n, idx) in standImageList" :key="n.key">
      <div :class="[n.type, n.name, n.src]">
        <label :for="n.key">立ち絵画像{{ idx + 1 }}</label>
        <label class="image-index-radio-container">
          <input
            type="radio"
            :id="n.key"
            v-if="n.type === 'uploaded'"
            :name="`current-chit-image`"
            @change="currentStandImage = $event.target.value"
            :checked="standImageList.filter(d => d.type === 'uploaded').findIndex(d => d.key === n.key) === Number(currentStandImage)"
            :value="standImageList.filter(d => d.type === 'uploaded').findIndex(d => d.key === n.key)"
          >
        </label>
        <image-input
          :key="n.key"
          :image-info="n"
          type="stand"
          @update="value => onUpdateImage('stand', n.key, value)"
          @delete="onDeleteImage('stand', n.key)"
        />
      </div>
    </template>
  </div>
  <button class="image-upload-btn" v-if="isOwn" @click="uploadImages()">Image Upload</button>

  <template v-if="isSheetShow && hasSheet">
    <div class="url-block">
      <label class="url">
        <span>キャラクターシート倉庫URL</span>
        <input v-if="isOwn" type="text" autocomplete="url" v-model="url" placeholder="https://character-sheets.appspot.com/shinobigami/edit.html?key=">
        <template v-else>
          <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer">{{ character?.data?.sheetInfo.characterName || character?.data.name }}</a>
        </template>
      </label>
      <label v-if="isOwn" class="sheet-view-pass">
        <span>秘匿情報閲覧パス</span>
        <input type="text" v-model="sheetViewPass" placeholder="">
        <button @click="onReadSheet()" :disabled="!url">読込</button>
      </label>
    </div>
    <div class="v-box">
      <character-basic-info :type="type" :target="target" mode="update" />
      <skill-table :type="type" :target="target" mode="update" />
      <ninja-arts-table :type="type" :target="target" mode="update" />
      <background-table :type="type" :target="target" mode="update" />
      <special-arts-table :type="type" :target="target" mode="update" />
      <ninja-tool-table v-if="isOwn" :type="type" :target="target" mode="update" />
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch, computed } from 'vue'
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
import { errorDialog, questionDialog } from '@/core/utility/dialog'
import { Enigma, NPC, PC, RightHand } from '@/core/utility/shinobigamiScenario'
import ScenarioPc from '@/feature/scenario/scenario-pc.vue'
import ScenarioNpc from '@/feature/scenario/scenario-npc.vue'
import ScenarioRightHand from '@/feature/scenario/scenario-right-hand.vue'
import ScenarioEnigma from '@/feature/scenario/scenario-enigma.vue'

export default defineComponent({
  name: 'character-form',
  components: { ScenarioEnigma, ScenarioRightHand, ScenarioNpc, ScenarioPc, ImageInput, FontColorSelect, NinjaToolTable, SpecialArtsTable, BackgroundTable, NinjaArtsTable, SkillTable, CharacterBasicInfo },
  props: {
    target: {
      type: String,
      required: true
    },
    type: {
      type: String as PropType<'pc' | 'npc' | 'right-hand' | 'enigma'>,
      required: true
    }
  },
  emits: ['insert', 'update:url', 'update:sheetViewPass'],
  setup(props) {
    const mediaListState = MediaListStore.injector()
    const scenarioState = ScenarioStore.injector()
    const characterState = CharacterStore.injector()

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const getObjects = (): {
      pc: PC | null;
      npc: NPC | null;
      rightHand: RightHand | null;
      enigma: Enigma | null;
    } => {
      const sheetInfo = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo
      return {
        pc: props.type !== 'pc' ? null : sheetInfo?.pc.find(d => d._characterKey === props.target) || null,
        npc: props.type !== 'npc' ? null : sheetInfo?.npc.find(d => d._characterKey === props.target) || null,
        rightHand: props.type !== 'right-hand' ? null : sheetInfo?.righthand.find(d => d._characterKey === props.target) || null,
        enigma: props.type !== 'enigma' ? null : sheetInfo?.enigma.find(d => d.name === props.target) || null
      }
    }

    const hasSheet = ref(true)
    const colorWrap = ref<string | null>(null)
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.currentScenario.sheetInfo.pc,
      () => scenarioState.currentScenario.sheetInfo.npc,
      () => scenarioState.currentScenario.sheetInfo.righthand,
      () => scenarioState.currentScenario.sheetInfo.enigma
    ], () => {
      const { pc, npc, rightHand, enigma } = getObjects()
      const obj = pc || npc || rightHand || enigma || null
      if (enigma) hasSheet.value = false
      else if (npc) hasSheet.value = npc._hasSheet
      else if (rightHand) hasSheet.value = rightHand._hasSheet
      else hasSheet.value = true
      colorWrap.value = obj?.color || null
    }, { immediate: true, deep: true })
    watch(colorWrap, () => {
      const { pc, npc, rightHand, enigma } = getObjects()
      const obj = pc || npc || rightHand || enigma || null
      if (obj && colorWrap.value) obj.color = colorWrap.value
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

    const character = ref<StoreData<Character> | null>(null)
    const chitImageList = ref<ImageInfo[]>([])
    const standImageList = ref<ImageInfo[]>([])
    const currentChitImage = ref<number>(-1)
    const currentStandImage = ref<number>(-1)
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma
    ], () => {
      const { pc, npc, rightHand, enigma } = getObjects()
      const obj = pc || npc || rightHand || null
      character.value = characterState.characterList.find(c => c.key === obj?._characterKey) || null
      if ((enigma || obj) === null) {
        chitImageList.value = makeImageList([])
        standImageList.value = makeImageList([])
        currentChitImage.value = -1
        currentStandImage.value = -1
      } else {
        const chitNewFileList = chitImageList.value.filter(d => d.type === 'new-file' && d.src)
        chitImageList.value = makeImageList((enigma || obj)?.chitImageList || [])
        chitImageList.value.splice(
          chitImageList.value.length - 1,
          0,
          ...chitNewFileList.filter(d => !chitImageList.value.some(cd => cd.key === d.key))
        )
        const standNewFileList = standImageList.value.filter(d => d.type === 'new-file' && d.src)
        standImageList.value = makeImageList((enigma || obj)?.standImageList || [])
        standImageList.value.splice(
          standImageList.value.length - 1,
          0,
          ...standNewFileList.filter(d => !standImageList.value.some(cd => cd.key === d.key))
        )
        currentChitImage.value = (enigma || obj)?.currentChitImage || 0
        currentStandImage.value = (enigma || obj)?.currentStandImage || 0
      }
    }, { immediate: true, deep: true })
    watch([currentChitImage, currentStandImage], () => {
      const { pc, npc, rightHand, enigma } = getObjects()
      const obj = pc || npc || rightHand || enigma || null
      if (obj) {
        obj.currentChitImage = currentChitImage.value
        obj.currentStandImage = currentStandImage.value
      }
    })

    const url = ref(character.value?.data?.sheetInfo.url || '')
    watch(url, () => {
      if (character.value && character.value.data) {
        character.value.data.sheetInfo.url = url.value
      }
    })

    const sheetViewPass = ref(character.value?.data?.sheetViewPass || '')
    watch(sheetViewPass, () => {
      if (character.value && character.value.data) {
        character.value.data.sheetViewPass = sheetViewPass.value
      }
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

    const onDeleteImage = async (type: 'chit' | 'stand', key: string) => {
      const list: ImageInfo[] = type === 'chit' ? chitImageList.value : standImageList.value
      const index = list.findIndex(ci => ci.key === key)
      if (index < 0) return
      const { pc, npc, rightHand, enigma } = getObjects()
      const obj = pc || npc || rightHand || enigma || null
      if (!obj) return

      if (!(await questionDialog({
        title: `${type === 'chit' ? 'コマ' : '立ち絵'}画像削除`,
        text: `${type === 'chit' ? 'コマ' : '立ち絵'}画像${index + 1}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return

      const removeObj = list.splice(index, 1)[0]
      if (removeObj.type === 'new-file') return

      if (type === 'chit') {
        console.log(index)
        console.log(obj.currentChitImage)
        console.log(obj.chitImageList.length)
        obj.chitImageList.splice(index, 1)
        console.log(obj.chitImageList.length)
        obj.chitImageList.map(d => mediaListState.list.find(m => m.key === d)).forEach(d => {
          console.log(d?.data?.name)
          console.log(d?.data?.url)
        })
        if (obj.chitImageList.length <= obj.currentChitImage) {
          console.log('minus index')
          obj.currentChitImage--
        }
      } else {
        obj.standImageList.splice(index, 1)
        if (obj.standImageList.length <= obj.currentStandImage) obj.currentStandImage--
      }
    }

    const uploadImages = () => {
      const { pc, npc, rightHand, enigma } = getObjects()
      const obj = pc || npc || rightHand || enigma || null
      if (obj) {
        scenarioState.uploadCharacterImage(obj, [chitImageList.value, standImageList.value])
      }
    }

    const onReadSheet = async () => {
      if (!isGm.value && !isOwn.value) return
      if (!url.value) return
      const helper = new ShinobigamiHelper(url.value, sheetViewPass.value)
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

      if (character.value && character.value.data) character.value.data.sheetInfo = rd
    }

    const isOwn = ref(false)
    const isSheetShow = ref(false)
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.list
    ], () => {
      const chitStatus = scenarioState.getChitStatus(
        props.type,
        props.target,
        userState.selfUser?.key || null
      )
      isOwn.value = isGm.value || chitStatus.isOwn
      isSheetShow.value = isGm.value || chitStatus.isSheetShow
    }, { deep: true, immediate: true })

    return {
      isOwn,
      hasSheet,
      isSheetShow,
      colorWrap,
      url,
      sheetViewPass,
      onReadSheet,
      onDeleteImage,
      uploadImages,
      character,
      chitImageList,
      standImageList,
      currentChitImage,
      currentStandImage,
      onUpdateImage,
      isOpen: (openList: string[]) => userState.selfUser?.refList.some(r => openList.some(o => o === r.key)),
      refList: computed(() => userState.selfUser?.refList || [])
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.v-box {
  @include common.flex-box(column, flex-start, flex-start, wrap);
  gap: 0.5em;
}

.image-upload-btn {
  align-self: flex-start;
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
  gap: 0.5em;

  .message {
    font-size: 80%;
    color: gray;
  }

  .image-index-radio-container {
    width: 100%;
    @include common.flex-box(row, center, flex-start);
  }

  > div {
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

<template>
  <template v-for="n in list" :key="n.key">
    <div class="scene" v-if="n.scene" @click="onSelectScene(n.key)" :class="currentKey === n.key ? 'selected' : ''">
      <label>
        <span>名前</span>
        <input type="text" v-model="n.scene.name">
      </label>
      <label>
        <span>背景</span>
        <image-input :image-info="n.imageInfo" type="back" @update="value => onUpdateImage(n.key, value)" />
        <button :disabled="n.imageInfo.type !== 'new-file' || !n.imageInfo.name" @click="uploadImages(n)">Image Upload</button>
      </label>
    </div>
  </template>
  <button @click="onAddScene()">追加</button>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import Store, { Scene } from './data'
import SocketStore from '@/core/data/socket'
import RoomSettingStore from '@/feature/room-setting/data'
import {
  ImageInfo,
  UploadMediaInfo,
  UploadMediaRequest,
  UploadMediaResponse
} from '@/feature/character/data'
import MediaListStore, { getUrlTypes } from '@/feature/media-list/data'
import { v4 as uuidV4 } from 'uuid'
import ImageInput from '@/feature/character/image-input.vue'
import { getFileName } from '@/core/utility/PrimaryDataUtility'

export default defineComponent({
  name: 'scene-pane',
  components: { ImageInput },
  emits: ['close'],
  setup() {
    const state = Store.injector()
    const mediaListState = MediaListStore.injector()
    const socketStore = SocketStore.injector()
    const roomSettingState = RoomSettingStore.injector()

    type WrapScene = { key: string; scene: Scene | null; imageInfo: ImageInfo }
    const makeWrapList = (): WrapScene[] => state.list.map(scene => {
      const media = mediaListState.list.find(m => m.key === scene.data?.backgroundImage)
      return {
        key: scene.key,
        scene: scene.data || null,
        imageInfo: media ? ({
          key: media.key,
          name: media.data?.name || '',
          type: 'uploaded',
          src: media.data?.url || ''
        }) : ({
          key: uuidV4(),
          name: '',
          type: 'new-file',
          src: ''
        })
      }
    })
    const wrapSceneList = ref<WrapScene[]>(makeWrapList())
    watch(() => state.list, () => {
      wrapSceneList.value = makeWrapList()
    }, { deep: true })

    const onUpdateImage = (key: string, value: ImageInfo) => {
      const index = wrapSceneList.value.findIndex(s => s.key === key)
      if (index > -1) {
        const imageInfo = wrapSceneList.value[index].imageInfo
        if (imageInfo.type === 'uploaded') {
          imageInfo.type = 'new-file'
          imageInfo.key = uuidV4()
        }
        imageInfo.name = value.name
        imageInfo.src = value.src
      }
    }

    const onAddScene = () => {
      state.insertData({
        data: {
          name: '',
          backgroundImage: null
        }
      })
    }

    const uploadAndKeyReplace = async (uploadMediaInfoList: UploadMediaInfo[], imageInfo: ImageInfo) => {
      const resultList = await socketStore.sendSocketServerRoundTripRequest<UploadMediaRequest, UploadMediaResponse>(
        'media-api-upload',
        { uploadMediaInfoList, option: {} }
      )
      imageInfo.key = resultList[0].key
    }

    const uploadImages = async (wrapScene: WrapScene): Promise<void> => {
      const uploadMediaInfoList: UploadMediaInfo[] = [{
        key: wrapScene.imageInfo.key,
        url: '',
        dataLocation: 'server',
        ...getUrlTypes(wrapScene.imageInfo.name),
        rawPath: getFileName(wrapScene.imageInfo.name),
        tag: 'scene-background',
        name: wrapScene.imageInfo.name,
        arrayBuffer: wrapScene.imageInfo.src
      }]
      await uploadAndKeyReplace(uploadMediaInfoList, wrapScene.imageInfo)
      if (wrapScene.scene) {
        wrapScene.scene.backgroundImage = wrapScene.imageInfo.key
      }
    }

    const currentKey = computed(() => roomSettingState.roomSetting?.sceneKey)
    const onSelectScene = (key: string) => {
      if (roomSettingState.roomSetting) {
        roomSettingState.roomSetting.sceneKey = key
      }
    }

    return {
      list: wrapSceneList,
      onUpdateImage,
      onAddScene,
      uploadImages,
      currentKey,
      onSelectScene
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.scene {
  @include common.flex-box(column, flex-start, flex-start);

  &.selected {
    border: solid 1px red;
  }
}
</style>

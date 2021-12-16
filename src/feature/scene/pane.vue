<template>
  <template v-for="n in list" :key="n.key">
    <div class="scene" v-if="n.scene">
      <label class="image-index-radio-container">
        <input
          type="radio"
          :id="n.imageInfo.key"
          v-if="n.scene?.backgroundImage"
          :name="`current-scene`"
          @change="onSelectScene(n.key)"
          :checked="currentKey === n.key"
          :value="n.key"
        >
      </label>
      <image-input
        :key="n.imageInfo.key"
        :image-info="n.imageInfo"
        type="back"
        @update="value => onUpdateImage(n.key, value)"
        @delete="onDelete(n.key)"
      />
      <button v-if="n.imageInfo.type === 'new-file'" :disabled="!n.imageInfo.name" @click="uploadImages(n)">Image Upload</button>
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
import { removeFilter } from '@/core/utility/typescript'

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
    watch([() => state.list, () => mediaListState.list], () => {
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
      onSelectScene,
      onDelete: (key: string) => {
        console.log(roomSettingState.roomSetting?.sceneKey === key, roomSettingState.roomSetting?.sceneKey, key)
        if (roomSettingState.roomSetting?.sceneKey === key) {
          // TODO 選択されているシーンをずらす
          const idx = wrapSceneList.value.findIndex(d => d.key === key)
          if (wrapSceneList.value.length === 1) {
            console.log('ずらす - null')
            roomSettingState.roomSetting.sceneKey = null
          } else if (idx === wrapSceneList.value.length - 1) {
            console.log(`ずらす - まえ\n${roomSettingState.roomSetting.sceneKey}\n${wrapSceneList.value[idx - 1].key}`)
            roomSettingState.roomSetting.sceneKey = wrapSceneList.value[idx - 1].key
          } else {
            console.log(`ずらす - どう\n${roomSettingState.roomSetting.sceneKey}\n${wrapSceneList.value[idx].key}`)
            roomSettingState.roomSetting.sceneKey = wrapSceneList.value[idx + 1].key
          }
        }
        const d1 = removeFilter(wrapSceneList.value, d => d.key === key)
        // const d2 = removeFilter(state.list, d => d.key === key)
        console.log(d1.length)
        state.deleteData([key])
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.scene {
  @include common.flex-box(column, center, flex-start);

  &.selected {
    border: solid 1px red;
  }
}
</style>

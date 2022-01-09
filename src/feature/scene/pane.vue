<template>
  <view-mode
    title=""
    normal-label="通常"
    :use-simple="false"
    simple-label=""
    :alt-label="'入替/削除'"
    :editable="true"
    v-model:viewMode="viewMode"
    :use-add="true"
    @add="onAddScene()"
  />
  <draggable
    :list="list"
    item-key="key"
    group="scene"
    @change="onDrag('change', $event)"
    @start="onDrag('start', $event)"
    @end="onDrag('end', $event)"
    ghost-class="ghost"
    class="draggable-container"
    handle=".grip-line"
  >
    <template #item="{element}">
      <div class="scene-block">
        <div class="grip-line" v-show="viewMode === 'alt'">
          <button @click="onDelete(element.key)">削除</button>
        </div>
        <table class="scene">
          <tbody>
          <tr>
            <th><label :for="`scene-name-${element.key}`">名前</label></th>
            <td class="name">
              <input type="text" :id="`scene-name-${element.key}`" v-model="element.scene.name">
            </td>
          </tr>
          <tr v-if="viewMode === 'normal'">
            <th><label>画像</label></th>
            <td>
              <div class="h-box scene-image">
                <image-input
                  :key="element.imageInfo.key"
                  :image-info="element.imageInfo"
                  type="back"
                  @update="value => onUpdateImage(element.key, value)"
                  :deletable="false"
                />
                <button
                  v-if="element.imageInfo.type === 'new-file'"
                  :disabled="!element.imageInfo.name"
                  @click="uploadImages(element)"
                >Image Upload</button>
                <button
                  v-if="element.imageInfo.type !== 'new-file'"
                  @click="onImageDelete(element.key)"
                >画像削除</button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
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
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'

export default defineComponent({
  name: 'scene-pane',
  components: { ViewMode, ImageInput, draggable },
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

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const target = state.list.splice(evt.oldIndex || 0, 1)[0]
        state.list.splice(evt.newIndex || 0, 0, target)
      }
    }

    return {
      viewMode,
      onDrag,
      list: wrapSceneList,
      onUpdateImage,
      onAddScene,
      uploadImages,
      onImageDelete: (key: string) => {
        const scene = state.list.find(d => d.key === key)
        if (scene && scene.data) {
          scene.data.backgroundImage = null
        }
      },
      onDelete: (key: string) => {
        if (roomSettingState.roomSetting?.sceneKey === key) {
          // 選択されているシーンをずらす
          const idx = wrapSceneList.value.findIndex(d => d.key === key)
          if (wrapSceneList.value.length === 1) {
            roomSettingState.roomSetting.sceneKey = null
          } else if (idx === wrapSceneList.value.length - 1) {
            roomSettingState.roomSetting.sceneKey = wrapSceneList.value[idx - 1].key
          } else {
            roomSettingState.roomSetting.sceneKey = wrapSceneList.value[idx + 1].key
          }
        }
        removeFilter(wrapSceneList.value, d => d.key === key)
        state.deleteData([key])
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.draggable-container {
  @include common.flex-box(column, flex-start, flex-start);
  gap: 0.5em;
}

.h-box {
  @include common.flex-box(row, flex-start, center);

  input {
    width: auto;
    flex: 1;
  }
}

.scene-block.ghost {
  opacity: 0.5;
}

.grip-line {
  @include common.flex-box(row, flex-end, center);
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

.scene-contents {
  margin-top: -1px;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  box-sizing: border-box;
  height: 100%;

  .scene-image :first-child {
    flex: 1;
  }

  @mixin set-column-width($class, $width) {
    .#{$class} {
      width: $width;
      min-width: $width;
      max-width: $width;
    }
  }

  &.scene {
    th {
      width: 4em;
    }
  }

  label {
    cursor: pointer;
    width: 100%;
    height: 100%;
    @include common.flex-box(row, center, center);
  }

  input:not([type='checkbox']),
  select {
    padding: 0;
    margin: 0;
    cursor: inherit;
    width: 100%;
    box-sizing: border-box;
    font-size: inherit;

    &:not([multiple]) {
      height: 2em;
    }
  }

  th {
    background-color: #252525;
    color: white;
    text-align: center;
    height: 100%;
  }

  td {
    height: 1.9em;
    text-align: left;
  }

  td, th {
    position: relative;
    border-style: solid;
    border-width: 1px;
    border-color: black;
    padding: 0;
    margin: 0;
    white-space: pre-wrap;

    > * {
      vertical-align: middle;
    }
  }
}
</style>

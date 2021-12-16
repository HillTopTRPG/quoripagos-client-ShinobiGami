<template>
  <view-mode
    title="説明・カットイン"
    :use-simple="true"
    :normal-label="isGm ? '通常' : '詳細'"
    :simple-label="'簡易'"
    :alt-label="'入替/削除'"
    :editable="isGm && mode === 'scenario'"
    v-model:viewMode="viewMode"
    :use-add="isGm"
    @add="onAdd()"
  />
  <draggable
    :list="summaryListWrap"
    item-key="idx"
    group="summary"
    @change="onDrag('change', $event)"
    @start="onDrag('start', $event)"
    @end="onDrag('end', $event)"
    ghost-class="ghost"
    class="draggable-container"
    handle=".grip-line"
  >
    <template #item="{element}">
      <div class="summary-block">
        <div class="grip-line" v-show="isGm && viewMode === 'alt'">
          <button @click="onDelete(element.idx)">削除</button>
        </div>
        <table class="summary">
          <tbody>
          <template v-if="isGm || !element.raw.secret">
            <tr>
              <th><label :for="isGm ? `summary-title-${element.idx}-${elmId}` : ''">タイトル</label></th>
              <td class="title">
                <input type="text" v-if="isGm" :id="`summary-title-${element.idx}-${elmId}`" v-model="element.raw.title">
                <template v-else>{{ element.raw.title }}</template>
              </td>
              <th><label :for="isGm ? `summary-secret-${element.idx}-${elmId}` : ''">秘</label></th>
              <td class="secret">
                <input type="checkbox" v-if="isGm" :id="`summary-secret-${element.idx}-${elmId}`" v-model="element.raw.secret">
                <input type="checkbox" v-else :checked="element.raw.secret" @click.prevent>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <td class="contents" colspan="4">
                <textarea v-if="isGm" v-model="element.raw.contents"></textarea>
                <template v-else>{{ element.raw.contents }}</template>
              </td>
            </tr>
            <tr v-if="isGm">
              <th><label>画像</label></th>
              <td :colspan="isGm ? 1 : 3">
                <div class="h-box summary-image">
                  <image-input
                    :key="element.imageInfo.key"
                    :image-info="element.imageInfo"
                    type="chit"
                    :deletable="false"
                    @update="value => onUpdateImage(element.idx, value)"
                  />
                  <button
                    v-if="isGm && element.imageInfo.type === 'new-file' && element.imageInfo.name"
                    @click="uploadImages(element.imageInfo, element.raw)"
                  >Image Upload</button>
                  <button
                    v-if="isGm && element.imageInfo.type !== 'new-file'"
                    @click="deleteImage(element.raw)"
                  >削除</button>
                </div>
              </td>
              <th v-if="isGm"><label>カットイン</label></th>
              <td v-if="isGm">
                <button @click="sendCutIn(element.raw)">全員に表示</button>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
      </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import UserStore from '../../core/data/user'
import { v4 as uuidV4 } from 'uuid'
import draggable from 'vuedraggable'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import { questionDialog } from '@/core/utility/dialog'
import ScenarioStore from '@/feature/scenario/data'
import { ImageInfo, UploadMediaInfo, UploadMediaRequest, UploadMediaResponse } from '@/feature/character/data'
import SocketStore from '@/core/data/socket'
import { Summary } from '@/core/utility/shinobigamiScenario'
import MediaListStore, { getUrlTypes } from '@/feature/media-list/data'
import { getFileName } from '@/core/utility/PrimaryDataUtility'
import ImageInput from '@/feature/character/image-input.vue'

export default defineComponent({
  name: 'scenario-summary',
  components: { ImageInput, ViewMode, draggable },
  setup() {
    const scenarioState = ScenarioStore.injector()
    const mediaListState = MediaListStore.injector()
    const summaryList = scenarioState.currentScenario.sheetInfo.summary
    const elmId = uuidV4()
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = () => {
      scenarioState.currentScenario.sheetInfo.summary.push(({
        contents: '',
        secret: true,
        title: '',
        _imageKey: null
      }))
    }

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '説明削除',
        text: `${summaryList[idx].title}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      summaryList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const target = summaryList.splice(evt.oldIndex || 0, 1)[0]
        summaryList.splice(evt.newIndex || 0, 0, target)
      }
    }

    const {
      summaryListWrap
    } = scenarioState.makeWrapLists()

    const onUpdateImage = (idx: number, value: ImageInfo) => {
      const index = summaryListWrap.value.findIndex(s => s.idx === idx)
      if (index > -1) {
        const imageInfo = summaryListWrap.value[index].imageInfo
        if (imageInfo.type === 'uploaded') {
          imageInfo.type = 'new-file'
          imageInfo.key = uuidV4()
        }
        imageInfo.name = value.name
        imageInfo.src = value.src
      }
    }

    const socketStore = SocketStore.injector()
    const uploadAndKeyReplace = async (uploadMediaInfoList: UploadMediaInfo[], imageInfo: ImageInfo) => {
      const resultList = await socketStore.sendSocketServerRoundTripRequest<UploadMediaRequest, UploadMediaResponse>(
        'media-api-upload',
        { uploadMediaInfoList, option: {} }
      )
      imageInfo.key = resultList[0].key
    }

    const uploadImages = async (imageInfo: ImageInfo, summary: Summary): Promise<void> => {
      const uploadMediaInfoList: UploadMediaInfo[] = [{
        key: imageInfo.key,
        url: '',
        dataLocation: 'server',
        ...getUrlTypes(imageInfo.name),
        rawPath: getFileName(imageInfo.name),
        tag: 'cut-in',
        name: imageInfo.name,
        arrayBuffer: imageInfo.src
      }]
      await uploadAndKeyReplace(uploadMediaInfoList, imageInfo)
      summary._imageKey = imageInfo.key
    }

    const sendCutIn = (summary: Summary) => {
      const media = mediaListState.list.find(m => m.key === summary._imageKey)
      socketStore.sendSocketClientRequest<{ title: string, text: string, imageUrl: string | null, targetList?: string[] }>(
        'view-cut-in',
        'room',
        {
          title: summary.title,
          text: summary.contents,
          imageUrl: media ? media.data?.url || null : null
        }
      )
    }

    const deleteImage = (summary: Summary) => {
      summary._imageKey = null
    }

    return {
      elmId,
      summaryListWrap,
      isGm,
      viewMode,
      onAdd,
      onDelete,
      onDrag,
      onUpdateImage,
      uploadImages,
      sendCutIn,
      deleteImage
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

.summary-block.ghost {
  opacity: 0.5;
}

.grip-line {
  @include common.flex-box(row, flex-end, center);
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

.summary-contents {
  margin-top: -1px;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  width: 45em;
  max-width: 45em;
  min-width: 45em;
  box-sizing: border-box;
  height: 100%;

  textarea {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 7em;
    font-size: inherit;
    resize: vertical;
  }

  .summary-image :first-child {
    flex: 1;
  }

  @mixin set-column-width($class, $width) {
    .#{$class} {
      width: $width;
      min-width: $width;
      max-width: $width;
    }
  }

  &.summary {
    th {
      width: 6em;
    }

    .secret {
      width: 7em;
    }
  }

  label {
    cursor: pointer;
    width: 100%;
    height: 100%;
    @include common.flex-box(row, center, center);
  }

  caption {
    text-align: center;
    background-color: #252525;
    color: white;
    font-weight: bold;
    font-size: 110%;
  }

  tfoot td {
    text-align: left;
    border: none;
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

  thead tr,
  th {
    background-color: #252525;
    color: white;
  }

  td {
    height: 1.9em;
    text-align: left;
  }

  th {
    text-align: center;
    height: 100%;
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

<template>
  <view-mode
    title="エニグマ"
    :use-simple="isGm"
    :normal-label="isGm ? '通常' : '詳細'"
    :simple-label="'簡易'"
    :alt-label="isGm ? '入替/削除' : '簡易'"
    :editable="mode === 'scenario'"
    v-model:viewMode="viewMode"
    :use-add="true"
    @add="onAdd()"
  />
  <draggable
    :list="enigmaListWrap"
    item-key="idx"
    group="enigma"
    @change="onDrag('change', $event)"
    @start="onDrag('start', $event)"
    @end="onDrag('end', $event)"
    ghost-class="ghost"
    class="draggable-container"
    handle=".grip-line"
  >
    <template #item="{element}">
      <div class="enigma-block">
        <div class="grip-line" v-show="isGm && viewMode === 'alt'">
          <button @click="onDelete(element.idx)">削除</button>
        </div>
        <table class="enigma">
          <tbody>
          <tr>
            <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-name` : ''">偽装</label></th>
            <td class="name" colspan="7">
              <input type="text" :id="`enigma-${element.idx}-name`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.name">
              <template v-else>{{ element.enigma.name }}</template>
            </td>
            <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-power` : ''">戦力</label></th>
            <td class="power" colspan="7">
              <input type="text" :id="`enigma-${element.idx}-power`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.power">
              <template v-else>
                <template v-if="isGm || element.enigma.open">{{ element.enigma.power }}</template>
              </template>
            </td>
          </tr>
          </tbody>
        </table>
        <table class="enigma-contents" v-show="viewMode !== 'alt'">
          <tbody>
          <tr>
            <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-disarmMethod` : ''">解除方法</label></th>
            <td class="disarmMethod">
              <select :id="`enigma-${element.idx}-disarmMethod`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.disarmMethod">
                <option disabled>解除方法</option>
                <option value="">未選択</option>
                <option value="自動">自動</option>
                <option value="判定">判定</option>
                <option value="計画判定">計画判定</option>
              </select>
              <template v-else>
                <template v-if="isGm || element.enigma.open">{{ element.enigma.disarmMethod }}</template>
              </template>
            </td>
            <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-open` : ''">公開</label></th>
            <td class="open">
              <div class="wrap">
                <input type="checkbox" :id="`enigma-${element.idx}-open`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.open">
                <input type="checkbox" v-else :checked="element.enigma.open" @click.prevent>
              </div>
            </td>
            <th class="disarm-th"><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-disarm` : ''">解除</label></th>
            <td class="disarm">
              <div class="wrap">
                <input type="checkbox" :id="`enigma-${element.idx}-disarm`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.disarm">
                <input type="checkbox" v-else :checked="element.enigma.disarm" @click.prevent>
              </div>
            </td>
            <th class="bind-th"><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-target` : ''">バインド</label></th>
            <td class="target">
              <input type="text" :id="`enigma-${element.idx}-target`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.target">
              <template v-else>
                <template v-if="isGm || element.enigma.open">{{ element.enigma.target }}</template>
              </template>
            </td>
          </tr>
          <tr>
            <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-targetSkill` : ''">指定特技</label></th>
            <td class="targetSkill">
              <select v-model="element.enigma.targetSkill" :id="`enigma-${element.idx}-targetSkill`" v-if="isGm && mode === 'scenario'">
                <option value="">未選択</option>
                <template v-for="col of 6" :key="col">
                  <optgroup :label="skillColumnList[col - 1]">
                    <option v-for="row of 11" :key="row" :value="SkillTable[row - 1][col - 1]">{{ SkillTable[row - 1][col - 1] }}</option>
                  </optgroup>
                </template>
              </select>
              <template v-else>
                <template v-if="isGm || element.enigma.open">{{ element.enigma.targetSkill }}</template>
              </template>
            </td>
            <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-menace` : ''">脅威度</label></th>
            <td class="menace" colspan="3">
              <input type="text" :id="`enigma-${element.idx}-menace`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.menace">
              <template v-else>
                <template v-if="isGm || element.enigma.open">{{ element.enigma.menace }}</template>
              </template>
            </td>
            <th class="bind-th"><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-targetId` : ''">バインドPC</label></th>
            <td class="target">
              <input type="text" :id="`enigma-${element.idx}-targetId`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.targetId">
              <template v-else>
                <template v-if="isGm || element.enigma.open">{{ element.enigma.targetId }}</template>
              </template>
            </td>
          </tr>
          <template v-if="viewMode === 'normal'">
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-notes` : ''">説明</label></th>
              <td class="notes" colspan="7">
                <input type="text" :id="`enigma-${element.idx}-notes`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.notes">
                <template v-else>
                  <template v-if="isGm || element.enigma.open">{{ element.enigma.notes }}</template>
                </template>
              </td>
            </tr>
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `enigma-${element.idx}-effect` : ''">効果</label></th>
              <td class="effect" colspan="7">
                <textarea :id="`enigma-${element.idx}-effect`" v-if="isGm && mode === 'scenario'" v-model="element.enigma.effect"></textarea>
                <template v-else>
                  <template v-if="isGm || element.enigma.open">{{ element.enigma.effect }}</template>
                </template>
              </td>
            </tr>
            <tr v-if="isGm">
              <th><label>画像</label></th>
              <td colspan="7">
                <div class="h-box enigma-image">
                  <image-input :image-info="element.imageInfo" type="chit" @update="value => onUpdateEnigmaImage(element.idx, value)" />
                  <button :disabled="element.imageInfo.type !== 'new-file' || !element.imageInfo.name" @click="uploadImages(element)">Image Upload</button>
                </div>
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
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { Enigma, ShinobiGamiScenario } from '@/core/utility/shinobigamiScenario'
import UserStore from '../../core/data/user'
import CharacterStore, { ImageInfo, UploadMediaInfo, UploadMediaRequest, UploadMediaResponse } from '../character/data'
import { removeFilter } from '@/core/utility/typescript'
import SocketStore from '@/core/data/socket'
import MediaListStore, { getUrlTypes } from '@/feature/media-list/data'
import { getFileName } from '@/core/utility/PrimaryDataUtility'
import { v4 as uuidV4 } from 'uuid'
import ImageInput from '@/feature/character/image-input.vue'
import { SkillTable } from '@/core/utility/shinobigami'
import draggable from 'vuedraggable'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import { questionDialog } from '@/core/utility/dialog'

export default defineComponent({
  name: 'scenario-enigma',
  components: { ViewMode, ImageInput, draggable },
  props: {
    mode: {
      type: String as PropType<'scenario' | 'character'>,
      required: true
    },
    sheetInfo: {
      type: Object as PropType<ShinobiGamiScenario>,
      required: true
    }
  },
  setup(props) {
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const characterState = CharacterStore.injector()
    const mediaListState = MediaListStore.injector()

    type WrapEnigma = { idx: number; enigma: Enigma; imageInfo: ImageInfo }
    const makeWrapList = (): WrapEnigma[] => props.sheetInfo.enigma
      .map((enigma, idx) => {
        const media = mediaListState.list.find(m => m.key === enigma.imageKey)
        return {
          idx,
          enigma,
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
      }) || []
    const enigmaListWrap = ref<WrapEnigma[]>([])
    watch(() => props.sheetInfo.enigma, () => {
      enigmaListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const onUpdateEnigmaImage = (idx: number, value: ImageInfo) => {
      const index = enigmaListWrap.value.findIndex(s => s.idx === idx)
      if (index > -1) {
        const imageInfo = enigmaListWrap.value[index].imageInfo
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

    const uploadImages = async (wrapEnigma: WrapEnigma): Promise<void> => {
      const uploadMediaInfoList: UploadMediaInfo[] = [{
        key: wrapEnigma.imageInfo.key,
        url: '',
        dataLocation: 'server',
        ...getUrlTypes(wrapEnigma.imageInfo.name),
        rawPath: getFileName(wrapEnigma.imageInfo.name),
        tag: 'scene-background',
        name: wrapEnigma.imageInfo.name,
        arrayBuffer: wrapEnigma.imageInfo.src
      }]
      await uploadAndKeyReplace(uploadMediaInfoList, wrapEnigma.imageInfo)
      wrapEnigma.enigma.imageKey = wrapEnigma.imageInfo.key
    }

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = () => {
      console.log('emit onAdd')
    }

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: 'エニグマ削除',
        text: `${props.sheetInfo.enigma[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const enigma = props.sheetInfo.enigma
      enigma.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const enigma = props.sheetInfo.enigma
        const target = enigma.splice(evt.oldIndex || 0, 1)[0]
        enigma.splice(evt.newIndex || 0, 0, target)
      }
    }

    return {
      uploadImages,
      onUpdateEnigmaImage,
      enigmaListWrap,
      isGm,
      removeFilter,
      characterList: computed(() => characterState.characterList),
      skillColumnList: ['器術', '体術', '忍術', '謀術', '戦術', '妖術'],
      SkillTable,
      viewMode,
      onAdd,
      onDelete,
      onDrag
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

.enigma-block.ghost {
  opacity: 0.5;
}

.grip-line {
  @include common.flex-box(row, flex-end, center);
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

.enigma-contents {
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

  .enigma-image :first-child {
    flex: 1;
  }

  @mixin set-column-width($class, $width) {
    .#{$class} {
      width: $width;
      min-width: $width;
      max-width: $width;
    }
  }

  &.enigma,
  &.enigma-contents {
    th {
      width: 4em;
      min-width: 4em;
      max-width: 4em;
    }

    @include set-column-width("disarmMethod", 10em);
    @include set-column-width("open", 2em);
    @include set-column-width("disarm", 2em);
    @include set-column-width("disarm-th", 4em);
    @include set-column-width("bind-th", 6em);
    @include set-column-width("power", 14.5em);
    @include set-column-width("menace", 10em);

    .open .wrap,
    .disarm .wrap {
      @include common.flex-box(row, center, center);
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

<template>
  <div class="v-box">
    <view-mode
      v-if="mode !== 'normal'"
      title="背景"
      normal-label="通常"
      :use-simple="true"
      simple-label="簡易"
      alt-label="入替/削除"
      :editable="!isRawViewMode"
      v-model:viewMode="viewMode"
      :use-add="!isRawViewMode"
      @add="addBackground()"
    />
    <draggable
      tag="table"
      :list="backgroundListWrap"
      item-key="idx"
      group="background"
      @change="onDrag('change', $event)"
      @start="onDrag('start', $event)"
      @end="onDrag('end', $event)"
      ghost-class="ghost"
      class="background"
      :class="[mode, isRawViewMode ? 'raw-view' : '']"
      handle=".draggable-handle"
    >
      <template #header>
        <thead>
        <tr>
          <th class="name">名称</th>
          <th class="type" v-show="viewMode !== 'alt'">種別</th>
          <th class="point" v-show="viewMode !== 'alt'">功績点</th>
          <th class="effect" v-show="viewMode === 'normal'">効果</th>
          <th v-if="viewMode === 'alt'">入替</th>
          <th class="delete-btn" v-if="viewMode === 'alt'">削除</th>
        </tr>
        </thead>
      </template>
      <template #item="{element}">
        <tbody>
        <tr>
          <td class="name">
            <span>
              <template v-if="isRawViewMode">{{ element.background.name }}</template>
              <input v-else type="text" v-model="element.background.name">
            </span>
          </td>
          <td class="type" v-show="viewMode !== 'alt'">
            <span>
              <template v-if="isRawViewMode">{{ element.background.type }}</template>
              <select v-model="element.background.type" v-else>
                <option value="長所">長所</option>
                <option value="弱点">弱点</option>
              </select>
            </span>
          </td>
          <td class="point" v-show="viewMode !== 'alt'">
            <span>
              <template v-if="isRawViewMode">{{ element.background.point }}</template>
              <input type="text" v-model="element.background.point" v-else>
            </span>
          </td>
          <td class="effect" v-show="viewMode === 'normal'">
            <template v-if="isRawViewMode">{{ element.background.effect }}</template>
            <textarea v-model="element.background.effect" v-else></textarea>
          </td>
          <td v-if="viewMode === 'alt'" class="draggable-handle"></td>
          <td v-if="viewMode === 'alt'"><button @click="onDelete(element.idx)">削除</button></td>
        </tr>
        </tbody>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { Background, ShinobiGami, ShinobigamiHelper } from '@/core/utility/shinobigami'
import UserStore from '@/core/data/user'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { questionDialog } from '@/core/utility/dialog'

export default defineComponent({
  name: 'background-table',
  components: { ViewMode, draggable },
  props: {
    mode: {
      type: String as PropType<'update' | 'insert'>,
      require: true
    },
    sheetInfo: {
      type: Object as PropType<ShinobiGami>,
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
    }
  },
  setup(props) {
    const reloadBackground = async () => {
      const helper = new ShinobigamiHelper(props.url, props.sheetViewPass)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) return
      const backgroundList = props.sheetInfo.backgroundList
      backgroundList.splice(0, backgroundList.length, ...rd.backgroundList)
    }

    const addBackground = () => {
      const backgroundList = props.sheetInfo.backgroundList
      backgroundList.push({
        name: '',
        type: '長所',
        point: '',
        effect: ''
      })
    }

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))
    const isRawViewMode = computed(() => props.mode !== 'insert' && !isGm.value && !isOwn.value)

    type WrapBackground = { idx: number; background: Background; }
    const makeWrapList = (): WrapBackground[] => props.sheetInfo.backgroundList.map((background, idx) => ({ idx, background })) || []
    const backgroundListWrap = ref<WrapBackground[]>([])
    watch(() => props.sheetInfo.backgroundList, () => {
      backgroundListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '背景削除',
        text: `${props.sheetInfo.backgroundList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const backgroundList = props.sheetInfo.backgroundList
      backgroundList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const backgroundList = props.sheetInfo.backgroundList
        const target = backgroundList.splice((evt.oldIndex || 1) - 1, 1)[0]
        backgroundList.splice((evt.newIndex || 1) - 1, 0, target)
      }
    }

    return {
      isRawViewMode,
      reloadBackground,
      addBackground,
      backgroundListWrap,
      viewMode,
      onDelete,
      onDrag
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

.ghost {
  opacity: 0.5;
}

.v-box {
  @include common.flex-box(column, stretch, flex-start);
  gap: 0.5rem
}

h2:deep() {
  &.normal {
    width: calc(var(--sheet-font-size) * (13 + 4 + 4 + 15) + 4px + 1px);
  }
  &.simple {
    width: calc(var(--sheet-font-size) * (13 + 4 + 4) + 3px + 1px);
  }
  &.alt {
    width: calc(var(--sheet-font-size) * (13 + 3 + 4) + 3px + 1px);
  }
}

.draggable-handle {
  min-width: 3em;
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

table.background {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);

  &.raw-view {
    label {
      cursor: default;
    }

    tbody tr {
      cursor: default;
    }
  }

  label {
    cursor: pointer;
  }

  caption {
    text-align: left;
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
    height: 2em;
  }

  thead tr {
    background-color: #252525;
    color: white;
  }

  tbody tr {
    cursor: pointer;
  }

  td, th {
    position: relative;
    text-align: center;
    border-style: solid;
    border-width: 1px;
    border-color: black;
    padding: 0;
    margin: 0;

    > * {
      vertical-align: middle;
    }
  }

  @mixin set-width($width) {
    width: $width;
    min-width: $width;
    max-width: $width;
  }

  @mixin set-label-css($direction, $height, $horizontal: center) {
    > label {
      @include common.flex-box($direction, $horizontal, center);
      height: $height;
    }
  }

  td.name,
  td.effect {
    text-align: left;
  }

  .name {
    white-space: nowrap;
    width: 13em;
  }

  .type {
    white-space: nowrap;
    width: 4em;
  }

  .point {
    white-space: nowrap;
    width: 4em;
  }

  .effect {
    white-space: break-spaces;
    min-width: 15em;

    textarea {
      width: 100%;
      resize: vertical;
      box-sizing: border-box;
      min-height: 2.5em;
      font-size: inherit;
    }
  }
}
</style>

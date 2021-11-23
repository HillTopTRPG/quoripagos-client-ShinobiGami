<template>
  <view-mode
    title="説明"
    :use-simple="isGm"
    :normal-label="isGm ? '通常' : '詳細'"
    :simple-label="'簡易'"
    :alt-label="isGm ? '入替/削除' : '簡易'"
    :editable="true"
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

export default defineComponent({
  name: 'scenario-summary',
  components: { ViewMode, draggable },
  setup() {
    const scenarioState = ScenarioStore.injector()
    const summaryList = scenarioState.currentScenario.sheetInfo.summary
    const elmId = uuidV4()
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = () => {
      console.log('emit onAdd')
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

    return {
      elmId,
      summaryListWrap,
      isGm,
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

  &.summary {
    th {
      width: 6em;
    }

    .secret {
      width: 3em;
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

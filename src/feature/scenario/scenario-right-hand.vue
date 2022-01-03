<template>
  <view-mode
    :title="mode === 'detail' ? '' : '腹心'"
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
    :list="rightHandListWrap"
    item-key="idx"
    group="right-hand"
    @change="onDrag('change', $event)"
    @start="onDrag('start', $event)"
    @end="onDrag('end', $event)"
    ghost-class="ghost"
    class="draggable-container"
    handle=".grip-line"
  >
    <template #item="{element}">
      <div class="right-hand-block">
        <div class="grip-line" v-show="isGm && viewMode === 'alt'">
          <button @click="onDelete(element.idx)">削除</button>
        </div>
        <table class="right-hand">
          <tbody>
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `right-hand-${element.idx}-name` : ''">腹心</label></th>
              <td class="name">
                <input type="text" :id="`right-hand-${element.idx}-name`" v-if="isGm && mode === 'scenario'" v-model="element.raw.name">
                <template v-else>{{ element.raw.name }}</template>
              </td>
              <th><label :for="isGm && mode === 'scenario' ? `right-hand-${element.idx}-menace` : ''">脅威度</label></th>
              <td class="menace">
                <input type="text" :id="`right-hand-${element.idx}-menace`" v-if="isGm && mode === 'scenario'" v-model="element.raw.menace">
                <template v-else>{{ element.raw.menace }}</template>
              </td>
            </tr>
            <tr v-show="viewMode !== 'alt'">
              <th><label :for="isGm && mode === 'scenario' ? `right-hand-${element.idx}-notes` : ''">説明</label></th>
              <td class="notes">
                <input type="text" :id="`right-hand-${element.idx}-notes`" v-if="isGm && mode === 'scenario'" v-model="element.raw.notes">
                <template v-else>{{ element.raw.notes }}</template>
              </td>
              <th class="has-sheet-th"><label :for="isGm ? `right-hand-${element.idx}-has-sheet` : ''">キャラシ有無</label></th>
              <td class="has-sheet-check">
                <input type="checkbox" :id="`right-hand-${element.idx}-has-sheet`" v-if="isGm" v-model="element.raw._hasSheet">
                <input type="checkbox" v-else :checked="element.raw._hasSheet" @click.prevent>
              </td>
            </tr>
            <tr v-if="isGm && element.raw._hasSheet" v-show="viewMode !== 'alt'">
              <th>キャラシ<br/>閲覧許可PC</th>
              <td class="secret-owner" colspan="3">
                <scenario-jurisdiction-check
                  :types="['pc']"
                  :mode="mode"
                  type="right-hand"
                  :character-key="element.raw._characterKey"
                  :jurisdiction-list="element.raw._sheetOpenList"
                  @push="(type, cKey) => onJurisdictionChecked('sheet-open', type, cKey)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import UserStore from '../../core/data/user'
import CharacterStore from '../character/data'
import { removeFilter } from '@/core/utility/typescript'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { questionDialog } from '@/core/utility/dialog'
import ScenarioStore from '@/feature/scenario/data'
import ScenarioJurisdictionCheck from '@/feature/scenario/scenario-jurisdiction-check.vue'

export default defineComponent({
  name: 'scenario-rightHand',
  components: { ScenarioJurisdictionCheck, ViewMode, draggable },
  props: {
    mode: {
      type: String as PropType<'scenario' | 'character' | 'detail'>,
      required: true
    },
    target: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const scenarioState = ScenarioStore.injector()
    const rightHandList = scenarioState.currentScenario.sheetInfo.righthand
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const characterState = CharacterStore.injector()

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = async () => {
      scenarioState.currentScenario.sheetInfo.righthand.push(({
        _type: 'right-hand',
        menace: '',
        name: '',
        notes: '',
        _characterKey: await characterState.insertEmptyCharacter(),
        _secretCheck: true,
        _hasSheet: false,
        _sheetOpenList: [],
        plot: -2,
        isFumble: false,
        isActed: false,
        chitImageList: [],
        standImageList: [],
        currentChitImage: -1,
        currentStandImage: -1,
        color: '#3E2723'
      }))
    }

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '腹心削除',
        text: `${rightHandList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      rightHandList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const target = rightHandList.splice(evt.oldIndex || 0, 1)[0]
        rightHandList.splice(evt.newIndex || 0, 0, target)
      }
    }

    const {
      rightHandListWrap,
      updateRightHandListWrap
    } = scenarioState.makeWrapLists('right-hand', computed(() => props.target))
    watch(() => props.target, () => updateRightHandListWrap(props.target))

    return {
      rightHandListWrap,
      isGm,
      removeFilter,
      characterList: computed(() => characterState.characterList),
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

@include common.deep("h2") {
  width: calc(var(--sheet-font-size) * 45);
}

.h-box {
  @include common.flex-box(row, flex-start, center);

  input {
    width: auto;
    flex: 1;
  }
}

.menace {
  width: 6em;
}

.has-sheet-th {
  width: 6em;
}

.right-hand-block.ghost {
  opacity: 0.5;
}

.grip-line {
  @include common.flex-box(row, flex-end, center);
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

.right-hand-contents {
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

  tr.space {
    min-height: 0.5em;
    height: 0.5em;
  }

  &.right-hand {
    th {
      width: 6em;
    }

    .secret-owner {
      label {
        @include common.flex-box(row, flex-start, center);
      }
    }
  }

  label {
    cursor: pointer;
    width: 100%;
    height: 100%;
    @include common.flex-box(row, center, center);

    &.secret-owner-label {
      height: auto;
    }
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

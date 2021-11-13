<template>
  <view-mode
    title="PC"
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
    :list="pcListWrap"
    item-key="idx"
    group="pc"
    @change="onDrag('change', $event)"
    @start="onDrag('start', $event)"
    @end="onDrag('end', $event)"
    ghost-class="ghost"
    class="draggable-container"
    handle=".grip-line"
  >
    <template #item="{element}">
      <div class="pc-block">
        <div class="grip-line" v-show="isGm && viewMode === 'alt'">
          <button @click="onDelete(element.idx)">削除</button>
        </div>
        <table class="pc">
          <tbody>
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-name` : ''">PC</label></th>
              <td class="name">
                <input type="text" :id="`pc-${element.idx}-name`" v-if="isGm && mode === 'scenario'" v-model="element.pc.name">
                <template v-else>{{ element.pc.name }}</template>
              </td>
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-recommend` : ''">推奨</label></th>
              <td class="recommend">
                <input type="text" :id="`pc-${element.idx}-recommend`" v-if="isGm && mode === 'scenario'" v-model="element.pc.recommend">
                <template v-else>{{ element.pc.recommend }}</template>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-intro` : ''">導入</label></th>
              <td class="intro" colspan="3">
                <textarea :id="`pc-${element.idx}-intro`" v-if="isGm && mode === 'scenario'" v-model="element.pc.intro"></textarea>
                <template v-else>{{ element.pc.intro }}</template>
              </td>
            </tr>
            <tr v-show="viewMode !== 'alt'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-mission` : ''">使命</label></th>
              <td class="mission" colspan="3">
                <input type="text" :id="`pc-${element.idx}-mission`" v-if="isGm && mode === 'scenario'" v-model="element.pc.mission">
                <template v-else>{{ element.pc.mission }}</template>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-secret` : ''">秘密</label></th>
              <td class="secret" colspan="3">
                <textarea :id="`pc-${element.idx}-secret`" v-if="isGm && mode === 'scenario'" v-model="element.pc.secret"></textarea>
                <template v-else>
                  <template v-if="isOpen(element.pc.openList) || isGm || isOwn">{{ element.pc.secret }}</template>
                </template>
              </td>
            </tr>
            <tr v-if="mode === 'scenario'" v-show="viewMode !== 'alt'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-characterKey` : ''">割り当て</label></th>
              <td class="owner" colspan="3">
                <label>
                  <select :id="`pc-${element.idx}-characterKey`" v-if="isGm && mode === 'scenario'" v-model="element.pc.characterKey">
                    <option value="">選択なし</option>
                    <option :value="c.key" v-for="c in characterList" :key="c.key">{{ c.data?.sheetInfo.characterName }}</option>
                  </select>
                  <template v-else>{{ characterList.find(c => c.key === element.pc.characterKey)?.data?.sheetInfo.characterName || '選択なし' }}</template>
                </label>
              </td>
            </tr>
            <tr v-show="viewMode !== 'alt'">
              <th>秘密保有</th>
              <td class="secret-owner" colspan="3">
                <template v-for="c in characterList" :key="c.key">
                  <template v-if="c.key !== element.pc.characterKey">
                    <label>
                      <input type="checkbox" v-if="isGm" :checked="element.pc.openList?.some(o => o === c.key)" @change.prevent="$event.target.checked ? element.pc.openList.push(c.key) : removeFilter(element.pc.openList, i => i === c.key)">
                      <input type="checkbox" v-else :checked="element.pc.openList?.some(o => o === c.key)" @click.prevent>
                      <span>{{ c.data?.sheetInfo.characterName }}</span>
                    </label>
                  </template>
                </template>
                <template v-if="!characterList.filter(c => c.key !== element.pc.characterKey).length">
                  <template v-if="mode === 'scenario'">選択肢なし</template>
                  <template v-if="mode === 'character'">なし</template>
                </template>
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
import { PC } from '@/core/utility/shinobigamiScenario'
import UserStore from '../../core/data/user'
import CharacterStore from '../character/data'
import { removeFilter } from '@/core/utility/typescript'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { questionDialog } from '@/core/utility/dialog'

export default defineComponent({
  name: 'scenario-pc',
  components: { ViewMode, draggable },
  props: {
    mode: {
      type: String as PropType<'scenario' | 'character'>,
      required: true
    },
    characterKey: {
      type: String,
      default: null
    },
    pcList: {
      type: Array as PropType<PC[]>,
      required: true
    }
  },
  setup(props) {
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))

    const characterState = CharacterStore.injector()

    type WrapPc = { idx: number; pc: PC; }
    const makeWrapList = (): WrapPc[] => props.pcList.filter(pc => props.characterKey ? pc.characterKey === props.characterKey : true).map((pc, idx) => ({ idx, pc })) || []
    const pcListWrap = ref<WrapPc[]>([])
    watch(() => props.pcList, () => {
      pcListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = () => {
      console.log('emit onAdd')
    }

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: 'PC削除',
        text: `${props.pcList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const pcList = props.pcList
      pcList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const pcList = props.pcList
        const target = pcList.splice(evt.oldIndex || 0, 1)[0]
        pcList.splice(evt.newIndex || 0, 0, target)
      }
    }

    return {
      pcListWrap,
      isGm,
      isOwn,
      removeFilter,
      characterList: computed(() => characterState.characterList),
      isOpen: (openList: string[]) => userState.selfUser?.refList.some(r => openList.some(o => o === r.key)),
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

.pc-block.ghost {
  opacity: 0.5;
}

.grip-line {
  @include common.flex-box(row, flex-end, center);
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

.pc-contents {
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

  &.pc,
  &.npc {
    th {
      width: 4em;
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

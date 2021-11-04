<template>
  <view-mode
    title="NPC"
    :use-simple="isGm"
    :normal-label="isGm ? '通常' : '詳細'"
    :simple-label="'簡易'"
    :alt-label="isGm ? '削除／入替' : '簡易'"
    :editable="mode === 'scenario'"
    v-model:viewMode="viewMode"
    :use-add="true"
    @add="onAdd()"
  />
  <draggable
    :list="npcListWrap"
    item-key="idx"
    group="npc"
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
        <table class="npc" v-if="isGm || npcListWrap.some(n => !n.npc.secretcheck)">
          <tbody>
            <template v-if="isGm || !element.npc.secretcheck">
              <tr>
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-name` : ''">NPC</label></th>
                <td class="name">
                  <input type="text" :id="`npc-${element.idx}-name`" v-if="isGm && mode === 'scenario'" v-model="element.npc.name">
                  <template v-else>{{ element.npc.name }}</template>
                </td>
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-recommend` : ''">概要</label></th>
                <td class="recommend">
                  <input type="text" :id="`npc-${element.idx}-recommend`" v-if="isGm && mode === 'scenario'" v-model="element.npc.recommend">
                  <template v-else>{{ element.npc.recommend }}</template>
                </td>
              </tr>
              <tr v-show="viewMode === 'normal'">
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-intro` : ''">設定</label></th>
                <td class="intro" colspan="3">
                  <textarea :id="`npc-${element.idx}-intro`" v-if="isGm && mode === 'scenario'" v-model="element.npc.intro"></textarea>
                  <template>{{ element.npc.intro }}</template>
                </td>
              </tr>
              <tr v-show="viewMode !== 'alt'">
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-mission` : ''">使命</label></th>
                <td class="mission">
                  <input type="text" :id="`npc-${element.idx}-mission`" v-if="isGm && mode === 'scenario'" v-model="element.npc.mission">
                  <template v-else>{{ element.npc.mission }}</template>
                </td>
                <th><label :for="isGm ? `npc-${element.idx}-secretcheck` : ''">秘匿</label></th>
                <td class="secret-check">
                  <input type="checkbox" :id="`npc-${element.idx}-secretcheck`" v-if="isGm" v-model="element.npc.secretcheck">
                  <input type="checkbox" v-else :checked="element.npc.secretcheck" @click.prevent>
                </td>
              </tr>
              <tr v-show="viewMode === 'normal'">
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-secret` : ''">秘密</label></th>
                <td class="secret" colspan="3">
                  <textarea :id="`npc-${element.idx}-secret`" v-if="isGm && mode === 'scenario'" v-model="element.npc.secret"></textarea>
                  <template v-else>
                    <template v-if="isOpen(element.npc.openList) || isGm">{{ element.npc.secret }}</template>
                  </template>
                </td>
              </tr>
              <tr v-show="viewMode === 'normal'">
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-url` : ''">URL</label></th>
                <td class="url" colspan="3">
                  <input type="text" :id="`npc-${element.idx}-url`" v-if="isGm && mode === 'scenario'" v-model="element.npc.url" placeholder="キャラクターシート倉庫URL">
                  <template v-else>
                    <a v-if="(isOpen(element.npc.sheetOpenList) || isGm) && element.npc.sheetInfo && element.npc.sheetInfo.characterName" :href="element.npc.url" target="_blank" rel="noopener noreferrer">{{ element.npc.sheetInfo.characterName }}</a>
                  </template>
                </td>
              </tr>
              <tr v-if="isGm && mode === 'scenario'" v-show="viewMode === 'normal'">
                <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-sheetViewPass` : ''">秘匿情報閲覧パス</label></th>
                <td class="sheet-view-pass">
                  <div class="h-box">
                    <input type="text" :id="`npc-${element.idx}-sheetViewPass`" v-model="element.npc.sheetViewPass">
                    <button @click="onReadNpcSheet(element.npc.name)" :disabled="!element.npc.url.trim()">読込</button>
                  </div>
                </td>
                <th>リンク</th>
                <td class="npc-link">
                  <a v-if="element.npc.sheetInfo && element.npc.sheetInfo.characterName" :href="element.npc.sheetInfo.url" target="_blank" rel="noopener noreferrer">{{ element.npc.sheetInfo.characterName }}</a>
                </td>
              </tr>
              <tr v-if="!element.npc.secretcheck && isGm" v-show="viewMode !== 'alt'">
                <th>キャラシ閲覧</th>
                <td class="secret-owner" colspan="3">
                  <label v-for="c in characterList" :key="c.key">
                    <input type="checkbox" :checked="element.npc.sheetOpenList?.some(o => o === c.key)" @change.prevent="$event.target.checked ? element.npc.sheetOpenList.push(c.key) : removeFilter(element.npc.sheetOpenList, i => i === c.key)">
                    <span>{{ c.data?.sheetInfo.characterName }}</span>
                  </label>
                </td>
              </tr>
              <tr v-if="!element.npc.secretcheck" v-show="viewMode !== 'alt'">
                <th>秘密保有</th>
                <td class="secret-owner" colspan="3">
                  <label v-for="c in characterList" :key="c.key">
                    <input type="checkbox" v-if="isGm" :checked="element.npc.openList?.some(o => o === c.key)" @change.prevent="$event.target.checked ? element.npc.openList.push(c.key) : removeFilter(element.npc.openList, i => i === c.key)">
                    <input type="checkbox" v-else :checked="element.npc.openList?.some(o => o === c.key)" @click.prevent>
                    <span>{{ c.data?.sheetInfo.characterName }}</span>
                  </label>
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
import { NPC } from '@/core/utility/shinobigamiScenario'
import UserStore from '../../core/data/user'
import CharacterStore from '../character/data'
import { removeFilter } from '@/core/utility/typescript'
import { ShinobigamiHelper } from '@/core/utility/shinobigami'
import { errorDialog, questionDialog } from '@/core/utility/dialog'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'

export default defineComponent({
  name: 'scenario-npc',
  components: { ViewMode, draggable },
  props: {
    mode: {
      type: String as PropType<'scenario' | 'character'>,
      required: true
    },
    npcName: {
      type: String,
      default: null
    },
    npcList: {
      type: Array as PropType<NPC[]>,
      required: true
    }
  },
  setup(props) {
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const characterState = CharacterStore.injector()

    const onReadNpcSheet = async (npcName: string) => {
      const npc = props.npcList.find(n => n.name === npcName)
      if (!npc) return

      const helper = new ShinobigamiHelper(npc.url, npc.sheetViewPass)
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

      if (npc.sheetInfo) {
        const result = await questionDialog({
          title: '上書き確認',
          text: `'${npc.name}'のキャラクターシート情報を上書きしますか？`,
          confirmButtonText: '上書き',
          cancelButtonText: 'キャンセル'
        })
        if (!result) return
      }
      npc.sheetInfo = rd
    }

    type WrapNpc = { idx: number; npc: NPC; }
    const makeWrapList = (): WrapNpc[] => props.npcList.filter(npc => props.npcName ? npc.name === props.npcName : true).map((npc, idx) => ({ idx, npc })) || []
    const npcListWrap = ref<WrapNpc[]>([])
    watch(() => props.npcList, () => {
      npcListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = () => {
      console.log('emit onAdd')
    }

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: 'NPC削除',
        text: `${props.npcList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const npcList = props.npcList
      npcList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const npcList = props.npcList
        const target = npcList.splice(evt.oldIndex || 0, 1)[0]
        npcList.splice(evt.newIndex || 0, 0, target)
      }
    }

    return {
      onReadNpcSheet,
      npcListWrap,
      isGm,
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

.npc-block.ghost {
  opacity: 0.5;
}

.grip-line {
  @include common.flex-box(row, flex-end, center);
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

.npc-contents {
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

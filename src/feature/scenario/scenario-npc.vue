<template>
  <view-mode
    title="NPC"
    :class="mode"
    :use-simple="true"
    :normal-label="isGm ? '通常' : '詳細'"
    :simple-label="'簡易'"
    :alt-label="isGm ? '入替/削除' : '簡易'"
    :editable="mode === 'scenario'"
    v-model:viewMode="viewMode"
    :use-add="isGm"
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
        <table class="npc" v-if="isGm || npcListWrap.some(n => !n.raw.secretcheck)">
          <tbody>
          <template v-if="isGm || !element.raw.secretcheck">
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-name` : ''">NPC</label></th>
              <td class="name">
                <input type="text" :id="`npc-${element.idx}-name`" v-if="isGm && mode === 'scenario'" v-model="element.raw.name">
                <template v-else>{{ element.raw.name }}</template>
              </td>
              <th><label :for="isGm ? `npc-${element.idx}-secretcheck` : ''">秘匿</label></th>
              <td class="secret-check">
                <input type="checkbox" :id="`npc-${element.idx}-secretcheck`" v-if="isGm" v-model="element.raw.secretcheck">
                <input type="checkbox" v-else :checked="element.raw.secretcheck" @click.prevent>
              </td>
            </tr>
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-recommend` : ''">概要</label></th>
              <td class="recommend" :colspan="isGm || getChitStatus(element.raw).isSheetShow ? 1 : 3">
                <input type="text" :id="`npc-${element.idx}-recommend`" v-if="isGm && mode === 'scenario'" v-model="element.raw.recommend">
                <template v-else>{{ element.raw.recommend }}</template>
              </td>
              <th v-if="isGm || getChitStatus(element.raw).isSheetShow"><label :for="isGm ? `npc-${element.idx}-has-sheet` : ''">キャラシ有無</label></th>
              <td v-if="isGm || getChitStatus(element.raw).isSheetShow" class="has-sheet-check">
                <input type="checkbox" :id="`npc-${element.idx}-has-sheet`" v-if="isGm" v-model="element.raw._hasSheet">
                <input type="checkbox" v-else :checked="element.raw._hasSheet" @click.prevent>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-intro` : ''">設定</label></th>
              <td class="intro" :colspan="3">
                <textarea :id="`npc-${element.idx}-intro`" v-if="isGm && mode === 'scenario'" v-model="element.raw.intro"></textarea>
                <template>{{ element.raw.intro }}</template>
              </td>
            </tr>
            <tr v-show="viewMode !== 'alt'">
              <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-mission` : ''">使命</label></th>
              <td class="mission" :colspan="3">
                <input type="text" :id="`npc-${element.idx}-mission`" v-if="isGm && mode === 'scenario'" v-model="element.raw.mission">
                <template v-else>{{ element.raw.mission }}</template>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th><label :for="isGm && mode === 'scenario' ? `npc-${element.idx}-secret` : ''">秘密</label></th>
              <td class="secret" :colspan="3">
                <textarea :id="`npc-${element.idx}-secret`" v-if="isGm && mode === 'scenario'" v-model="element.raw.secret"></textarea>
                <template v-else>
                  <template v-if="isGm || getChitStatus(element.raw).isSecretOpen">{{ element.raw.secret }}</template>
                </template>
              </td>
            </tr>
            <tr v-if="!element.raw.secretcheck && element.raw._hasSheet && isGm" v-show="viewMode !== 'alt'">
              <th>キャラシ<br/>閲覧許可PC</th>
              <td class="secret-owner" :colspan="3">
                <scenario-jurisdiction-check
                  :types="['pc']"
                  :mode="mode"
                  type="npc"
                  :character-key="element.raw._characterKey"
                  :jurisdiction-list="element.raw._sheetOpenList"
                />
              </td>
            </tr>
            <tr v-if="!element.raw.secretcheck" v-show="viewMode !== 'alt'">
              <th>この秘密の保持者</th>
              <td class="secret-owner" :colspan="3">
                <scenario-jurisdiction-check
                  :types="['pc', 'npc']"
                  :mode="mode"
                  type="npc"
                  :character-key="element.raw._characterKey"
                  :jurisdiction-list="element.raw._openList"
                />
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
import { questionDialog } from '@/core/utility/dialog'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import ScenarioStore from '@/feature/scenario/data'
import ScenarioJurisdictionCheck from '@/feature/scenario/scenario-jurisdiction-check.vue'

export default defineComponent({
  name: 'scenario-npc',
  components: { ScenarioJurisdictionCheck, ViewMode, draggable },
  props: {
    mode: {
      type: String as PropType<'scenario' | 'character'>,
      required: true
    },
    target: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const scenarioState = ScenarioStore.injector()
    const npcList = scenarioState.currentScenario.sheetInfo.npc
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const characterState = CharacterStore.injector()

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = async () => {
      scenarioState.currentScenario.sheetInfo.npc.push(({
        _type: 'npc',
        intro: '',
        mission: '',
        name: '',
        recommend: '',
        secret: '',
        secretcheck: true,
        _openList: [],
        _characterKey: await characterState.insertEmptyCharacter(),
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
        title: 'NPC削除',
        text: `${npcList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      npcList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const target = npcList.splice(evt.oldIndex || 0, 1)[0]
        npcList.splice(evt.newIndex || 0, 0, target)
      }
    }

    const {
      npcListWrap,
      updateNpcListWrap
    } = scenarioState.makeWrapLists('npc', computed(() => props.target))
    watch(() => props.target, () => updateNpcListWrap(props.target))

    return {
      npcListWrap,
      isGm,
      removeFilter,
      characterList: computed(() => characterState.characterList),
      getChitStatus: (npc: NPC) => scenarioState.getChitStatus('npc', npc._characterKey, userState.selfUser?.key || null),
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

h2:deep() {
  width: calc(var(--sheet-font-size) * 45);
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

.secret-check {
  width: 3em;
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

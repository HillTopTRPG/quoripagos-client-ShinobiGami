<template>
  <div v-if="mode === 'normal' && (isGm || isOwn)" class="h-box">
    <template v-for="ninjaTool in ninjaToolListWrap" :key="ninjaTool.idx">
      <div class="ninja-tool-chip" v-for="n of ninjaTool.ninjaTool.count" :key="n">
        <span class="header">
          <span class="type">忍具</span>
          <span class="name">{{ ninjaTool.ninjaTool.name }}</span>
        </span>
        <template v-if="isGm || isOwn">
          <button @click="onViewContents(ninjaTool.idx)">内容確認</button>
          <button @click="onUseTool(ninjaTool.idx)">使う</button>
          <select @change="onSelectPresentTarget($event, ninjaTool.idx)" :value="''">
            <option value="" disabled>渡し先</option>
            <option :value="p.key" v-for="p in presentList" :key="p.key">{{ p.name }}</option>
          </select>
        </template>
      </div>
    </template>
  </div>
  <div v-if="mode !== 'normal'" class="v-box">
    <view-mode
      title="忍具"
      normal-label="通常"
      :use-simple="true"
      simple-label="簡易"
      alt-label="入替/削除"
      :editable="!isRawViewMode"
      v-model:viewMode="viewMode"
      :use-add="!isRawViewMode"
      @add="addNinjaTool()"
    />
    <draggable
      tag="table"
      :list="ninjaToolListWrap"
      item-key="idx"
      group="ninja-tools"
      @change="onDrag('change', $event)"
      @start="onDrag('start', $event)"
      @end="onDrag('end', $event)"
      ghost-class="ghost"
      class="ninja-tools"
      :class="[mode, isRawViewMode ? 'raw-view' : '']"
      handle=".draggable-handle"
    >
      <template #header>
        <thead>
        <tr>
          <th class="name">名称</th>
          <th class="num" v-show="viewMode !== 'alt'">個数</th>
          <th class="effect" v-show="viewMode === 'normal'">効果</th>
          <th class="draggable-handle" v-if="viewMode === 'alt'">入替</th>
          <th class="delete-btn" v-if="viewMode === 'alt'">削除</th>
        </tr>
        </thead>
      </template>
      <template #item="{element}">
        <tbody>
        <tr>
          <td class="name">
            <span>
              <template v-if="isRawViewMode">{{ element.ninjaTool.name }}</template>
              <input type="text" v-model="element.ninjaTool.name" v-else>
            </span>
          </td>
          <td class="count" v-show="viewMode !== 'alt'">
            <span>
              <template v-if="isRawViewMode">{{ element.ninjaTool.count }}</template>
              <input type="number" v-model="element.ninjaTool.count" v-else>
            </span>
          </td>
          <td class="effect" v-show="viewMode === 'normal'">
            <template v-if="isRawViewMode">{{ element.ninjaTool.effect }}</template>
            <textarea v-model="element.ninjaTool.effect" v-else></textarea>
          </td>
          <td v-if="viewMode === 'alt'" class="draggable-handle"></td>
          <td v-if="viewMode === 'alt'" class="delete-btn"><button @click="onDelete(element.idx)">削除</button></td>
        </tr>
        </tbody>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { NinjaTool, ShinobiGami, ShinobigamiHelper } from '@/core/utility/shinobigami'
import UserStore from '@/core/data/user'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { cutInDialog, questionDialog } from '@/core/utility/dialog'
import ScenarioStore from '@/feature/scenario/data'
import CharacterStore from '@/feature/character/data'
import ChatListStore from '@/feature/chat-list/data'
import { clone } from '@/core/utility/typescript'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const escape = require('escape-html')

export default defineComponent({
  name: 'ninja-tool-table',
  components: { ViewMode, draggable },
  props: {
    type: {
      type: String as PropType<'pc' | 'npc' | 'right-hand'>,
      required: true
    },
    target: {
      type: String,
      default: null
    },
    mode: {
      type: String as PropType<'normal' | 'update'>,
      require: true
    }
  },
  setup(props) {
    const scenarioState = ScenarioStore.injector()
    const characterState = CharacterStore.injector()
    const userState = UserStore.injector()
    const chatListState = ChatListStore.injector()

    const getFromName = (): string => {
      let fromName = ''
      if (props.type === 'pc') {
        const pc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.find(p => p._characterKey === props.target)
        const character = characterState.characterList.find(c => c.key === props.target)
        fromName = `PC ${pc?.name || ''} ${character?.data?.sheetInfo.characterName || ''}`
      }
      if (props.type === 'npc') {
        const npc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.find(p => p._characterKey === props.target)
        fromName = `NPC ${npc?.name || ''}`
      }
      if (props.type === 'right-hand') {
        const rightHand = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.find(p => p._characterKey === props.target)
        fromName = `腹心 ${rightHand?.name || ''}`
      }
      return fromName
    }

    const presentList = ref<{ name: string, key: string }[]>([])
    const onSelectPresentTarget = async (event: { target: HTMLSelectElement }, toolIndex: number) => {
      const fromName: string = getFromName()
      const ninjaTool = sheetInfoWrap.value?.ninjaToolList[toolIndex]
      if (!ninjaTool) {
        alert('指定された忍具は存在しません')
        return
      }

      const toCharacter = characterState.characterList.find(c => c.key === event.target.value)
      const ninjaToolList = toCharacter?.data?.sheetInfo.ninjaToolList
      if (!ninjaToolList) {
        alert('渡す先がいません')
        return
      }

      const targetName = presentList.value.find(p => p.key === event.target.value)?.name || ''

      if ((await questionDialog({
        title: '忍具を渡す',
        text: `${targetName}に「${ninjaTool.name}」を渡します。`,
        confirmButtonText: '渡す',
        cancelButtonText: 'キャンセル'
      }))) {
        ninjaTool.count--
        const toNinjaTool = ninjaToolList.find(n => n.name === ninjaTool.name)
        if (toNinjaTool) {
          toNinjaTool.count++
        } else {
          const ninjaToolNew = clone(ninjaTool)
          ninjaToolNew.count = 1
          ninjaToolList.push(ninjaToolNew)
        }

        await chatListState.insertData({
          raw: `${fromName}が${targetName}に「${ninjaTool.name}」を渡しました。`,
          diceRaw: null,
          tag: [''],
          tab: '',
          type: 'system',
          diceType: null,
          fromType: props.type,
          from: props.target,
          diceRollResult: null,
          rands: null
        })
      }

      setTimeout(() => {
        event.target.value = ''
      })
    }

    const sheetViewPass = ref('')
    const sheetInfoWrap = ref<ShinobiGami | null>(null)
    watch(() => characterState.characterList.find(c => c.key === props.target)?.data, (data) => {
      sheetViewPass.value = data?.sheetViewPass || ''
      sheetInfoWrap.value = data?.sheetInfo || null
    }, { immediate: true, deep: true })

    const isRawViewMode = ref(false)
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = ref(false)
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma
    ], () => {
      const { isOwn: isOwnRaw } = scenarioState.getChitStatus(
        props.type,
        props.target,
        userState.selfUser?.key || null
      )
      isOwn.value = isOwnRaw
      isRawViewMode.value = props.mode !== 'update' || (userState.selfUser?.type !== 'gm' && !isOwnRaw)
      const pcList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc
        .filter(p => p._characterKey !== props.target)
        .map(p => ({ name: `PC ${p.name} ${characterState.characterList.find(c => c.key === p._characterKey)?.data?.sheetInfo.characterName || ''}`, key: p._characterKey })) || []
      const npcList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc
        .filter(p => p._characterKey !== props.target)
        .map(p => ({ name: `NPC ${p.name}`, key: p._characterKey })) || []
      const rightHandList = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand
        .filter(p => p._characterKey !== props.target)
        .map(p => ({ name: `腹心 ${p.name}`, key: p._characterKey })) || []
      presentList.value = pcList.concat(...npcList).concat(...rightHandList)
    }, { immediate: true, deep: true })

    const reloadNinjaTool = async () => {
      const helper = new ShinobigamiHelper(sheetInfoWrap.value?.url || '', sheetViewPass.value)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd } = await helper.getData()
      if (!rd) return
      const ninjaToolList = sheetInfoWrap.value?.ninjaToolList
      ninjaToolList?.splice(0, ninjaToolList?.length || 0, ...rd.ninjaToolList)
    }
    const addNinjaTool = () => {
      const ninjaToolList = sheetInfoWrap.value?.ninjaToolList
      ninjaToolList?.push({
        name: '',
        count: 0,
        effect: ''
      })
    }

    type WrapNinjaTool = { idx: number; ninjaTool: NinjaTool; }
    const makeWrapList = (): WrapNinjaTool[] => sheetInfoWrap.value?.ninjaToolList.map((ninjaTool, idx) => ({ idx, ninjaTool })) || []
    const ninjaToolListWrap = ref<WrapNinjaTool[]>([])
    watch(() => sheetInfoWrap.value?.ninjaToolList, () => {
      ninjaToolListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '忍具削除',
        text: `${sheetInfoWrap.value?.ninjaToolList[idx].name || ''}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const ninjaToolList = sheetInfoWrap.value?.ninjaToolList
      ninjaToolList?.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const ninjaToolList = sheetInfoWrap.value?.ninjaToolList
        const target = ninjaToolList?.splice((evt.oldIndex || 1) - 1, 1)[0]
        if (target) ninjaToolList?.splice((evt.newIndex || 1) - 1, 0, target)
      }
    }

    const onUseTool = async (index: number) => {
      const fromName: string = getFromName()
      const ninjaTool = sheetInfoWrap.value?.ninjaToolList[index]
      if (!ninjaTool) {
        alert('指定された忍具は存在しません')
        return
      }
      if (!(await questionDialog({
        title: '忍具使用',
        text: `「${ninjaTool.name || ''}」を使用します。`,
        confirmButtonText: '使用',
        cancelButtonText: 'キャンセル'
      }))) return
      ninjaTool.count--
      await chatListState.insertData({
        raw: `${fromName}が「${ninjaTool.name}」を使用しました。`,
        diceRaw: null,
        tag: [''],
        tab: '',
        type: 'system',
        diceType: null,
        fromType: props.type,
        from: props.target,
        diceRollResult: null,
        rands: null
      })
    }

    const onViewContents = async (index: number) => {
      const ninjaTool = sheetInfoWrap.value?.ninjaToolList[index]
      if (!ninjaTool) {
        alert('指定された忍具は存在しません')
        return
      }
      await cutInDialog({
        title: `${ninjaTool?.name || ''}`,
        text: [
          '<table>',
          `<tr><th>保有個数</th><td>${ninjaTool?.count}</td></tr>`,
          `<tr><th>効果</th><td>${escape(ninjaTool?.effect?.replaceAll('。', '。\n') || 'なし')}</td></tr>`,
          '</table>'
        ].join('')
      })
    }

    return {
      isGm,
      isOwn,
      isRawViewMode,
      reloadNinjaTool,
      addNinjaTool,
      ninjaToolListWrap,
      viewMode,
      onDelete,
      onDrag,
      onUseTool,
      presentList,
      onSelectPresentTarget,
      onViewContents
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

.h-box {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5rem;
  padding: 0.2rem;
}

.ninja-tool-chip {
  @include common.flex-box(column, stretch, flex-start);
  font-size: var(--sheet-font-size);
  box-shadow: rgba(0, 0, 0, 0.05) 0 6px 24px 0, rgba(0, 0, 0, 0.08) 0 0 0 1px;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.7);
  overflow: hidden;

  .header {
    @include common.flex-box(column, stretch, flex-start);
    background-color: #252525;
    position: relative;
    color: white;
    padding: 0.2rem 0.5rem;

    .type {
      text-align: right;
    }

    .name {
      font-size: 1.4em;
      font-weight: bold;
      padding: 0.2rem 0;
    }
  }

  > * {
    white-space: nowrap;
  }

  button,
  select {
    margin: 0.2rem 0.5rem;
  }
}

@include common.deep("h2") {
  &.normal {
    width: calc(var(--sheet-font-size) * (13 + 5 + 15) + 3px + 1px);
  }
  &.simple {
    width: calc(var(--sheet-font-size) * (13 + 5) + 2px + 1px);
  }
  &.alt {
    width: calc(var(--sheet-font-size) * (13 + 4 + 4) + 3px + 1px);
  }
}

td.draggable-handle {
  min-width: 3em;
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

table.ninja-tools {
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

  td.name {
    text-align: left;
  }
  .name {
    white-space: nowrap;
    @include set-width(13em);
  }

  .num {
    @include set-width(5em);
  }

  td.effect {
    text-align: left;
  }

  .draggable-handle,
  .delete-btn {
    @include set-width(4em);

    button {
      width: 100%;
    }
  }

  .effect {
    white-space: break-spaces;
    @include set-width(15em);

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

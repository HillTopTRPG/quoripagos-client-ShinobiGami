<template>
  <div v-if="mode === 'normal'" class="h-box">
    <template v-for="specialArts in specialArtsListWrap" :key="specialArts.idx">
      <div
        class="special-arts-chip"
        v-if="isGm || isOwn || specialArts.specialArts._openList.some(od => yourPcCharacterKeyList.some(cKey => cKey === od))"
      >
        <span class="header">
          <span class="type">奥義</span>
          <span class="name">{{ specialArts.specialArts.name }}</span>
          <span class="skill">{{ specialArts.specialArts.skill }}</span>
        </span>
        <button @click="onViewContents(specialArts.idx)">内容確認</button>
        <button v-if="isGm || isOwn">使用宣言</button>
        この奥義を知る者(GMのみ変更可能)
        <scenario-jurisdiction-check
          :types="['pc', 'npc', 'right-hand']"
          :mode="mode"
          :type="type"
          :character-key="target"
          :jurisdiction-list="specialArts.specialArts._openList"
          @push="(cType, cKey) => onJurisdictionChecked('special-arts', cType, cKey, specialArts.specialArts)"
        />
      </div>
    </template>
  </div>
  <div v-else class="v-box">
    <view-mode
      v-if="mode !== 'normal'"
      title="奥義"
      normal-label="通常"
      :use-simple="true"
      simple-label="簡易"
      alt-label="入替/削除"
      :editable="!isRawViewMode"
      v-model:viewMode="viewMode"
      :use-add="!isRawViewMode"
      @add="addSpecialArts()"
    />
    <draggable
      tag="table"
      :list="specialArtsListWrap"
      item-key="idx"
      group="special-arts"
      @change="onDrag('change', $event)"
      @start="onDrag('start', $event)"
      @end="onDrag('end', $event)"
      ghost-class="ghost"
      class="special-arts"
      :class="[mode, isRawViewMode ? 'raw-view' : '']"
      handle=".draggable-handle"
    >
      <template #header>
        <thead>
        <tr>
          <th class="name">名称</th>
          <th class="skill" v-show="viewMode !== 'alt'">指定特技</th>
          <th class="effect" v-show="viewMode === 'normal'">効果／強み／弱み</th>
          <th class="direction" v-show="viewMode === 'normal'">演出</th>
          <th class="open-list" v-show="viewMode === 'normal'">知っている人</th>
          <th class="draggable-handle" v-if="viewMode === 'alt'">入替</th>
          <th class="delete-btn" v-if="viewMode === 'alt'">削除</th>
        </tr>
        </thead>
      </template>
      <template #item="{element}">
        <tbody v-if="isGm || isOwn || element.specialArts._openList.some(od => yourPcCharacterKeyList.some(cKey => cKey === od))">
          <tr>
            <td class="name">
              <span>
                <template v-if="isRawViewMode">{{ element.specialArts.name }}</template>
                <input type="text" v-model="element.specialArts.name" v-else>
              </span>
            </td>
            <td class="skill" v-show="viewMode !== 'alt'">
              <span>
                <template v-if="isRawViewMode">{{ element.specialArts.skill }}</template>
                <select v-model="element.specialArts.skill" v-else>
                  <option value=""></option>
                  <option :value="s" v-for="s in skillList" :key="s">{{ s }}</option>
                </select>
              </span>
            </td>
            <td class="effect" v-show="viewMode === 'normal'">
              <template v-if="isRawViewMode">{{ element.specialArts.effect }}</template>
              <textarea v-model="element.specialArts.effect" v-else></textarea>
            </td>
            <td class="direction" v-show="viewMode === 'normal'">
              <template v-if="isRawViewMode">{{ element.specialArts.direction }}</template>
              <textarea v-model="element.specialArts.direction" v-else></textarea>
            </td>
            <td class="open-list" v-show="viewMode === 'normal'">
              <scenario-jurisdiction-check
                :types="['pc', 'npc', 'right-hand']"
                :mode="mode"
                :type="type"
                :character-key="target"
                :jurisdiction-list="element.specialArts._openList"
                @push="(cType, cKey) => onJurisdictionChecked('special-arts', cType, cKey, element.specialArts)"
              />
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
import { ShinobiGami, ShinobigamiHelper, SpecialArts } from '@/core/utility/shinobigami'
import UserStore from '@/core/data/user'
import SocketStore from '@/core/data/socket'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { cutInDialog, questionDialog } from '@/core/utility/dialog'
import ScenarioStore from '@/feature/scenario/data'
import CharacterStore from '@/feature/character/data'
import MediaListStore from '@/feature/media-list/data'
import ScenarioJurisdictionCheck from '@/feature/scenario/scenario-jurisdiction-check.vue'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const escape = require('escape-html')

export default defineComponent({
  name: 'special-arts-table',
  components: { ScenarioJurisdictionCheck, ViewMode, draggable },
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
      type: String as PropType<'normal' | 'view' | 'update' | 'insert'>,
      require: true
    }
  },
  setup(props) {
    const scenarioState = ScenarioStore.injector()
    const characterState = CharacterStore.injector()
    const userState = UserStore.injector()
    const socketStore = SocketStore.injector()
    const mediaListState = MediaListStore.injector()

    const sheetViewPass = ref('')
    const sheetInfoWrap = ref<ShinobiGami | null>(null)
    watch(
      [
        () => props.target,
        () => characterState.characterList
      ], () => {
        const data = characterState.characterList.find(c => c.key === props.target)?.data
        sheetViewPass.value = data?.sheetViewPass || ''
        sheetInfoWrap.value = data?.sheetInfo || null
      },
      { immediate: true, deep: true }
    )

    const isRawViewMode = ref(false)
    const yourPcCharacterKeyList = ref<string[]>([])
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
      yourPcCharacterKeyList.value = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc
        .filter(p => p._userKey === userState.selfUser?.key)
        .map(p => p._characterKey) || []
    }, { immediate: true, deep: true })

    const reloadSpecialArts = async () => {
      const helper = new ShinobigamiHelper(sheetInfoWrap.value?.url || '', sheetViewPass.value)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) return
      const specialArtsList = sheetInfoWrap.value?.specialArtsList
      specialArtsList?.splice(0, specialArtsList?.length || 0, ...rd.specialArtsList)
    }

    const skillList = computed(() => sheetInfoWrap.value?.skill.learnedList.map(l => l.name).filter((s, idx, self) => self.findIndex(ss => ss === s) === idx) || [])

    const addSpecialArts = () => {
      const specialArtsList = sheetInfoWrap.value?.specialArtsList
      specialArtsList?.push({
        name: '',
        skill: skillList.value[0] || '',
        effect: '',
        direction: '',
        _openList: []
      })
    }

    type WrapSpecialArts = { idx: number; specialArts: SpecialArts; }
    const makeWrapList = (): WrapSpecialArts[] => sheetInfoWrap.value?.specialArtsList.map((specialArts, idx) => ({ idx, specialArts })) || []
    const specialArtsListWrap = ref<WrapSpecialArts[]>([])
    watch(() => sheetInfoWrap.value?.specialArtsList, () => {
      specialArtsListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '奥義削除',
        text: `${sheetInfoWrap.value?.specialArtsList[idx].name || ''}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const specialArtsList = sheetInfoWrap.value?.specialArtsList
      specialArtsList?.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const specialArtsList = sheetInfoWrap.value?.specialArtsList
        const target = specialArtsList?.splice((evt.oldIndex || 1) - 1, 1)[0]
        if (target) specialArtsList?.splice((evt.newIndex || 1) - 1, 0, target)
      }
    }

    const onJurisdictionChecked = async (
      pushType: 'special-arts',
      type: 'pc' | 'npc' | 'right-hand',
      characterKey: string,
      specialArts: SpecialArts
    ) => {
      const thisPc = scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === props.target)
      const thisNpc = scenarioState.currentScenario.sheetInfo.npc.find(p => p._characterKey === props.target)
      const thisRightHand = scenarioState.currentScenario.sheetInfo.righthand.find(p => p.name === props.target)
      const pc = scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === characterKey)
      const npc = scenarioState.currentScenario.sheetInfo.npc.find(p => p._characterKey === characterKey)
      const rightHand = scenarioState.currentScenario.sheetInfo.righthand.find(p => p._characterKey === characterKey)
      const thisName = thisPc ? `PC ${thisPc.name}` : thisNpc ? `NPC ${thisNpc.name}` : thisRightHand ? `腹心 ${thisRightHand.name}` : ''
      const name = pc ? `PC ${pc.name}` : npc ? `NPC ${npc.name}` : rightHand ? `腹心 ${rightHand.name}` : ''

      const contents = [
        '<table>',
        `<tr><th>名称</th><td>${specialArts.name}</td></tr>`,
        `<tr><th>指定特技</th><td>${specialArts.skill}</td></tr>`,
        `<tr><th>効果／強み／弱み</th><td>${specialArts.effect || 'なし'}</td></tr>`,
        `<tr><th>演出</th><td>${specialArts.direction || 'なし'}</td></tr>`,
        '</table>'
      ].join('')

      const questionTitle = '奥義情報獲得通知確認'
      const cutInTitle = '奥義情報獲得'
      const questionText = `${name} が ${thisName} の奥義を獲得したことを全員に通知します。`
      const cutInTextParties = `${name} が ${thisName}の奥義を獲得しました。\n\n${contents}`
      const cutInTextOpposite = `${name} が ${thisName}の奥義を獲得しました。`

      if (!await questionDialog({
        title: questionTitle,
        text: questionText,
        confirmButtonText: '表示する',
        cancelButtonText: '表示しない'
      })) return

      const media = mediaListState.list.find(m => m.key === thisPc?.chitImageList[thisPc?.currentChitImage])
      const url = media?.data?.url

      const sendCutIn = async (targetList: string[], text: string) =>
        socketStore.sendSocketClientRequest<{ title: string, text: string, imageUrl: string | null, targetList?: string[] }>(
          'view-cut-in',
          targetList,
          {
            title: cutInTitle,
            text,
            imageUrl: url || null
          }
        )

      const gmSocketIdList = userState.userList
        .filter(u => u.type === 'gm')
        .flatMap(u => u.socketIdList)

      const thisPcSocketIdList = userState.userList
        .filter(u => u.key === thisPc?._userKey)
        .flatMap(u => u.socketIdList)

      const pcSocketIdList = userState.userList
        .filter(u => u.key === pc?._userKey)
        .flatMap(u => u.socketIdList)

      await sendCutIn([...gmSocketIdList, ...thisPcSocketIdList, ...pcSocketIdList], cutInTextParties)

      const otherSocketIdList = userState.userList
        .filter(u => u.key !== pc?._userKey && u.key !== thisPc?._userKey && u.type !== 'gm')
        .flatMap(u => u.socketIdList)

      await sendCutIn(otherSocketIdList, cutInTextOpposite)
    }

    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const onViewContents = async (index: number) => {
      const specialArts = specialArtsListWrap.value[index].specialArts
      await cutInDialog({
        title: `${specialArts?.name || ''}`,
        text: [
          '<table>',
          `<tr><th>指定特技</th><td>${escape(specialArts?.skill)}</td></tr>`,
          `<tr><th>効果／強み／弱み</th><td>${escape(specialArts?.effect || 'なし')}</td></tr>`,
          `<tr><th>演出</th><td>${escape(specialArts?.direction || 'なし')}</td></tr>`,
          '</table>'
        ].join('')
      })
    }

    return {
      isGm,
      isOwn,
      isRawViewMode,
      reloadSpecialArts,
      addSpecialArts,
      skillList,
      specialArtsListWrap,
      viewMode,
      onDelete,
      onDrag,
      onJurisdictionChecked,
      yourPcCharacterKeyList,
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

.special-arts-chip {
  @include common.flex-box(column, stretch, flex-start);
  font-size: var(--sheet-font-size);
  box-shadow: rgba(0, 0, 0, 0.05) 0 6px 10px 0, rgba(0, 0, 0, 0.08) 0 0 0 1px;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.7);
  overflow: hidden;

  .header {
    @include common.flex-box(column, stretch, flex-start);
    background-color: var(--color);
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

    .skill {
      white-space: nowrap;
      text-align: right;
    }
  }

  > * {
    white-space: nowrap;
  }

  button {
    margin: 0.2rem 0.5rem;
  }
}

@include common.deep("h2") {
  &.normal {
    width: calc(var(--sheet-font-size) * (13 + 7 + 10 + 10) + 4px + 1px);
  }
  &.simple {
    width: calc(var(--sheet-font-size) * (13 + 7) + 2px + 1px);
  }
  &.alt {
    width: calc(var(--sheet-font-size) * (13 + 4 + 4) + 3px + 1px);
  }
}

td.draggable-handle {
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

table.special-arts {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  background-color: rgba(255, 255, 255, 0.7);

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

  th {
    white-space: nowrap;
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
    @include set-width(13em);
  }

  .skill {
    white-space: nowrap;
    @include set-width(7em);
  }

  td.effect,
  td.direction {
    text-align: left;
  }

  .draggable-handle,
  .delete-btn {
    @include set-width(4em);

    button {
      width: 100%;
    }
  }

  .effect,
  .direction {
    white-space: break-spaces;
    @include set-width(10em);

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

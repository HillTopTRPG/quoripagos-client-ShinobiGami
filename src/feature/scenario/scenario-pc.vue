<template>
  <view-mode
    :title="mode === 'detail' ? '' : 'PC'"
    :use-simple="true"
    :normal-label="isGm ? '通常' : '詳細'"
    :simple-label="'簡易'"
    :alt-label="'入替/削除'"
    :editable="isGm && mode === 'scenario'"
    v-model:viewMode="viewMode"
    :use-add="isGm && mode === 'scenario'"
    :class="mode"
    @add="onAdd()"
  />
  <draggable
    :list="pcDragListWrap"
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
        <table class="pc" :class="mode">
          <tbody>
            <tr>
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-name` : ''">PC</label></th>
              <td class="name">
                <input type="text" :id="`pc-${element.idx}-name`" v-if="isGm && mode === 'scenario'" v-model="element.raw.name">
                <template v-else>{{ element.raw.name }}</template>
              </td>
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-recommend` : ''">推奨</label></th>
              <td class="recommend">
                <input type="text" :id="`pc-${element.idx}-recommend`" v-if="isGm && mode === 'scenario'" v-model="element.raw.recommend">
                <template v-else>{{ element.raw.recommend }}</template>
              </td>
            </tr>
            <tr v-show="viewMode !== 'alt'">
              <th><label :for="isGm ? `pc-${element.idx}-user` : ''">割り当て<br/>ユーザー</label></th>
              <td class="owner" colspan="3">
                <select v-if="isGm" :id="`pc-${element.idx}-user`" v-model="element.raw._userKey">
                  <option value="">選択なし</option>
                  <template v-for="u in userList" :key="u.key">
                    <option v-if="u.type === 'pl'" :value="u.key">{{ u.name }}</option>
                  </template>
                </select>
                <template v-else>{{
                    userList.find(u => u.key === element.raw._userKey)?.name || '選択なし'
                  }}</template>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-intro` : ''">導入</label></th>
              <td class="intro" colspan="3">
                <textarea :id="`pc-${element.idx}-intro`" v-if="isGm && mode === 'scenario'" v-model="element.raw.intro"></textarea>
                <template v-else>{{ element.raw.intro }}</template>
              </td>
            </tr>
            <tr v-show="viewMode !== 'alt'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-mission` : ''">使命</label></th>
              <td class="mission" colspan="3">
                <input type="text" :id="`pc-${element.idx}-mission`" v-if="isGm && mode === 'scenario'" v-model="element.raw.mission">
                <template v-else>{{ element.raw.mission }}</template>
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th><label :for="isGm && mode === 'scenario' ? `pc-${element.idx}-secret` : ''">秘密</label></th>
              <td class="secret" colspan="3">
                <textarea :id="`pc-${element.idx}-secret`" v-if="isGm && mode === 'scenario'" v-model="element.raw.secret"></textarea>
                <template v-else>
                  <template v-if="isGm || getChitStatus('pc', element.raw._characterKey).isSecretOpen">{{ element.raw.secret }}</template>
                  <template v-else>[あなたはこの秘密を知らない]</template>
                </template>
              </td>
            </tr>
            <template v-for="e in enigmaListWrap" :key="e.raw.name">
              <tr v-show="viewMode === 'normal'" v-if="e.raw._targetId === element.raw._characterKey">
                <th>エニグマ<br/>バインド効果</th>
                <td class="secret" colspan="3">{{ e.raw._effect }}</td>
              </tr>
            </template>
            <tr v-show="viewMode === 'normal'">
              <th>この秘密の<br />保持者<br >(GMのみ変更可)</th>
              <td class="secret-owner" colspan="3">
                <scenario-jurisdiction-check
                  :types="['pc', 'npc', 'right-hand']"
                  :mode="mode"
                  type="pc"
                  :character-key="element.raw._characterKey"
                  :jurisdiction-list="element.raw._secretOpenList"
                  @push="(type, cKey) => onJurisdictionChecked('secret', type, cKey, element.raw._characterKey)"
                />
              </td>
            </tr>
            <tr v-show="viewMode === 'normal'">
              <th>この居所の<br />保持者<br />(GMのみ変更可)</th>
              <td class="secret-owner" colspan="3">
                <scenario-jurisdiction-check
                  :types="['pc', 'npc', 'right-hand']"
                  :mode="mode"
                  type="pc"
                  :character-key="element.raw._characterKey"
                  :jurisdiction-list="element.raw._placementOpenList"
                  @push="(type, cKey) => onJurisdictionChecked('placement', type, cKey, element.raw._characterKey)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </draggable>
  <table class="has-info-table" v-if="target">
    <caption>このPCが知っていること</caption>
    <tr>
      <th class="name">名前</th>
      <th class="where">居所</th>
      <th class="mystery-skill">奥義</th>
      <th class="secret">秘密</th>
    </tr>
    <template v-for="d in pcListWrap" :key="d.raw._characterKey">
      <tr v-if="d.raw._characterKey !== target">
        <td class="name">PC {{ d.raw.name }} {{ d.character.sheetInfo.characterName }}</td>
        <td class="where">{{ d.raw._placementOpenList.some(od => od === target) ? '⭕️' : '' }}</td>
        <td class="mystery-skill">
          <button
            v-if="d.character.sheetInfo.specialArtsList.some(sa => sa._openList.some(od => od === target))"
            @click="viewCutInMysterySkill('pc', d.raw._characterKey)"
          >{{ d.character.sheetInfo.specialArtsList.filter(sa => sa._openList.some(od => od === target)).length }}個</button>
        </td>
        <td class="secret">{{ d.raw._secretOpenList.some(od => od === target) ? isGm || isOwn ? d.raw.secret || '[秘密なし]' : '⭕️' : '' }}</td>
      </tr>
    </template>
    <template v-for="d in npcListWrap" :key="d.raw._characterKey">
      <tr v-if="d.raw._characterKey !== target">
        <td class="name">NPC {{ d.raw.name }}</td>
        <td class="where">{{ d.raw._placementOpenList.some(od => od === target) ? '⭕️' : '' }}</td>
        <td class="mystery-skill">-</td>
        <td class="secret">{{ d.raw._secretOpenList.some(od => od === target) ? isGm || isOwn ? d.raw.secret || '[秘密なし]' : '⭕️' : '' }}</td>
      </tr>
    </template>
    <template v-for="d in rightHandListWrap" :key="d.raw._characterKey">
      <tr v-if="d.raw._characterKey !== target">
        <td class="name">腹心 {{ d.raw.name }}</td>
        <td class="where">-</td>
        <td class="mystery-skill">-</td>
        <td class="secret">-</td>
      </tr>
    </template>
  </table>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import UserStore from '../../core/data/user'
import SocketStore from '../../core/data/socket'
import CharacterStore from '../character/data'
import { removeFilter } from '@/core/utility/typescript'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { cutInDialog, questionDialog } from '@/core/utility/dialog'
import ScenarioStore from '@/feature/scenario/data'
import MediaListStore from '@/feature/media-list/data'
import ScenarioJurisdictionCheck from '@/feature/scenario/scenario-jurisdiction-check.vue'

export default defineComponent({
  name: 'scenario-pc',
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
    const pcList = scenarioState.currentScenario.sheetInfo.pc
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const mediaListState = MediaListStore.injector()
    const socketStore = SocketStore.injector()

    const characterState = CharacterStore.injector()

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onAdd = async () => {
      scenarioState.currentScenario.sheetInfo.pc.push(({
        _type: 'pc',
        intro: '',
        mission: '',
        name: '',
        recommend: '',
        secret: '',
        _secretOpenList: [],
        _placementOpenList: [],
        _userKey: '',
        _characterKey: await characterState.insertEmptyCharacter(),
        prePlot1: -2,
        prePlot2: -2,
        isUsePrePlot2: false,
        prePlotIsReady: 'none',
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
        title: 'PC削除',
        text: `${pcList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      pcList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const target = pcList.splice(evt.oldIndex || 0, 1)[0]
        pcList.splice(evt.newIndex || 0, 0, target)
      }
    }

    const {
      pcListWrap: pcDragListWrap,
      updatePcListWrap
    } = scenarioState.makeWrapLists('pc', computed(() => props.target))
    watch(() => props.target, () => updatePcListWrap(props.target))

    const {
      pcListWrap,
      npcListWrap,
      rightHandListWrap,
      enigmaListWrap
    } = scenarioState.makeWrapLists()

    const isOwn = ref(false)
    watch([
      () => props.target,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc
    ], () => {
      if (props.target) {
        const { isOwn: isOwnRaw } = scenarioState.getChitStatus(
          'pc',
          props.target,
          userState.selfUser?.key || null
        )
        isOwn.value = isOwnRaw
      } else {
        isOwn.value = false
      }
    }, { immediate: true, deep: true })

    const viewCutInMysterySkill = async (
      type: 'pc' | 'npc' | 'right-hand',
      characterKey: string
    ) => {
      const thisPc = scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === props.target)
      const pc = scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === characterKey)
      const npc = scenarioState.currentScenario.sheetInfo.npc.find(p => p._characterKey === characterKey)
      const rightHand = scenarioState.currentScenario.sheetInfo.righthand.find(p => p._characterKey === characterKey)
      const name = pc ? `PC ${pc.name}` : npc ? `NPC ${npc.name}` : rightHand ? `腹心 ${rightHand.name}` : ''
      const character = characterState.characterList.find(c => c.key === characterKey)

      const specialArts = character?.data?.sheetInfo.specialArtsList
        .filter(sa => sa._openList.some(od => od === props.target))
        .map(specialArts => {
          const secretText =
            userState.selfUser?.type === 'gm' ||
            pc?._userKey === userState.selfUser?.key ||
            specialArts._openList
              .map(od => scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === od)?._userKey)
              .some(userKey => userKey === userState.selfUser?.key) ? '' : 'あなたは閲覧できません'
          return [
            '<table>',
            `<tr><th>名称</th><td>${secretText || specialArts.name}</td></tr>`,
            `<tr><th>指定特技</th><td>${secretText || specialArts.skill}</td></tr>`,
            `<tr><th>効果／強み／弱み</th><td>${secretText || specialArts.effect || 'なし'}</td></tr>`,
            `<tr><th>演出</th><td>${secretText || specialArts.direction || 'なし'}</td></tr>`,
            '</table>'
          ].join('')
        })
        .join('') || ''

      const cutInTitle = `${name}の奥義`
      const cutInText = `PC ${thisPc?.name}が知っている奥義\n\n${specialArts}`

      return cutInDialog({
        title: cutInTitle,
        text: cutInText
      })
    }

    const onJurisdictionChecked = async (
      pushType: 'secret' | 'placement' | 'sheet-open',
      type: 'pc' | 'npc' | 'right-hand',
      characterKey: string,
      thisCharacterKey: string
    ) => {
      const thisPc = scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === thisCharacterKey)
      const pc = scenarioState.currentScenario.sheetInfo.pc.find(p => p._characterKey === characterKey)
      const npc = scenarioState.currentScenario.sheetInfo.npc.find(p => p._characterKey === characterKey)
      const rightHand = scenarioState.currentScenario.sheetInfo.righthand.find(p => p._characterKey === characterKey)
      const name = pc ? `PC ${pc.name}` : npc ? `NPC ${npc.name}` : rightHand ? `腹心 ${rightHand.name}` : ''

      let questionTitle: string
      let questionText: string
      let cutInTitle: string
      let cutInTextParties: string
      let cutInTextOpposite: string

      switch (pushType) {
        case 'secret':
          questionTitle = '秘密獲得通知確認'
          cutInTitle = '秘密獲得'
          questionText = `${name} が PC ${thisPc?.name} の秘密を獲得したことを全員に通知します。`
          cutInTextParties = `${name} が PC ${thisPc?.name}の秘密を獲得しました。\n\n${thisPc?.secret || 'なし'}`
          cutInTextOpposite = `${name} が PC ${thisPc?.name}の秘密を獲得しました。`
          break
        case 'placement':
          questionTitle = '居所獲得通知確認'
          questionText = `${name} が PC ${thisPc?.name} の居所を獲得したことを全員に通知します。`
          cutInTitle = '居所獲得'
          cutInTextParties = `${name} が PC ${thisPc?.name}の居所を獲得しました。`
          cutInTextOpposite = `${name} が PC ${thisPc?.name}の居所を獲得しました。`
          break
        default:
          questionTitle = 'キャラシ閲覧許可通知確認'
          questionText = `${name} が PC ${thisPc?.name} のキャラシを閲覧できるようになったことを全員に通知します。`
          cutInTitle = 'キャラシ閲覧許可'
          cutInTextParties = `${name} が PC ${thisPc?.name}のキャラシを閲覧できるようになりました。`
          cutInTextOpposite = `${name} が PC ${thisPc?.name}のキャラシを閲覧できるようになりました。`
          break
      }

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

    return {
      isOwn,
      userList: computed(() => userState.userList),
      pcDragListWrap,
      pcListWrap,
      npcListWrap,
      rightHandListWrap,
      enigmaListWrap,
      isGm,
      removeFilter,
      characterList: computed(() => characterState.characterList),
      getChitStatus: (type: 'pc' | 'npc' | 'right-hand' | 'enigma', target: string) => scenarioState.getChitStatus(type, target, userState.selfUser?.key || null),
      viewMode,
      onAdd,
      onDelete,
      onDrag,
      onJurisdictionChecked,
      viewCutInMysterySkill
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

h2:not(.detail) {
  @include common.deep() {
    width: calc(var(--sheet-font-size) * 45);
    margin-bottom: 0 !important;
  }
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

.has-info-table {
  .name {
    width: 10em;
    white-space: nowrap;
    overflow: hidden;
  }
  .where,
  .mystery-skill {
    width: 4em;
    text-align: center;

    button {
      width: 100%;
    }
  }
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  box-sizing: border-box;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);

  &:not(.detail):not(.has-info-table) {
    width: 45em;
    max-width: 45em;
    min-width: 45em;
  }

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

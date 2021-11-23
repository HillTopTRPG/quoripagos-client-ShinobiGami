<template>
  <div class="v-box">
    <view-mode
      v-if="mode !== 'normal'"
      title="忍法"
      normal-label="通常"
      :use-simple="true"
      simple-label="簡易"
      alt-label="入替/削除"
      :editable="(isGm || isOwn) && (mode === 'update' || mode === 'insert')"
      v-model:viewMode="viewMode"
      :use-add="!isRawViewMode"
      @add="addNinjaArts()"
    />
    <draggable
      tag="table"
      :list="ninjaArtsListWrap"
      item-key="idx"
      group="ninjaArts"
      @change="onDrag('change', $event)"
      @start="onDrag('start', $event)"
      @end="onDrag('end', $event)"
      ghost-class="ghost"
      class="ninja-arts"
      :class="[mode, isRawViewMode ? 'raw-view' : '']"
      handle=".draggable-handle"
    >
      <template #header>
        <thead>
        <tr>
          <th class="secret" v-if="mode === 'update' || mode === 'insert'" :class="{ focused: currentColumn === 'secret' }">秘</th>
          <th class="name" :class="{ focused: currentColumn === 'name' }">忍法名</th>
          <th class="type" v-if="mode !== 'normal'" v-show="viewMode !== 'alt'" :class="{ focused: currentColumn === 'type' }">タイプ</th>
          <th class="target-skill" :class="{ focused: currentColumn === 'target-skill' }">指定特技</th>
          <th class="range" v-show="viewMode !== 'alt'" :class="{ focused: currentColumn === 'range' }">間合</th>
          <th class="cost" v-show="viewMode !== 'alt'" :class="{ focused: currentColumn === 'cost' }">コスト</th>
          <th class="effect" v-if="mode !== 'normal'" v-show="viewMode === 'normal'" :class="{ focused: currentColumn === 'effect' }">効果</th>
          <th class="page" v-if="mode !== 'normal'" v-show="viewMode === 'normal'" :class="{ focused: currentColumn === 'page' }">参照p</th>
          <th v-show="viewMode === 'alt'">入替</th>
          <th class="delete-btn" v-show="viewMode === 'alt'">削除</th>
        </tr>
        </thead>
      </template>
      <template #footer v-if="mode === 'normal' && (isGm || isOwn)">
        <tfoot>
        <tr>
          <td colspan="4">
            <button @click="reloadNinjaArts()">忍法再読み込み</button>
          </td>
        </tr>
        </tfoot>
      </template>
      <template #item="{element}">
        <tbody>
        <tr @click="onSelectArts(element.idx)" v-if="isGm || isOwn || !element.ninjaArts.secret">
          <td class="secret" v-if="mode === 'update' || mode === 'insert'" :class="{ focused: currentColumn === 'secret' }">
            <input type="checkbox" @focus="onFocusColumn($event)" v-if="isGm || isOwn" :id="`secret-${element.idx}-${elmId}`" v-model="element.ninjaArts.secret">
            <input type="checkbox" @focus="onFocusColumn($event)" v-else :id="`secret-${element.idx}-${elmId}`" :checked="element.ninjaArts.secret" @click.prevent>
          </td>
          <td class="name" :class="{ focused: currentColumn === 'name' }">
            <ruby v-if="isRawViewMode" v-html="getNameHtml(element.ninjaArts.name)"></ruby>
            <input type="text" @focus="onFocusColumn($event)" :id="`name-${element.idx}-${elmId}`" v-else v-model="element.ninjaArts.name">
          </td>
          <td class="type" v-if="mode !== 'normal'" v-show="viewMode !== 'alt'" :class="{ focused: currentColumn === 'type' }">
            <template v-if="isRawViewMode">{{ element.ninjaArts.type }}</template>
            <select @focus="onFocusColumn($event)" :id="`type-${element.idx}-${elmId}`" v-else v-model="element.ninjaArts.type">
              <option value="攻撃">攻撃</option>
              <option value="サポート">ｻﾎﾟｰﾄ</option>
              <option value="装備">装備</option>
            </select>
          </td>
          <td class="target-skill" :class="{ focused: currentColumn === 'target-skill' }">
            <template v-if="isRawViewMode">{{ element.ninjaArts.targetSkill }}</template>
            <input type="text" @focus="onFocusColumn($event)" :id="`targetSkill-${element.idx}-${elmId}`" v-else :list="`target-skill-list-${elmId}`" v-model="element.ninjaArts.targetSkill">
            <datalist :id="`target-skill-list-${elmId}`">
              <template v-for="col of 6" :key="col">
                <option v-for="row of 11" :key="row" :label="`${skillColumnList[col - 1]} - ${row + 1}`" :value="SkillTable[row - 1][col - 1]">{{ SkillTable[row - 1][col - 1] }}</option>
              </template>
            </datalist>
          </td>
          <td class="range" v-show="viewMode !== 'alt'" :class="{ focused: currentColumn === 'range' }">
            <template v-if="isRawViewMode">{{ element.ninjaArts.range }}</template>
            <input type="text" @focus="onFocusColumn($event)" :id="`range-${element.idx}-${elmId}`" v-else v-model="element.ninjaArts.range">
          </td>
          <td class="cost" v-show="viewMode !== 'alt'" :class="{ focused: currentColumn === 'cost' }">
            <template v-if="isRawViewMode">{{ element.ninjaArts.cost }}</template>
            <input type="text" @focus="onFocusColumn($event)" :id="`cost-${element.idx}-${elmId}`" v-else v-model="element.ninjaArts.cost">
          </td>
          <td class="effect" v-if="mode !== 'normal'" :class="{ focused: currentColumn === 'effect' }" v-show="viewMode === 'normal'">
            <template v-if="isRawViewMode">{{ element.ninjaArts.effect }}</template>
            <textarea @focus="onFocusColumn($event)" :id="`effect-${element.idx}-${elmId}`" v-else v-model="element.ninjaArts.effect"></textarea>
          </td>
          <td class="page" v-if="mode !== 'normal'" :class="{ focused: currentColumn === 'page' }" v-show="viewMode === 'normal'">
            <template v-if="isRawViewMode">{{ element.ninjaArts.page }}</template>
            <input type="text" @focus="onFocusColumn($event)" :id="`page-${element.idx}-${elmId}`" v-else v-model="element.ninjaArts.page">
          </td>
          <td v-if="viewMode === 'alt'" class="draggable-handle"></td>
          <td v-if="viewMode === 'alt'" class="delete-btn"><button @click="onDelete(element.idx)">削除</button></td>
        </tr>
        <tr @click="onSelectArts(element.idx)">
          <td class="effect-normal" colspan="4" v-show="mode === 'normal' && element.idx === selectedArts">{{ element.ninjaArts.effect }}</td>
        </tr>
        </tbody>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import SpecialInputStore from '@/feature/special-input/data'
import UserStore from '@/core/data/user'
import { v4 as uuidV4 } from 'uuid'
import { NinjaArts, ShinobiGami, ShinobigamiHelper, SkillTable } from '@/core/utility/shinobigami'
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { questionDialog } from '@/core/utility/dialog'
import ScenarioStore from '@/feature/scenario/data'
import CharacterStore from '@/feature/character/data'

export default defineComponent({
  name: 'ninja-arts-table',
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
      type: String as PropType<'normal' | 'view' | 'update' | 'insert'>,
      require: true
    },
    selectIndex: {
      type: Number,
      default: null
    }
  },
  setup(props, { emit }) {
    const scenarioState = ScenarioStore.injector()
    const characterState = CharacterStore.injector()
    const userState = UserStore.injector()

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
      isRawViewMode.value = props.mode !== 'update' || (!isGm.value && !isOwnRaw)
    }, { immediate: true, deep: true })

    const elmId = uuidV4()
    const specialInputState = SpecialInputStore.injector()
    const currentColumn = ref('')
    const onFocusColumn = (event: { target: HTMLInputElement | HTMLSelectElement }): void => {
      const type = (event.target?.parentNode as HTMLElement).className.split(' ')[0] || ''
      console.log('onFocus', type)
      if (!type) return
      currentColumn.value = type
    }
    const selectedArts = computed(() => props.selectIndex)
    const onSelectArts = (index: number) => {
      emit('update:selectIndex', selectedArts.value === index ? null : index)
      const ninjaArts = sheetInfoWrap.value?.ninjaArtsList[index]
      specialInputState.from.key = props.target
      specialInputState.setNinjaArts(ninjaArts?.name || null)
    }
    const reloadNinjaArts = async () => {
      const helper = new ShinobigamiHelper(sheetInfoWrap.value?.url || '', sheetViewPass.value)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) return
      const ninjaArtsList = sheetInfoWrap.value?.ninjaArtsList
      ninjaArtsList?.splice(0, ninjaArtsList?.length || 0, ...rd.ninjaArtsList)
    }

    const addNinjaArts = () => {
      const ninjaArtsList = sheetInfoWrap.value?.ninjaArtsList
      ninjaArtsList?.push({
        secret: false,
        name: '',
        type: '攻撃',
        targetSkill: '',
        range: '1',
        cost: '1',
        effect: '',
        page: ''
      })
    }

    type WrapNinjaArts = { idx: number; ninjaArts: NinjaArts; }
    const makeWrapList = (): WrapNinjaArts[] => sheetInfoWrap.value?.ninjaArtsList.map((ninjaArts, idx) => ({ idx, ninjaArts })) || []
    const ninjaArtsListWrap = ref<WrapNinjaArts[]>([])
    watch(() => sheetInfoWrap.value?.ninjaArtsList, () => {
      ninjaArtsListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '忍法削除',
        text: `${sheetInfoWrap.value?.ninjaArtsList[idx].name || ''}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const ninjaArtsList = sheetInfoWrap.value?.ninjaArtsList
      ninjaArtsList?.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      console.log(type, evt.oldIndex, evt.newIndex, sheetInfoWrap.value?.ninjaArtsList[evt.oldIndex || 0].name)
      if (type === 'end') {
        const ninjaArtsList = sheetInfoWrap.value?.ninjaArtsList
        const target = ninjaArtsList?.splice((evt.oldIndex || 1) - 1, 1)[0] || null
        if (target) {
          ninjaArtsList?.splice((evt.newIndex || 1) - 1, 0, target)
        }
      }
    }

    return {
      isGm,
      isOwn,
      isRawViewMode,
      elmId,
      currentColumn,
      onFocusColumn,
      SkillTable,
      skillColumnList: ['器術', '体術', '忍術', '謀術', '戦術', '妖術'],
      selectedArts,
      onSelectArts,
      getNameHtml: (name: string) => name
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replaceAll(/(.+)[(（](.+)[)）]/g, (_, p1, p2) => {
          return `${p1}<rp>（</rp><rt>${p2}</rt><rp>）</rp>`
        }),
      reloadNinjaArts,
      addNinjaArts,
      ninjaArtsListWrap,
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
    width: calc(var(--sheet-font-size) * (2 + 10 + 5 + 8 + 3 + 3 + 15 + 3) + 8px + 1px);
  }
  &.simple {
    width: calc(var(--sheet-font-size) * (2 + 10 + 5 + 8 + 3 + 3) + 6px + 1px);
  }
  &.alt {
    width: calc(var(--sheet-font-size) * (2 + 10 + 8 + 3 + 4) + 5px + 1px);
  }
}

.draggable-handle {
  min-width: 3em;
  background-color: lightgray;
  background-image: radial-gradient(white 30%, transparent 30%);
  background-size: 0.3em 0.3em;
  cursor: move;
}

table.ninja-arts {
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

  td {
    height: 1.9em;
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

  .secret {
    width: 2em;
  }

  td.name,
  td.effect {
    text-align: left;
  }

  &.update .name,
  &.insert .name {
    width: 10em;
  }
  .name {
    white-space: nowrap;
    width: 3em;
  }

  .type {
    white-space: nowrap;
    width: 5em;
  }

  &.update .target-skill,
  &.insert .target-skill {
    width: 8em;
  }
  .target-skill {
    white-space: nowrap;
    width: 4em;
  }

  .delete-btn {
    width: 4em;
  }

  .range {
    white-space: nowrap;
    width: 3em;
  }

  .cost {
    white-space: nowrap;
    width: 3em;
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

  .effect-normal {
    text-align: left;
    white-space: break-spaces;
    max-width: 1em;
    background-color: rgba(100, 100, 100, 0.1);
  }

  .page {
    white-space: nowrap;
    width: 3em;
  }
}
</style>

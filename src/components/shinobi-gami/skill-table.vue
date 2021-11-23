<template>
  <table class="skill-table" :class="[isRawViewMode ? 'raw-view' : '', operationType]">
    <caption v-if="mode !== 'update' && mode !== 'insert'">
      <template v-if="mode === 'comparison'">
        <div>
          <select v-model="otherCharaKey">
            <option :value="null">比較対象なし</option>
            <template v-for="d in pcListWrap" :key="d.raw._characterKey">
              <option
                v-if="d.raw._characterKey !== target"
                :value="d.raw._characterKey"
              >{{ d.raw.name }}（{{ d.character.sheetInfo.characterName }}）</option>
            </template>
            <template v-for="d in npcListWrap" :key="d.raw._characterKey">
              <option
                v-if="
                  d.raw._characterKey !== target &&
                  d.raw._hasSheet && (
                    isGm || (
                      !d.raw.secretcheck &&
                      getChitStatus('npc', d.raw._characterKey).isSheetShow
                    )
                  )
                "
                :value="d.raw._characterKey"
              >{{ d.raw.name }}</option>
            </template>
            <template v-for="d in rightHandListWrap" :key="d.raw._characterKey">
              <option
                v-if="isGm || (
                  d.raw._characterKey !== target &&
                  !d.raw._secretCheck &&
                  d.raw._hasSheet &&
                  getChitStatus('right-hand', d.raw._characterKey).isSheetShow
                )"
                :value="d.raw._characterKey"
              >{{ d.raw.name }}</option>
            </template>
          </select>
        </div>
      </template>
      <template v-else>
        <div class="operation-type-radio" @click.prevent="operationType = operationType === 'judge' ? 'input' : 'judge'">
          <label :class="operationType === 'input' ? 'selected' : ''"><input type="radio" value="input" v-model="operationType">設定</label>
          <label :class="operationType === 'judge' ? 'selected' : ''">判定<input type="radio" value="judge" v-model="operationType"></label>
        </div>
      </template>
    </caption>
    <thead v-if="skill">
      <tr>
        <template v-for="(s, col) in skillColumnList" :key="s[0]">
          <th :class="`gap-${col}`">
            <label>
              <input
                type="checkbox"
                :checked="skill?.spaceList.some(n => n === col)"
                v-if="isRawViewMode || operationType === 'judge'"
                @click.prevent
              >
              <input
                type="checkbox"
                :checked="skill?.spaceList.some(n => n === col)"
                v-else
                @change="onChangeGapHead($event, col)"
              >
              {{s[0]}}
            </label>
          </th>
          <th :class="`skill-${col}`">
            <label>
              {{s[1]}}
              <input
                type="checkbox"
                :checked="skill?.damagedColList.some(n => n === col)"
                v-if="isRawViewMode || operationType === 'judge'"
                @click.prevent
              >
              <input
                type="checkbox"
                :checked="skill?.damagedColList.some(n => n === col)"
                v-else
                @change="onChangeDamageHead($event, col)"
              >
            </label>
          </th>
        </template>
        <th class="row-num" rowspan="2"></th>
      </tr>
    </thead>
    <tbody v-if="skill">
      <tr :class="`row-${row}`" v-for="(tList, row) in SkillTable" :key="row">
        <template v-for="(t, col) in tList" :key="t">
          <td :class="[`gap-${col}`, skill?.spaceList.some(n => n === col) ? 'fill' : '']"></td>
          <td
            :class="[
              `skill-${col}`,
              t === selectedSkill ? 'selected' : '',
              skill?.learnedList.some(n => n.column === col && n.row === row)? 'learned' : '',
              skill?.damagedList.some(d => d.name === t) ? 'damaged' : ''
            ]"
          >
            <span
              class="target-value"
              v-if="targetValueList.some(tv => tv.name === t)"
              :style="{ '--value': `'>=${targetValueList.find(tv => tv.name === t).targetValue}'` }"
              @click="onClickTargetValue(targetValueList.find(tv => tv.name === t))"
            ></span>
            <label @click="onClickSkillName(t)">{{ t }}</label>
          </td>
        </template>
        <td class="row-num">{{ row + 2 }}</td>
      </tr>
    </tbody>
    <tfoot v-if="skill">
      <tr>
        <td class="out-row" colspan="13" :class="skill?.outRow ? 'fill' : ''">
          <label>
            <input
              type="checkbox"
              :checked="skill?.outRow"
              v-if="isRawViewMode || operationType === 'judge'"
              @click.prevent
            >
            <input
              type="checkbox"
              :checked="skill?.outRow"
              v-else
              @change="onChangeOutRow($event)"
            >
          </label>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script lang="ts">
import { defineComponent, watch, ref, reactive, PropType, computed } from 'vue'
import { ShinobiGami, SkillTable } from '@/core/utility/shinobigami'
import { listDelete } from '@/core/utility/PrimaryDataUtility'
import { HtmlEvent } from '@/core/utility/typescript'
import { SaikoroFictionTokugi } from '@/core/utility/SaikoroFiction'
import CharacterStore from '@/feature/character/data'
import SpecialInputStore from '@/feature/special-input/data'
import { calcTargetValue, getRowCol } from '@/core/utility/TrpgSystemFasade'
import UserStore from '@/core/data/user'
import ScenarioStore from '@/feature/scenario/data'

export default defineComponent({
  name: 'skill-table',
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
      type: String as PropType<'normal' | 'comparison' | 'update' | 'insert'>,
      require: true
    },
    targetSkill: {
      type: String,
      default: null
    },
    targetArts: {
      type: String,
      default: null
    },
    otherCharacterKey: {
      type: String,
      default: null
    }
  },
  emits: ['update:otherCharacterKey', 'update:targetSkill', 'clear-arts'],
  setup(props, { emit }) {
    const scenarioState = ScenarioStore.injector()
    const characterState = CharacterStore.injector()
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const sheetInfoWrap = ref<ShinobiGami | null>(null)
    watch(() => characterState.characterList.find(c => c.key === props.target)?.data?.sheetInfo, (data) => {
      sheetInfoWrap.value = data || null
    }, { immediate: true, deep: true })

    const isRawViewMode = ref(false)
    watch([
      () => props.type,
      () => props.target,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand,
      () => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma
    ], () => {
      const { isOwn } = scenarioState.getChitStatus(
        props.type,
        props.target,
        userState.selfUser?.key || null
      )
      isRawViewMode.value = props.mode === 'update' && (!isGm.value && !isOwn)
    }, { immediate: true, deep: true })

    const specialInputState = SpecialInputStore.injector()
    // 特技表
    const skill = ref<SaikoroFictionTokugi | null>(null)
    const targetNinjaArts = ref<string | null>(null)

    // 達成値
    const targetValueList = reactive<{ name: string; targetValue: number; }[]>([])
    const onChangeSelectedSkill = (name: string | null): void => {
      if (!name || !skill.value) {
        targetValueList.splice(0, targetValueList.length)
        return
      }
      const list = calcTargetValue(name, skill.value)
      targetValueList.splice(0, targetValueList.length, ...list.map(o => ({ name: o.name, targetValue: o.targetValue })))
    }

    watch(() => props.targetArts, () => {
      targetNinjaArts.value = props.targetArts
    })

    const otherCharaKey = ref<string | null>(props.otherCharacterKey)
    watch(
      props.mode === 'comparison'
        ? [
          () => sheetInfoWrap.value?.skill,
          () => characterState.characterList,
          otherCharaKey
        ]
        : () => sheetInfoWrap.value?.skill,
      () => {
        skill.value = props.mode === 'comparison'
          ? characterState.characterList.find(c => c.key === otherCharaKey.value)?.data?.sheetInfo.skill || null
          : sheetInfoWrap.value?.skill || null
        if (props.mode === 'normal') onChangeSelectedSkill(props.targetSkill)
      },
      { immediate: true, deep: true }
    )
    watch(otherCharaKey, () => {
      emit('update:otherCharacterKey', otherCharaKey.value)
    })

    // 選択済み特技に関するpropsと内部変数とのバインディング
    const selectedSkill = ref<string | null>(null)
    watch(selectedSkill, () => {
      onChangeSelectedSkill(selectedSkill.value)
      emit('update:targetSkill', selectedSkill.value)
    })
    watch(() => props.targetSkill, () => {
      selectedSkill.value = props.targetSkill
    }, { immediate: true })

    const onChangeGapHead = (e: HtmlEvent<HTMLInputElement>, col: number): void => {
      if (!skill.value) return
      const list = skill.value.spaceList
      e.target.checked ? list.push(col) : listDelete(list, d => d === col)
    }
    const onChangeDamageHead = (e: HtmlEvent<HTMLInputElement>, col: number): void => {
      if (!skill.value) return
      const damagedColList = skill.value.damagedColList
      const damageList = skill.value.damagedList
      if (e.target.checked) {
        damagedColList.push(col)
        damageList.push(...SkillTable.map((row, idx) => ({
          name: row[col],
          row: idx,
          column: col
        })))
      } else {
        listDelete(damagedColList, d => d === col)
        listDelete(damageList, d => d.column === col)
      }
    }

    // 設定・判定
    const operationType = ref<'input' | 'judge'>(props.mode === 'update' || props.mode === 'insert' ? 'input' : 'judge')
    watch(operationType, () => {
      if (operationType.value === 'input') {
        selectedSkill.value = null
      }
    })
    const onClickTargetValue = (info: { name: string; targetValue: number; }) => {
      specialInputState.setUseSkill(info.name)
      specialInputState.from.key = props.target
      specialInputState.setNinjaArts(targetNinjaArts.value)
      specialInputState.setTargetSkill(selectedSkill.value)
      specialInputState.from.key = props.target
      specialInputState.setCmdType('SG')
    }

    const onChangeOutRow = (e: HtmlEvent<HTMLInputElement>) => {
      if (skill.value) {
        skill.value.outRow = e.target.checked
      }
    }

    const onClickSkillName = (name: string): void => {
      console.log(name)
      console.log(isRawViewMode.value)
      console.log(operationType.value === 'input')
      console.log(skill.value?.learnedList)
      console.log(selectedSkill.value)
      if (isRawViewMode.value) return
      if (!skill.value) return
      const { r, c } = getRowCol(name)
      if (r === -1 || c === -1) return
      if (operationType.value === 'input') {
        const list = skill.value.learnedList
        const index = list.findIndex(s => s.name === name)
        index < 0 ? list.push({ name, row: r, column: c }) : list.splice(index, 1)
      } else {
        selectedSkill.value = selectedSkill.value === name ? null : name
      }
      console.log(selectedSkill.value)
      if (targetNinjaArts.value) emit('clear-arts')
    }

    const {
      pcListWrap,
      npcListWrap,
      rightHandListWrap
    } = scenarioState.makeWrapLists()

    return {
      isGm,
      isRawViewMode,
      otherCharaKey,
      targetValueList,
      selectedSkill,
      skill,
      operationType,
      pcListWrap,
      npcListWrap,
      rightHandListWrap,
      getChitStatus: (type: 'pc' | 'npc' | 'right-hand' | 'enigma', target: string) => scenarioState.getChitStatus(type, target, userState.selfUser?.key || ''),
      // ...makeComputedObject(characterState),
      skillColumnList: [['　', '器術'], ['A', '体術'], ['B', '忍術'], ['C', '謀術'], ['D', '戦術'], ['E', '妖術']],
      SkillTable,
      onChangeGapHead,
      onChangeDamageHead,
      onClickSkillName,
      onChangeOutRow,
      onClickTargetValue
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

table.skill-table {
  font-size: var(--sheet-font-size);
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid rgb(0, 0, 0);
  //border-top: 1px solid rgb(0, 0, 0);
  table-layout: fixed;

  &:not(.raw-view).input td[class^="skill-"] {
    background-color: rgba(200, 255, 255, 0.7);
  }

  &.raw-view {
    label {
      cursor: default;
    }
  }

  label {
    cursor: pointer;
  }

  caption {
    text-align: left;
    div {
      @include common.flex-box(row, flex-start, center, wrap);
      height: 2em;

      &.operation-type-radio {
        @include common.flex-box(row, flex-start, stretch, wrap);

        label {
          padding: 0 0.2rem;
          border: 1px solid black;
          box-sizing: border-box;
          user-select: none;

          input {
            pointer-events: none;
          }

          &:first-child {
            border-radius: 5px 0 0 0;
          }

          &:last-child {
            border-radius: 0 5px 0 0;
          }

          &.selected {
            background-color: #252525;
            color: white;
          }
        }
      }
    }
    label {
      @include common.flex-box(row, flex-start, center);
    }
  }

  input {
    padding: 0;
    margin: 0;
    cursor: inherit;
  }

  td, th {
    position: relative;
    text-align: center;
    white-space: nowrap;
    box-sizing: border-box;
    border-style: solid;
    border-width: 1px;
    border-color: black;
    padding: 0;
    margin: 0;
    background-color: rgba(255, 255, 255, 0.7);

    > * {
      vertical-align: middle;
    }
  }
  @mixin fill-cell {
    background-color: #252525 !important;
    color: white !important;
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

  thead {
    th { @include fill-cell; }
    *[class^="gap-"] { @include set-label-css(column, 2rem); }
    *[class^="skill-"] {
      @include set-label-css(row, 2rem);

      input[type='checkbox'] {
        margin-left: 3px;

        &:checked {
          outline: var(--accent1-color) solid 1px;
          outline-offset: 1px;
        }
      }
    }
  }

  tbody {
    *[class^="gap-"] {
      @include set-label-css(column, 2em);
    }
    *[class^="skill-"] { @include set-label-css(row, 2em); }
  }

  .row-num {
    @include fill-cell;
    @include set-width(1.4em);
  }

  .out-row {
    @include set-label-css(row, 2em, flex-start);
    width: 100%;
  }

  .target-value {
    @include common.flex-box(row, center, center);
    z-index: 3;
    position: absolute;
    color: black;
    right: -1.5em;
    top: 0;
    bottom: 0;
    margin: auto;
    background-color: yellow;
    border: solid gray 1px;
    border-radius: 5px;
    padding: 2px;
    overflow: visible;
    cursor: pointer;

    &:before {
      content: var(--value);
      display: block;
    }

    &:after {
      content: '';
      background-color: yellow;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 1em;
      height: 1em;
      margin: auto;
      transform: translateX(-0.5em) rotate(45deg);
      transform-origin: center center;
      z-index: -1;
    }
  }

  .learned,
  .fill {
    @include fill-cell;
  }

  *[class^="gap-"] {
    @include set-width(1.4em);
  }

  *[class^="skill-"] {
    @include set-width(5.2em);

    &.selected:after {
      content: '';
      @include common.position-full-size(absolute, -3px);
      padding: 2px;
      border: 2px var(--accent1-color) solid;
      box-sizing: content-box;
      pointer-events: none;
      z-index: 1;
    }

    &.damaged.learned {
      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        width: 5em;
        height: 2px;
        background-color: var(--accent1-color);
        transform-origin: center center;
        pointer-events: none;
        transform: rotate(19deg);
      }
    }
  }
}
</style>

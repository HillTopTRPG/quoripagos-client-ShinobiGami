<template>
  <div class="v-box">
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
          <th v-if="viewMode === 'alt'">入替</th>
          <th class="delete-btn" v-if="viewMode === 'alt'">削除</th>
        </tr>
        </thead>
      </template>
      <template #item="{element}">
        <tbody>
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
          <td v-if="viewMode === 'alt'" class="draggable-handle"></td>
          <td v-if="viewMode === 'alt'"><button @click="onDelete(element.idx)">削除</button></td>
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
import ViewMode from '@/components/shinobi-gami/view-mode.vue'
import draggable from 'vuedraggable'
import { questionDialog } from '@/core/utility/dialog'

export default defineComponent({
  name: 'special-arts-table',
  components: { ViewMode, draggable },
  props: {
    sheetInfo: {
      type: Object as PropType<ShinobiGami>,
      required: true
    },
    mode: {
      type: String as PropType<'normal' | 'view' | 'update' | 'insert'>,
      require: true
    },
    characterKey: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    sheetViewPass: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const reloadSpecialArts = async () => {
      const helper = new ShinobigamiHelper(props.url, props.sheetViewPass)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) return
      const specialArtsList = props.sheetInfo.specialArtsList
      specialArtsList.splice(0, specialArtsList.length, ...rd.specialArtsList)
    }

    const skillList = computed(() => props.sheetInfo.skill.learnedList.map(l => l.name).filter((s, idx, self) => self.findIndex(ss => ss === s) === idx))

    const addSpecialArts = () => {
      const specialArtsList = props.sheetInfo.specialArtsList
      specialArtsList.push({
        name: '',
        skill: skillList.value[0] || '',
        effect: '',
        direction: ''
      })
    }

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))
    const isRawViewMode = computed(() => props.mode !== 'insert' && (props.mode !== 'update' || (!isGm.value && !isOwn.value)))

    type WrapSpecialArts = { idx: number; specialArts: SpecialArts; }
    const makeWrapList = (): WrapSpecialArts[] => props.sheetInfo.specialArtsList.map((specialArts, idx) => ({ idx, specialArts })) || []
    const specialArtsListWrap = ref<WrapSpecialArts[]>([])
    watch(() => props.sheetInfo.specialArtsList, () => {
      specialArtsListWrap.value = makeWrapList()
    }, { deep: true, immediate: true })

    const viewMode = ref<'normal' | 'simple' | 'alt'>('normal')

    const onDelete = async (idx: number) => {
      if (!(await questionDialog({
        title: '奥義削除',
        text: `${props.sheetInfo.specialArtsList[idx].name}を削除します。`,
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル'
      }))) return
      const specialArtsList = props.sheetInfo.specialArtsList
      specialArtsList.splice(idx, 1)
    }

    const onDrag = (type: string, evt: { oldIndex: number | undefined; newIndex: number | undefined; }) => {
      if (type === 'end') {
        const specialArtsList = props.sheetInfo.specialArtsList
        const target = specialArtsList.splice((evt.oldIndex || 1) - 1, 1)[0]
        specialArtsList.splice((evt.newIndex || 1) - 1, 0, target)
      }
    }
    return {
      isRawViewMode,
      reloadSpecialArts,
      addSpecialArts,
      skillList,
      specialArtsListWrap,
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
    width: calc(var(--sheet-font-size) * (13 + 7 + 15 + 15) + 4px + 1px);
  }
  &.simple {
    width: calc(var(--sheet-font-size) * (13 + 7) + 2px + 1px);
  }
  &.alt {
    width: calc(var(--sheet-font-size) * (13 + 3 + 4) + 3px + 1px);
  }
}

.draggable-handle {
  min-width: 3em;
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
    width: 13em;
  }

  .skill {
    white-space: nowrap;
    width: 7em;
  }

  td.effect,
  td.direction {
    text-align: left;
  }

  .effect,
  .direction {
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
}
</style>

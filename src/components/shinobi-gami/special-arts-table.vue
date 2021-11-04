<template>
  <table class="special-arts" :class="isRawViewMode ? 'raw-view' : ''">
    <thead>
      <tr>
        <th class="name">名称</th>
        <th class="skill">指定特技</th>
        <th class="effect">効果／強み／弱み</th>
        <th class="direction">演出</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(sa, idx) in sheetInfo.specialArtsList" :key="idx">
        <td class="name"><span>
          <template v-if="isRawViewMode">{{ sa.name }}</template>
          <input type="text" v-model="sa.name" v-else>
        </span></td>
        <td class="skill">
          <span>
            <template v-if="isRawViewMode">{{ sa.skill }}</template>
            <select v-model="sa.skill" v-else>
              <option value=""></option>
              <option :value="s" v-for="s in skillList" :key="s">{{ s }}</option>
            </select>
          </span>
        </td>
        <td class="effect">
          <template v-if="isRawViewMode">{{ sa.effect }}</template>
          <textarea v-model="sa.effect" v-else></textarea>
        </td>
        <td class="direction">
          <template v-if="isRawViewMode">{{ sa.direction }}</template>
          <textarea v-model="sa.direction" v-else></textarea>
        </td>
      </tr>
    </tbody>
    <tfoot v-if="!isRawViewMode">
      <tr>
        <td colspan="4">
          <button @click="addSpecialArts()">追加</button>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { ShinobiGami, ShinobigamiHelper } from '@/core/utility/shinobigami'
import UserStore from '@/core/data/user'

export default defineComponent({
  name: 'special-arts-table',
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

    return {
      isRawViewMode,
      reloadSpecialArts,
      addSpecialArts,
      skillList
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

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
    width: 10em;
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

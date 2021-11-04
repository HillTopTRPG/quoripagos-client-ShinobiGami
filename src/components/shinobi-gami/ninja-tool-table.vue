<template>
  <table class="ninja-tools" :class="isRawViewMode ? 'raw-view' : ''">
    <thead>
      <tr>
        <th class="name">名称</th>
        <th class="num">個数</th>
        <th class="effect">効果</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(t, idx) in sheetInfo.ninjaToolList" :key="idx">
        <td class="name"><span>
          <template v-if="isRawViewMode">{{ t.name }}</template>
          <input type="text" v-model="t.name" v-else>
        </span></td>
        <td class="count"><span>
          <template v-if="isRawViewMode">{{ t.count }}</template>
          <input type="number" v-model="t.count" v-else>
        </span></td>
        <td class="effect">
          <template v-if="isRawViewMode">{{ t.effect }}</template>
          <textarea v-model="t.effect" v-else></textarea>
        </td>
      </tr>
    </tbody>
    <tfoot v-if="!isRawViewMode">
      <tr>
        <td colspan="4">
          <button @click="addNinjaTool()">追加</button>
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
  name: 'ninja-tool-table',
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
    const reloadNinjaTool = async () => {
      const helper = new ShinobigamiHelper(props.url, props.sheetViewPass)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) return
      const ninjaToolList = props.sheetInfo.ninjaToolList
      ninjaToolList.splice(0, ninjaToolList.length, ...rd.ninjaToolList)
    }
    const addNinjaTool = () => {
      const ninjaToolList = props.sheetInfo.ninjaToolList
      ninjaToolList.push({
        name: '',
        count: 0,
        effect: ''
      })
    }

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))
    const isRawViewMode = computed(() => props.mode !== 'insert' && (props.mode !== 'update' || (!isGm.value && !isOwn.value)))

    return {
      isRawViewMode,
      reloadNinjaTool,
      addNinjaTool
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

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
    width: 10em;
  }

  td.effect {
    text-align: left;
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
}
</style>

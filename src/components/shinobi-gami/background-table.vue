<template>
  <table class="background" :class="isRawViewMode ? 'raw-view' : ''">
    <thead>
      <tr>
        <th class="name">名称</th>
        <th class="type">種別</th>
        <th class="point">功績点</th>
        <th class="effect">効果</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(bg, idx) in sheetInfo.backgroundList" :key="idx">
        <td class="name"><span>
          <template v-if="isRawViewMode">{{ bg.name }}</template>
          <input v-else type="text" v-model="bg.name">
        </span></td>
        <td class="type">
          <span>
            <template v-if="isRawViewMode">{{ bg.type }}</template>
            <select v-model="bg.type" v-else>
              <option value="長所">長所</option>
              <option value="弱点">弱点</option>
            </select>
          </span>
        </td>
        <td class="point"><span>
          <template v-if="isRawViewMode">{{ bg.point }}</template>
          <input type="text" v-model="bg.point" v-else>
        </span></td>
        <td class="effect">
          <template v-if="isRawViewMode">{{ bg.effect }}</template>
          <textarea v-model="bg.effect" v-else></textarea>
        </td>
      </tr>
    </tbody>
    <tfoot v-if="!isRawViewMode">
      <tr>
        <td colspan="4">
          <button @click="addBackground()">追加</button>
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
  name: 'background-table',
  props: {
    mode: {
      type: String as PropType<'update' | 'insert'>,
      require: true
    },
    sheetInfo: {
      type: Object as PropType<ShinobiGami>,
      required: true
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
    const reloadBackground = async () => {
      const helper = new ShinobigamiHelper(props.url, props.sheetViewPass)
      if (!helper.isThis()) {
        console.log('is not this')
        return
      }
      const { data: rd, jsons } = await helper.getData()
      console.log(jsons)
      console.log(rd)
      if (!rd) return
      const backgroundList = props.sheetInfo.backgroundList
      backgroundList.splice(0, backgroundList.length, ...rd.backgroundList)
    }

    const addBackground = () => {
      const backgroundList = props.sheetInfo.backgroundList
      backgroundList.push({
        name: '',
        type: '長所',
        point: '',
        effect: ''
      })
    }

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))
    const isRawViewMode = computed(() => props.mode !== 'insert' && !isGm.value && !isOwn.value)

    return {
      isRawViewMode,
      reloadBackground,
      addBackground
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

table.background {
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

  td.name,
  td.effect {
    text-align: left;
  }

  .name {
    white-space: nowrap;
    width: 10em;
  }

  .type {
    white-space: nowrap;
    width: 5em;
  }

  .point {
    white-space: nowrap;
    width: 4em;
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

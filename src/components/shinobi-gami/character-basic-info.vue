<template>
  <table class="character-basic-info" :class="isRawViewMode ? 'raw-view' : ''">
    <tr>
      <th><label :for="`cbi-player-name-${elmId}`">プレイヤー</label></th>
      <td colspan="3">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.playerName }}</template>
          <input v-else :id="`cbi-player-name-${elmId}`" type="text" v-model="sheetInfoWrap.playerName">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-character-name-${elmId}`">名前</label></th>
      <td colspan="3">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.characterName }}</template>
          <input v-else :id="`cbi-character-name-${elmId}`" type="text" v-model="sheetInfoWrap.characterName">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-character-name-kana-${elmId}`">カナ</label></th>
      <td colspan="3">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.characterNameKana }}</template>
          <input v-else :id="`cbi-character-name-kana-${elmId}`" type="text" v-model="sheetInfoWrap.characterNameKana">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-regulation-${elmId}`">ﾚｷﾞｭﾚｰｼｮﾝ</label></th>
      <td colspan="3">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.regulation }}</template>
          <input v-else :id="`cbi-regulation-${elmId}`" type="text" v-model="sheetInfoWrap.regulation">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-upper-style-${elmId}`">上位流派</label></th>
      <td class="c1">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.upperStyle }}</template>
          <select v-else :id="`cbi-upper-style-${elmId}`" v-model="sheetInfoWrap.upperStyle">
            <option value=""></option>
            <option value="斜歯忍軍">斜歯忍軍</option>
            <option value="鞍馬神流">鞍馬神流</option>
            <option value="ハグレモノ">ハグレモノ</option>
            <option value="比良坂機関">比良坂機関</option>
            <option value="私立御斎学園">私立御斎学園</option>
            <option value="隠忍の血統">隠忍の血統</option>
          </select>
        </span>
      </td>
      <th><label :for="`cbi-sub-style-${elmId}`">流派</label></th>
      <td class="c2">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.subStyle }}</template>
          <input v-else :id="`cbi-sub-style-${elmId}`" type="text" placeholder="（上位流派）" v-model="sheetInfoWrap.subStyle">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-style-rule-${elmId}`">流儀</label></th>
      <td colspan="3">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.stylerule }}</template>
          <input v-else :id="`cbi-style-rule-${elmId}`" type="text" v-model="sheetInfoWrap.stylerule">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-foe-${elmId}`">仇敵</label></th>
      <td colspan="3">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.foe }}</template>
          <input v-else :id="`cbi-foe-${elmId}`" type="text" v-model="sheetInfoWrap.foe">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-level-${elmId}`">階級</label></th>
      <td class="c1">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.level }}</template>
          <input v-else :id="`cbi-level-${elmId}`" type="text" v-model="sheetInfoWrap.level">
        </span>
      </td>
      <th><label :for="`cbi-exp-${elmId}`">功績</label></th>
      <td class="c2">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.exp }}</template>
          <input v-else :id="`cbi-exp-${elmId}`" type="text" v-model="sheetInfoWrap.exp">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-age-${elmId}`">年齢</label></th>
      <td class="c1">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.age }}</template>
          <input v-else :id="`cbi-age-${elmId}`" type="text" v-model="sheetInfoWrap.age">
        </span>
      </td>
      <th><label :for="`cbi-sex-${elmId}`">性別</label></th>
      <td class="c2">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.sex }}</template>
          <input v-else :id="`cbi-sex-${elmId}`" type="text" v-model="sheetInfoWrap.sex">
        </span>
      </td>
    </tr>
    <tr>
      <th><label :for="`cbi-cover-${elmId}`">表の顔</label></th>
      <td class="c1">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.cover }}</template>
          <input v-else :id="`cbi-cover-${elmId}`" type="text" v-model="sheetInfoWrap.cover">
        </span>
      </td>
      <th><label :for="`cbi-belief-${elmId}`">信念</label></th>
      <td class="c2">
        <span>
          <template v-if="isRawViewMode">{{ sheetInfoWrap.belief }}</template>
          <input v-else :id="`cbi-belief-${elmId}`" type="text" v-model="sheetInfoWrap.belief">
        </span>
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import { ShinobiGami } from '@/core/utility/shinobigami'
import UserStore from '@/core/data/user'

export default defineComponent({
  name: 'character-basic-info',
  props: {
    sheetInfo: {
      type: Object as PropType<ShinobiGami>,
      required: true
    },
    characterKey: {
      type: String,
      required: true
    },
    mode: {
      type: String as PropType<'update' | 'insert' | 'view'>,
      required: true
    }
  },
  setup(props) {
    const elmId = uuidV4()
    const sheetInfoWrap = ref(props.sheetInfo)
    watch(() => props.sheetInfo, () => {
      sheetInfoWrap.value = props.sheetInfo
    })

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    const isOwn = computed(() => userState.selfUser?.refList.some(r => r.key === props.characterKey))
    const isRawViewMode = computed(() => props.mode !== 'insert' && (props.mode === 'view' || (!isGm.value && !isOwn.value)))

    return {
      isRawViewMode,
      elmId,
      sheetInfoWrap
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

table.character-basic-info {
  font-size: var(--sheet-font-size);
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid rgb(0, 0, 0);
  table-layout: fixed;

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
  }

  input {
    padding: 0;
    margin: 0;
    cursor: inherit;
    width: 100%;
    height: 100%;
    font-size: inherit;
    box-sizing: border-box;
  }

  select {
    font-size: inherit;
  }

  td, th {
    position: relative;
    border-style: solid;
    border-width: 1px;
    border-color: black;
    padding: 0;
    margin: 0;

    > * {
      vertical-align: middle;
    }
  }

  th {
    background-color: #252525;
    color: white;
    text-align: center;
    padding: 0 0.2rem;
    white-space: nowrap;
  }

  td {
    text-align: left;
    padding: 0.1rem 0.2rem;

    > * {
      width: 100%;
    }

    &.c1 {
      width: 10em;
    }

    &.c2 {
      width: 10em;
    }
  }
}
</style>

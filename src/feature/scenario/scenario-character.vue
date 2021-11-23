<template>
    <table class="characters">
      <caption>キャラクター</caption>
      <thead>
      <tr>
        <th class="input-url">入力URL</th>
        <th class="link">リンク</th>
        <th class="note">備考</th>
        <th class="secret">秘</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(n, idx) in scenario.sheetInfo.characters" :key="idx">
        <template v-if="isGm || !n.secret">
          <td class="input-url">
            <input type="text" v-if="isGm" v-model="n.inputUrl">
            <template>{{ n.inputUrl }}</template>
          </td>
          <td class="link"><a :href="n.inputUrl" target="_blank" rel="noopener noreferrer">リンク</a></td>
          <td class="note">
            <input type="text" v-if="isGm" v-model="n.note">
            <template v-else>{{ n.note }}</template>
          </td>
          <td class="secret">
            <input type="checkbox" v-if="isGm" v-model="n.secret">
            <input type="checkbox" v-else :checked="n.secret" @click.prevent>
          </td>
        </template>
      </tr>
      </tbody>
    </table>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import Store from './data'
import UserStore from '@/core/data/user'

export default defineComponent({
  name: 'scenario-character',
  setup() {
    const state = Store.injector()
    const scenario = computed(() => state.currentScenario)

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      isGm,
      scenario
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

table {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  width: 45em;
  max-width: 45em;
  min-width: 45em;
  box-sizing: border-box;

  caption {
    text-align: center;
    background-color: #252525;
    color: white;
    font-weight: bold;
    font-size: 110%;
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

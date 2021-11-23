<template>
  <table class="prize">
    <caption>プライズ</caption>
    <thead>
    <tr>
      <th class="name">名称</th>
      <th class="career-open">公開保持者</th>
      <th class="career-close">保持者</th>
      <th class="secret">秘</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="(n, idx) in scenario.sheetInfo.prize" :key="idx">
      <template v-if="isGm || !n.secret">
        <td class="name">
          <input type="text" v-if="isGm" v-model="n.name">
          <template v-else>{{ n.name }}</template>
        </td>
        <td class="career-open">
          <input type="text" v-if="isGm" v-model="n.careerOpen">
          <template v-else>{{ n.careerOpen }}</template>
        </td>
        <td class="career-close">
          <input type="text" v-if="isGm" v-model="n.careerClose">
          <template v-else>{{ n.careerClose }}</template>
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
import { v4 as uuidV4 } from 'uuid'

export default defineComponent({
  name: 'scenario-prize',
  setup() {
    const elmId = uuidV4()
    const state = Store.injector()
    const scenario = computed(() => state.currentScenario)

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      elmId,
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

  @mixin set-column-width($class, $width) {
    .#{$class} {
      width: $width;
      min-width: $width;
      max-width: $width;
    }
  }

  &.prize {
    @include set-column-width("name", 12em);
    @include set-column-width("career-open", 12em);
    @include set-column-width("career-close", 12em);
  }

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

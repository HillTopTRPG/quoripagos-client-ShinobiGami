<template>
  <table class="scenario">
    <tbody>
      <tr>
        <th class="th1"><label :for="isGm ? `scenario-name-${elmId}` : ''"></label>シナリオ名</th>
        <td colspan="3">
          <input type="text" v-if="isGm" :id="`scenario-name-${elmId}`" v-model="scenario.sheetInfo.base.name">
          <template v-else>{{ scenario.sheetInfo.base.name }}</template>
        </td>
        <th class="th3"><label :for="isGm ? `author-${elmId}` : ''">作成者</label></th>
        <td>
          <input type="text" v-if="isGm" :id="`author-${elmId}`" v-model="scenario.sheetInfo.base.author">
          <template v-else>{{ scenario.sheetInfo.base.author }}</template>
        </td>
      </tr>
      <tr>
        <th class="th1"><label>タイプ</label></th>
        <td colspan="3">
          <div class="h-box">
            <label>
              <span>対立型</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.type1">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.type1" @click.prevent>
            </label>
            <label>
              <span>協力型</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.type2">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.type2" @click.prevent>
            </label>
            <label>
              <span>ﾊﾞﾄﾙﾛｲﾔﾙ型</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.type3">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.type3" @click.prevent>
            </label>
            <label>
              <span>特殊型</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.type4">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.type4" @click.prevent>
            </label>
          </div>
        </td>
        <th class="th3"><label :for="isGm ? `stage-${elmId}` : ''">舞台</label></th>
        <td>
          <input type="text" v-if="isGm" :id="`stage-${elmId}`" v-model="scenario.sheetInfo.base.stage">
          <template v-else>{{ scenario.sheetInfo.base.stage }}</template>
        </td>
      </tr>
      <tr>
        <th class="th1"><label :for="isGm ? `scene-${elmId}` : ''">シーン表</label></th>
        <td class="scene">
          <input type="text" v-if="isGm" :id="`scene-${elmId}`" v-model="scenario.sheetInfo.base.scene">
          <template v-else>{{ scenario.sheetInfo.base.scene }}</template>
        </td>
        <th class="th2"><label :for="isGm ? `num-${elmId}` : ''">人数</label></th>
        <td class="num">
          <input type="text" v-if="isGm" :id="`num-${elmId}`" v-model="scenario.sheetInfo.base.num">
          <template v-else>{{ scenario.sheetInfo.base.num }}</template>
        </td>
        <th class="th3"><label :for="isGm ? `limit-${elmId}` : ''">リミット</label></th>
        <td>
          <input type="text" v-if="isGm" :id="`limit-${elmId}`" v-model="scenario.sheetInfo.base.limit">
          <template v-else>{{ scenario.sheetInfo.base.limit }}</template>
        </td>
      </tr>
      <tr>
        <th class="th1"><label>シークエンス</label></th>
        <td colspan="3">
          <div class="h-box">
            <label>
              <span>通常</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.seq1">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.seq1" @click.prevent>
            </label>
            <label>
              <span>時限</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.seq2">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.seq2" @click.prevent>
            </label>
            <label>
              <span>競争</span>
              <input type="checkbox" v-if="isGm" v-model="scenario.sheetInfo.base.seq3">
              <input type="checkbox" v-else :checked="scenario.sheetInfo.base.seq3" @click.prevent>
            </label>
          </div>
        </td>
        <th class="th3"><label :for="isGm ? `menace-${elmId}` : ''">脅威度</label></th>
        <td class="menace">
          <div class="h-box">
            <input type="text" v-if="isGm" :id="`menace-${elmId}`" v-model="scenario.sheetInfo.base.menace">
            <template v-else>{{ scenario.sheetInfo.base.menace }}</template>
            <span>/</span>
            <input type="text" v-if="isGm" :id="`menacePC-${elmId}`" v-model="scenario.sheetInfo.base.menacePC">
            <template v-else>{{ scenario.sheetInfo.base.menacePC }}</template>
          </div>
        </td>
      </tr>
      <tr>
        <th class="th1"><label :for="isGm ? `boss-${elmId}` : ''">ボス</label></th>
        <td colspan="3">
          <input type="text" v-if="isGm" :id="`boss-${elmId}`" v-model="scenario.sheetInfo.base.boss.name">
          <template v-else>
            <template v-if="!scenario.sheetInfo.base.boss.secret">{{ scenario.sheetInfo.base.boss.name }}</template>
          </template>
        </td>
        <th class="th3"><label :for="isGm ? `boss-secret-${elmId}` : ''">秘密</label></th>
        <td>
          <input type="checkbox" v-if="isGm" :id="`boss-secret-${elmId}`" v-model="scenario.sheetInfo.base.boss.secret">
          <input type="checkbox" v-else :checked="scenario.sheetInfo.base.boss.secret" @click.prevent>
        </td>
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
  name: 'scenario-base',
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

.h-box {
  @include common.flex-box(row, flex-start, center);

  input {
    width: auto;
    flex: 1;
  }
}

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

  &.scenario {
    @include set-column-width("th1", 7em);
    @include set-column-width("th2", 3em);
    @include set-column-width("th3", 4em);
    @include set-column-width("menace", 9em);
    .menace {
      input {
        flex: 1;
        min-width: auto;
        max-width: none;
      }
      span {
        margin: 0 0.2rem;
      }
    }
  }

  label {
    cursor: pointer;
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

  th {
    background-color: #252525;
    color: white;
    text-align: center;
  }

  td {
    height: 1.9em;
    text-align: left;
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

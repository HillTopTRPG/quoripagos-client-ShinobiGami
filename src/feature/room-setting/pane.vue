<template>
  <label class="bcdice-api-url">
    <span>Bcdice-APIサーバー</span>
    <input type="text" v-model="roomSetting.bcdiceApiUrl">
    <button type="button" @click="onTestBcdice()">接続テスト</button>
    {{ bcdiceTestResult }}
  </label>

  <div class="help-message">{{ roomSetting.helpMessage }}</div>

  <div class="container">
    <div v-for="c in roomSetting.commandSelectionList" :key="c.command">
      <span>{{ c.title }}</span>
      <span>{{ c.command }}</span>
    </div>
  </div>

  <button type="button" @click="onAddOriginalTable()">オリジナル表追加</button>
  <table class="original-table" v-for="(d, idx) in roomSetting.originalDiceTable" :key="idx">
    <tr>
      <th><label :for="`bcdice-command-${idx}`">コマンド</label></th>
      <td><input :id="`bcdice-command-${idx}`" type="text" v-model="d.command"></td>
    </tr>
    <tr>
      <th><label :for="`bcdice-contents-${idx}`">内容</label></th>
      <td><textarea :id="`bcdice-contents-${idx}`" v-model="d.contents"></textarea></td>
    </tr>
    <tr>
      <th colspan="2">
        <button type="button" @click="onExecuteCommand(idx)">実行</button>
      </th>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'
import Store, { RoomSetting } from '@/feature/room-setting/data'
import { errorDialog } from '@/core/utility/dialog'

export default defineComponent({
  name: 'room-setting-pane',
  emits: ['close'],
  setup() {
    const state = Store.injector()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const roomSetting = reactive<RoomSetting>(state.roomSetting!)
    const bcdiceTestResult = ref('')
    watch(() => roomSetting.bcdiceApiUrl, () => {
      bcdiceTestResult.value = ''
    })
    const onTestBcdice = async () => {
      const system = await state.getGameSystem(true)
      if (!system) {
        bcdiceTestResult.value = '接続失敗'
      } else {
        bcdiceTestResult.value = '接続成功'
      }
    }
    const onAddOriginalTable = () => {
      state.roomSetting?.originalDiceTable.push({
        command: 'PGN',
        contents: 'ペンギン表\n1D18\n' + [
          'エンペラーペンギン',
          'キングペンギン',
          'アデリーペンギン',
          'ジェンツーペンギン',
          'ヒゲペンギン',
          'ガラパゴスペンギン',
          'ケープペンギン',
          'フンボルトペンギン',
          'マゼランペンギン',
          'フィヨルドランドペンギン',
          'シュレーターペンギン',
          'スネアーズペンギン',
          'マカロニペンギン',
          'ロイヤルペンギン',
          'キタイワトビペンギン',
          'ミナミイワトビペンギン',
          'キガシラペンギン',
          'コガタペンギン'
        ].map((n, idx) => `${idx + 1}:${n}`).join('\n')
      })
    }
    const onExecuteCommand = async(idx: number): Promise<void> => {
      const command = state.roomSetting?.originalDiceTable[idx]?.command || ''
      console.log(command)
      const contents = state.roomSetting?.originalDiceTable[idx]?.contents || ''
      const commandUrl = `${state.roomSetting?.bcdiceApiUrl}/v2/original_table?table=${encodeURIComponent(contents)}`
      let fetchResult: Response | null = null
      try {
        fetchResult = await fetch(commandUrl, { method: 'POST' })
      } catch (_) {
        setTimeout(() => {
          errorDialog({
            title: 'BcdiceApi接続失敗',
            text: `${commandUrl}`
          }).then()
        })
        return
      }
      try {
        if (!fetchResult) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await fetchResult.json()
        console.log(JSON.stringify(json))
      } catch (err) {
        console.log(err)
      }
    }

    return {
      roomSetting,
      onTestBcdice,
      bcdiceTestResult,
      onAddOriginalTable,
      onExecuteCommand
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.bcdice-api-url {
  input {
    width: 20em;
  }
}

.help-message {
  width: 100%;
  white-space: pre-wrap;
  text-align: left;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  font-size: var(--sheet-font-size);
  box-sizing: border-box;
  width: 30em;
  height: 100%;

  &.original-table {
    th {
      width: 4em;
    }
  }

  label {
    cursor: pointer;
    width: 100%;
    height: 100%;
    @include common.flex-box(row, center, center);
  }

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
    height: 100%;
  }

  td {
    height: 1.9em;
    text-align: left;

    input,
    textarea {
      width: 100%;
    }
    textarea {
      resize: vertical;
      box-sizing: border-box;
      height: 13em;
    }
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

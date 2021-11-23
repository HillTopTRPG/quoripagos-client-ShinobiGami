<template>
  <div class="user-settings" v-if="userSetting">
    <table>
      <caption>ユーザ一覧</caption>
      <tr>
        <th>名前</th>
        <th>タイプ</th>
        <th>チャット色</th>
        <th class="description"></th>
      </tr>
      <tr v-for="user in userList" :key="user.key">
        <td>{{ user.name }}</td>
        <td>{{ getUserTypeLabel(user.type) }}</td>
        <td>
          <font-color-select :editable="false" :model-value="userSettingList.find(us => us.data?.userKey === user.key)?.data?.fontColor" />
        </td>
        <td class="description">{{ selfKey === user.key ? '(あなた)' : '' }}</td>
      </tr>
    </table>
    <h5>あなたの設定</h5>
    <label>
      <span>キャラクター（シナリオ）シートのフォントサイズ</span>
      <input type="number" v-model="userSetting.sheetFontSize" min="10" step="1">
    </label>

    <label>
      <span>アクセントカラー（見えやすい方を選択してください）</span>
      <color-set-container />
    </label>

    <label class="color">
      <span>チャット文字色</span>
      <font-color-select :editable="true" v-model="userSetting.fontColor" />
    </label>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import Store from './data'
import ColorSetContainer from '@/feature/user-setting/color-set-container.vue'
import FontColorSelect from '@/components/font-color-select.vue'
import UserStore, { UserType } from '@/core/data/user'

export default defineComponent({
  name: 'user-setting-pane',
  components: { FontColorSelect, ColorSetContainer },
  setup() {
    const state = Store.injector()
    const userSetting = computed(() => state.userSetting)
    const userSettingList = computed(() => state.userSettingList)
    const userState = UserStore.injector()

    const userList = computed(() => userState.userList)
    const selfKey = computed(() => userState.userLoginResponse?.userKey)

    return {
      userSetting,
      selfKey,
      userSettingList,
      userList,
      getUserTypeLabel: (type: UserType): string => {
        if (type === 'pl') return 'プレイヤー'
        if (type === 'gm') return 'ゲームマスター'
        return '見学者'
      }
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
  box-sizing: border-box;

  caption {
    text-align: left;
  }

  td, th {
    border: solid 1px gray;
    padding: 0.2em;
    margin: 0;
    white-space: pre-wrap;

    &.description {
      border: none;
    }
  }
}

label {
  margin-top: 0.5em;
}

.user-settings {
  @include common.flex-box(column, flex-start, flex-start);
  text-align: left;

  input {
    width: 3em;
  }
}
</style>

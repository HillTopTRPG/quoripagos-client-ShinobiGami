<template>
  <span class="menu-btn" @click="onClickMenuButton()" :class="isMenuOpen ? 'closed' : ''">
    <span class="hr"></span>
    <span class="hr"></span>
    <span class="hr"></span>
  </span>
  <div class="modal-area" :class="[isMenuOpen ? 'open' : '']" @click="onClickMenuButton(false)">
    <transition name="drawer">
      <div class="right-pane" @click.stop v-if="isMenuOpen">
        <details v-for="t in menuItemList" :key="t.type" :id="`menu-${t.type}`" :class="activeTaskList.some(lt => lt === t.type) ? 'active' : ''">
          <summary>{{ t.label }}</summary>
          <div class="container">
            <component :is="`${t.type}-pane`" @close="onTask(t.type, 'hide')"></component>
          </div>
        </details>
      </div>
    </transition>
    <transition name="right-pane">
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import UserStore from '@/core/data/user'
import { removeFilter } from '@/core/utility/typescript'

type MenuItem = {
  label: string;
  type: string;
  isUnique: boolean;
}

type RightPaneTask = {
  type: string;
  taskKey: string;
}

export default defineComponent({
  name: 'modal-area',
  setup() {
    const userState = UserStore.injector()
    const menuItemList = reactive<MenuItem[]>([])
    const me = userState.userList.find(u => u.key === userState.userLoginResponse?.userKey)
    const userType = me?.type || 'pl'
    menuItemList.push({ label: 'シナリオ', type: 'scenario', isUnique: true })
    menuItemList.push({ label: 'ハンドアウト／キャラクター', type: 'character', isUnique: true })
    // menuItemList.push({ label: 'ローカル設定', type: 'local-setting', isUnique: true })
    menuItemList.push({ label: 'ユーザー設定', type: 'user-setting', isUnique: true })
    if (userType === 'gm') {
      menuItemList.push({ label: 'シーン(GMのみ編集可)', type: 'scene', isUnique: true })
      menuItemList.push({ label: '部屋設定(GMのみ編集可)', type: 'room-setting', isUnique: true })
      // menuItemList.push({ label: 'タグ', type: 'tag', isUnique: false })
    }

    const rightPaneTaskList = ref<RightPaneTask[]>([])
    const activeTaskList = ref<string[]>([])
    const currentTask = ref<string | null>(null)

    watch(currentTask, () => {
      setTimeout(() => {
        if (!currentTask.value) return
        document.getElementById(currentTask.value)?.scrollIntoView(true)
      })
    })

    const isRightPaneOpen = ref(false)
    const onClickMenuItem = (type: string) => {
      isRightPaneOpen.value = true
      isMenuOpen.value = false
      if (menuItemList.find(m => m.type === type)?.isUnique) {
        const task = rightPaneTaskList.value.find(t => t.type === type)
        if (task) {
          currentTask.value = task.taskKey
          activeTaskList.value.splice(0, activeTaskList.value.length, task.taskKey)
          return
        }
      }
      const taskKey = uuidV4()
      rightPaneTaskList.value.splice(0, 0, { type, taskKey })
      activeTaskList.value.splice(0, activeTaskList.value.length, taskKey)
      currentTask.value = taskKey
    }

    const onClickRightPaneButton = () => {
      isRightPaneOpen.value = !isRightPaneOpen.value
    }

    const onTask = (taskKey: string, type?: 'open' | 'hide') => {
      if (type === 'open') {
        activeTaskList.value.push(taskKey)
      }
      if (type === 'hide') {
        removeFilter(activeTaskList.value, t => t === taskKey)
      }
      if (type === undefined) {
        if (activeTaskList.value.some(t => t === taskKey)) {
          removeFilter(activeTaskList.value, t => t === taskKey)
        } else {
          activeTaskList.value.push(taskKey)
        }
      }
    }

    const isMenuOpen = ref(false)
    const onClickMenuButton = (force?: boolean) => {
      if (force === false) {
        isRightPaneOpen.value = false
        isMenuOpen.value = false
        return
      }
      isMenuOpen.value = !isMenuOpen.value
    }

    return {
      menuItemList,
      activeTaskList,
      isMenuOpen,
      onClickMenuButton,
      onTask,
      currentTask,
      rightPaneTaskList,
      onClickMenuItem,
      onClickRightPaneButton,
      isRightPaneOpen
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";
@use "sass:math";

.menu-btn {
  display: block;
  width: common.$header-height;
  height: common.$header-height;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  cursor: pointer;

  .hr {
    display: block;
    margin: 0;
    border: none;
    width: 50%;
    height: 4px;
    background: #000;
    position: absolute;
    left: 25%;
    transition: 0.25s;
    transition-property: width, transform;
    z-index: 11;

    &:nth-of-type(1) {
      top: 23%;
      transform-origin: left bottom;
    }
    &:nth-of-type(2) {
      top: 45%;
    }
    &:nth-of-type(3) {
      transform-origin: left top;
      top: 67%;
    }
  }

  &.closed .hr {
    &:nth-of-type(1) {
      transform: translateY(calc(#{common.$header-height} * 0.22 + 1px)) rotate(-45deg) scaleX(0.7);
    }

    &:nth-of-type(3) {
      transform: translateY(calc(#{common.$header-height} * -0.22 - 1px)) rotate(45deg) scaleX(0.7);
    }
  }
}

.modal-area {
  position: absolute;
  top: calc(#{common.$header-height} + 1px);
  @include common.flex-box(row, flex-end, stretch);
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 50000;

  &.open {
    backdrop-filter: blur(10px);
    pointer-events: all;
  }

  .drawer-enter-active,
  .drawer-leave-active {
    transition: all .1s linear;
  }
  .drawer-enter-from,
  .drawer-leave-to {
    transform: translateX(-10px);
    opacity: 0;
  }
  .drawer-enter-to,
  .drawer-leave-from {
    transform: translateX(0);
    opacity: 1;
  }

  .right-pane {
    box-sizing: content-box;
    margin-top: -1px;
    @include common.flex-box(column, stretch, flex-start);
    gap: 0.5rem;
    padding: 0.5rem;
    flex: 1;
    background-color: white;
    border-top: 1px solid #495478;
    border-left: 1px solid #495478;
    overflow-x: hidden;
    overflow-y: scroll;

    details {
      position: relative;
      transition: all .5s;

      .container {
        @include common.flex-box(row, flex-start, flex-start, wrap);
        gap: 0.5rem;
      }

      summary {
        background-color: lightblue;
        vertical-align: center;
        text-align: left;
        line-height: 2em;
        height: 2em;
        box-sizing: border-box;
        cursor: pointer;
        padding: 0 0.5em;
        overflow: hidden;
        font-size: 110%;
        font-weight: bold;
      }
    }
  }
}
</style>

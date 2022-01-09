<template>
  <quoripagos-core>
    <the-play />
  </quoripagos-core>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import ThePlay from '@/components/the-play/the-play.vue'

export default defineComponent({
  name: 'App',
  components: { ThePlay },
  setup() {
    const setFillHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // 画面のサイズ変動があった時に高さを再計算する
    window.addEventListener('resize', setFillHeight)

    setFillHeight()
    onMounted(() => {
      setFillHeight()
    })
  }
})
</script>

<style lang="scss">
@use "./components/common";
@use "./components/animations";

html {
  overflow: hidden;
  overscroll-behavior-x: none;
  overscroll-behavior-y: none;
}

body {
  margin: 0;
  padding: 0;
  text-rendering: optimizeSpeed;
  font-feature-settings: "palt" 1;
  height: calc(var(--vh, 1vh) * 100);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;
  overflow: hidden;
  display: block;
  height: calc(var(--vh, 1vh) * 100);
}

/* モバイルデバイスでアドレスバーを非表示にするには画面をスクロールできないといけない */
@media (hover: none) and (pointer: coarse) {
  #screen-wrapper {
    overflow-y: scroll !important;
  }
}

#screen-wrapper {
  @include common.flex-box(row, space-between, stretch);
  position: absolute;
  left: 0;
  top: 0;
  height: calc(var(--vh, 1vh) * 100);
  max-height: calc(var(--vh, 1vh) * 100);
  min-height: calc(var(--vh, 1vh) * 100);
  width: 200vw;
  transition-property: none;
  transition-duration: animations.$play-slide-animation-duration;
  transition-delay: animations.$play-slide-animation-delay;
  transition-timing-function: linear;

  &.animation {
    transition-property: transform;
  }

  &.login {
    transform: translateX(0);
  }

  &.play {
    transform: translateX(-100vw);
  }
}

.swal2-popup.cut-in {
  table {
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid black;

    th {
      vertical-align: top;
      white-space: nowrap;
    }

    td {
      white-space: pre-wrap;
    }

    td, th {
      border: 1px solid gray;
      padding: 0.3rem;
    }
  }
}

button {
  font-size: inherit;
  white-space: nowrap;

  &:not(:disabled) {
    cursor: pointer;
  }
}

.swal2-popup.cut-in {
  border: 2px solid gray;
}

.dialog-cutin-container {
  position: relative;

  &.vertical {
    @include common.flex-box(column, center, flex-start);

    .image {
      width: 100%;
      height: 35%;
      background-position: center;
    }
  }

  &.horizontal {
    @include common.flex-box(row, flex-start, stretch);

    .image {
      width: 35%;
      height: 100%;
      background-position: top;
    }
  }

  .image {
    background-image: var(--image);
    background-repeat: no-repeat;
    background-size: contain;
  }

  .text {
    flex: 1;
    text-align: left;
    overflow: auto;
  }
}

input[type="text"] {
  height: 2em;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

select {
  font-size: inherit;
  box-sizing: border-box;
  height: 2em;
  padding: 0;
  margin: 0;
}
</style>

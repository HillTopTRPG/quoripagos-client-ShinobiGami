<template>
  <quoripagos-core>
    <the-play />
  </quoripagos-core>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ThePlay from '@/components/the-play/the-play.vue'

export default defineComponent({
  name: 'App',
  components: { ThePlay }
})
</script>

<style lang="scss">
@use "./components/common";

* {
  overscroll-behavior-x: none;
}

body {
  margin: 0;
  padding: 0;
  text-rendering: optimizeSpeed;
  font-feature-settings: "palt" 1;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;
}

button {
  font-size: inherit;
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
    overflow: auto;
    text-align: left;
  }
}

input[type="text"] {
  height: 2em;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
</style>

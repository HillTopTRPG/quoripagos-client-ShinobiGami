<template>
  <h2>
    <span>{{ title }}</span>
    <span class="view-mode">
      表示モード
      <label>
        <input type="radio" :name="`view-mode-${title}`" value="normal" :checked="'normal' === viewMode" @change="$emit('update:viewMode', $event.target.value)">
        <span>{{ normalLabel }}</span>
      </label>
      <label v-if="useSimple">
        <input type="radio" :name="`view-mode-${title}`" value="simple" :checked="'simple' === viewMode" @change="$emit('update:viewMode', $event.target.value)">
        <span>{{ simpleLabel }}</span>
      </label>
      <label v-if="editable">
        <input type="radio" :name="`view-mode-${title}`" value="alt" :checked="'alt' === viewMode" @change="$emit('update:viewMode', $event.target.value)">
        <span>{{ altLabel }}</span>
      </label>
    </span>
    <button @click="$emit('add')" v-if="editable">追加</button>
  </h2>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'view-mode',
  emits: ['update:viewMode', 'add'],
  props: {
    title: {
      type: String,
      required: true
    },
    viewMode: {
      type: String as PropType<'normal' | 'simple' | 'alt'>
    },
    useSimple: {
      type: Boolean,
      required: true
    },
    editable: {
      type: Boolean,
      required: true
    },
    useAdd: {
      type: Boolean,
      required: true
    },
    normalLabel: {
      type: String,
      required: true
    },
    simpleLabel: {
      type: String,
      required: true
    },
    altLabel: {
      type: String,
      required: true
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

h2 {
  @include common.flex-box(row, flex-start, center);
  border-bottom: gold 3px solid;
  border-left: gold 5px solid;
  padding-left: 0.3rem;
  margin: 0;
  box-sizing: border-box;
  width: 100%;

  > :first-child {
    flex: 1;
    text-align: left;
  }

  > :not(:first-child) {
    margin-right: 0.5rem;
  }
}

.view-mode {
  @include common.flex-box(row, flex-start, center);
  font-size: 1rem;
  background-color: white;
  padding: 0.1rem;
  font-weight: normal;

  input {
    display: none;
  }
  input ~ span {
    border: gray 1px solid;
    padding: 0.1rem;
    cursor: pointer;
    user-select: none;
  }
  input:checked ~ span {
    border: gray 1px solid;
    background-color: darkblue;
    color: white;
    font-weight: bold;
  }
  label:first-child input ~ span {
    border-radius: 5px 0 0 5px;
  }
  label:not(:first-child) input ~ span {
    margin-left: -1px;
  }
  label:last-child input ~ span {
    border-radius: 0 5px 5px 0;
  }
}
</style>

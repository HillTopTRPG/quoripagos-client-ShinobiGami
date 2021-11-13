<template>
  <h2 :class="viewMode">
    <span>{{ title }}</span>
    <span class="view-mode">
      <label>
        <input type="radio" :name="`view-mode-${elmId}`" value="normal" :checked="'normal' === viewMode" @change="$emit('update:viewMode', $event.target.value)">
        <span>{{ normalLabel }}</span>
      </label>
      <label v-if="useSimple">
        <input type="radio" :name="`view-mode-${elmId}`" value="simple" :checked="'simple' === viewMode" @change="$emit('update:viewMode', $event.target.value)">
        <span>{{ simpleLabel }}</span>
      </label>
      <label v-if="editable">
        <input type="radio" :name="`view-mode-${elmId}`" value="alt" :checked="'alt' === viewMode" @change="$emit('update:viewMode', $event.target.value)">
        <span>{{ altLabel }}</span>
      </label>
    </span>
    <button @click="$emit('add')" v-if="editable">追加</button>
  </h2>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { v4 as uuidV4 } from 'uuid'

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
  },
  setup() {
    const elmId = uuidV4()
    return {
      elmId
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

h2 {
  @include common.flex-box(row, flex-start, center);
  position:relative;
  padding-left: 10px;
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  font-size: calc(var(--sheet-font-size) * 1.2);

  &:before{
    content: '';
    position: absolute;
    top: -6px;
    left: 3px;
    height: 15px;
    width: 3px;
    display: block;
    background: #252525;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3) inset;
  }

  &:after {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    height: 3px;
    width: 13px;
    display: block;
    background: #252525;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3) inset;
  }

  > :first-child {
    flex: 1;
    text-align: left;
  }

  > :not(:first-child) {
    margin-right: 0.2rem;
  }
}

button {
  font-size: var(--sheet-font-size);
}

.view-mode {
  @include common.flex-box(row, flex-start, center);
  font-size: var(--sheet-font-size);
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
    background-color: #252525;
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

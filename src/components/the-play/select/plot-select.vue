<template>
  <select :value="modelValue" :class="mode" @input="inputHandler">
    <option disabled>プロット</option>
    <option :value="-2" :disabled="readonly && modelValue !== -2">{{ defaultText }}</option>
    <option :value="-1" :disabled="readonly && modelValue !== -1">ドラマ</option>
    <option :value="0" :disabled="readonly && modelValue !== 0">0</option>
    <option :value="1" :disabled="readonly && modelValue !== 1">1</option>
    <option :value="2" :disabled="readonly && modelValue !== 2">2</option>
    <option :value="3" :disabled="readonly && modelValue !== 3">3</option>
    <option :value="4" :disabled="readonly && modelValue !== 4">4</option>
    <option :value="5" :disabled="readonly && modelValue !== 5">5</option>
    <option :value="6" :disabled="readonly && modelValue !== 6">6</option>
    <option :value="7" :disabled="readonly && modelValue !== 7" v-if="mode === 'normal'">7</option>
  </select>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { convertNumberZero } from '@/core/utility/PrimaryDataUtility'
export default defineComponent({
  name: 'plot-select',
  emits: ['update:modelValue'],
  props: {
    mode: {
      type: String as PropType<'normal' | 'plot'>,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Number,
      required: true
    },
    defaultText: {
      type: String,
      default: ''
    }
  },
  setup(_, { emit }) {
    return {
      inputHandler: (e: { target: HTMLButtonElement }) => {
        emit('update:modelValue', convertNumberZero(e.target.value))
      }
    }
  }
})
</script>

<style scoped lang="scss">
select {
  height: 2em;

  &.plot {
    background-color: rgba(255, 255, 0, 0.4) !important;
  }
}
</style>

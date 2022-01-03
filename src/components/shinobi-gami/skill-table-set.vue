<template>
  <div class="skill-table-set">
    <skill-table
      :type="type"
      :target="target"
      @clearArts="onClearArts()"
      :target-arts="targetArts"
      mode="normal"
      v-model:target-skill="targetSkillRaw"
    />
    <skill-table
      :type="type"
      :target="target"
      @clearArts="onClearArts()"
      mode="comparison"
      v-model:other-character-key="otherCharaKey"
      v-model:target-skill="targetSkillRaw"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import SkillTable from '@/components/shinobi-gami/skill-table.vue'

export default defineComponent({
  name: 'skill-table-set',
  components: { SkillTable },
  props: {
    type: {
      type: String as PropType<'pc' | 'npc' | 'right-hand'>,
      required: true
    },
    target: {
      type: String,
      default: null
    },
    otherCharacterKey: {
      type: String,
      default: null
    },
    targetSkill: {
      type: String,
      default: null
    },
    targetArts: {
      type: String,
      default: null
    }
  },
  emits: ['update:targetSkill', 'update:otherCharacterKey', 'clear-arts'],
  setup(props, { emit }) {
    const targetSkillRaw = ref<string | null>(props.targetSkill)
    const otherCharaKey = ref<string | null>(props.otherCharacterKey)
    watch(() => props.targetSkill, () => {
      targetSkillRaw.value = props.targetSkill
    })
    watch(targetSkillRaw, () => {
      emit('update:targetSkill', targetSkillRaw.value)
    })
    watch(() => props.otherCharacterKey, () => {
      otherCharaKey.value = props.otherCharacterKey
    })
    watch(otherCharaKey, () => {
      emit('update:otherCharacterKey', otherCharaKey.value)
    })
    return {
      targetSkillRaw,
      otherCharaKey,
      onClearArts: () => {
        emit('clear-arts')
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../common";

.skill-table-set {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5rem;
  box-sizing: border-box;
}
</style>

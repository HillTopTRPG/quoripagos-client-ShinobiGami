<template>
  <div class="scene-status-area">
    <cycle-select :limit="limit" v-model="cycle" />
    <span>/{{limit}}</span>
    <round-select v-model="round" />
    <battle-field-select v-model="battleField" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import CycleSelect from '@/components/the-play/select/cycle-select.vue'
import BattleFieldSelect from '@/components/the-play/select/battle-field-select.vue'
import RoundSelect from '@/components/the-play/select/round-select.vue'
import ScenarioStore from '@/feature/scenario/data'
import RoomSettingStore from '@/feature/room-setting/data'

export default defineComponent({
  name: 'scene-status-area',
  components: { RoundSelect, BattleFieldSelect, CycleSelect },
  setup() {
    const scenarioState = ScenarioStore.injector()
    const roomSettingState = RoomSettingStore.injector()
    const limit = computed(() => scenarioState.currentScenario.sheetInfo.base.limit)

    const cycle = ref(roomSettingState.roomSetting?.cycle || 0)
    const round = ref(roomSettingState.roomSetting?.round || 0)
    const battleField = ref(roomSettingState.roomSetting?.battleField || 0)

    watch([cycle, round, battleField], () => {
      if (roomSettingState.roomSetting) {
        roomSettingState.roomSetting.cycle = cycle.value
        roomSettingState.roomSetting.round = round.value
        roomSettingState.roomSetting.battleField = battleField.value
      }
    })

    return {
      cycle,
      round,
      battleField,
      limit
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.scene-status-area {
  @include common.flex-box(row, null, flex-end, wrap);

  label {
    @include common.flex-box(column, null, flex-start);

    select {
      font-size: 120%;
    }
  }
}
</style>

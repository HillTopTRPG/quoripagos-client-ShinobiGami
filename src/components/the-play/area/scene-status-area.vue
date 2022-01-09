<template>
  <div class="scene-status-area">
    <cycle-select :limit="limit" v-model="cycle" />
    <span>/{{limit}}</span>
    <round-select v-model="round" />
    <span v-if="roundPhase">/{{roundPhase}}</span>
    <battle-field-select v-model="battleField" />
    <label>
      <span>シーン</span>
      <select v-model="currentScene" v-if="isGm">
        <option :value="s.key" v-for="s in sceneList" :key="s.key">{{ s.data?.name }}</option>
      </select>
      <div class="readonly-scene" v-else>
        {{ sceneList.find(s => s.key === currentScene)?.data?.name || '' }}
      </div>
    </label>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import CycleSelect from '@/components/the-play/select/cycle-select.vue'
import BattleFieldSelect from '@/components/the-play/select/battle-field-select.vue'
import RoundSelect from '@/components/the-play/select/round-select.vue'
import ScenarioStore from '@/feature/scenario/data'
import RoomSettingStore from '@/feature/room-setting/data'
import SceneStore from '@/feature/scene/data'
import UserStore from '@/core/data/user'

export default defineComponent({
  name: 'scene-status-area',
  components: { RoundSelect, BattleFieldSelect, CycleSelect },
  setup() {
    const scenarioState = ScenarioStore.injector()
    const roomSettingState = RoomSettingStore.injector()
    const limit = computed(() => scenarioState.currentScenario.sheetInfo.base.limit)
    const sceneState = SceneStore.injector()
    const sceneList = computed(() => sceneState.list)

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const cycle = ref(0)
    const round = ref(0)
    const battleField = ref(0)
    const currentScene = ref(roomSettingState.roomSetting?.sceneKey)
    const roundPhase = ref('')

    watch(() => roomSettingState.roomSetting, () => {
      cycle.value = roomSettingState.roomSetting?.cycle || 0
      round.value = roomSettingState.roomSetting?.round || 0
      battleField.value = roomSettingState.roomSetting?.battleField || 0
      currentScene.value = roomSettingState.roomSetting?.sceneKey || null
      roundPhase.value = roomSettingState.roomSetting?.isPrePlot !== 'none' ? 'プロット中' : ''
    }, { immediate: true, deep: true })

    watch([cycle, round, battleField, currentScene], () => {
      if (roomSettingState.roomSetting) {
        roomSettingState.roomSetting.cycle = cycle.value
        roomSettingState.roomSetting.round = round.value
        roomSettingState.roomSetting.battleField = battleField.value
        roomSettingState.roomSetting.sceneKey = currentScene.value || null
      }
    })

    return {
      isGm,
      cycle,
      round,
      battleField,
      limit,
      sceneList,
      currentScene,
      roundPhase
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.scene-status-area {
  @include common.flex-box(row, null, flex-end, wrap);
  gap: 0.5rem;

  > span {
    margin-left: -0.5rem;
  }

  label {
    @include common.flex-box(column, null, flex-start);
  }

  span {
    font-size: 80%;
  }
  select {
    height: 2em;
  }
  .readonly-scene {
    height: 2em;
    @include common.flex-box(column, flex-start, center);
  }
}
</style>

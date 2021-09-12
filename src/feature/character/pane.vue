<template>
  <div class="character-pane-container">
    <details open>
      <summary>編集</summary>
      <div class="h-box">
        <template v-for="c in characterList" :key="c.key">
          <div
            class="character"
            :style="c.styleObj"
            @click="onSelectEditCharacter(c.key)"
          ><span>{{ c.data.sheetInfo.characterName }}</span></div>
        </template>
        <template v-if="selectCharacterKey">
          <label>入力内容はリアルタイムで反映されます（画像はアップロードボタンで反映）</label>
          <character-form mode="update" :character="characterList.find(c => c.key === selectCharacterKey)?.data" />
        </template>
      </div>
    </details>
    <details open>
      <summary>追加</summary>
      <div class="h-box">
        <character-form mode="insert" :character="character" @insert="insertCharacter" />
      </div>
    </details>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import Store, { Character, ImageInfo } from './data'
import UserSettingStore from '@/feature/user-setting/data'
import SkillTable from '@/components/shinobi-gami/skill-table.vue'
import { removeFilter } from '@/core/utility/typescript'
import CharacterForm from '@/feature/character/character-form.vue'

export default defineComponent({
  name: 'character-pane',
  emits: ['close'],
  components: { CharacterForm },
  setup(_, { emit }) {
    const userSettingStore = UserSettingStore.injector()
    const userSetting = computed(() => userSettingStore.userSetting)

    const state = Store.injector()

    const character = reactive<Character>({
      pcNo: null,
      isActed: false,
      plot: -2,
      type: 'character',
      isFumble: false,
      color: '#3E2723',
      sheetViewPass: '',
      sheetInfo: {
        url: '',
        playerName: '',
        characterName: '',
        characterNameKana: '',
        regulation: '',
        foe: '',
        exp: '',
        memo: '',
        upperStyle: '',
        subStyle: '',
        level: '',
        age: '',
        sex: '',
        cover: '',
        belief: '',
        stylerule: '',
        ninjaArtsList: [],
        personalityList: [],
        scenario: {
          handout: '',
          mission: '',
          name: '',
          pcno: ''
        },
        backgroundList: [],
        skill: {
          learnedList: [],
          damagedList: [],
          damagedColList: [],
          spaceList: [],
          outRow: false,
          isUseColDamage: false,
          isUseSingleDamage: false,
          isOutputSingleDamage: false
        },
        specialArtsList: [],
        ninjaToolList: []
      },
      chitImageList: [],
      standImageList: [],
      currentChitImage: -1,
      currentStandImage: -1
    })

    const insertCharacter = (chitImageList: ImageInfo[], standImageList: ImageInfo[]) => {
      // eslint-disable-next-line no-irregular-whitespace
      const deleteSpace = (name: string) => name.replaceAll(/ 　/g, '')
      removeFilter(character.sheetInfo.ninjaArtsList, n => !deleteSpace(n.name).length)
      removeFilter(character.sheetInfo.backgroundList, n => !deleteSpace(n.name).length)
      state.insertData([character], [[chitImageList.filter(ci => !!ci.name), standImageList.filter(ci => !!ci.name)]])
      emit('close')
    }

    const selectCharacterKey = ref<string | null>(null)
    const onSelectEditCharacter = (characterKey: string) => {
      selectCharacterKey.value = characterKey
    }

    return {
      selectCharacterKey,
      onSelectEditCharacter,
      characterList: state.makeWrapCharacterList(),
      userSetting,
      character,
      SkillTable,
      skillColumnList: ['器術', '体術', '忍術', '謀術', '戦術', '妖術'],
      insertCharacter,
      selectColor(color: string) {
        character.color = color
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.character-pane-container {
  @include common.flex-box(column, stretch, flex-start);
  padding-top: 0.5rem;
  gap: 0.5rem;
  width: 100%;
}

details {
  margin: 0 0.5rem;

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
    font-weight: bold;
  }
}

.h-box {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5rem
}
.character {
  width: 5em;
  height: 7em;
  font-size: 80%;
  overflow: hidden;
  position: relative;
  @include common.flex-box(row, center, center);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center top;
  background-image: var(--chit-image);

  span {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2em;
    @include common.flex-box(row, center, center);
    color: var(--color);
    font-weight: bold;
  }
}
</style>

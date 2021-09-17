<template>
  <div class="character-pane-container">
    <details open>
      <summary>編集</summary>
      <div class="h-box">
        <template v-for="(n, idx) in npcList" :key="idx">
          <character-chit-name type="NPC" :character="n" :view-name="true" :name="n.name" @select="onSelectEditCharacter(n.name)" />
        </template>
        <template v-for="c in characterList" :key="c.key">
          <character-chit-name type="PC" :character="c.data" :view-name="true" :name="c.data.sheetInfo.characterName" @select="onSelectEditCharacter(c.key)" />
        </template>
        <template v-if="editCharacter">
          <character-form
            mode="update"
            :character="editCharacter"
            :character-key="editCharacterKey"
            v-if="editCharacter"
            v-model:url="editCharacter.sheetInfo.url"
            v-model:sheet-view-pass="editCharacter.sheetViewPass"
          />
        </template>
      </div>
    </details>
    <details>
      <summary>追加</summary>
      <div class="h-box">
        <character-form
          mode="insert"
          :character="character"
          :character-key="''"
          v-model:url="character.sheetInfo.url"
          v-model:sheet-view-pass="character.sheetViewPass"
          @insert="insertCharacter"
        />
      </div>
    </details>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import Store, { Character, CharacterBase, ImageInfo } from './data'
import UserSettingStore from '@/feature/user-setting/data'
import ScenarioStore from '@/feature/scenario/data'
import SkillTable from '@/components/shinobi-gami/skill-table.vue'
import { removeFilter } from '@/core/utility/typescript'
import CharacterForm from '@/feature/character/character-form.vue'
import MediaListStore from '@/feature/media-list/data'
import CharacterChitName from '@/feature/character/character-chit-name.vue'

export default defineComponent({
  name: 'character-pane',
  emits: ['close'],
  components: { CharacterChitName, CharacterForm },
  setup(_, { emit }) {
    const userSettingState = UserSettingStore.injector()
    const scenarioState = ScenarioStore.injector()
    const userSetting = computed(() => userSettingState.userSetting)
    const mediaListState = MediaListStore.injector()

    const state = Store.injector()

    const character = reactive<Character>({
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getStyleObj = (c: CharacterBase | undefined): any => {
      if (!c || !c.chitImageList || !c.standImageList) return null
      const chitImageUrl = mediaListState.list.find(m => m.key === c.chitImageList[c.currentChitImage])?.data?.url
      const standImageUrl = mediaListState.list.find(m => m.key === c.standImageList[c.currentStandImage])?.data?.url
      return {
        '--color': c.color,
        '--chit-image': chitImageUrl ? `url('${chitImageUrl}')` : '',
        '--stand-image': standImageUrl ? `url('${standImageUrl}')` : ''
      }
    }

    const editCharacterType = ref<null | 'character' | 'npc'>(null)
    const editCharacter = ref<null | CharacterBase>(null)
    const editCharacterKey = ref<null | string>(null)
    watch(selectCharacterKey, () => {
      const npc = scenarioState.currentScenario.sheetInfo.npc.find(n => n.sheetInfo?.characterName === selectCharacterKey.value)
      if (npc) {
        editCharacterType.value = 'npc'
        editCharacter.value = npc
        editCharacterKey.value = npc.name
        return
      }
      const character = state.characterList.find(c => c.key === selectCharacterKey.value)
      if (character && character.data) {
        editCharacterType.value = 'character'
        editCharacter.value = character.data
        editCharacterKey.value = character.key
        return
      }
      editCharacterType.value = null
      editCharacter.value = null
    }, { deep: true, immediate: true })

    return {
      editCharacterType,
      editCharacter,
      editCharacterKey,
      getStyleObj,
      selectCharacterKey,
      onSelectEditCharacter,
      npcList: computed(() => scenarioState.currentScenario.sheetInfo.npc),
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
</style>

<template>
  <div class="character-pane-container">
    <details open>
      <summary>編集／閲覧</summary>
      <div class="v-box">
        <div class="h-box">
          <template v-for="(n, idx) in npcList" :key="idx">
            <character-chit-name v-if="isGm || !n.secretcheck" type="NPC" :character="n" :view-name="true" :name="n.sheetInfo ? n.sheetInfo.characterName : n.name" @select="onSelectEditCharacter(n.name)" />
          </template>
          <template v-for="(e, idx) in enigmaList" :key="idx">
            <character-chit-name type="エニグマ" :character="e" :view-name="true" :name="e.name" @select="onSelectEditCharacter(e.name)" />
          </template>
          <template v-for="c in characterList" :key="c.key">
            <character-chit-name type="PC" :character="c.data" :view-name="true" :name="c.data.sheetInfo.characterName" @select="onSelectEditCharacter(c.key)" />
          </template>
        </div>
        <div class="h-box">
          <template v-if="editCharacter">
            <character-form
              mode="update"
              :character="editCharacter"
              :character-key="editCharacterKey"
              v-if="editCharacter?.type === 'character'"
              v-model:url="editCharacter.sheetInfo.url"
              v-model:sheet-view-pass="editCharacter.sheetViewPass"
            />
            <character-form
              mode="update"
              :character="editCharacter"
              :character-key="editCharacterKey"
              v-if="editCharacter?.type === 'npc'"
              v-model:url="editCharacter.url"
              v-model:sheet-view-pass="editCharacter.sheetViewPass"
            />
            <character-form
              mode="update"
              :character="editCharacter"
              :character-key="editCharacterKey"
              v-if="editCharacter?.type === 'enigma'"
            />
          </template>
        </div>
      </div>
    </details>
    <details>
      <summary>キャラクター追加</summary>
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
import UserStore from '@/core/data/user'
import { Enigma, NPC } from '@/core/utility/shinobigamiScenario'

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

    const selectCharacterKey = ref<string | null>(null)
    const onSelectEditCharacter = (characterKey: string) => {
      selectCharacterKey.value = characterKey
    }

    const editCharacter = ref<null | Character | NPC | Enigma>(null)
    const editCharacterKey = ref<null | string>(null)
    watch([
      selectCharacterKey,
      () => scenarioState.currentScenario.sheetInfo.npc,
      () => state.characterList
    ], () => {
      const npc = scenarioState.currentScenario.sheetInfo.npc.find(n => (n.sheetInfo?.characterName || n.name) === selectCharacterKey.value)
      if (npc) {
        editCharacter.value = npc
        editCharacterKey.value = npc.name
        return
      }
      const enigma = scenarioState.currentScenario.sheetInfo.enigma.find(e => e.name === selectCharacterKey.value)
      if (enigma) {
        editCharacter.value = enigma
        editCharacterKey.value = enigma.name
        return
      }
      const character = state.characterList.find(c => c.key === selectCharacterKey.value)
      if (character && character.data) {
        editCharacter.value = character.data
        editCharacterKey.value = character.key
        return
      }
      editCharacter.value = null
    }, { deep: true, immediate: true })

    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    return {
      isGm,
      editCharacter,
      editCharacterKey,
      getStyleObj,
      selectCharacterKey,
      onSelectEditCharacter,
      npcList: computed(() => scenarioState.currentScenario.sheetInfo.npc),
      enigmaList: computed(() => scenarioState.currentScenario.sheetInfo.enigma),
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

.v-box {
  @include common.flex-box(column, stretch, flex-start);
  gap: 0.5rem
}

.h-box {
  @include common.flex-box(row, flex-start, flex-start, wrap);
  gap: 0.5rem
}
</style>

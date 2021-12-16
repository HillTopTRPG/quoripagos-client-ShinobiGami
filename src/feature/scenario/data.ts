import { reactive, ref, watch } from 'vue'
import { commonStoreDataProcess, makeStore, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import { ChitBase, Enigma, NPC, PC, RightHand, ShinobiGamiScenario, Summary } from '@/core/utility/shinobigamiScenario'
import { ApplicationError } from '@/core/error/ApplicationError'
import CharacterStore, {
  Character,
  ImageInfo,
  UploadMediaInfo,
  UploadMediaRequest,
  UploadMediaResponse
} from '@/feature/character/data'
import MediaStore, { getUrlTypes } from '@/feature/media-list/data'
import { getFileName } from '@/core/utility/PrimaryDataUtility'
import SocketStore from '@/core/data/socket'
import { ComputedRef, ToRef } from '@vue/reactivity'
import { v4 as uuidV4 } from 'uuid'

export type Scenario = {
  url: string;
  sheetViewPass: string;
  sheetInfo: ShinobiGamiScenario;
}

export type WrapCharacterData<T> = {
  idx: number;
  raw: T;
  character: Character | null;
  imageInfo: ImageInfo;
}

export type ChitStatus = {
  isOwn: boolean;
  isSecretOpen: boolean;
  isSheetShow: boolean;
}

type Store = {
  ready: boolean,
  list: StoreData<Scenario>[];
  currentIndex: number;
  requestData: () => Promise<void>;
  uploadCharacterImage: (character: ChitBase, mediaInfo: [ImageInfo[], ImageInfo[]]) => Promise<void>;
  getChitStatus: (
    type: 'pc' | 'npc' | 'right-hand' | 'enigma',
    target: string,
    selfUserKey: string | null
  ) => ChitStatus;
  currentScenario: Scenario;
  makeWrapLists: (
    type?: 'pc' | 'npc' | 'right-hand' | 'enigma',
    target?: ComputedRef<string>
  ) => {
    pcListWrap: ToRef<WrapCharacterData<PC>[]>;
    npcListWrap: ToRef<WrapCharacterData<NPC>[]>;
    rightHandListWrap: ToRef<WrapCharacterData<RightHand>[]>;
    enigmaListWrap: ToRef<WrapCharacterData<Enigma>[]>;
    summaryListWrap: ToRef<WrapCharacterData<Summary>[]>;
    updatePcListWrap: (target: string) => void;
    updateNpcListWrap: (target: string) => void;
    updateRightHandListWrap: (target: string) => void;
    updateEnigmaListWrap: (target: string) => void;
  }
}

export default makeStore<Store>('scenario-store', () => {
  const state = reactive<StoreUpdateProperties<Store, 'currentScenario'>>({
    ready: false,
    currentIndex: 0,
    list: []
  })

  const characterState = CharacterStore.injector()
  const mediaState = MediaStore.injector()

  const { requestData, insertData } = commonStoreDataProcess(
    state.list,
    'scenario',
    [
      'url',
      'sheetViewPass',
      'sheetInfo'
    ]
  )

  const setup = async (): Promise<void> => {
    await requestData()
    if (state.list.length) {
      state.ready = true
      return
    }
    await insertData({
      ownerType: null,
      owner: null,
      data: {
        url: '',
        sheetViewPass: '',
        sheetInfo: {
          base: {
            author: '',
            boss: {
              name: '',
              secret: false
            },
            limit: '',
            name: '',
            num: '',
            menace: '',
            menacePC: '',
            publicview: false,
            scene: '',
            seq1: false,
            seq2: false,
            seq3: false,
            type1: false,
            type2: false,
            type3: false,
            type4: false,
            stage: ''
          },
          npc: [],
          pc: [],
          enigma: [],
          characters: [],
          prize: [],
          righthand: [],
          summary: []
        }
      }
    })
    let intervalId: number | null = null
    return new Promise((resolve) => {
      intervalId = window.setInterval(() => {
        if (state.list.length) {
          if (intervalId !== null) {
            window.clearInterval(intervalId)
            intervalId = null
            state.ready = true
            resolve()
          }
        }
      }, 50)
    })
  }
  setup().then()

  const makeUploadMediaInfoList = (mediaList: [ImageInfo[], ImageInfo[]][]): UploadMediaInfo[] =>
    mediaList.flatMap(mediaInfo => mediaInfo.flatMap((list, idx) => list
      .filter(img => img.type === 'new-file' && img.name)
      .map(img => ({
        key: img.key,
        url: '',
        dataLocation: 'server',
        ...getUrlTypes(img.name),
        rawPath: getFileName(img.name),
        tag: idx === 0 ? 'chit' : 'stand',
        name: img.name,
        arrayBuffer: img.src
      }))))

  const socketState = SocketStore.injector()

  const uploadAndKeyReplace = async (
    uploadMediaInfoList: UploadMediaInfo[],
    mediaList: [ImageInfo[], ImageInfo[]][]
  ) => {
    const resultList = await socketState.sendSocketServerRoundTripRequest<
      UploadMediaRequest,
      UploadMediaResponse
    >(
      'media-api-upload',
      { uploadMediaInfoList, option: {} }
    )
    let count = 0
    mediaList.forEach(tuple => {
      tuple.forEach(
        list => list
          .filter(img => img.type === 'new-file' && img.name)
          .forEach(img => {
            img.key = resultList[count++].key
            img.type = 'uploaded'
          })
      )
    })
  }

  const uploadCharacterImage = async (
    character: ChitBase,
    mediaInfo: [ImageInfo[], ImageInfo[]]
  ): Promise<void> => {
    const uploadMediaInfoList: UploadMediaInfo[] = makeUploadMediaInfoList([mediaInfo])
    console.log(uploadMediaInfoList)
    await uploadAndKeyReplace(uploadMediaInfoList, [mediaInfo])
    character.chitImageList = mediaInfo[0].filter(t => t.type === 'uploaded').map(t => t.key)
    if (character.currentChitImage === -1) character.currentChitImage = character.chitImageList.length ? 0 : -1
    character.standImageList = mediaInfo[1].filter(t => t.type === 'uploaded').map(t => t.key)
    if (character.currentStandImage === -1) character.currentStandImage = character.standImageList.length ? 0 : -1
  }

  const getChitStatus = (
    type: 'pc' | 'npc' | 'right-hand' | 'enigma',
    target: string,
    selfUserKey: string | null
  ): { isOwn: boolean; isSecretOpen: boolean; isPlacementOpen: boolean; isSheetShow: boolean; } => {
    const sheetInfo = state.list[state.currentIndex].data?.sheetInfo
    if (!sheetInfo) throw new Error()
    const checkList = (list: string[]) =>
      list.map(characterKey => sheetInfo.pc
        .find(p => p._characterKey === characterKey)?._userKey)
        .some(userKey => userKey && userKey === selfUserKey)
    if (type === 'pc') {
      const pc = sheetInfo.pc.find(p => p._characterKey === target)
      const isOwn = Boolean(pc && pc._userKey === selfUserKey)
      return {
        isOwn,
        isSecretOpen: isOwn || Boolean(pc && checkList(pc._secretOpenList)),
        isPlacementOpen: isOwn || Boolean(pc && checkList(pc._placementOpenList)),
        isSheetShow: true
      }
    }
    if (type === 'npc') {
      const npc = sheetInfo.npc.find(n => n._characterKey === target)
      return {
        isOwn: false,
        isSecretOpen: Boolean(npc && checkList(npc._secretOpenList)),
        isPlacementOpen: Boolean(npc && checkList(npc._placementOpenList)),
        isSheetShow: Boolean(npc && !npc.secretcheck && checkList(npc._sheetOpenList))
      }
    }
    if (type === 'right-hand') {
      const rh = sheetInfo.righthand.find(r => r._characterKey === target)
      return {
        isOwn: false,
        isSecretOpen: false,
        isPlacementOpen: false,
        isSheetShow: Boolean(rh && !rh._secretCheck && checkList(rh._sheetOpenList))
      }
    }
    if (type === 'enigma') {
      return {
        isOwn: false,
        isSecretOpen: false,
        isPlacementOpen: false,
        isSheetShow: true
      }
    }
    throw new Error()
  }

  const makeWrapLists = (
    type?: 'pc' | 'npc' | 'right-hand' | 'enigma',
    target?: ComputedRef<string>
  ): {
    pcListWrap: ToRef<WrapCharacterData<PC>[]>;
    npcListWrap: ToRef<WrapCharacterData<NPC>[]>;
    rightHandListWrap: ToRef<WrapCharacterData<RightHand>[]>;
    enigmaListWrap: ToRef<WrapCharacterData<Enigma>[]>;
    summaryListWrap: ToRef<WrapCharacterData<Summary>[]>;
    updatePcListWrap: (target: string) => void;
    updateNpcListWrap: (target: string) => void;
    updateRightHandListWrap: (target: string) => void;
    updateEnigmaListWrap: (target: string) => void;
  } => {
    const scenario = state.list[state.currentIndex]?.data
    if (!scenario) {
      throw new ApplicationError('Not found scenario error.')
    }

    const updateWrapList = <U>(
      wrapList: ToRef<WrapCharacterData<U>[]>,
      list: U[],
      _type: 'pc' | 'npc' | 'right-hand' | 'enigma' | 'summary',
      target?: string
    ) => {
      const _wrapList: WrapCharacterData<U>[] = list
        .filter(d => {
          if (type !== _type || !target) return true

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const name = (d as any).name

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const characterKey = (d as any)._characterKey
          // console.log(name, type, target, characterKey)
          if (type === 'pc') return target === characterKey
          if (type === 'npc') return target === characterKey
          if (type === 'right-hand') return target === characterKey
          if (type === 'enigma') return target === name

          return true
        })
        .map((raw, idx) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const media = mediaState.list.find(m => m.key === (raw as any)._imageKey)
          return {
            idx,
            raw,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            character: characterState.characterList?.find(c => c.key === (raw as any)._characterKey)?.data || null,
            imageInfo: media ? ({
              key: media.key,
              name: media.data?.name || '',
              type: 'uploaded',
              src: media.data?.url || ''
            }) : ({
              key: uuidV4(),
              name: '',
              type: 'new-file',
              src: ''
            })
          }
        }) || [];
      (wrapList.value as WrapCharacterData<U>[]).splice(0, wrapList.value.length, ..._wrapList)
    }

    const pcListWrap = ref<WrapCharacterData<PC>[]>([])
    const updatePcListWrap = (target: string) => updateWrapList(
      pcListWrap,
      state.list[state.currentIndex]?.data?.sheetInfo.pc || [],
      'pc',
      target
    )
    watch(
      () => state.list[state.currentIndex]?.data?.sheetInfo.pc,
      () => updatePcListWrap(target?.value || ''),
      { deep: true, immediate: true }
    )

    const npcListWrap = ref<WrapCharacterData<NPC>[]>([])
    const updateNpcListWrap = (target: string) => updateWrapList(
      npcListWrap,
      state.list[state.currentIndex]?.data?.sheetInfo.npc || [],
      'npc',
      target
    )
    watch(
      () => state.list[state.currentIndex]?.data?.sheetInfo.npc,
      () => updateNpcListWrap(target?.value || ''),
      { deep: true, immediate: true }
    )

    const rightHandListWrap = ref<WrapCharacterData<RightHand>[]>([])
    const updateRightHandListWrap = (target: string) => updateWrapList(
      rightHandListWrap,
      state.list[state.currentIndex]?.data?.sheetInfo.righthand || [],
      'right-hand',
      target
    )
    watch(
      () => state.list[state.currentIndex]?.data?.sheetInfo.righthand,
      () => updateRightHandListWrap(target?.value || ''),
      { deep: true, immediate: true }
    )

    const enigmaListWrap = ref<WrapCharacterData<Enigma>[]>([])
    const updateEnigmaListWrap = (target: string) => updateWrapList(
      enigmaListWrap,
      state.list[state.currentIndex]?.data?.sheetInfo.enigma || [],
      'enigma',
      target
    )
    watch(
      () => state.list[state.currentIndex]?.data?.sheetInfo.enigma,
      () => updateEnigmaListWrap(target?.value || ''),
      { deep: true, immediate: true }
    )

    const summaryListWrap = ref<WrapCharacterData<Summary>[]>([])
    const updateSummaryListWrap = (target: string) => updateWrapList(
      summaryListWrap,
      state.list[state.currentIndex]?.data?.sheetInfo.summary || [],
      'summary',
      target
    )
    watch(
      () => state.list[state.currentIndex]?.data?.sheetInfo.summary,
      () => updateSummaryListWrap(target?.value || ''),
      { deep: true, immediate: true }
    )

    watch(
      () => characterState.characterList,
      () => {
        updatePcListWrap(target?.value || '')
        updateNpcListWrap(target?.value || '')
        updateRightHandListWrap(target?.value || '')
      },
      { deep: true }
    )

    return {
      pcListWrap,
      npcListWrap,
      rightHandListWrap,
      enigmaListWrap,
      summaryListWrap,
      updatePcListWrap,
      updateNpcListWrap,
      updateRightHandListWrap,
      updateEnigmaListWrap
    }
  }

  return {
    get ready() {
      return state.ready
    },
    get currentIndex() {
      return state.currentIndex
    },
    get list() {
      return state.list
    },
    get currentScenario() {
      const scenario = state.list[state.currentIndex]?.data || null
      if (!scenario) {
        throw new ApplicationError('Not found scenario error.')
      }
      return scenario
    },
    uploadCharacterImage,
    getChitStatus,
    requestData,
    makeWrapLists
  }
})

import { computed, reactive } from 'vue'
import { makeStore, commonStoreDataProcess, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import { ShinobiGami } from '@/core/utility/shinobigami'
import { MediaStore } from '@/feature/media-list/data'
import { ComputedRef } from '@vue/reactivity'

export type ImageInfo = {
  key: string;
  type: 'uploaded' | 'new-file';
  src: string;
  name: string;
}

export type Character = {
  sheetViewPass: string;
  sheetInfo: ShinobiGami;
}

export type UrlType = 'youtube' | 'image' | 'music' | 'setting' | 'unknown';

export type UploadMediaInfo = MediaStore & { key?: string } & (
  {
    dataLocation: 'direct';
    url: string;
  } | {
    dataLocation: 'server';
    arrayBuffer: string;
  }
);

export type UploadMediaRequest = {
  uploadMediaInfoList: UploadMediaInfo[];
  option: Partial<StoreData<unknown>>;
};

export type UploadMediaResponse = {
  key: string;
  rawPath: string;
  url: string;
  name: string;
  tag: string;
  urlType: UrlType;
}[];

export type Store = {
  ready: boolean,
  characterList: StoreData<Character>[];
  requestData: () => Promise<void>;
  insertData: (c: Character[]) => Promise<string[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  makeWrapCharacterList: () => ComputedRef<(StoreData<Character>)[]>;
  insertEmptyCharacter: () => Promise<string>;
}

export default makeStore<Store>('character-store', () => {
  const state = reactive<StoreUpdateProperties<Store, never>>({
    ready: false,
    characterList: []
  })

  const { requestData, insertData } = commonStoreDataProcess(
    state.characterList,
    'character',
    [
      'sheetInfo',
      'sheetViewPass'
    ]
  )

  const setup = async (): Promise<void> => {
    await requestData()
    state.ready = true
  }
  setup().then()

  // const makeUploadMediaInfoList = (mediaList: [ImageInfo[], ImageInfo[]][]): UploadMediaInfo[] =>
  //   mediaList.flatMap(mediaInfo => mediaInfo.flatMap((list, idx) => list
  //     .filter(img => img.type === 'new-file' && img.name)
  //     .map(img => ({
  //       key: img.key,
  //       url: '',
  //       dataLocation: 'server',
  //       ...getUrlTypes(img.name),
  //       rawPath: getFileName(img.name),
  //       tag: idx === 0 ? 'chit' : 'stand',
  //       name: img.name,
  //       arrayBuffer: img.src
  //     }))))
  //
  // const socketState = SocketStore.injector()
  //
  // const uploadAndKeyReplace = async (uploadMediaInfoList: UploadMediaInfo[], mediaList: [ImageInfo[], ImageInfo[]][]) => {
  //   const resultList = await socketState.sendSocketServerRoundTripRequest<UploadMediaRequest, UploadMediaResponse>(
  //     'media-api-upload',
  //     { uploadMediaInfoList, option: {} }
  //   )
  //   let count = 0
  //   mediaList.forEach(tuple => {
  //     tuple.forEach(
  //       list => list
  //         .filter(img => img.type === 'new-file' && img.name)
  //         .forEach(img => (img.key = resultList[count++].key))
  //     )
  //   })
  // }

  const insertDataWrapper = async (
    characterList: Character[]
  ): Promise<string[]> => {
    // const uploadMediaInfoList: UploadMediaInfo[] = makeUploadMediaInfoList(mediaList)
    // console.log(uploadMediaInfoList)
    // await uploadAndKeyReplace(uploadMediaInfoList, mediaList)
    // mediaList.forEach((tuple, idx) => {
    //   characterList[idx].chitImageList = tuple[0].map(t => t.key)
    //   characterList[idx].currentChitImage = characterList[idx].chitImageList.length ? 0 : -1
    //   characterList[idx].standImageList = tuple[1].map(t => t.key)
    //   characterList[idx].currentStandImage = characterList[idx].standImageList.length ? 0 : -1
    // })
    return await insertData(...characterList.map(c => ({ data: c, ownerType: null, owner: null })))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeWrapCharacterList = (): ComputedRef<(StoreData<Character>)[]> => {
    // const mediaListState = MediaListStore.injector()
    return computed(() => state.characterList.map(c => {
      // const chitImageUrl = mediaListState.list.find(m => m.key === c.data?.chitImageList[c.data?.currentChitImage])?.data?.url
      // const standImageUrl = mediaListState.list.find(m => m.key === c.data?.standImageList[c.data?.currentStandImage])?.data?.url
      // const styleObj = {
      //   '--color': c.data?.color,
      //   '--chit-image': chitImageUrl ? `url('${chitImageUrl}')` : '',
      //   '--stand-image': standImageUrl ? `url('${standImageUrl}')` : ''
      // }
      return {
        ...c
        // styleObj
      }
    }))
  }

  const insertEmptyCharacter = async (): Promise<string> => {
    const keys = await insertData(...[{
      ownerType: null,
      owner: null,
      data: {
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
        }
      }
    }])
    return keys[0]
  }

  return {
    get ready() {
      return state.ready
    },
    get characterList() {
      return state.characterList
    },
    requestData,
    insertData: insertDataWrapper,
    insertEmptyCharacter,
    makeWrapCharacterList
  }
})

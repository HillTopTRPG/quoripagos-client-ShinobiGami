import { computed, reactive } from 'vue'
import { makeStore, commonStoreDataProcess, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import { ShinobiGami } from '@/core/utility/shinobigami'
import SocketStore from '@/core/data/socket'
import { getFileName } from '@/core/utility/PrimaryDataUtility'
import MediaListStore, { getUrlTypes, MediaStore } from '@/feature/media-list/data'
import { ComputedRef } from '@vue/reactivity'

export type ImageInfo = {
  key: string;
  type: 'uploaded' | 'new-file';
  src: string;
  name: string;
}

export type CharacterBase = {
  plot: number;
  isFumble: boolean;
  isActed: boolean;
  sheetViewPass: string;
  sheetInfo: ShinobiGami | null;
  color: string;
  chitImageList: string[];
  standImageList: string[];
  currentChitImage: number;
  currentStandImage: number;
}

export type Character = CharacterBase & {
  type: 'character';
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
  insertData: (c: Character[], mediaList: [ImageInfo[], ImageInfo[]][]) => Promise<void>;
  uploadCharacterImage: (character: CharacterBase, mediaInfo: [ImageInfo[], ImageInfo[]]) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  makeWrapCharacterList: () => ComputedRef<(StoreData<Character> & { styleObj: any })[]>;
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
      'type',
      'plot',
      'isFumble',
      'isActed',
      'color',
      'chitImageList',
      'standImageList',
      'currentChitImage',
      'currentStandImage',
      'sheetInfo',
      'sheetViewPass'
    ]
  )

  const setup = async (): Promise<void> => {
    await requestData()
    state.ready = true
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

  const uploadAndKeyReplace = async (uploadMediaInfoList: UploadMediaInfo[], mediaList: [ImageInfo[], ImageInfo[]][]) => {
    const resultList = await socketState.sendSocketServerRoundTripRequest<UploadMediaRequest, UploadMediaResponse>(
      'media-api-upload',
      { uploadMediaInfoList, option: {} }
    )
    let count = 0
    mediaList.forEach(tuple => {
      tuple.forEach(
        list => list
          .filter(img => img.type === 'new-file' && img.name)
          .forEach(img => (img.key = resultList[count++].key))
      )
    })
  }

  const uploadCharacterImage = async (character: CharacterBase, mediaInfo: [ImageInfo[], ImageInfo[]]): Promise<void> => {
    const uploadMediaInfoList: UploadMediaInfo[] = makeUploadMediaInfoList([mediaInfo])
    console.log(uploadMediaInfoList)
    await uploadAndKeyReplace(uploadMediaInfoList, [mediaInfo])
    character.chitImageList = mediaInfo[0].map(t => t.key)
    character.currentChitImage = character.chitImageList.length ? 0 : -1
    character.standImageList = mediaInfo[1].map(t => t.key)
    character.currentStandImage = character.standImageList.length ? 0 : -1
  }

  const insertDataWrapper = async (characterList: Character[], mediaList: [ImageInfo[], ImageInfo[]][]): Promise<void> => {
    const uploadMediaInfoList: UploadMediaInfo[] = makeUploadMediaInfoList(mediaList)
    console.log(uploadMediaInfoList)
    await uploadAndKeyReplace(uploadMediaInfoList, mediaList)
    mediaList.forEach((tuple, idx) => {
      characterList[idx].chitImageList = tuple[0].map(t => t.key)
      characterList[idx].currentChitImage = characterList[idx].chitImageList.length ? 0 : -1
      characterList[idx].standImageList = tuple[1].map(t => t.key)
      characterList[idx].currentStandImage = characterList[idx].standImageList.length ? 0 : -1
    })
    await insertData(...characterList.map(c => ({ data: c })))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeWrapCharacterList = (): ComputedRef<(StoreData<Character> & { styleObj: any })[]> => {
    const mediaListState = MediaListStore.injector()
    return computed(() => state.characterList.map(c => {
      const chitImageUrl = mediaListState.list.find(m => m.key === c.data?.chitImageList[c.data?.currentChitImage])?.data?.url
      const standImageUrl = mediaListState.list.find(m => m.key === c.data?.standImageList[c.data?.currentStandImage])?.data?.url
      const styleObj = {
        '--color': c.data?.color,
        '--chit-image': chitImageUrl ? `url('${chitImageUrl}')` : '',
        '--stand-image': standImageUrl ? `url('${standImageUrl}')` : ''
      }
      return {
        ...c,
        styleObj
      }
    }))
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
    uploadCharacterImage,
    makeWrapCharacterList
  }
})

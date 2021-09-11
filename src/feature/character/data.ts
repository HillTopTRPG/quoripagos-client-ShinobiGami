import { computed, reactive } from 'vue'
import { makeStore, commonStoreDataProcess, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import { ShinobiGami } from '@/core/utility/shinobigami'
import SocketStore from '@/core/data/socket'
import { getFileName } from '@/core/utility/PrimaryDataUtility'
import MediaListStore, { getUrlTypes, MediaStore } from '@/feature/media-list/data'
import { ComputedRef } from '@vue/reactivity'
import { removeFilter } from '@/core/utility/typescript'

export type ImageInfo = {
  key: string;
  type: 'uploaded' | 'new-file';
  src: string;
  name: string;
}

export type Character = {
  type: 'character';
  plot: number;
  pcNo: number | null;
  isFumble: boolean;
  isActed: boolean;
  color: string;
  chitImageList: string[];
  standImageList: string[];
  currentChitImage: number;
  currentStandImage: number;
  sheetInfo: ShinobiGami;
  sheetViewPass: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  makeWrapCharacterList: () => ComputedRef<(StoreData<Character> & { styleObj: any })[]>;
}

export default makeStore<Store>('character-store', () => {
  const state = reactive<StoreUpdateProperties<Store, never>>({
    ready: false,
    characterList: []
  })

  const socketStore = SocketStore.injector()

  const { requestData, insertData } = commonStoreDataProcess(
    state.characterList,
    'character',
    [
      'type',
      'plot',
      'pcNo',
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

  const insertDataWrapper = async (characterList: Character[], mediaList: [ImageInfo[], ImageInfo[]][]): Promise<void> => {
    mediaList.forEach(tuple => {
      tuple.forEach(list => {
        removeFilter(list, t => !t.name)
      })
    })
    const uploadMediaInfoList: UploadMediaInfo[] = mediaList.flatMap(tuple => tuple.flatMap(list => list
      .filter(img => img.type === 'new-file')
      .map(img => ({
        key: img.key,
        url: '',
        dataLocation: 'server',
        ...getUrlTypes(img.name),
        rawPath: getFileName(img.name),
        tag: 'chit-image',
        name: img.name,
        arrayBuffer: img.src
      })))
    )

    console.log(uploadMediaInfoList)

    const resultList = await socketStore.sendSocketServerRoundTripRequest<UploadMediaRequest, UploadMediaResponse>(
      'media-api-upload',
      { uploadMediaInfoList, option: {} }
    )
    let count = 0
    mediaList.forEach((tuple, idx) => {
      tuple.forEach(list => list.filter(img => img.type === 'new-file').forEach(img => {
        const result = resultList[count++]
        img.key = result.key
      }))
      characterList[idx].chitImageList = tuple[0].map(t => t.key)
      characterList[idx].currentChitImage = characterList[idx].chitImageList.length ? 0 : -1
      characterList[idx].standImageList = tuple[1].map(t => t.key)
      characterList[idx].currentStandImage = characterList[idx].standImageList.length ? 0 : -1
    })
    console.log('$$$$ UploadMediaResult $$$$')
    console.log(resultList)
    await insertData(...characterList)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeWrapCharacterList = (): ComputedRef<(StoreData<Character> & { styleObj: any })[]> => {
    const mediaListStore = MediaListStore.injector()
    return computed(() => state.characterList.map(c => {
      const chitImageUrl = mediaListStore.list.find(m => m.key === c.data?.chitImageList[c.data?.currentChitImage])?.data?.url
      const standImageUrl = mediaListStore.list.find(m => m.key === c.data?.standImageList[c.data?.currentStandImage])?.data?.url
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
    makeWrapCharacterList
  }
})

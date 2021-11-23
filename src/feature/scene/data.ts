import { reactive } from 'vue'
import { commonStoreDataProcess, makeStore, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import RoomSettingStore from '@/feature/room-setting/data'

export type Scene = {
  name: string;
  backgroundImage: string | null;
}

type Store = {
  ready: boolean,
  list: StoreData<Scene>[];
  currentScene: Scene | null;
  requestData: () => Promise<void>;
  insertData: (...c: (Partial<StoreData<Scene>> & { data: Scene })[]) => Promise<string[]>;
}

export default makeStore<Store>('scene-store', () => {
  const state = reactive<StoreUpdateProperties<Store, 'currentScene'>>({
    ready: false,
    list: []
  })

  const roomSettingState = RoomSettingStore.injector()

  const { requestData, insertData } = commonStoreDataProcess(
    state.list,
    'scene',
    [
      'name',
      'backgroundImage'
    ]
  )

  const setup = async (): Promise<void> => {
    await requestData()
    state.ready = true
  }
  setup().then()

  return {
    get ready() {
      return state.ready
    },
    get list() {
      return state.list
    },
    get currentScene(): Scene | null {
      return state.list.find(s => s.key === roomSettingState.roomSetting?.sceneKey)?.data || null
    },
    requestData,
    insertData
  }
})

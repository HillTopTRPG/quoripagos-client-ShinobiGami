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
  deleteData: (keys: string[]) => Promise<void>;
}

export default makeStore<Store>('scene-store', () => {
  const state = reactive<StoreUpdateProperties<Store, 'currentScene'>>({
    ready: false,
    list: []
  })

  const roomSettingState = RoomSettingStore.injector()

  const { requestData, insertData, deleteData } = commonStoreDataProcess(
    state.list,
    'scene',
    [
      'name',
      'backgroundImage'
    ]
  )

  const setup = async (): Promise<void> => {
    console.log('scene store setup')
    const getCurrentScene = (): Scene | null => state.list.find(s => s.key === roomSettingState.roomSetting?.sceneKey)?.data || null

    await requestData()
    if (getCurrentScene()) {
      console.log('scene store isReady')
      state.ready = true
      return
    }

    const keyList = await insertData({
      data: {
        name: '通常',
        backgroundImage: null
      }
    })

    const key: string = keyList[0]

    console.log('uryyyyyyyyy')
    console.log(key)
    console.log(roomSettingState.roomSetting)
    if (roomSettingState.roomSetting) {
      console.log('set key!!!')
      roomSettingState.roomSetting.sceneKey = key
    }

    let intervalId: number | null = null
    return new Promise((resolve) => {
      intervalId = window.setInterval(() => {
        console.log(state.list[0]?.key === roomSettingState.roomSetting?.sceneKey, state.list[0]?.key, state.list[0]?.data?.name, roomSettingState.roomSetting?.sceneKey)
        if (getCurrentScene()) {
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
    deleteData,
    insertData
  }
})

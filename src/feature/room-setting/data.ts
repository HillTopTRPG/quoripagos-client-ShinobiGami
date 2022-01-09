import { reactive } from 'vue'
import { commonStoreDataProcess, makeStore, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'

export type RoomSetting = {
  sceneKey: string | null;
  cycle: number;
  round: number;
  battleField: number; // 0: 平地, 1: 水中, 2: 高所, 3: 悪天候, 4: 雑踏, 5: 極地
  isPrePlot: 'none' | 'pre-plot' | 'select' | 'selecting' | 'finish' | 'finished';
}

type Store = {
  ready: boolean,
  list: StoreData<RoomSetting>[];
  roomSetting: RoomSetting | null;
  requestData: () => Promise<void>;
}

export default makeStore<Store>('room-setting-store', () => {
  const state = reactive<StoreUpdateProperties<Store, 'roomSetting'>>({
    ready: false,
    list: []
  })

  const { requestData, insertData } = commonStoreDataProcess(
    state.list,
    'room-setting',
    [
      'sceneKey',
      'cycle',
      'round',
      'battleField',
      'isPrePlot'
    ]
  )

  const getRoomSetting = (): RoomSetting | null => state.list.length ? state.list[0].data || null : null
  const setup = async (): Promise<void> => {
    await requestData()

    if (getRoomSetting()) {
      console.log('room-setting store isReady')
      state.ready = true
      return
    }
    await insertData({
      ownerType: null,
      owner: null,
      data: {
        sceneKey: null,
        cycle: 0,
        round: 0,
        battleField: 0,
        isPrePlot: 'none'
      }
    })
    let intervalId: number | null = null
    return new Promise((resolve) => {
      intervalId = window.setInterval(() => {
        if (getRoomSetting()) {
          if (intervalId !== null) {
            window.clearInterval(intervalId)
            intervalId = null
            state.ready = true
            console.log('room-setting store isReady')
            resolve()
          }
        }
      }, 50)
    })
  }
  setup().then()

  return {
    get list() {
      return state.list
    },
    get ready() {
      return state.ready
    },
    get roomSetting() {
      return getRoomSetting()
    },
    requestData
  }
})

import { reactive } from 'vue'
import { commonStoreDataProcess, makeStore, StoreUpdateProperties } from '@/core/utility/vue3'
import { loadYaml, StoreData } from '@/core/utility/FileUtility'
import { ConnectInfo } from '@/core/data/socket'
import { errorDialog, questionDialog } from '@/core/utility/dialog'

export type OriginalDiceTable = {
  command: string;
  contents: string;
}

export type Command = {
  title: string;
  command: string;
}

export type RoomSetting = {
  sceneKey: string | null;
  cycle: number;
  round: number;
  battleField: number; // 0: 平地, 1: 水中, 2: 高所, 3: 悪天候, 4: 雑踏, 5: 極地
  isPrePlot: 'none' | 'pre-plot' | 'pre-plot-re' | 'pre-plot-end' | 'select' | 'select-re' | 'select-end';
  bcdiceApiUrl: string;
  commandPattern: string;
  commandSelectionList: Command[];
  commandList: Command[];
  helpMessage: string;
  originalDiceTable: OriginalDiceTable[];
}

type Store = {
  ready: boolean,
  list: StoreData<RoomSetting>[];
  roomSetting: RoomSetting | null;
  requestData: () => Promise<void>;
  getGameSystem: (isUserOperation: boolean) => Promise<{
    id: string;
    name: string;
    commandPattern: string;
    helpMessage: string;
  } | null>;
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
      'isPrePlot',
      'bcdiceApiUrl',
      'commandPattern',
      'commandSelectionList',
      'commandList',
      'helpMessage',
      'originalDiceTable'
    ]
  )

  const getGameSystem = async (isUserOperation: boolean): Promise<{
    id: string;
    name: string;
    commandPattern: string;
    helpMessage: string;
  } | null> => {
    const bcdiceApiUrl = state.list[0]?.data?.bcdiceApiUrl
    if (!bcdiceApiUrl) {
      setTimeout(() => {
        errorDialog({
          title: '未設定エラー',
          text: 'BcdiceApiのURLが設定されていません'
        }).then()
      })
      return null
    }
    const commandUrl = `${bcdiceApiUrl}/v2/game_system/ShinobiGami`
    let fetchResult: Response | null = null
    try {
      fetchResult = await fetch(commandUrl)
    } catch (_) {
      setTimeout(() => {
        errorDialog({
          title: 'BcdiceApi接続失敗',
          text: `${commandUrl}`
        }).then()
      })
      return null
    }
    try {
      if (!fetchResult) return null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await fetchResult.json()

      if (!json.ok) throw json

      if (state.list[0]?.data) {
        if (!isUserOperation || await questionDialog({
          title: '部屋情報に反映',
          text: '接続によって得られた情報を部屋に適用しますか？',
          confirmButtonText: '適用する',
          cancelButtonText: '適用しない'
        })) {
          const commandPattern = json.command_pattern
          const helpMessage = json.help_message
          const regExpStr = `(?:[\\s・/／]*)([^\\n:（()）@#>=,\\\\]+?)\\s(${commandPattern.substr(1) || ''}n?)`
          const array = [...(helpMessage.matchAll(RegExp(regExpStr, 'g')) || [])]
          const commandList: Command[] = array
            .filter(d => !(/^[0-9]+$/.test(d[2])))
            .map(d => ({
              title: d[1],
              command: d[2]
            }))
          state.list[0].data.commandPattern = commandPattern
          state.list[0].data.helpMessage = helpMessage
          state.list[0].data.commandSelectionList.splice(0, state.list[0].data.commandSelectionList.length, ...commandList)
        }
      }

      return {
        id: json.id,
        name: json.name,
        commandPattern: json.command_pattern,
        helpMessage: json.help_message
      }
    } catch (err) {
      console.log(err)
      return null
    }
  }

  const getRoomSetting = (): RoomSetting | null => state.list.length ? state.list[0].data || null : null
  const setup = async (): Promise<void> => {
    await requestData()

    const roomSetting = getRoomSetting()
    if (roomSetting) {
      console.log('room-setting store isReady')
      state.ready = true
      return
    }
    const connectInfo = await loadYaml<ConnectInfo>(
      'static/conf/connect.yaml'
    )

    const bcdiceApiUrl = connectInfo.bcdiceServer
    await insertData({
      ownerType: null,
      owner: null,
      data: {
        sceneKey: null,
        cycle: 0,
        round: 0,
        battleField: 0,
        isPrePlot: 'none',
        bcdiceApiUrl,
        commandPattern: '',
        commandSelectionList: [],
        commandList: [],
        helpMessage: '',
        originalDiceTable: []
      }
    })

    let intervalId: number | null = null
    return new Promise((resolve) => {
      intervalId = window.setInterval(() => {
        if (getRoomSetting()) {
          getGameSystem(false).then(() => {
            if (intervalId !== null) {
              window.clearInterval(intervalId)
              intervalId = null
              state.ready = true
              console.log('room-setting store isReady')
              resolve()
            }
          })
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
    requestData,
    getGameSystem
  }
})

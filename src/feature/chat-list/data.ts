import { reactive } from 'vue'
import { commonStoreDataProcess, makeStore, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import RoomSettingStore from '@/feature/room-setting/data'
import { errorDialog } from '@/core/utility/dialog'

export type DiceResult = {
  kind: string; // 'normal' | 'tens_d10' | 'd9';
  sides: number;
  value: number;
};

export type BcdiceDiceRollResult = {
  text?: string;
  secret?: boolean;
  success?: boolean;
  failure?: boolean;
  critical?: boolean;
  fumble?: boolean;
  rands?: DiceResult[];
};

export type ChatStore = {
  type: 'chat' | 'system';
  diceType: 'dice-roll' | 'dice-roll-scf' | null;
  raw: string;
  diceRaw: string | null;
  tag: string[];
  tab: string;
  from: string;
  fromType: 'user' | 'pc' | 'npc' | 'right-hand';
  diceRollResult: string | null;
  rands: DiceResult[] | null;
  secret: 'none' | 'secret' | 'opened';
};

type Store = {
  ready: boolean,
  list: StoreData<ChatStore>[];
  requestData: () => Promise<void>;
  insertData: (...list: ChatStore[]) => Promise<void>;
  diceRoll: (command: string) => Promise<BcdiceDiceRollResult | null>;
}

export default makeStore<Store>('chat-list-store', () => {
  const state = reactive<StoreUpdateProperties<Store, never>>({
    ready: false,
    list: []
  })
  const roomSettingState = RoomSettingStore.injector()

  const { requestData, insertData } = commonStoreDataProcess(
    state.list,
    'chat-list',
    [
      'type',
      'raw',
      'tag',
      'tab',
      'from',
      'fromType',
      'diceRollResult',
      'rands',
      'secret'
    ]
  )

  const setup = async (): Promise<void> => {
    await requestData()
    console.log('chat-list store isReady')
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
    requestData,
    insertData: async (...list: ChatStore[]) => {
      console.log(JSON.stringify(list, null, '  '))
      await insertData(...list.map(c => ({ owner: null, ownerType: null, data: c })))
    },
    diceRoll: async (command: string): Promise<BcdiceDiceRollResult | null> => {
      const baseUrl = roomSettingState.roomSetting?.bcdiceApiUrl

      const commandUrl = `${baseUrl}/v2/game_system/ShinobiGami/roll?command=${encodeURIComponent(command)}`
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
        delete json.ok

        json.text = json.text.replace(/(^: )/g, '').replace(/＞/g, '→')

        return json as BcdiceDiceRollResult
      } catch (err) {
        console.log(err)
        return null
      }
    }
  }
})

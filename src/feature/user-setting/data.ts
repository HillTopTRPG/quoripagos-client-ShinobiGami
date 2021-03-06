import { reactive } from 'vue'
import { commonStoreDataProcess, makeStore, StoreUpdateProperties } from '@/core/utility/vue3'
import { StoreData } from '@/core/utility/FileUtility'
import UserStore from '@/core/data/user'
import { ApplicationError } from '@/core/error/ApplicationError'

export type UserSetting = {
  userKey: string;
  fontColor: string;
  accent1Color: string;
  accent2Color: string;
  sheetFontSize: number;
}

type Store = {
  ready: boolean,
  userSettingList: StoreData<UserSetting>[];
  userSetting: UserSetting | null;
  masterVolume: number;
  masterMute: boolean;
  requestData: () => Promise<void>;
}

export default makeStore<Store>('user-setting-store', () => {
  const state = reactive<StoreUpdateProperties<Store, 'userSetting'>>({
    ready: false,
    userSettingList: [],
    masterVolume: 100,
    masterMute: false
  })

  const userState = UserStore.injector()

  const { requestData, insertData } = commonStoreDataProcess(
    state.userSettingList,
    'user-setting',
    [
      'userKey',
      'fontColor',
      'accent1Color',
      'accent2Color',
      'sheetFontSize'
    ]
  )

  const setup = async (): Promise<void> => {
    const user = userState.userList.find(u => u.key === userState.userLoginResponse?.userKey)
    if (!user) throw new ApplicationError('You are not logged in yet.(2)')

    const getUserSetting = (): UserSetting | null => state.userSettingList.find(us => us.data?.userKey === user.key)?.data || null

    await requestData()
    if (getUserSetting()) {
      console.log('user-setting store isReady')
      state.ready = true
      return
    }
    await insertData({
      data: {
        userKey: user.key,
        accent1Color: 'rgba(255, 40, 0, 1)',
        accent2Color: 'rgba(0, 111, 255, 1)',
        fontColor: '#3E2723',
        sheetFontSize: 11
      }
    })
    let intervalId: number | null = null
    return new Promise((resolve) => {
      intervalId = window.setInterval(() => {
        if (getUserSetting()) {
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
    get userSettingList() {
      return state.userSettingList
    },
    get ready() {
      return state.ready
    },
    get masterMute() {
      return state.masterMute
    },
    get masterVolume() {
      return state.masterVolume
    },
    set masterMute(val: boolean) {
      state.masterMute = val
    },
    set masterVolume(val: number) {
      state.masterVolume = val
    },
    get userSetting() {
      const user = userState.userList.find(u => u.key === userState.userLoginResponse?.userKey)
      if (!user) throw new ApplicationError('You are not logged in yet.(3)')
      const userSetting = state.userSettingList.find(us => us.data?.userKey === user.key)
      return userSetting?.data || null
    },
    requestData
  }
})

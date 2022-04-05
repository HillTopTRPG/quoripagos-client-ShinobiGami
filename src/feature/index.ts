import { App } from 'vue'
import character from '@/feature/character'
import localSetting from '@/feature/local-setting'
import scenario from '@/feature/scenario'
import scene from '@/feature/scene'
import mediaList from '@/feature/media-list'
import chatList from '@/feature/chat-list'
import specialInput from '@/feature/special-input'
import userSetting from '@/feature/user-setting'
import roomSetting from '@/feature/room-setting'
import { installFeatures } from '@/core'

const Plugin = {
  install(app: App): void {
    const features = [
      [
        roomSetting,
        mediaList,
        character
      ],
      [
        localSetting,
        scenario,
        scene,
        userSetting
      ],
      [
        chatList,
        specialInput
      ]
    ]
    installFeatures(app, features)
  }
}

export default Plugin

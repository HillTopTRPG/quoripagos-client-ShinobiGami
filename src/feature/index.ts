import { App } from 'vue'
import battleField from '@/feature/battle-field'
import character from '@/feature/character'
import localSetting from '@/feature/local-setting'
import memo from '@/feature/memo'
import persona from '@/feature/persona'
import scenario from '@/feature/scenario'
import scene from '@/feature/scene'
import mediaList from '@/feature/media-list'
import chatList from '@/feature/chat-list'
import specialInput from '@/feature/special-input'
import tag from '@/feature/tag'
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
        battleField,
        localSetting,
        memo,
        persona,
        scenario,
        scene,
        tag,
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

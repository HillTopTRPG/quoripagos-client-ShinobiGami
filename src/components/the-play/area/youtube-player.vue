<template>
  <div class="cut-in stored" v-show="thumbnailImageUrl" ref="rootChitElm">
    <img class="thumbnail" @click="onClickCutInBox()" alt="Youtube" :src="thumbnailImageUrl">
    <div class="title"></div>
    <div class="contents" id="youtube-contents"></div>
    <div class="volume-control" :class="{ mute: mute }">
      <input type="range" min="0" max="100" v-model="volume">
      <span class="use-volume">{{ useVolume?.toFixed(1) }}</span>
      <label class="mute-control">
        <input type="checkbox" v-model="mute">
        <span class="foreground">Mute</span>
      </label>
      <span>{{ currentTime?.toFixed(1) }}</span>
    </div>
  </div>
  <div class="modal-back stored" @click="onClickCutInBox()"></div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import UserSettingStore from '@/feature/user-setting/data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare var YT: any

export default defineComponent({
  name: 'youtube-player',
  emits: ['end'],
  props: {
    videoId: {
      type: String,
      default: ''
    },
    start: {
      type: Number,
      default: 0
    },
    end: {
      type: Number,
      default: Number.MAX_VALUE
    },
    useEnd: {
      type: Boolean,
      default: false
    },
    loop: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const rootChitElm = ref<HTMLDivElement | null>(null)
    const userSettingStore = UserSettingStore.injector()
    const masterMute = computed(() => userSettingStore.masterMute)
    const masterVolume = computed(() => userSettingStore.masterVolume)
    const volume = ref(100)
    const mute = ref(false)
    const useVolume = computed(() => volume.value * userSettingStore.masterVolume / 100 || 0)

    const changeClass = (toStore: boolean) => {
      const remove = toStore ? 'extension' : 'stored'
      const add = toStore ? 'stored' : 'extension'
      rootChitElm.value?.classList.remove(remove)
      rootChitElm.value?.classList.add(add)
      rootChitElm.value?.nextElementSibling?.classList.remove(remove)
      rootChitElm.value?.nextElementSibling?.classList.add(add)
    }

    const onClickCutInBox = () => {
      changeClass(rootChitElm.value?.classList.contains('extension') || false)
    }

    const thumbnailImageUrl = ref('')

    let timeUpdateTimer: number | null = null
    const currentTime = ref(0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any = null

    const startPlay = () => {
      if (player !== null) {
        player.loadVideoById({
          videoId: props.videoId,
          startSeconds: props.start < 0 ? 0 : props.start,
          suggestedQuality: 'small'
        })
      }
      thumbnailImageUrl.value = props.videoId ? `http://i.ytimg.com/vi/${props.videoId}/default.jpg` : ''
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const onStateChange = (event: any) => {
      switch (event.data) {
        case YT.PlayerState.PLAYING: {
          console.log('### YT.PlayerState.PLAYING')
          const duration = event.target.getDuration()
          const duraStart = props.start % duration
          const duraEnd = props.end % duration
          console.log(`この動画の長さは${duration}秒`)
          // 既にタイマーが張られていたら停止する
          if (timeUpdateTimer !== null) {
            clearInterval(timeUpdateTimer)
          }

          // 100ミリ秒毎に現在の再生経過時間を通知する
          timeUpdateTimer = window.setInterval(() => {
            currentTime.value = event.target.getCurrentTime()
            if (props.useEnd && currentTime.value >= (duraEnd >= 0 ? duraEnd : duraEnd + duration)) {
              if (props.loop) {
                player.seekTo(duraStart < 0 ? 0 : duraStart, true)
              } else {
                changeClass(true)
                emit('end')
              }
            }
          }, 100)
          break
        }
        case YT.PlayerState.ENDED: {
          console.log('### YT.PlayerState.ENDED', props.loop)
          if (props.loop) {
            startPlay()
          }
          break
        }
        default:
      }
    }

    setTimeout(() => {
      // eslint-disable-next-line no-undef
      player = new YT.Player('youtube-contents', {
        height: '360',
        width: '640',
        videoId: props.videoId,
        events: {
          onStateChange
        },
        playerVars: {
          // origin: location.protocol + '//' + location.hostname + ':8080/',
          // playlist: videoId,
          html5: 1,
          autoplay: 1, // 0:自動再生しない or 1:自動再生
          controls: 0, // 再生ボタンとか出さない
          disablekb: 1, // ショートカットキー無効
          enablejsapi: 1, // JavaScript API 有効
          playsinline: 1,
          fs: 0,
          // list: 'search', // 検索クエリ使用
          // listType: "search", // 検索クエリ使用
          loop: 0, // 0:ループしない or 1:ループする 後で再設定する
          rel: 0, // 関連動画出さない
          frameborder: 0,
          start: props.start < 0 ? 0 : props.start,
          modestbranding: 1,
          showinfo: 0 // 動画名とか出さない
        }
      })
    })

    watch(() => props.videoId, startPlay, { immediate: true })

    watch([
      masterMute,
      masterVolume,
      volume,
      mute
    ], () => {
      if (player !== null) {
        player.setVolume(masterMute.value || mute.value ? 0 : useVolume.value)
      }
    }, { immediate: true })

    return {
      rootChitElm,
      onClickCutInBox,
      thumbnailImageUrl,
      volume,
      mute,
      useVolume,
      currentTime
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../common";

.cut-in {
  @include common.flex-box(column, stretch, flex-start);
  z-index: 1;
  pointer-events: all;

  &.extension {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(640px);
    height: calc(360px + 2rem + 2.4em);
    transform: translate(-50%, -50%);
    box-shadow: 0 0 50px 0 black;
    border: 2px solid black;

    .thumbnail {
      display: none;
    }
  }

  &.stored {
    position: relative;
    width: calc(#{common.$header-height} * 0.9 * 16 / 9);
    height: calc(#{common.$header-height} * 0.9);
    overflow: hidden;
    margin: calc(#{common.$header-height} * 0.05);

    .title,
    .volume-control {
      display: none;
    }
  }

  .title {
    @include common.flex-box(row, flex-start, center);
    overflow: hidden;
    background-color: white;
    text-overflow: ellipsis;
    white-space: nowrap;
    align-self: stretch;
    font-size: 1.5rem;
    height: 2rem;
  }

  .thumbnail {
    @include common.flex-box(row, center, center);
    font-size: 0.8rem;
    cursor: pointer;
    position: absolute;
    top: 0;
    left: 0;
    width: calc(#{common.$header-height} * 0.9 * 16 / 9);
    height: calc(#{common.$header-height} * 0.9);
    object-position: 50% 50%;
    object-fit: cover;
  }

  .volume-control {
    @include common.volume-control();
    height: 2.4em;
    background-color: white;
  }
}

.modal-back {
  position: absolute;
  pointer-events: all;
  cursor: pointer;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 0;
  backdrop-filter: blur(10px);

  &.stored {
    display: none;
  }
}
</style>

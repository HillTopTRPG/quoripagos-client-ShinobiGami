<template>
  <div class="cut-in stored">
    <img class="thumbnail" @click="onClickCutInBox($event.target.parentNode)" alt="Youtube" :src="thumbnailImageUrl">
    <div class="title"></div>
    <div class="contents" id="youtube-contents"></div>
    <div class="volume-control" :class="{ mute: mute }">
      <input type="range" min="0" max="100" v-model="volume">
      <span class="use-volume">{{ Math.round(useVolume * 10) / 10 }}</span>
      <label class="mute-control">
        <input type="checkbox" v-model="mute">
        <span class="foreground">Mute</span>
      </label>
    </div>
  </div>
  <div class="modal-back stored" @click="onClickCutInBox($event.target.previousElementSibling)"></div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import UserSettingStore from '@/feature/user-setting/data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare var YT: any

export default defineComponent({
  name: 'youtube-player',
  props: {
    videoId: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const userSettingStore = UserSettingStore.injector()
    const masterMute = computed(() => userSettingStore.masterMute)
    const masterVolume = computed(() => userSettingStore.masterVolume)
    const volume = ref(100)
    const mute = ref(false)
    const useVolume = computed(() => volume.value * userSettingStore.masterVolume / 100)

    const onClickCutInBox = (boxElm: HTMLDivElement) => {
      const changeClass = (remove: string, add: string) => {
        boxElm.classList.remove(remove)
        boxElm.classList.add(add)
        boxElm.nextElementSibling?.classList.remove(remove)
        boxElm.nextElementSibling?.classList.add(add)
      }
      if (boxElm.classList.contains('extension')) {
        changeClass('extension', 'stored')
      } else {
        changeClass('stored', 'extension')
      }
    }

    const thumbnailImageUrl = ref('')
    thumbnailImageUrl.value = `http://i.ytimg.com/vi/${props.videoId}/default.jpg`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const onPlayerReady = (_: any) => {
      // event.target.playVideo()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any = null
    setTimeout(() => {
      // eslint-disable-next-line no-undef
      player = new YT.Player('youtube-contents', {
        height: '360',
        width: '640',
        videoId: props.videoId,
        events: {
          onReady: onPlayerReady
          // 'onStateChange': onPlayerStateChange
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
          loop: 1, // 0:ループしない or 1:ループする 後で再設定する
          rel: 0, // 関連動画出さない
          frameborder: 0,
          // start,
          // end,
          modestbranding: 1,
          showinfo: 0 // 動画名とか出さない
        }
      })
    })

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
      onClickCutInBox,
      thumbnailImageUrl,
      volume,
      mute,
      useVolume
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
  backdrop-filter: blur(2px);

  &.stored {
    display: none;
  }
}
</style>

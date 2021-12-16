<template>
  <div class="image-input" :class="type">
    <label :for="imageInfo.key" class="message" v-if="imageInfo.type === 'new-file' && imageInfo.name">未アップロード</label>
    <template v-if="src">
      <label :for="imageInfo.key">
        <img alt="" :src="src" :key="src">
      </label>
      <button v-if="deletable" @click="$emit('delete')">削除</button>
    </template>
    <input v-else type="file" @change="onImageUploaded($event)" >
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from 'vue'
import { file2Base64, getFileName } from '@/core/utility/FileUtility'
import { ImageInfo } from '@/feature/character/data'
import UserStore from '@/core/data/user'
export default defineComponent({
  name: 'image-input',
  props: {
    type: {
      type: String as PropType<'chit' | 'stand' | 'back'>,
      required: true
    },
    imageInfo: {
      type: Object as PropType<ImageInfo>,
      default: null
    },
    deletable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update', 'delete'],
  setup(props, { emit }) {
    const userState = UserStore.injector()
    const isGm = computed(() => userState.selfUser?.type === 'gm')

    const src = ref<string>(props.imageInfo.src)

    const onImageUploaded = async (event: { target: HTMLInputElement }) => {
      const image = event.target.files?.[0]
      src.value = (await file2Base64(image || null)) || ''
      const result: ImageInfo = {
        key: props.imageInfo.key,
        type: 'new-file',
        src: src.value,
        name: getFileName(image?.name || '')
      }
      emit('update', result)
    }
    return {
      isGm,
      src,
      onImageUploaded
    }
  }
})
</script>

<style scoped lang="scss">
@use "../../components/common";

.message {
  font-size: 80%;
  color: gray;
}

.image-input {
  position: relative;
  @include common.flex-box(column, center, flex-start);

  img {
    border: 1px solid gray;
  }

  &.chit {
    img {
      width: 5em;
      height: 5em;
      object-fit: cover;
      object-position: center top;
    }
  }

  &.stand {
    img {
      width: 6em;
      height: 9em;
      object-fit: contain;
      object-position: center bottom;
    }
  }

  &.back {
    img {
      width: 9em;
      height: 6em;
      object-fit: cover;
      object-position: center bottom;
    }
  }
}
</style>

import { getImageSize } from '@/core/utility/FileUtility'

async function simpleDialog(obj: {
  title: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  position?:
    | 'top' | 'top-start' | 'top-end'
    | 'center' | 'center-start' | 'center-end'
    | 'bottom' | 'bottom-start' | 'bottom-end';
  toast?: boolean;
}): Promise<void> {
  const html = `<div style="text-align: left;">${obj.text?.replaceAll(
    '\n',
    '<br />'
  ) || ''}</div>`
  delete obj.text
  await Swal.fire({
    ...obj,
    html
  })
}

export async function errorDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await Swal.fire({
    title: obj.title,
    icon: 'error',
    toast: true,
    position: 'top-end',
    animation: true,
    html: obj.text.replaceAll(
      '\n',
      '<br />'
    )
  })
}

export async function cutInDialog(
  obj: {
    title: string;
    text: string;
  },
  imageUrl?: string | null
): Promise<void> {
  let imgVH = false
  if (imageUrl) {
    const size = await getImageSize(imageUrl)
    if (size) {
      imgVH = size.width > size.height
    }
  }

  const updateArgs = {
    ...obj,
    html: [
      `<div class="dialog-cutin-container ${imgVH ? 'vertical' : 'horizontal'}">`,
      (imageUrl ? `<div class="image" style="--image: url('${imageUrl}')"></div>` : ''),
      `<div class="text">${obj.text}</div>`,
      '</div>'
    ].join('')
  }

  const resizeWindow = () => {
    Swal.update(updateArgs)
  }
  window.addEventListener('resize', resizeWindow)

  // let timerInterval: number | undefined
  await Swal.fire({
    ...updateArgs,
    position: 'center',
    grow: 'fullscreen',
    background: 'rgba(255, 255, 255, 0.9)',
    customClass: {
      popup: 'cut-in'
    },
    showClass: {
      popup: '',
      backdrop: '',
      icon: ''
    },
    hideClass: {
      popup: '',
      backdrop: '',
      icon: ''
    },
    didRender: () => {
      const textContainerElm = Swal.getHtmlContainer().querySelector('.dialog-cutin-container')
      if (textContainerElm) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const elmStyle = (textContainerElm as any).style
        elmStyle.width = `${document.documentElement.clientWidth - 120}px`
        elmStyle.height = `${document.documentElement.clientHeight - 185}px`
      }
    },
    didDestroy: () => {
      window.removeEventListener('resize', resizeWindow)
    }
  })
}

export async function warningDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await simpleDialog({
    ...obj,
    icon: 'warning'
  })
}

export async function successDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await simpleDialog({
    ...obj,
    icon: 'success'
  })
}

export async function infoDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await simpleDialog({
    ...obj,
    icon: 'info'
  })
}

export async function questionDialog(obj: {
  title: string;
  text?: string;
  confirmButtonText: string;
  cancelButtonText: string;
}): Promise<boolean> {
  const html = `<div style="text-align: left;">${obj.text?.replaceAll(
    '\n',
    '<br />'
  )}</div>`
  delete obj.text
  const confirm = await Swal.fire({
    ...obj,
    html,
    icon: 'question',
    showCancelButton: true
  })
  return confirm.isConfirmed
}

export async function inputTextDialog(obj: {
  title: string;
  text?: string;
  confirmButtonText: string;
  cancelButtonText: string;
}): Promise<string | null> {
  const html = `<div style="text-align: left;">${obj.text?.replaceAll(
    '\n',
    '<br />'
  )}</div>`
  delete obj.text
  let resultText: string | null = null
  const result = await Swal.fire({
    ...obj,
    html,
    input: 'password',
    inputPlaceholder: 'room password',
    icon: 'question',
    showCancelButton: true
  })
  console.log(JSON.stringify(result))
  if (result.isConfirmed) {
    resultText = result.value.toString()
  }
  return resultText
}

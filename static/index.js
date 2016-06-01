import * as Masonry from 'masonry-layout'

document.addEventListener('DOMContentLoaded', () => {
  upload.addEventListener('submit', event => {
    const data = new FormData()
    data.append('image', upload[0].files[0])

    fetch(upload.action, {
      method: upload.method,
      body: data
    })

    return event.preventDefault()
  })

  const grid = new Masonry('.grid', {
  })
})

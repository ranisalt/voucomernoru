document.addEventListener('DOMContentLoaded', () => {
  /* guess who doesn't support fetch yet...
   * fuck you if you use IE/Safari, I won't write fallbacks */
  if (!window.fetch) {
    upload.parentNode.removeChild(upload)
    return
  }

  const fileInput = upload.querySelector('input[type="file"]')

  fileInput.addEventListener('change', event => {
    if (event.target.files.length > 0) {
      const fileSubmit = upload.querySelector('input[type="submit"]')
      fileSubmit.disabled = false
      fileSubmit.parentNode.classList.remove('pure-button-disabled')
    }
  })

  upload.addEventListener('submit', event => {
    const data = new FormData()
    data.append('image', fileInput.files[0])

    fetch(upload.action, {
      method: upload.method,
      body: data
    })
    .then(response => response.json())
    .then(data => {
      const gallery = document.querySelector('.grid')
      const newImage = document.createElement('img')
      newImage.src = data.url
      newImage.setAttribute('data-id', data.id)
      gallery.insertBefore(newImage, gallery.firstChild)
    })

    return event.preventDefault()
  })
})

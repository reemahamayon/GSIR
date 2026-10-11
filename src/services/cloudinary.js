const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Small limits keep the free Cloudinary allowance from running out
const MAX_IMAGE_MB = 5
const MAX_VIDEO_MB = 20

// Returns an error message, or null if the file is fine
export function validateMedia(file) {
  const sizeMb = file.size / (1024 * 1024)

  if (file.type.startsWith('image/')) {
    return sizeMb > MAX_IMAGE_MB ? `Images must be ${MAX_IMAGE_MB} MB or smaller.` : null
  }
  if (file.type.startsWith('video/')) {
    return sizeMb > MAX_VIDEO_MB ? `Videos must be ${MAX_VIDEO_MB} MB or smaller.` : null
  }
  return 'Only images and videos can be attached.'
}

// Uploads to Cloudinary and reports progress (0 to 100)
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new Error('Media uploads are not set up yet. Add the Cloudinary values to .env.local and restart.'))
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      let data
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error('Upload failed.'))
        return
      }

      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve({
          url: data.secure_url,
          type: data.resource_type === 'video' ? 'video' : 'image',
        })
      } else {
        reject(new Error(data?.error?.message || 'Upload failed.'))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))

    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', UPLOAD_PRESET)
    xhr.send(form)
  })
}
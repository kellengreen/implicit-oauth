function base64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('load', _ => {
            const str = reader.result.split(',', 2)
            resolve(str)
        })
        reader.readAsDataURL(blob)
    })
}
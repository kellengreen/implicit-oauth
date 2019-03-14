export function ready() {
    return new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('readystatechange', resolve, { once: true })
        } else {
            resolve()
        }
    })
}

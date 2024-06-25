export function makeWorker(script: string) {
    const blob = new Blob([script], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url, { type: 'module' })
    URL.revokeObjectURL(url)
    return worker
}
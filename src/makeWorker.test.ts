import { makeWorker } from "./makeWorker.ts"
import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts"

Deno.test('makeWorker: should generate a worker from the given script', async () => {
    const worker = makeWorker(`addEventListener('message', e=>postMessage(e.data+' world'))`)
    const promise = new Promise(resolve => { worker.onmessage = e => resolve(e.data) })
    worker.postMessage('hello')
    assertEquals(await promise, 'hello world')
    worker.terminate()
})
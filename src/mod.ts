export type { PropertyMetadata, ObjectMetadata } from "./types.ts"
export { declare, allocateData, prepareObject, get, set, assign, share, accept, manifestObject } from "./threadables.ts"
export { makeWorker } from './makeWorker.ts'
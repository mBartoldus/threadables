import type { ObjectMetadata } from "./mod.ts"

const _byteLength = Symbol('threadable byteLength')
const _meta = Symbol('threadable metadata')
const _data = Symbol('threadable data')
function getByteStride(type: string | string[]) {
    if (Array.isArray(type)) return 8
    return parseInt(type.replace(/[^\d]+/, '')) / 8
}

/**
 * Defines getters and setters for a prototype's threadable properties.
 * Instances will require data to be allocated using ```allocateData```.
 */
export function declare(
    prototype: any,
    objMeta: ObjectMetadata,
) {
    prototype[_meta] ??= {}
    prototype[_byteLength] ??= 0

    for (const k in objMeta) {
        const byteOffset = prototype[_byteLength]
        const propMeta = objMeta[k]
        const { writable = true, private: isPrivate = false } = propMeta

        prototype[_meta][k] = { ...propMeta, byteOffset }
        if (!isPrivate)
            Object.defineProperty(prototype, k, {
                get() { return get(this, k) },
                set: writable ? function (this: any, value: any) {
                    this[_meta][k].check?.(value)
                    set(this, k, value)
                } : undefined
            })
        prototype[_byteLength] += getByteStride(propMeta.type)
    }
    return prototype
}

/**
 * Allocates data for an object with threadable properties.
 * May be called before ```declare``` so long as byteLength is provided.
 */
export function allocateData(instance: any): void
export function allocateData(instance: any, targetPrototype: any): void
export function allocateData(instance: any, byteLength: number): void
export function allocateData(instance: any, l = instance[_byteLength]) {
    const byteLength = typeof l === 'number' ? l : l[_byteLength]
    const sab = new SharedArrayBuffer(byteLength)
    instance[_data] = new DataView(sab)
}

/**
 * Defines an object's threadable properties and allocates data.
 * 
 * > If the object is an instance of a class with inherited threadable properties, DO NOT USE THIS FUNCTION. Instead:
 * > - ```declare``` threadable properties on the class prototypes
 * > - call ```allocateData(this, new.target.prototype)``` in the base class constructor.
 */
export function prepareObject(object: any, metadata: ObjectMetadata){
    declare(object, metadata)
    allocateData(object)
    return object
}

export function get(instance: any, k: string) {
    const { byteOffset, type } = instance[_meta][k]
    if (!Array.isArray(type))
        return instance[_data][`get${type}`](byteOffset)
    return type[instance[_data].getUint8(byteOffset)]
}

/**
 * Manually sets an object's threadable property, bypassing checks (so long as the value is valid for the datatype).
 */
export function set(instance: any, k: string, value: any) {
    const { byteOffset, type } = instance[_meta][k]
    if (!Array.isArray(type))
        return instance[_data][`set${type}`](byteOffset, value)
    if (!type.includes(value)) throw `"${value}" is not a valid ${k}`
    instance[_data].setUint8(byteOffset, type.indexOf(value))
}

/**
 * Manually sets multiple threadable properties.
 */
export function assign(instance: any, values: Record<string, any> = {}) {
    for (const k in values) {
        if (k in instance[_meta]) {
            instance[_meta][k].check?.(values[k])
            set(instance, k, values[k])
        }
    }
}

/**
 * Retrieves the dataview holding an object's threadable properties.
 */
export function share(instance: any): DataView {
    if (!(_data in instance))
        throw 'must call `allocateDataView( instance )` before `share( instance )`'
    return instance[_data] as DataView
}

/**
 * Accepts a dataview to be used for object's threadable properties.
 */
export function accept<Th extends object>(instance: Th, data: DataView): Th {
    (instance as any)[_data] = data
    return instance
}
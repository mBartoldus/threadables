/**
 * Unit of metadata for preparing a threadable property.
 */
export type PropertyMetadata = {
    type: string[]
    | 'Int8' | 'Uint8'
    | 'Int16' | 'Uint16'
    | 'Int32' | 'Uint32'
    | 'Float32' | 'Float64'
    | 'BigInt64' | 'BigUint64'
    check?: (value: any) => void | never
    writable?: boolean
    private?: boolean
}

/**
 * Metadata for an object's threadable properties.
 */
export type ObjectMetadata<T = any> = {
    [k in keyof T]: PropertyMetadata
}
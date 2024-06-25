import * as threadables from './mod.ts'
import { assertStrictEquals, assertThrows } from 'https://deno.land/std@0.209.0/assert/mod.ts'

function testThreadableType(
    type: any,
    value: any
) {
    const th = threadables.declare({}, { value: { type } })
    threadables.allocateData(th)
    threadables.assign(th, { value })
    assertStrictEquals(value, th.value)
}

Deno.test('threadable: should be able to define numeric properties', () => {
    for (const type of [
        'Int8', 'Uint8',
        'Int16', 'Uint16',
        'Int32', 'Uint32',
        'Float32', 'Float64',
    ]) {
        testThreadableType(type, 42)
        assertThrows(() => testThreadableType(type, BigInt(10)))
    }
})

Deno.test('threadable: should be able to define bigint properties', () => {
    for (const type of ['BigInt64', 'BigUint64']) {
        testThreadableType(type, BigInt(1000000))
        assertThrows(() => testThreadableType(type, 1))
    }
})

Deno.test('threadable: should be able to define enum properties', () => {
    testThreadableType(['a', 'b', 'c'], 'b')
    assertThrows(() => testThreadableType(['a', 'b', 'c'], 'x'))
})

Deno.test('threadable: can define function to validate before setting', () => {
    const positivePrototype = threadables.declare({}, {
        value: {
            type: 'Float32',
            check(value: number) { if (value < 0) throw 'must be positive' }
        }
    })

    const positive = Object.create(positivePrototype)
    threadables.allocateData(positive)

    assertThrows(() => positive.value = -100)

    // should be able to bypass this validation in special circumstances
    threadables.set(positive, 'value', -100)
    assertStrictEquals(-100, positive.value)
})

Deno.test('threadable: must be able to share threadable properties with other objects', () => {
    class X {
        declare value: number
        constructor(value: number) {
            threadables.allocateData(this)
            threadables.assign(this, { value })
        }
    }
    threadables.declare(
        X.prototype,
        { value: { type: 'Uint8' } }
    )

    const x1 = new X(123456789)
    const x2 = threadables.accept(X.prototype, threadables.share(x1))

    x1.value = 987654321
    assertStrictEquals(x1.value, x2.value)
})


Deno.test('threadable: should be able to declare private', () => {
    class X {
        declare value: number
        constructor(value: number) {
            threadables.allocateData(this)
            threadables.assign(this, { value })
        }
    }
    threadables.declare(
        X.prototype,
        { value: { type: 'Uint8', private: true } }
    )
    const instance = new X(12)
    assertStrictEquals(threadables.get(instance, "value"), 12)
    threadables.set(instance, "value", 20)
    assertStrictEquals(threadables.get(instance, "value"), 20)
    //@ts-ignore
    assertStrictEquals(instance.x, undefined)
})

Deno.test('threadable: prepareObject should declare properties and allocate data', () => {
    const personMetadata: threadables.ObjectMetadata = {
        favoriteDrink: { type: ['water', 'tea', 'coffee'] },
        preferredTemperature: { type: 'Float32' }
    }

    const person = threadables.prepareObject({}, personMetadata)
    person.favoriteDrink = 'tea'
    person.preferredTemperature = 50.5

    const samePerson = threadables.declare({}, personMetadata)
    threadables.accept(samePerson, threadables.share(person))

    assertStrictEquals(samePerson.favoriteDrink, 'tea')
    assertStrictEquals(samePerson.preferredTemperature, 50.5)
    assertStrictEquals(threadables.share(samePerson), threadables.share(person))
})

Deno.test('threadable: manifestObject should declare properties and accept data', () => {
    const personMetadata: threadables.ObjectMetadata = {
        favoriteDrink: { type: ['water', 'tea', 'coffee'] },
        preferredTemperature: { type: 'Float32' }
    }

    const person = threadables.prepareObject({}, personMetadata)
    person.favoriteDrink = 'tea'
    person.preferredTemperature = 50.5

    const samePerson = threadables.manifestObject(threadables.share(person), personMetadata)

    assertStrictEquals(samePerson.favoriteDrink, 'tea')
    assertStrictEquals(samePerson.preferredTemperature, 50.5)
    assertStrictEquals(threadables.share(samePerson), threadables.share(person))
})
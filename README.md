# threadables

This library helps give javascript objects and classes properties which can be shared across workers. Javascript allows data to be accessed by multiple threads in the form of `SharedArrayBuffer`. We can give this data a more readable interface in the form of plain object properties, using the magic of getters and setters. However, due to the limitations of `SharedArrayBuffer`, these properties must be defined with a type, either one of the `TypedArray` types, or a user-defined enum.

### Making a threadable object

Start by defining the object's metadata. This should be defined in a file which can be imported by both the main thread and workers.
```javascript
export const personMetadata = {
    favoriteDrink: { type: ['water', 'tea', 'coffee'] },
    preferredTemperature: { type: 'Float32' }
}
```

In the worker script, import the metadata and add a listener in anticipation of the object's shared `DataView`.
```javascript
import * as threadables from 'threadables.js'
import { personMetadata } from './personMetadata.js'

addEventListener('message', e=>{
    const person = threadables.manifestObject(e.data, personMetadata)
    person.favoriteDrink = 'water'
})
```

In the main thread, start the worker, prepare the object and share its `DataView` to the worker.
```javascript
import * as threadables from 'threadables.js'
import { personMetadata } from './personMetadata.js'
const worker = new Worker(import.meta.resolve('./worker.js)', { type: 'module' })

const person = threadables.prepareObject(personMetaData)
person.favoriteDrink = 'coffee'
worker.postMessage(threadables.share(person))

setTimeout(()=>{
    console.log(person.favoriteDrink)
    worker.terminate()
}, 1000)
```
In the example above, the value of `person.favoriteDrink` will be changed from the worker thread, and this change can be seen from the main thread without needing to listen for a message from the worker. The threadable property values are stored in a `SharedArrayBuffer`, and are therefore the same in all threads.

### Making a threadable class

Using the same metadata as before, we can define a threadable class. In the worker thread, we `declare` threadable properties on the prototype, and we can use `accept` in the constructor, to accept a `DataView` which had been allocated on the main thread.
```javascript
import * as threadables from 'threadables.js'
import { personMetadata } from './personMetadata.js'

class Person {
    constructor(data) { threadables.accept(this, data) }
}
threadables.declare(Person.prototype, personMetadata)

addEventListener('message', e=>{
    const person = new Person(e.data)
    person.preferredTemperature = Math.random() * 100
})
```

On the main thread, we also `declare` threadable properties on the prototype, and we can use `allocateData` in the constructor. We can also pass `new.target.prototype` to `allocateData`, allowing the class to be extended with more threadable properties in its subclasses.
```javascript
import * as threadables from 'threadables.js'
import { personMetadata } from './personMetadata.js'
const worker = new Worker(import.meta.resolve('./worker.js)', { type: 'module' })

class Person {
    constructor(favoriteDrink) {
        threadables.allocateData(this, new.target.prototype)
        this.favoriteDrink = favoriteDrink
    }
}
threadables.declare(Person.prototype, personMetadata)

const people = [
    new Person('water'),
    new Person('tea'),
    new Person('coffee')
]

for(const person of people)
    worker.postMessage(threadables.share(person))

setTimeout(()=>{
    for(const {favoriteDrink, preferredTemperature} of people)
        console.log(`
            i like to drink ${favoriteDrink}
            at ${preferredTemperature} degrees.
        `)
    worker.terminate()
}, 1000)
```

### Readonly properties, private properties, and checks

- To define a readonly property, add `writable: false` to the property's metadata. You can set readonly properties using `threadables.set` and `threadables.assign`.
- To define a private property, add `private: true`. Private properties are accessible using `threadables.get`.
- For mutable properties with restricted values, use a `check` function to throw errors for invalid inputs.
```javascript
export const personMetadata = {
    eyeColor: {
        type: ["black", "brown", "blue", "green", "glowing"],
        writable: false
        check(color) {
            if(color === "glowing") throw "it's not natural for eyes to glow"
        }
    },
    opinion: {
        type: ["yes", "no"],
        private: true
    },
    height: {
        type: 'Float32',
        check(height) {
            if(height <= 0) throw "you can't have a negative height"
        }
    }
}
```

Checks can be bypassed using `threadables.set`.
```javascript
function drinkMagicPotion(person) {
    threadables.set(magicPerson, 'eyeColor', 'glowing')
}
```
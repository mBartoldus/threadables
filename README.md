# threadables

This library helps give javascript objects and classes properties which can be shared across workers. Javascript allows data to be accessed by multiple threads in the form of `SharedArrayBuffer`. We can give this data a more readable interface in the form of plain object properties, using the magic of getters and setters. However, due to the limitations of `SharedArrayBuffer`, these properties must be defined with a type, either one of the `TypedArray` types, or a user-defined enum.

> I'll finish writing this readme tomorrow
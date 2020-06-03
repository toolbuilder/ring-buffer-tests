/**
 * Simple ring buffer implementation.
 *
 * The primary methods match the Array signature for push, pop, unshift, and shift. But
 * of course push and unshift implement ring buffer semantics, not Array semantics.
 *
 * For buffer operation either use push/shift together, or unshift/pop together.
 *
 * This is a relatively slow implementation because Array is not optimized for length
 * changing operations at the front of the Array. It is intended as the exemplar ring
 * buffer for testing the ring buffer test harness in this implementation.
 */
export class SimpleRingBuffer {
  /**
   * Creates a ring buffer. This constructor is not considered part of the ringbuffer
   * interface, and is not tested by RingBufferDriver.
   * @param {Number} capacity - the maximum number of items the ring buffer can hold.
   * The capacity is accessible as the 'capacity' property on the ring buffer.
   */
  constructor (capacity) { this.array = []; this.capacity = capacity }

  /**
   * Get the number of items currently in the buffer.
   * @returns {Number} - the number of items currently in the buffer.
   */
  get length () { return this.array.length }

  /**
   * Pushes a value onto the back of the buffer. If length === capacity,
   * the value at the front of the buffer is discarded.
   * @param {any} value - value to push
   * @returns {Number} - current length of buffer
   */
  push (x) { if (this.length === this.capacity) this.shift(); return this.array.push(x) }

  /**
   * Removes a value from the back of the buffer and returns it. The
   * newly empty buffer location is set to undefined to release any
   * object references.
   * @returns {any} the value removed from the back of the buffer
   * or `undefined` if empty.
   */
  pop () { return this.array.pop() }

  /**
   * Removes a value from the front of the buffer and returns it. The
   * newly empty buffer location is set to undefined to release any
   * object references.
   * @returns {any} the value removed from the front of the buffer
   * or `undefined` if empty.
   */
  shift () { return this.array.shift() }

  /**
   * Pushes a value on the front of the buffer. If length === capacity,
   * the value at the back is discarded.
   * @param {any} value - to push onto the front
   * @returns {Number} - current length of buffer
   */
  unshift (x) { if (this.length === this.capacity) this.pop(); return this.array.unshift(x) }

  /**
   * Returns the value at the front of the buffer.
   * @returns {any} - the front of the buffer, or `undefined` if empty
   */
  front () { return this.array[0] }

  /**
   * Returns the value at the back of the buffer.
   * @returns {any} - the back of the buffer, or `undefined` if empty
   */
  back () { return this.array[this.array.length - 1] } // JavaScript is so tolerant of index out of bounds

  /**
   * Iterator that provides all values in the buffer from front to back.
   * @returns {Generator} - iterates from front to back
   */
  [Symbol.iterator] () { return this.array[Symbol.iterator]() }
}

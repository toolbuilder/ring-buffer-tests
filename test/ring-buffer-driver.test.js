import { RingBufferDriver, SimpleRingBuffer } from '../src/index'
import { test } from 'zora'

// This tests are very incomplete, but sufficient for my immediate purposes

// Violate Liskov substitution for a quick and dirty implementation
// to run the driver tests.
export class MinimalRingBuffer extends Array {
  constructor (capacity) {
    super()
    this.capacity = capacity
  }

  push (x) { if (this.length === this.capacity) this.shift(); return super.push(x) }
  unshift (x) { if (this.length === this.capacity) this.pop(); return super.unshift(x) }

  front () { return this[0] }
  back () { return this[this.length - 1] }
}

test('passing ring buffer', assert => {
  const driver = new RingBufferDriver()
  const factory = (capacity) => new MinimalRingBuffer(capacity)
  const [actual, expected] = driver.testRingBuffer(100, factory)
  assert.deepEqual(actual, expected, 'ring buffer passed test')
})

test('changing exemplar factory', assert => {
  const exemplarFactory = (capacity) => new SimpleRingBuffer(capacity)
  const driver = new RingBufferDriver({ exemplarFactory })
  const factory = (capacity) => new MinimalRingBuffer(capacity)
  const [actual, expected] = driver.testRingBuffer(100, factory)
  assert.deepEqual(actual, expected, 'ring buffer passed test')
})

class NonRingBuffer1 extends Array {
  constructor (capacity) {
    super()
    this.capacity = capacity
  }

  push (x) { return super.push(x) } // does not limit capacity
  unshift (x) { if (this.length === this.capacity) this.pop(); return super.unshift(x) }

  front () { return this[0] }
  back () { return this[this.length - 1] }
}

test('failing ring buffer ', assert => {
  const driver = new RingBufferDriver()
  const factory = (capacity) => new NonRingBuffer1(capacity)
  const [actual, expected] = driver.testRingBuffer(100, factory)
  assert.deepEqual(actual.message, 'push results', 'returns situation when failure occurred')
  assert.deepEqual(actual.message, expected.message, 'actual and expected messages are the same')
})

import { dequal } from 'dequal'
import { chainable } from 'iterablefu'
import { SimpleRingBuffer } from './simple-ring-buffer'

export const getBufferState = (ringbuffer) => {
  return {
    capacity: ringbuffer.capacity,
    length: ringbuffer.length,
    front: ringbuffer.front(),
    back: ringbuffer.back(),
    contents: [...ringbuffer]
  }
}

// An exception to gather expected and actual results on test failure
class TestError extends Error {
  constructor (actual, expected, message) {
    super(message)
    this.actual = actual
    this.expected = expected
  }
}

// Dual has a ring buffer interface.
// It runs multiple ring buffers through the same operation, and compares
// the results and the ring buffer states. Throws a TestError if either
// the results or the states are not the same.
class Dual {
  constructor (ringbuffers) { this.ringbuffers = ringbuffers }

  push (x) {
    const results = this.ringbuffers.map(ringbuffer => ringbuffer.push(x))
    return this._compare(results, 'push')
  }

  shift () {
    const results = this.ringbuffers.map(ringbuffer => ringbuffer.shift())
    return this._compare(results, 'shift')
  }

  unshift (x) {
    const results = this.ringbuffers.map(ringbuffer => ringbuffer.unshift(x))
    return this._compare(results, 'unshift')
  }

  pop () {
    const results = this.ringbuffers.map(ringbuffer => ringbuffer.pop())
    return this._compare(results, 'pop')
  }

  front () {
    const results = this.ringbuffers.map(ringbuffer => ringbuffer.front())
    return this._compare(results, 'front')
  }

  back () {
    const results = this.ringbuffers.map(ringbuffer => ringbuffer.back())
    return this._compare(results, 'back')
  }

  _testResults (results, methodName) {
    chainable(results)
      .diff((actual, expected) => {
        const equivalent = dequal(actual, expected)
        if (!equivalent) throw new TestError(actual, expected, `${methodName} results`)
      })
      .forEach(() => {})
  }

  _compareStates (methodName) {
    // assume last ringbuffer is the expected behavior
    const states = this.ringbuffers.map(ringbuffer => getBufferState(ringbuffer))
    chainable(states)
      .diff((actual, expected) => {
        const equivalent = dequal(actual, expected)
        if (!equivalent) throw new TestError(actual, expected, `state after ${methodName}`)
      })
      .forEach(() => {})
  }

  _compare (results, methodName) {
    this._testResults(results, methodName)
    this._compareStates(methodName)
    return results
  }
}

// Test that the addName method can be used to grow
// the buffer to capacity. Randomly, remove a value
// so that growth is interleaved with shrinking
const makeGrowingTest = (addName, removeName, data) => {
  return (exemplar, dual) => {
    dual[addName](data())
    dual[removeName]()
    while (exemplar.length < exemplar.capacity) {
      dual[addName](data())
      if (Math.random() > 0.3) dual[removeName]()
    }
  }
}

// Run buffer up to capacity and keep it there for
// a while to make sure that values are dropped properly
const makeTestAtCapacity = (addName, removeName, data) => {
  return (exemplar, dual) => {
    for (let i = 0; i < 2 * exemplar.capacity; ++i) {
      dual[addName](data())
    }
  }
}

// Run buffer up to capacity, and then shrink back to
// zero length, but occassionaly add a value so that
// shrinking is interleaved with growth.
const makeShrinkingTest = (addName, removeName, data) => {
  return (exemplar, dual) => {
    while (exemplar.length < exemplar.capacity) {
      dual[addName](data())
    }
    while (exemplar.length > 0) {
      dual[removeName]()
      if (Math.random() > 0.7) dual[addName](data())
    }
  }
}

// Test harness to return error data in a way the
// test harness can evaluate it.
const testHarness = (capacity, factories, testFunction) => {
  try {
    const ringbuffers = factories.map(factory => factory(capacity))
    const dual = new Dual(ringbuffers)
    const exemplar = ringbuffers[ringbuffers.length - 1] // last factory makes exemplar
    testFunction(exemplar, dual)
  } catch (error) {
    if (!(error instanceof TestError)) throw error
    const info = [error.actual, error.expected]
      .map(value => ({ message: error.message, value }))
    return info // return unequal results
  }
  return [true, true] // actual and expected are equal so test will pass
}

// Combine multiple tests together for a given set of method names (e.g. 'push', 'shift')
export const runTest = (capacity, factories, methods, dataGenerator) => {
  const testFunctionFactories = [makeGrowingTest, makeTestAtCapacity, makeShrinkingTest]
  return testFunctionFactories
    .map(testFunctionFactory => {
      return testHarness(capacity, factories, testFunctionFactory(...methods, dataGenerator()))
    })
    .reduce((finalResult, result) => dequal(finalResult, [true, true]) ? result : finalResult, [true, true])
}

export const defaultOptions = {
  exemplarFactory: (capacity) => new SimpleRingBuffer(capacity),
  getState: getBufferState,
  methodPairs: [['push', 'shift'], ['unshift', 'pop']],
  dataGenerator: () => {
    const randomData = chainable.range(1000).map(n => Math.random()).toArray()
    const sequence = chainable.repeatIterable(Number.MAX_SAFE_INTEGER, randomData)[Symbol.iterator]()
    return () => sequence.next().value
  }
}

/**
 * Simple driver to run a ring buffer matching the SimpleRingBuffer
 * interface through a suite of tests. It works by comparing the
 * ring buffer results and state with the SimpleRingBuffer with
 * every ring buffer method call.
 */
export class RingBufferDriver {
  /**
   *
   * @param {Object} options - has the following properties:
   * @param {RingBuffer} options.exemplarFactory - factory function, fn(capacity), for comparison ring buffer,
   * @param {Function} options.getState - method to get state from both ring buffers
   * @param {Array} options.methodPairs - method name pairs for grow/shrink operations (e.g. ['push', 'shift'])
   */
  constructor (options = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  /**
   * Tests a ring buffer implementation.
   * @param {Number} capacity - capacity value to test ring buffers with.
   * @param {Function} ringBufferFactory - given 'capacity', returns a ring buffer instance to test
   * @returns {Array} - returns a pair of test results. The first element is the 'actual' result, and
   * the second element is the 'expected' result. If both values are the same, the test passes. If they
   * are different, the test fails, and the values represent the difference between actual and expected
   * values.
   */
  testRingBuffer (capacity, ringBufferFactory) {
    const factories = [ringBufferFactory, this.options.exemplarFactory]
    return this.options.methodPairs
      .map(methodPair => runTest(capacity, factories, methodPair, this.options.dataGenerator))
      .reduce((finalResult, result) => dequal(finalResult, [true, true]) ? result : finalResult, [true, true])
  }
}

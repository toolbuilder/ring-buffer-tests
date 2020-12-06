# Ring-Buffer-Tests

This is a simple test harness for testing ring buffers (aka circular queues). Multiple ring buffer implementations are required to support different optimization requirements, so this package provides testing for the core functionality.

The interface being tested is defined by [SimpleRingBuffer](https://github.com/toolbuilder/ring-buffer-tests/blob/master/src/simple-ring-buffer.js).

## Installation

```bash
npm install --save @toolbuilder/ring-buffer-tests
```

## Use

```javascript
import { RingBufferDriver } from '@toolbuilder/ring-buffer-tests'
import { test } from 'zora' // or use your favorite test suite
import { YourRingBuffer } from '../src/your-ring-buffer'

test('ring buffer interface test', assert => {
  const driver = new RingBufferDriver() // taking default options

  // Since the driver does not test the ctor, you need to provide a factory function
  const factory = (capacity) => new YourRingBuffer(capacity)

  // Test the ring buffer with a capacity of 100
  const [actual, expected] = driver.testRingBuffer(100, factory)

  // If the test fails, the 'actual' field will hold what YourRingBuffer provided.
  // And the 'expected' field will hold what the exemplar (SimpleRingBuffer) provided.
  // Both will indicate whether it was a return value or a buffer state check that failed.
  assert.deepEqual(actual, expected, 'ring buffer passed test')
})
```

## API

### SimpleRingBuffer

This is the default ring buffer implementation that `RingBufferDriver` uses to compare your ring buffer implementation with. The implementation is at [src/simple-ring-buffer.js](./src/simple-ring-buffer.js). It has full JSDocs.

### RingBufferDriver

The class that runs the tests.

#### constructor

* options - an optional options object
  * options.exemplarFactory - factory function, fn(capacity), for exemplar ring buffer. Defaults to SimpleRingBuffer.
  * options.getState - method to get state from both ring buffers, returns a simple Object with the field values you want to check. Defaults keys are: `capacity`, `length`, `front`, `back`, `contents` which uses the iterator to collect all buffer values.
  * options.methodPairs - method name pairs for grow/shrink operations. Defaults to `[['push', 'shift'], ['unshift', 'pop']]`. Other method names are not currently supported.
  * options.dataGenerator - a function that takes no parameters that returns a function that returns a data element to insert into the test buffer. The default dataGenerator repeats a sequence of 1000 random numbers forever.

#### testRingBuffer

Tests a ring buffer implementation by:

* grow buffer to capacity - both grow and shrink but with a bias toward growth
* push into a buffer at capacity - repeatedly push into a buffer at capacity to verify behavior
* shrink a buffer to zero - both shrink and grow with bias toward shrinking

Every buffer operation is tested. The return value and buffer state is compared with the exemplar implementation. The first difference is returned by the method. However, testing will continue.

* capacity [Number] - capacity value to test ring buffer with
* ringBufferFactory [Function] - given capacity, fn(capacity), returns the ring buffer to test.
* Return value [Array] - returns a pair of test results. The first element is the 'actual' result, and
the second element is the 'expected' result. If both values are the same, the test passes. If they
are different, the test fails, and the values represent the difference between actual and expected
values.

## Contributing

For the most part, I threw this package together as an experiement in generic testing. So the flexibility required to test any ring buffer is not quite there. As such, I expect that this package is of limited utility to others. If you think it might be useful, feel free to contribute! Also, write up issues, submit pull requests, etc.

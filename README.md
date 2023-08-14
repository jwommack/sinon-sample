# Sinon Sandbox is not a real sandbox.

The only thing being isolated in sandbox is the restore() register. As such it's generally and usually a much
better practice to use `sinon.stub()` when stubbing than to call an explicit new sandbox.

sinon, when imported, creates a default sandbox. That sandbox uses a shared register. That shared register
will carry __across__ test suites. Without it you have to manually restore the stubs, which you have to already know exists.

Effectively running `sinon.restore()` before your test suite resets your environment __if you used the default sandbox__. If you created a second sandbox with `sinon.createSandbox()` that sandbox __will not be restored__ and you'll then have to manually test your stubs before stubbing, restore them through a loophole based on knowledge of the wrapped structure, and hope you've gotten them all.

Strangely enough `stub()` will assign to the default sandbox register but, it will be a _lesser_ stub that does not include `spy()` functionality. You won't be able to track `callCount`.

## Running these tests

The expected environment is a Typescript one. All tests are run against the `Generico` class. Currently there are no tests for Singletons but, those should also be expected to preserve their prototype across suites.


* `npm install`
* `npm run test` or `node node_modules/.bin/mocha -r ts-node/register src/__tests__/*`

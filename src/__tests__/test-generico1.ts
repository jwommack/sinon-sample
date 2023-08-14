import { Generico } from '../index';
import { it } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
//import { isRestorable } from 'sinon/lib/util/core/is-restorable';
import * as assert from 'assert/strict';

describe('Generico Suite', function() {
    let sandbox: sinon.SinonSandbox;
    let globalGenerico: Generico;
    
    // copied from sinon internals, there's an is-restorable under util/core/is-restorable
    // Replicates the wrapper check also applied in util/core/wrap-method:
    //   - https://github.com/sinonjs/sinon/blob/main/lib/sinon/util/core/wrap-method.js#L114-L121
    function isRestorableCopy(obj: any) { 
        return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
    }

    before(function() {
        globalGenerico = new Generico('globalCo');
        sandbox = sinon.createSandbox();
    });

    after(function() {
        sinon.stub(Generico.prototype, 'normalFunc').returns('Carries Over');
        sandbox.stub(Generico.prototype, 'privateFunc' as keyof Generico).returns('Carries Over');
        // True privates aren't stubbable. TODO: create an assert test on this.
        //sinon.stub(Generico.prototype, '#newPrivateFunc' as keyof Generico).returns('Carries Over');
    });

    describe(`Validate stub preserves cross test, stubs are global`, function() {
        // Order of these tests matter - I know, bad but we're intentionally doing xtest tests.
        it(`Should just stub something`, function() {
            const g1Stub = sinon.stub(globalGenerico, 'normalFunc').returns('I\'m a stubby stub');
            expect(globalGenerico.normalFunc.hasOwnProperty('reset'), 'Does not have reset method').to.be.true;
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as restorable').to.be.true;
        });

        it(`(xtest) Should throw when restubbing sinon.stub from previous test in sandbox`, function() {
            assert.throws(
                () => sandbox.stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
                { message: 'Attempted to wrap normalFunc which is already wrapped' }
            );
            sinon.restore();
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as not restorable').to.be.false;
        });
    });

    describe(`Validate that sinon.restore does not pierce sandbox but stubs are global`, function() {
        // Order of these tests matter - I know, bad but we're intentionally doing xtest tests.
        it(`Should throw fail stub after stubbing sandbox and restoring as sinon`, function() {
            const g1Stub = sandbox.stub(globalGenerico, 'normalFunc').returns('I\'m a stubby stub');
            assert.throws(
                () => sinon.stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
                { message: 'Attempted to wrap normalFunc which is already wrapped' }
            );
            sinon.restore();
            expect(
                isRestorableCopy(globalGenerico.normalFunc),
                'flags as restorable, sinon.restore does not restore sandbox'
            ).to.be.true;
            assert.throws( 
                () => sinon.stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
                { message: 'Attempted to wrap normalFunc which is already wrapped' },
                'sinon stub should have still thrown'
            );
        });

        it(`(xtest) Should correctly clean up sandbox stub`, function() {
            sandbox.restore();
            // Verify that it's NOW cleaned up.
            expect(
                isRestorableCopy(globalGenerico.normalFunc),
                'flags as restorable, sandbox.restore does restore sandbox'
            ).to.be.false;
            assert.doesNotThrow( 
                () => sinon.stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
            );
        });
    });

    describe(`Class/prototype stubs`, function() {
        it(`Should not restore sandbox with sinon.restore`, function() {
            // intentionally losing the variable.
            const genericoStub = sandbox.stub(Generico.prototype, 'normalFunc').returns('Stubbed');
            const localGenerico = new Generico('name');

            expect(isRestorableCopy(localGenerico.normalFunc), 'flags as restorable').to.be.true;
            expect(localGenerico.normalFunc(), 'failed to change return value').to.equal('Stubbed');
            sinon.assert.calledOnce(genericoStub);
            // fail to restore
            sinon.restore();
            expect(isRestorableCopy(localGenerico.normalFunc), 'still flags as restorable').to.be.true;
        });

        it(`Should see new instances as restorable`, function() {
            const localGenerico = new Generico('name');
            expect(isRestorableCopy(localGenerico.normalFunc), 'flags as restorable').to.be.true;
        });

        it(`Should share call count over tests`, function() {
            const localGenerico = new Generico('name');
            expect(localGenerico.normalFunc(), 'failed to change return value').to.equal('Stubbed');
            // You can recover stub reference in this way. You have to cast the type in TS though.
            expect(
                (localGenerico.normalFunc as any).callCount,
                'should have had a call count, included previous call'
            ).to.equal(2);
            sinon.assert.callCount((localGenerico.normalFunc as any), 2); // 1 for previous test 1 for this test.
        });

        it(`Should be able to restore prototype stub by abusing the wrapping`, function() {
            const localGenerico = new Generico('name');
            (localGenerico.normalFunc as any).restore(); // Does this work? Let's see
            expect(isRestorableCopy(localGenerico.normalFunc), 'flags as not restorable').to.be.false;
            // The direct restore restores the prototype.
            const localGenericoTwo = new Generico('name 2');
            expect(isRestorableCopy(localGenericoTwo.normalFunc), 'flags as not restorable').to.be.false;
        });

        it(`Should be able to re-stub the prototype`, function() {
            const genericoStub = sandbox.stub(Generico.prototype, 'normalFunc').returns('ReStubbed');
            const localGenerico = new Generico('name');
            sinon.assert.notCalled((localGenerico.normalFunc as any));
            sinon.assert.notCalled(genericoStub);
            expect(localGenerico.normalFunc()).to.equal('ReStubbed');
            sinon.assert.calledOnce((localGenerico.normalFunc as any));
            sinon.assert.calledOnce(genericoStub);
            genericoStub.restore();
        });
    });
});

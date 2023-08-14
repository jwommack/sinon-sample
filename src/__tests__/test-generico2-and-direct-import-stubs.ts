import { Generico } from '../index';
import { it } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { stub, spy } from 'sinon';
//import { isRestorable } from 'sinon/lib/util/core/is-restorable';
import * as assert from 'assert/strict';

describe('Generico Suite 2 - Generic Stubs and XSuite Stubs', function() {
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
    });

    after(function() {
        if(isRestorableCopy(globalGenerico.normalFunc)) {
            (globalGenerico as any).normalFunc.restore();
        }
    });

    describe(`Validate cross suite behaviors`, function() {
        it(`Should carry stubs across suites`, function() {
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as restorable').to.be.true;
            expect(isRestorableCopy((globalGenerico as any).privateFunc), 'flags as restorable').to.be.true;
        });

        it(`Should be able to restore the sinon stub`, function() {
            // normalFunc is sinon stub and should be in register.
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as restorable').to.be.true;
            sinon.restore();
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as not restorable').to.be.false;
        });
        
        it(`Should NOT be able to restore the sandbox stub with sinon.restore`, function() {
            // privateFunc is sandbox stub and should not be in register.
            expect(isRestorableCopy((globalGenerico as any).privateFunc), 'flags as restorable').to.be.true;
            sinon.restore(); // This should have already failed via the last test but do it again.
            expect(isRestorableCopy((globalGenerico as any).privateFunc), 'flags as restorable').to.be.true;
        });
        
        it(`Should be able to restore sandbox stub with work around if you know it needs restore`, function() {
            // Only way to restore it is to know to abuse wrapper class
            (globalGenerico as any).privateFunc.restore();
            expect(isRestorableCopy((globalGenerico as any).privateFunc), 'flags as NOT restorable').to.be.false;
        });
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
                () => stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
                { message: 'Attempted to wrap normalFunc which is already wrapped' }
            );
            sinon.restore();
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as not restorable').to.be.false;
        });
    });

    describe(`Validate that sinon.restore DOES work in direct import stubs`, function() {
        // This is DIFFERENT than other behavior, works as you'd expect strangely enough.
        // Order of these tests matter - I know, bad but we're intentionally doing xtest tests.
        it(`Should restore stub after stubbing with stub() and restoring as sinon.retore`, function() {
            const g1Stub = stub(globalGenerico, 'normalFunc').returns('I\'m a stubby stub');
            // Does this flag restorable?
            expect(isRestorableCopy(g1Stub), 'variable flags as restorable').to.be.true;
            expect(isRestorableCopy(globalGenerico.normalFunc), 'function flags as not restorable').to.be.true; 
            
            expect(globalGenerico.normalFunc()).to.equal('I\'m a stubby stub');

            sinon.restore();
            // Check if the default stub resets with restore
            expect(isRestorableCopy(g1Stub), 'variable flags as restorable').to.be.true;
            expect(isRestorableCopy(globalGenerico.normalFunc), 'function flags as restorable').to.be.false; 
            // This doens't seem to throw and instead adds it to the register.
            expect(globalGenerico.normalFunc()).to.not.equal('I\'m a stubby stub');
            stub(globalGenerico, 'normalFunc').returns('Cross test stub'); 
        });

        it(`(xtest) Should correctly clean up stub if manually called (via loophole)`, function() {
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as restorable').to.be.true;
            assert.throws( 
                () => sinon.stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
                { message: 'Attempted to wrap normalFunc which is already wrapped' }
            );

            (globalGenerico.normalFunc as any).restore();
            // Verify that it's NOW cleaned up.
            expect(isRestorableCopy(globalGenerico.normalFunc), 'flags as NOT restorable').to.be.false;
            assert.doesNotThrow( 
                () => sinon.stub(globalGenerico, 'normalFunc').returns('Sandbox stub'),
            );
        });
    });
});

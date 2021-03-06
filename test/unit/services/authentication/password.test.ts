import { expect } from 'chai';
import { createSandbox, SinonStub } from 'sinon';
import * as bcrypt from 'bcrypt';

import { hashPassword, checkPassword, SALT_ROUNDS } from '@/services/authentication/password';
import { numSubstrings } from '@/utilities/functions/numSubstrings';

interface BcryptMock {
  hash: SinonStub;
  compare: SinonStub;
}

const sandbox = createSandbox();

describe('authentication service password module', function () {
  const SIMPLE_PASSWORD = 'simplepassword';
  const COMPLEX_PASSWORD = '_C0MP|3><?';
  const MIN_SALT_ROUNDS = 10;

  let bcryptMock: BcryptMock;

  afterEach(() => sandbox.restore());

  it('should have >=10 salt rounds', function () {
    expect(SALT_ROUNDS).to.be.at.least(MIN_SALT_ROUNDS);
  });

  describe('#hashPassword', function () {
    const EXPECTED_DOLLARS = 3;

    describe('without bcrypt', function () {
      const fakeHash = '$2a$11$k8yDJJcxz5Xu.JnV6CRS6uxqbt1ogHp.sYeToI9WqwLluaAKIXnia';

      beforeEach(function () {
        mockBcrypt();
      });

      it('should hash simple password', async function () {
        bcryptMock.hash.withArgs(SIMPLE_PASSWORD, SALT_ROUNDS).resolves(fakeHash);
        return test(SIMPLE_PASSWORD);
      });

      it('should hash complex password', async function () {
        bcryptMock.hash.withArgs(COMPLEX_PASSWORD, SALT_ROUNDS).resolves(fakeHash);
        return test(COMPLEX_PASSWORD);
      });

      it('should throw error if bcrypt throws error', async function () {
        // Arrange
        bcryptMock.hash.rejects();

        await test(SIMPLE_PASSWORD, true);
      });
    });

    describe('with bcrypt @slow',function () {
      it('should hash simple password', async function () {
        return test(SIMPLE_PASSWORD);
      });

      it('should hash complex password', async function () {
        return test(COMPLEX_PASSWORD);
      });
    });

    async function test(password: string, shouldFail = false) {
      // Act
      let failed = false;
      try {
        const hash = await hashPassword(password);

        // Assert
        expect(hash).to.be.a('string');
        expect(hash).to.not.eq(password);
        expect(numSubstrings(hash, '$')).to.eq(EXPECTED_DOLLARS);
      } catch (_) {
        failed = true;
      }

      // Assert
      expect(failed).to.eq(shouldFail);
    }
  });

  describe('#comparePassword', function () {

    const SIMPLE_HASH = '$2a$11$mkIzes44pQ96o/l/lEUhJewwAGhiQva3HC2lTelnx6NlcKP2LPnu2';
    const COMPLEX_HASH = '$2a$11$xNyDJJcxz5Xu.J3V6CRS6uxqbt1oTKp.sGeToI9WqwLluaAKIXnia';
    const INCORRECT_HASH = '$2a$11$yNyDJJcxz5Xu.JnV6CRS6uxqbt1oTKp.sgeToI9WqwLluaAKIXnia';

    describe('without bcrypt', function () {
      beforeEach(function () {
        mockBcrypt();
      });

      it('simple password', async function () {
        bcryptMock.compare.withArgs(SIMPLE_PASSWORD, SIMPLE_HASH).resolves(true);
        return test(SIMPLE_PASSWORD, SIMPLE_HASH, true);
      });

      it('complex password', async function () {
        bcryptMock.compare.withArgs(COMPLEX_PASSWORD, COMPLEX_HASH).resolves(true);
        return test(COMPLEX_PASSWORD, COMPLEX_HASH, true);
      });

      it('should throw error if bcrypt errors', async function () {
        // Arrange
        bcryptMock.compare.rejects();

        await test(SIMPLE_PASSWORD, SIMPLE_HASH, true, true);
      });
    });

    describe('with bcrypt @slow', function () {
      it('simple password', async function () {
        return test(SIMPLE_PASSWORD, SIMPLE_HASH, true);
      });

      it('complex password', async function () {
        return test(COMPLEX_PASSWORD, COMPLEX_HASH, true);
      });

      it('incorrect password', async function () {
        return test(SIMPLE_PASSWORD, INCORRECT_HASH, false);
      });
    });

    async function test(password: string, hash: string, expected: boolean, shouldFail = false) {
      // Act
      let failed = false;
      try {
        const isPassword = await checkPassword(password, hash);

        // Assert
        expect(isPassword).to.eq(expected);
      } catch (_) {
        failed = true;
      }

      // Assert
      expect(failed).to.eq(shouldFail);
    }
  });

  function mockBcrypt() {
    bcryptMock = {
      compare: sandbox.stub(bcrypt, 'compare'),
      hash: sandbox.stub(bcrypt, 'hash'),
    };
  }
});

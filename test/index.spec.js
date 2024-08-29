const { assert } = require('chai');

const dataTable = require('../src');

describe('dataTable', () => {
  describe('original demo table', () => {
    const fn = (...args) => {
      return dataTable`
        ${args.length} || type       | colourTxt  | colourEnabled | codeTxt    | codeEnabled
                     0 || Type...    |            | ❌            | Code...    | ❌
                     1 || ${args[0]} |            | ✅            | Code...    | ❌
                     2 || ${args[0]} | ${args[1]} | ✅            | Code...    | ✅
                     3 || ${args[0]} | ${args[1]} | ✅            | ${args[2]} | ✅
      `;
    };

    it('should reject too many args', () => {
      // expect
      assert.throws(() => fn(1, 2, 3, 4), 'No args matched [4]');
    });

    [
      [ [],                               ['Type...', '',         false, 'Code...', false] ],
      [ ['a-type'],                       ['a-type',  '',         true,  'Code...', false] ],
      [ ['a-type', 'a-colour'],           ['a-type',  'a-colour', true,  'Code...', true ] ],
      [ ['a-type', 'a-colour', 'a-code'], ['a-type',  'a-colour', true,  'a-code',  true ] ],
    ].forEach(([ args, [ type, colourTxt, colourEnabled, codeTxt, codeEnabled ] ]) => {
      it(`should parse ${args.length} args as expected`, () => {
        // expect
        assert.deepEqual(fn(...args), { type, colourTxt, colourEnabled, codeTxt, codeEnabled });
      });
    });
  });

  describe.only('two input columns, with values', () => {
    const fn = (...args) => {
      return dataTable`
        ${args.length} | ${args[0]} || type       | colourTxt  | colourEnabled | codeTxt    | codeEnabled
                     0 |            || Type...    |            | ❌            | Code...    | ❌
                     1 |            || Type...    |            | ❌            | Code...    | ✅
                     1 | ${args[0]} || ${args[0]} |            | ❌            | Code...    | ❌
                     `;
//                     1 | a-type     || other1     |            | ✅            | Code...    | ❌
//                     1 | b-type     || other2     |            | ✅            | Code...    | ✅
//                     2 | ${args[0]} || ${args[0]} | ${args[1]} | ✅            | Code...    | ✅
//                     3 | ${args[0]} || ${args[0]} | ${args[1]} | ✅            | ${args[2]} | ✅
//      `;
    };

    it('should reject too many args', () => {
      // expect
      assert.throws(() => fn(1, 2, 3, 4), 'No args matched [4,1]');
    });

    [
//      [ [],                               ['Type...', '',         false, 'Code...', false] ],
//      [ [''],                             ['Type...', '',         false, 'Code...', true ] ],
      [ ['a-type'],                       ['other1',  '',         true,  'Code...', false] ],
//      [ ['b-type'],                       ['other2',  '',         true,  'Code...', true ] ],
//      [ ['X-type'],                       ['X-type',  '',         false, 'Code...', false] ],
//      [ ['a-type', 'a-colour'],           ['a-type',  'a-colour', true,  'Code...', true ] ],
//      [ ['a-type', 'a-colour', 'a-code'], ['a-type',  'a-colour', true,  'a-code',  true ] ],
    ].forEach(([ args, [ type, colourTxt, colourEnabled, codeTxt, codeEnabled ] ]) => {
      it.only(`should parse ${args.length} args as expected`, () => {
        // expect
        assert.deepEqual(fn(...args), { type, colourTxt, colourEnabled, codeTxt, codeEnabled });
      });
    });
  });
});

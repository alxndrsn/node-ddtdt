const { assert } = require('chai');

const dataTable = require('../src');

describe('dataTable', () => {
  it('should work for hardcoded values', () => {
    // when
    const vals = dataTable`
      m1 | m2 | m3 || a | b | c | d | e | f | g
         | m2 | m3 || 1 | 2 | 3 | 4 | 5 | 6 | 0
      m1 |    | m3 || 1 | 2 | 3 | 4 | 5 | 6 | 1
      m1 | m2 |    || 1 | 2 | 3 | 4 | 5 | 6 | 2
         |    | m3 || 1 | 2 | 3 | 4 | 5 | 6 | 3
         | m2 |    || 1 | 2 | 3 | 4 | 5 | 6 | 4
      m1 |    |    || 1 | 2 | 3 | 4 | 5 | 6 | 5
         |    |    || 1 | 2 | 3 | 4 | 5 | 6 | 6
      m1 | m2 | m3 || 1 | 2 | 3 | 4 | 5 | 6 | 7
    `;

    // then
    assert.deepEqual(vals, { a:'1', b:'2', c:'3', d:'4', e:'5', f:'6', g:'7' });
  });

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

  describe('two input columns, with values', () => {
    const fn = (...args) => {
      return dataTable`
        ${args.length} | ${args[0]} || type       | colourTxt  | colourEnabled | codeTxt    | codeEnabled
                     0 |            || Type...    |            | ❌            | Code...    | ❌
                     1 |            || Type...    |            | ❌            | Code...    | ✅
                     1 | a-type     || other1     |            | ✅            | Code...    | ❌
                     1 | b-type     || other2     |            | ✅            | Code...    | ✅
                     1 | ${args[0]} || ${args[0]} |            | ❌            | Code...    | ❌
                     2 | ${args[0]} || ${args[0]} | ${args[1]} | ✅            | Code...    | ✅
                     3 | ${args[0]} || ${args[0]} | ${args[1]} | ✅            | ${args[2]} | ✅
      `;
    };

    it('should reject too many args', () => {
      // expect
      assert.throws(() => fn(1, 2, 3, 4), 'No args matched [4,1]');
    });

    [
      [ [],                               ['Type...', '',         false, 'Code...', false] ],
      [ [''],                             ['Type...', '',         false, 'Code...', true ] ],
      [ ['a-type'],                       ['other1',  '',         true,  'Code...', false] ],
      [ ['b-type'],                       ['other2',  '',         true,  'Code...', true ] ],
      [ ['X-type'],                       ['X-type',  '',         false, 'Code...', false] ],
      [ ['a-type', 'a-colour'],           ['a-type',  'a-colour', true,  'Code...', true ] ],
      [ ['a-type', 'a-colour', 'a-code'], ['a-type',  'a-colour', true,  'a-code',  true ] ],
    ].forEach(([ args, [ type, colourTxt, colourEnabled, codeTxt, codeEnabled ] ]) => {
      it(`should parse ${args.length} args as expected`, () => {
        // expect
        assert.deepEqual(fn(...args), { type, colourTxt, colourEnabled, codeTxt, codeEnabled });
      });
    });
  });
});

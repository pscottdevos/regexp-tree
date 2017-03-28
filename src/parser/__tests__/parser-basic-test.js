/**
 * The MIT License (MIT)
 * Copyright (c) 2017-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

const regexpTree = require('../index');

function re(regexp) {
  return regexpTree.parse(regexp.toString());
}

describe('basic', () => {

  it('char', () => {
    expect(re(/a/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Char',
        value: 'a',
        kind: 'simple'
      },
      flags: []
    });
  });

  it('disjunction', () => {
    expect(re(/a|b/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Disjunction',
        left: {
          type: 'Char',
          value: 'a',
          kind: 'simple',
        },
        right: {
          type: 'Char',
          value: 'b',
          kind: 'simple',
        }
      },
      flags: [],
    });
  });

  it('alternative', () => {
    expect(re(/ab/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Alternative',
        expressions: [
          {
            type: 'Char',
            value: 'a',
            kind: 'simple',
          },
          {
            type: 'Char',
            value: 'b',
            kind: 'simple',
          }
        ],
      },
      flags: [],
    });
  });

  it('character class', () => {
    expect(re(/[a-z\d]/i)).toEqual({
      type: 'RegExp',
      body: {
        type: 'CharacterClass',
        expressions: [
          {
            type: 'ClassRange',
            from: {
              type: 'Char',
              value: 'a',
              kind: 'simple'
            },
            to: {
              type: 'Char',
              value: 'z',
              kind: 'simple'
            }
          },
          {
            type: 'Char',
            value: '\\d',
            kind: 'meta'
          }
        ]
      },
      flags: [
        'i'
      ]
    });
  });

  it('empty group', () => {
    expect(re(/()/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Group',
        capturing: true,
        expression: null,
      },
      flags: [],
    });

    expect(re(/(?:)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Group',
        capturing: false,
        expression: null,
      },
      flags: [],
    });
  });

  it('non-empty group', () => {
    expect(re(/(a)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Group',
        capturing: true,
        expression: {
          type: 'Char',
          value: 'a',
          kind: 'simple'
        },
      },
      flags: [],
    });

    expect(re(/(?:a)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Group',
        capturing: false,
        expression: {
          type: 'Char',
          value: 'a',
          kind: 'simple'
        },
      },
      flags: [],
    });
  });

  it('empty LA assertion', () => {
    expect(re(/(?=)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Assertion',
        kind: 'Lookahead',
        assertion: null,
      },
      flags: [],
    });

    expect(re(/(?!)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Assertion',
        kind: 'Lookahead',
        negative: true,
        assertion: null,
      },
      flags: [],
    });
  });

  it('non-empty LA assertion', () => {
    expect(re(/(?=a)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Assertion',
        kind: 'Lookahead',
        assertion: {
          type: 'Char',
          value: 'a',
          kind: 'simple'
        },
      },
      flags: [],
    });

    expect(re(/(?!a)/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Assertion',
        kind: 'Lookahead',
        negative: true,
        assertion: {
          type: 'Char',
          value: 'a',
          kind: 'simple'
        },
      },
      flags: [],
    });
  });

  it('backreferences', () => {
    expect(re(/(a)\1/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Alternative',
        expressions: [
          {
            type: 'Group',
            capturing: true,
            expression: {
              type: 'Char',
              value: 'a',
              kind: 'simple'
            }
          },
          {
            type: 'Backreference',
            reference: 1
          }
        ]
      },
      flags: []
    });
  });

  it('non-backreferences', () => {
    expect(re(/(?:a)\1/)).toEqual({
      type: 'RegExp',
      body: {
        type: 'Alternative',
        expressions: [
          {
            type: 'Group',
            capturing: false,
            expression: {
              type: 'Char',
              value: 'a',
              kind: 'simple'
            }
          },
          {
            type: 'Char',
            value: '\\1',
            kind: 'decimal'
          }
        ]
      },
      flags: []
    });
  });

  it('meta chars', () => {

    function LettersRange(start, stop) {
      const range = [];

      for (
        let idx = start.charCodeAt(0),
        end = stop.charCodeAt(0);
        idx <= end;
        ++idx
      ) {
        range.push(String.fromCharCode(idx));
      }

      return range;
    }

    const metaChars = new Set([
      't', 'n', 'r', 'd', 'D', 's',
      'S', 'w', 'W', 'v', 'f',
    ]);

    const azAZRange = LettersRange('a', 'z').concat(LettersRange('A', 'Z'));

    for (const letter of azAZRange) {
      const parsedChar = regexpTree.parse(`/\\${letter}/`).body;
      if (metaChars.has(letter)) {
        expect(parsedChar.kind).toBe('meta');
      } else {
        expect(parsedChar.kind).not.toBe('meta');
      }
    }

    // Special case for [\b] - Backspace
    const backspace = regexpTree.parse('/[\\b]/').body.expressions[0];
    expect(backspace.kind).toBe('meta');
  });

});
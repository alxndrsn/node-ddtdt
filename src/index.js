module.exports = dataTable;

const ARG_TERM = '||';

class Value {
  constructor(v) {
    this.v = v;
  }
}

function dataTable(parts, ...values) {
  console.log('dataTable()', { parts, values });
  const full = [ parts[0].trim() ];
  for(let i=0; i<values.length; ++i) {
    full.push(new Value(values[i]), parts[i+1]);
  }
  full[full.length-1] = full[full.length-1].trim();
  console.log('dataTable()', { full });

  const lines = [];
  let currentLine = [];
  for(const f of full) {
    if(f instanceof Value) currentLine.push(f);
    else if(!f.includes('\n')) currentLine.push(f);
    else {
      const [endThis, ...others] = f.split('\n');
      currentLine.push(endThis);
      lines.push(currentLine);
      while(others.length > 1) lines.push([ others.shift() ]);
      currentLine = [ others[0] ];
    }
  }
  if(currentLine.length) lines.push(currentLine);
  console.log('dataTable()', { lines });

  const processedLines = lines.map(line => {
    const pLine = [];
    for(const cell of line) {
      console.log('cell:', typeof cell, cell);
      if(cell instanceof Value) pLine.push(cell.v);
      else {
        pLine.push(...tokenise(cell));
      }
    }
    return pLine;
  });
  console.log('dataTable()', { processedLines });

  process.exit();

  parts = parts.map(it => it.trim());

  if(parts[0]) throw new Error(`Unexpected text before first arg column: '${parts[0]}'`);
  parts.shift();

  const args = [ values.shift() ];
  while(!endOfArgs(parts)) {
    args.push(values.shift());
    parts.shift();
  }

  if(!parts.length) throw new Error('No remaining parts!');
  const [ firstLine, ...remaining ] = parts.shift().split('\n');
  parts.unshift(remaining.join('\n').trim());

  const fieldNames = firstLine.substr(ARG_TERM.length).split('|').map(s => s.trim());

  let state;
  const rows = [];

  let currentRow;
  const newCurrent = () => {
    console.log('newCurrent()', 'previous:', currentRow);
    if(currentRow) rows.push(currentRow);
    state = 'processing-args';
    currentRow = { args:[], vals:[] };
  };
  newCurrent();

  let currentPart;
  const popPart = () => {
    currentPart = parts.shift();
    if(currentPart === undefined) return false;

    currentPart = currentPart.replace(/^[ \t]*/, '');
    if(currentPart.startsWith('\n')) {
      newCurrent();
      currentPart = currentPart.trim();
    }

    currentPart = currentPart.trim();

    // There are probably some bugs here relating to empty strings in first
    // column or first column after ARG_TERM.  TODO write tests and fix.
    console.log('    testing currentPart:', currentPart);
    if(currentPart.startsWith(ARG_TERM)) {
      state = 'processing-vals';
      currentPart = currentPart.substr(ARG_TERM.length);
    }
    if(currentPart.startsWith('|')) {
      currentPart = currentPart.substr(1).trim();
    }

    if(!currentPart) {
      currentPart = values.shift();
      return true;
    }

    const unshiftAfter = seq => {
      console.log('unshiftAfter()', { seq, currentPart });
      if(currentPart.includes(seq)) {
        const [ a, ...remaining ] = currentPart.split(seq);
        currentPart = a.trim();
        parts.unshift(seq + remaining.join(seq));
        console.log('unshiftAfter()', { currentPart, unshifted:parts[0] });
      }
    };
    unshiftAfter(ARG_TERM);
    unshiftAfter('|');
    unshiftAfter('\n');

    return currentPart !== undefined;
  };

  while(popPart()) {
    console.log('  while{}', { state, currentPart });
    switch(state) {
      case 'processing-args': {
        currentRow.args.push(parseSpecial(currentPart));
      } break;
      case 'processing-vals': {
        currentRow.vals.push(parseSpecial(currentPart));
      } break;
      default: throw new Error(`No handling for state '${state}'`);
    }
  }
  newCurrent();

  console.log('rows:', rows);

  for(const r of rows) {
    console.log('Trying to match:', args, r.args);
    if(args.length !== r.args.length) continue;

    // N.B. weak value comparison to allow for easy use of numbers in text.
    // This may cause ambiguities down the line...
    if(args.some((arg, i) => {
      return arg != r.args[i] && !(typeof arg === 'string' && !arg && !r.args[i]);
    })) continue;

    return fieldNames.reduce((ret, k, i) => {
      ret[k] = r.vals[i];
      return ret;
    }, {});
  }

  throw new Error(`No args matched ${JSON.stringify(args)}`);
}

function endOfArgs([nextPart]) {
  if(nextPart == null) throw new Error(`String ends before arg terminator ('${ARG_TERM}') seen!`);
  return nextPart.startsWith(ARG_TERM);
}

function parseSpecial(v) {
  if(v === '✅') return true;
  if(v === '❌') return false;
  return v;
}

const ARG_DIVIDER = Symbol('||');
const COL_DIVIDER = Symbol('|');
function tokenise(str) {
  const replaced = replace(str, '||', ARG_DIVIDER)
      .map(it => typeof it === 'string' ? replace(it, '|', COL_DIVIDER) : it)
      .flat();
  return replaced
      .filter((v, idx) => {
        if(typeof v !== 'string') return true;
        if(v) return true;
        const prev = replaced[idx-1];
        const next = replaced[idx+1];
        if(prev instanceof Value || !prev) return false;
        if(next instanceof Value || !next) return false;
        return true;
      })
      .map(it => {
        console.log('it:',it);
        if(it === '✅') return true;
        if(it === '❌') return false;
        return it;
      });
}
function replace(str, match, replacement) {
  const splitByArg = str.split(match).map(it => it.trim());
  const rebuilt = [ splitByArg[0] ];
  for(let i=1; i<splitByArg.length; ++i) {
    rebuilt.push(replacement, splitByArg[i]);
  }
  return rebuilt;
}

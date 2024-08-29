module.exports = dataTable;

const ARG_TERM = '||';

function dataTable(parts, ...values) {
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
      if(currentPart.includes(seq)) {
        const [ a, ...remaining ] = currentPart.split(seq);
        currentPart = a.trim();
        parts.unshift(seq + remaining.join(seq));
      }
    };
    unshiftAfter(ARG_TERM);
    unshiftAfter('|');
    unshiftAfter('\n');

    return currentPart !== undefined;
  };

  while(popPart()) {
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

  for(const r of rows) {
    if(args.length !== r.args.length) continue;

    // N.B. weak value comparison to allow for easy use of numbers in text.
    // This may cause ambiguities down the line...
    if(args.some((arg, i) => arg != r.args[i])) continue;

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

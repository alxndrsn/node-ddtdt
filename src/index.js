module.exports = dataTable;

const ARG_DIVIDER = Symbol('||');
const COL_DIVIDER = Symbol('|');

class Value {
  constructor(v) {
    this.v = v;
  }
}

function dataTable(parts, ...values) {
  const full = [ parts[0].trim() ];
  for(let i=0; i<values.length; ++i) {
    full.push(new Value(values[i]), parts[i+1]);
  }
  full[full.length-1] = full[full.length-1].trim();

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

  const processedLines = lines.map(line => {
    const pLine = [];
    for(const cell of line) {
      if(cell instanceof Value) pLine.push(cell.v);
      else {
        pLine.push(...tokenise(cell));
      }
    }
    const objLine = { args:[], vals:[] };
    let argsDone = false;
    for(const cell of pLine) {
      switch(cell) {
        case ARG_DIVIDER: argsDone = true; break;
        case COL_DIVIDER: break;
        default: objLine[argsDone ? 'vals' : 'args'].push(cell);
      }
    }
    return objLine;
  });

  const [ { args, vals:fieldNames }, ...rows ] = processedLines;

  for(const r of rows) {
    if(args.length !== r.args.length) continue;

    // N.B. weak value comparison to allow for easy use of numbers in text.
    // This may cause ambiguities down the line...
    if(!args.every((arg, i) => {
      if(arg == r.args[i]) return true;
      if(arg == null && r.args[i] === '') return true;
    })) continue;

    return fieldNames.reduce((ret, k, i) => {
      ret[k] = r.vals[i];
      return ret;
    }, {});
  }

  throw new Error(`No args matched ${JSON.stringify(args)}`);
}

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

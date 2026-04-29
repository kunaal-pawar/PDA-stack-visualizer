// ── State ─────────────────────────────────────────────
let inputStr = '';
let idx      = 0;
let stack    = [];
let state    = 'q0';
let running  = false;
let done     = false;
let currentLanguage = 'anbn';

function createEqualCountConfig(first, second, name, subtitle, examples) {
  return {
    name,
    subtitle,
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: true,
    allowedSymbols: new RegExp(`^[${first}${second}]*$`),
    examples,
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === first) {
          const rule = stackTop === 'Z'
            ? `δ(q0, ${first}, Z) → (q0, AZ)`
            : `δ(q0, ${first}, A) → (q0, AA)`;
          return { nextState: 'q0', operation: 'Push', pushValue: 'A', rule };
        }

        if (symbol === second) {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: `δ(q0, ${second}, A) → (q1, ε)` };
          }
          return { error: `stack underflow — no ${first} was pushed before first ${second}` };
        }
      } else if (state === 'q1') {
        if (symbol === second) {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: `δ(q1, ${second}, A) → (q1, ε)` };
          }
          return { error: `stack underflow — more ${second}'s than ${first}'s` };
        }

        if (symbol === first) {
          return { error: `invalid symbol "${first}" in state q1 — ${first}'s must come before ${second}'s` };
        }
      }

      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  };
}

function createEvenPalindromeConfig(symbols, name, subtitle, examples) {
  return {
    name,
    subtitle,
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: true,
    allowedSymbols: new RegExp(`^[${symbols}]*$`),
    examples,
    transitions: function(symbol, state, stackTop, index, inputLength) {
      const mid = inputLength / 2;

      if (state === 'q0') {
        if (index < mid) {
          return {
            nextState: 'q0',
            operation: 'Push',
            pushValue: symbol,
            rule: `δ(q0, ${symbol}, X) → (q0, ${symbol}X)`
          };
        }

        if (symbol === stackTop) {
          return { nextState: 'q1', operation: 'Pop', rule: `δ(q0, ${symbol}, ${symbol}) → (q1, ε)` };
        }

        return { error: `mismatch at index ${index}: expected ${stackTop}, got ${symbol}` };
      }

      if (state === 'q1') {
        if (symbol === stackTop) {
          return { nextState: 'q1', operation: 'Pop', rule: `δ(q1, ${symbol}, ${symbol}) → (q1, ε)` };
        }

        return { error: `mismatch at index ${index}: expected ${stackTop}, got ${symbol}` };
      }

      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return stack.length === 1 && stack[0] === 'Z' && inputLength > 0 && inputLength % 2 === 0;
    }
  };
}

const pdaConfigs = {
  anbn: createEqualCountConfig(
    'a',
    'b',
    'aⁿbⁿ (n ≥ 0)',
    'Pushdown Automaton for the language aⁿbⁿ',
    ['aaabbb', 'ab', 'aabbb', 'abb']
  ),

  anbmcm: {
    name: 'aⁿbᵐcᵐ (n,m ≥ 0)',
    subtitle: 'Pushdown Automaton for the language aⁿbᵐcᵐ',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: true,
    allowedSymbols: /^[abc]*$/,
    examples: ['aaabbbccc', 'abcc', 'aaaccc', 'aabbbc'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          return { nextState: 'q0', operation: 'None', rule: 'δ(q0, a, X) → (q0, X)' };
        }
        if (symbol === 'b') {
          return { nextState: 'q1', operation: 'Push', pushValue: 'B', rule: 'δ(q0, b, X) → (q1, BX)' };
        }
        if (symbol === 'c') {
          return { error: 'c cannot appear before b' };
        }
      } else if (state === 'q1') {
        if (symbol === 'b') {
          return { nextState: 'q1', operation: 'Push', pushValue: 'B', rule: 'δ(q1, b, X) → (q1, BX)' };
        }
        if (symbol === 'c') {
          if (stackTop === 'B') {
            return { nextState: 'q2', operation: 'Pop', rule: 'δ(q1, c, B) → (q2, ε)' };
          }
          return { error: 'no b available to match c' };
        }
        if (symbol === 'a') {
          return { error: 'a must come before b and c sections' };
        }
      } else if (state === 'q2') {
        if (symbol === 'c') {
          if (stackTop === 'B') {
            return { nextState: 'q2', operation: 'Pop', rule: 'δ(q2, c, B) → (q2, ε)' };
          }
          return { error: 'more c\'s than b\'s' };
        }
        if (symbol === 'a' || symbol === 'b') {
          return { error: 'only c\'s are allowed after first c' };
        }
      }

      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  },

  zeroone: createEqualCountConfig(
    '0',
    '1',
    '0ⁿ1ⁿ (n ≥ 0)',
    'Pushdown Automaton for the language 0ⁿ1ⁿ',
    ['000111', '01', '00111', '011']
  ),

  anb2n: {
    name: 'aⁿb²ⁿ (n ≥ 0)',
    subtitle: 'Pushdown Automaton for the language aⁿb²ⁿ',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: true,
    allowedSymbols: /^[ab]*$/,
    examples: ['aabbbb', 'abb', 'aaabbbbbb', 'abbb'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          const rule = stackTop === 'Z' ? 'δ(q0, a, Z) → (q0, AAZ)' : 'δ(q0, a, A) → (q0, AAA)';
          return { nextState: 'q0', operation: 'Push', pushValue: ['A', 'A'], rule };
        }

        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q0, b, A) → (q1, ε)' };
          }
          return { error: 'stack underflow — no a was pushed before first b' };
        }
      } else if (state === 'q1') {
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q1, b, A) → (q1, ε)' };
          }
          return { error: 'stack underflow — expected more A\'s on stack' };
        }

        if (symbol === 'a') {
          return { error: 'invalid symbol "a" in state q1 — a\'s must come before b\'s' };
        }
      }

      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  },

  anbncmdm: {
    name: 'aⁿbⁿcᵐdᵐ',
    subtitle: 'Pushdown Automaton for the language aⁿbⁿcᵐdᵐ',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: true,
    allowedSymbols: /^[abcd]*$/,
    examples: ['aabbccdd', 'abccdd', 'aaabbbcccddd', 'abbccdd'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          const rule = stackTop === 'Z' ? 'δ(q0, a, Z) → (q0, AZ)' : 'δ(q0, a, A) → (q0, AA)';
          return { nextState: 'q0', operation: 'Push', pushValue: 'A', rule };
        }
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q0, b, A) → (q1, ε)' };
          }
          return { error: 'stack underflow — no a was pushed before first b' };
        }
        return { error: 'language requires a\'s before b\'s' };
      }
      if (state === 'q1') {
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q1, b, A) → (q1, ε)' };
          }
          return { error: 'stack underflow — more b\'s than a\'s' };
        }
        if (symbol === 'c') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q1, c, A) → (q1, ε)' };
          }
          if (stackTop === 'Z') {
            return { nextState: 'q2', operation: 'Push', pushValue: 'C', rule: 'δ(q1, c, Z) → (q2, CZ)' };
          }
          return { error: 'invalid stack state for c transition' };
        }
        if (symbol === 'a') {
          return { error: 'a\'s must come before b\'s' };
        }
        return { error: 'language requires b\'s before c\'s' };
      }
      if (state === 'q2') {
        if (symbol === 'c') {
          const rule = stackTop === 'Z' ? 'δ(q2, c, Z) → (q2, CZ)' : 'δ(q2, c, C) → (q2, CC)';
          return { nextState: 'q2', operation: 'Push', pushValue: 'C', rule };
        }
        if (symbol === 'd') {
          if (stackTop === 'C') {
            return { nextState: 'q2', operation: 'Pop', rule: 'δ(q2, d, C) → (q2, ε)' };
          }
          if (stackTop === 'Z') {
            return { nextState: 'q3', operation: 'None', rule: 'δ(q2, d, Z) → (q3, Z)' };
          }
          return { error: 'stack underflow — no c was pushed before first d' };
        }
        return { error: 'language requires c\'s before d\'s' };
      }
      if (state === 'q3') {
        return { error: 'input should end after matching all d\'s' };
      }
      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return (state === 'q3' || (state === 'q2' && index === inputLength)) && stack.length === 1 && stack[0] === 'Z';
    }
  },

  anbman: {
    name: 'aⁿbᵐaⁿ',
    subtitle: 'Pushdown Automaton for the language aⁿbᵐaⁿ',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: false,
    allowedSymbols: /^[ab]*$/,
    examples: ['aabbaa', 'aba', 'aaabbbbaaa', 'abba'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          const rule = stackTop === 'Z' ? 'δ(q0, a, Z) → (q0, AZ)' : 'δ(q0, a, A) → (q0, AA)';
          return { nextState: 'q0', operation: 'Push', pushValue: 'A', rule };
        }
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'None', rule: 'δ(q0, b, A) → (q1, A)' };
          }
          return { error: 'at least one a required before b' };
        }
        return { error: 'language requires a\'s first' };
      }
      if (state === 'q1') {
        if (symbol === 'b') {
          return { nextState: 'q1', operation: 'None', rule: 'δ(q1, b, X) → (q1, X)' };
        }
        if (symbol === 'a') {
          if (stackTop === 'A') {
            return { nextState: 'q2', operation: 'Pop', rule: 'δ(q1, a, A) → (q2, ε)' };
          }
          return { error: 'stack underflow — more a\'s than initial a\'s' };
        }
        return { error: 'only b\'s or a\'s allowed' };
      }
      if (state === 'q2') {
        if (symbol === 'a') {
          if (stackTop === 'A') {
            return { nextState: 'q2', operation: 'Pop', rule: 'δ(q2, a, A) → (q2, ε)' };
          }
          if (stackTop === 'Z') {
            return { nextState: 'q3', operation: 'None', rule: 'δ(q2, a, Z) → (q3, Z)' };
          }
          return { error: 'stack underflow — more a\'s than initial a\'s' };
        }
        if (symbol === 'b') {
          return { error: 'b\'s must come before final a\'s' };
        }
        return { error: 'only a\'s allowed in final section' };
      }
      if (state === 'q3') {
        return { error: 'input should end after matching a\'s' };
      }
      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return (state === 'q3' || (state === 'q2' && index === inputLength)) && stack.length === 1 && stack[0] === 'Z';
    }
  },

  palindrome: createEvenPalindromeConfig(
    'ab',
    'Palindrome',
    'Pushdown Automaton for Palindrome (even length w wᴿ)',
    ['abba', 'baab', 'aaaa', 'aba']
  ),

  parentheses: {
    name: 'Balanced Parentheses',
    subtitle: 'Pushdown Automaton for Balanced Parentheses',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: true,
    allowedSymbols: /^[()[\]{}]*$/,
    examples: ['([])', '{[()]}', '([)]', '(()'],
    transitions: function(symbol, state, stackTop) {
      if (symbol === '(' || symbol === '[' || symbol === '{') {
        return {
          nextState: 'q0',
          operation: 'Push',
          pushValue: symbol,
          rule: `δ(q0, ${symbol}, X) → (q0, ${symbol}X)`
        };
      }

      if (symbol === ')' || symbol === ']' || symbol === '}') {
        const expected = symbol === ')' ? '(' : symbol === ']' ? '[' : '{';
        if (stackTop === expected) {
          return { nextState: 'q0', operation: 'Pop', rule: `δ(q0, ${symbol}, ${expected}) → (q0, ε)` };
        }
        return { error: `mismatch — expected closing for "${stackTop}" before "${symbol}"` };
      }

      return { error: `invalid symbol "${symbol}"` };
    },
    acceptanceCondition: function(stack) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  },

  anbm: {
    name: 'aⁿ bᵐ (n > m)',
    subtitle: 'Pushdown Automaton for the language aⁿ bᵐ where n > m',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: false,
    allowedSymbols: /^[ab]*$/,
    examples: ['aaab', 'aabb', 'aaaab', 'aab'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          const rule = stackTop === 'Z' ? 'δ(q0, a, Z) → (q0, AZ)' : 'δ(q0, a, A) → (q0, AA)';
          return { nextState: 'q0', operation: 'Push', pushValue: 'A', rule };
        }
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q0, b, A) → (q1, ε)' };
          }
          return { error: 'more b\'s than available a\'s' };
        }
      } else if (state === 'q1') {
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q1, b, A) → (q1, ε)' };
          }
          return { error: 'more b\'s than available a\'s' };
        }
        if (symbol === 'a') {
          return { error: 'a\'s must come before b\'s' };
        }
      }

      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack) {
      return stack.length > 1 && stack[0] === 'Z';
    }
  },

  aibjck: {
    name: 'aⁱ bʲ cᵏ (i + j = k)',
    subtitle: 'Pushdown Automaton for the language aⁱ bʲ cᵏ where i + j = k',
    initialState: 'q0',
    stackStart: 'Z',
    allowsEmpty: false,
    allowedSymbols: /^[abc]*$/,
    examples: ['aabbcc', 'abcc', 'aaabbbccc', 'aabbbcccc'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          const rule = stackTop === 'Z' ? 'q0, a, Z) (q0, AZ)' : 'q0, a, A) (q0, AA)';
          return { nextState: 'q0', operation: 'Push', pushValue: 'A', rule };
        }
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q0', operation: 'Push', pushValue: 'B', rule: 'q0, b, A) (q0, BA)' };
          }
          if (stackTop === 'Z') {
            return { nextState: 'q0', operation: 'Push', pushValue: 'B', rule: 'q0, b, Z) (q0, BZ)' };
          }
          return { error: 'invalid transition' };
        }
        if (symbol === 'c') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'q0, c, A) (q1, )' };
          }
          if (stackTop === 'B') {
            return { nextState: 'q1', operation: 'Pop', rule: 'q0, c, B) (q1, )' };
          }
          return { error: 'no a\'s or b\'s to match c\'s' };
        }
        return { error: 'language requires a\'s or b\'s first' };
      }
      if (state === 'q1') {
        if (symbol === 'c') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'q1, c, A) (q1, )' };
          }
          if (stackTop === 'B') {
            return { nextState: 'q1', operation: 'Pop', rule: 'q1, c, B) (q1, )' };
          }
          if (stackTop === 'Z') {
            return { nextState: 'q2', operation: 'None', rule: 'q1, c, Z) (q2, Z)' };
          }
          return { error: 'stack underflow' };
        }
        if (symbol === 'a' || symbol === 'b') {
          return { error: 'a\'s and b\'s must come before c\'s' };
        }
        return { error: 'only c\'s allowed in this section' };
      }
      if (state === 'q2') {
        return { error: 'input should end after matching c\'s' };
      }
      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return (state === 'q2' || (state === 'q1' && index === inputLength)) && stack.length === 1 && stack[0] === 'Z';
    }
  }
};

// ... (rest of the code remains the same)

function updateChips() {
  const container = document.getElementById('chipsContainer');
  const config = pdaConfigs[currentLanguage];
  container.innerHTML = '<span class="label">Try:</span>';

  config.examples.forEach(ex => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = ex;
    btn.onclick = () => setInput(ex);
    container.appendChild(btn);
  });
}

function setInput(val) {
  document.getElementById('inputString').value = val;
}

function changeLanguage() {
  currentLanguage = document.getElementById('languageSelect').value;
  const config = pdaConfigs[currentLanguage];
  document.getElementById('languageSubtitle').textContent = config.subtitle;
  updateChips();
  reset();
}

function setState(s) {
  state = s;
  const badge = document.getElementById('stateBadge');
  const label = document.getElementById('stateLabel');
  badge.className = 'state-badge';
  if (s === 'q1')       badge.classList.add('q1');
  if (s === 'accepted') badge.classList.add('accepted');
  if (s === 'rejected') badge.classList.add('rejected');
  label.textContent = s;
}

function setStatus(msg, cls) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status-bar ' + (cls || '');
}

function setTransition(sym, top, op, next, rule) {
  const config = pdaConfigs[currentLanguage];
  document.getElementById('iLang').textContent  = config.name;
  document.getElementById('iSym').textContent   = sym  || '—';
  document.getElementById('iTop').textContent   = top  || '—';
  document.getElementById('iNext').textContent  = next || '—';
  document.getElementById('iRule').textContent  = rule || '—';

  const opEl = document.getElementById('iOp');
  opEl.textContent = op || '—';
  opEl.className = 'mono op-badge';

  opEl.classList.remove('active-pulse');
  void opEl.offsetWidth;

  if (op === 'Push') {
    opEl.classList.add('push', 'active-pulse');
  } else if (op === 'Pop') {
    opEl.classList.add('pop', 'active-pulse');
  }
}

// ── Stack Rendering ────────────────────────────────────

function renderStack(animateTop, animType, poppedValue) {
  const el = document.getElementById('stack');
  el.innerHTML = '';

  const displaySymbol = (sym) => (sym === 'Z' ? 'Z₀' : sym);

  for (let i = stack.length - 1; i >= 0; i--) {
    const slot = document.createElement('div');
    slot.className = 'stack-slot';

    if (i === stack.length - 1) slot.classList.add('top-slot');
    if (i === 0)                slot.classList.add('bottom-slot');

    if (animateTop && animType === 'push' && i === stack.length - 1) {
      slot.classList.add('anim-push');
    }

    slot.textContent = displaySymbol(stack[i]);
    el.appendChild(slot);
  }

  if (animateTop && animType === 'pop' && poppedValue !== undefined) {
    const slot = document.createElement('div');
    slot.className = 'stack-slot top-slot anim-pop';
    slot.textContent = displaySymbol(poppedValue);
    el.insertBefore(slot, el.firstChild);
  }
}

// ── Tape Rendering ─────────────────────────────────────

function renderTape() {
  const el = document.getElementById('tape');
  el.innerHTML = '';

  for (let i = 0; i < inputStr.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'tape-cell';
    if (i < idx) cell.classList.add('done');
    if (i === idx) cell.classList.add('active');
    cell.textContent = inputStr[i];
    el.appendChild(cell);
  }
}

// ── Acceptance / Rejection ─────────────────────────────

function checkAcceptance() {
  const config = pdaConfigs[currentLanguage];
  if (config.acceptanceCondition(stack, state, idx, inputStr.length, inputStr)) {
    accept();
  } else {
    reject('stack not empty or final state not reached');
  }
}

function accept() {
  const config = pdaConfigs[currentLanguage];
  setState('accepted');
  setStatus(`Accepted ✓ — input for ${config.name} fully consumed and accepted`, 'accepted');
  endSim();
}

function reject(reason) {
  const config = pdaConfigs[currentLanguage];
  setState('rejected');
  setStatus(`Rejected ✗ — ${config.name}: ${reason}`, 'rejected');
  endSim();
}

function endSim() {
  done    = true;
  running = false;
  document.getElementById('btnNext').disabled = true;
}

// ── Core Functions ─────────────────────────────────────

function startSimulation() {
  const config = pdaConfigs[currentLanguage];
  inputStr = document.getElementById('inputString').value.trim();

  if (!inputStr && !config.allowsEmpty) {
    setStatus('Please enter a string first', '');
    return;
  }

  if (!config.allowedSymbols.test(inputStr)) {
    setStatus(`Invalid input — only ${config.allowedSymbols.toString().slice(2, -2)} are allowed`, 'rejected');
    return;
  }

  idx     = 0;
  stack   = [config.stackStart];
  done    = false;
  running = true;

  setState(config.initialState);
  setTransition('—', '—', '—', '—');
  renderStack(false, '');
  renderTape();

  document.getElementById('tape-section').style.display = '';
  document.getElementById('btnNext').disabled = false;
  setStatus(`Simulation for ${config.name} started — click Next Step`, 'started');
}

function nextStep() {
  if (!running || done) return;

  const config = pdaConfigs[currentLanguage];

  if (idx >= inputStr.length) {
    checkAcceptance();
    return;
  }

  const sym = inputStr[idx];
  const top = stack[stack.length - 1];
  const result = config.transitions(sym, state, top, idx, inputStr.length);

  if (result.error) {
    reject(result.error);
    return;
  }

  if (result.operation === 'Push') {
    if (Array.isArray(result.pushValue)) {
      result.pushValue.forEach(v => stack.push(v));
    } else {
      stack.push(result.pushValue);
    }
    renderStack(true, 'push');
    setTransition(sym, top, 'Push', result.nextState, result.rule);
  } else if (result.operation === 'Pop') {
    const popped = stack.pop();
    renderStack(true, 'pop', popped);
    setTransition(sym, popped, 'Pop', result.nextState, result.rule);
  } else {
    setTransition(sym, top, 'None', result.nextState, result.rule);
    renderStack(false, '');
  }

  setState(result.nextState);
  idx++;
  renderTape();

  if (idx >= inputStr.length) {
    setTimeout(checkAcceptance, 320);
  }
}

function updateStack() {
  renderStack(false, '');
}

function reset() {
  const config = pdaConfigs[currentLanguage];
  inputStr = '';
  idx      = 0;
  stack    = [];
  state    = config.initialState;
  running  = false;
  done     = false;

  document.getElementById('inputString').value = '';
  document.getElementById('stack').innerHTML = '';
  document.getElementById('tape').innerHTML = '';
  document.getElementById('tape-section').style.display = 'none';

  setState(config.initialState);
  setTransition('—', '—', '—', '—');
  setStatus('Enter a string and click Start', '');
  document.getElementById('btnNext').disabled = true;
}

// ── Initialization ─────────────────────────────────────
window.onload = () => {
  changeLanguage();
};

// ── State ─────────────────────────────────────────────
let inputStr = '';
let idx      = 0;
let stack    = [];
let state    = 'q0';
let running  = false;
let done     = false;
let currentLanguage = 'anbn';

const pdaConfigs = {
  "anbn": {
    name: "aⁿbⁿ (n ≥ 0)",
    subtitle: "Pushdown Automaton for the language aⁿbⁿ",
    initialState: "q0",
    stackStart: "Z",
    allowedSymbols: /^[ab]*$/,
    examples: ['aaabbb', 'ab', 'aabbb', 'abb'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          const rule = stackTop === 'Z' ? 'δ(q0, a, Z) → (q0, AZ)' : 'δ(q0, a, A) → (q0, AA)';
          return { nextState: 'q0', operation: 'Push', pushValue: 'A', rule: rule };
        } else if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q0, b, A) → (q1, ε)' };
          } else {
            return { error: 'stack underflow — no a was pushed before first b' };
          }
        }
      } else if (state === 'q1') {
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q1, b, A) → (q1, ε)' };
          } else {
            return { error: 'stack underflow — more b\'s than a\'s' };
          }
        } else if (symbol === 'a') {
          return { error: 'invalid symbol "a" in state q1 — a\'s must come before b\'s' };
        }
      }
      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  },

  "anb2n": {
    name: "aⁿb²ⁿ (n ≥ 0)",
    subtitle: "Pushdown Automaton for the language aⁿb²ⁿ",
    initialState: "q0",
    stackStart: "Z",
    allowedSymbols: /^[ab]*$/,
    examples: ['aabbbb', 'abb', 'aaabbbbbb', 'abbb'],
    transitions: function(symbol, state, stackTop) {
      if (state === 'q0') {
        if (symbol === 'a') {
          // Push two A's for each 'a'
          const rule = stackTop === 'Z' ? 'δ(q0, a, Z) → (q0, AAZ)' : 'δ(q0, a, A) → (q0, AAA)';
          return { nextState: 'q0', operation: 'Push', pushValue: ['A', 'A'], rule: rule };
        } else if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q0, b, A) → (q1, ε)' };
          } else {
            return { error: 'stack underflow — no a was pushed before first b' };
          }
        }
      } else if (state === 'q1') {
        if (symbol === 'b') {
          if (stackTop === 'A') {
            return { nextState: 'q1', operation: 'Pop', rule: 'δ(q1, b, A) → (q1, ε)' };
          } else {
            return { error: 'stack underflow — expected more A\'s on stack' };
          }
        } else if (symbol === 'a') {
          return { error: 'invalid symbol "a" in state q1 — a\'s must come before b\'s' };
        }
      }
      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  },

  "parentheses": {
    name: "Balanced Parentheses",
    subtitle: "Pushdown Automaton for Balanced Parentheses",
    initialState: "q0",
    stackStart: "Z",
    allowedSymbols: /^[()]*$/,
    examples: ['(())', '()()', '(()', '())'],
    transitions: function(symbol, state, stackTop) {
      if (symbol === '(') {
        return { nextState: 'q0', operation: 'Push', pushValue: '(', rule: 'δ(q0, (, Z/() → (q0, (Z/((' };
      } else if (symbol === ')') {
        if (stackTop === '(') {
          return { nextState: 'q0', operation: 'Pop', rule: 'δ(q0, ), () → (q0, ε)' };
        } else {
          return { error: 'stack underflow — closing parenthesis without matching open' };
        }
      }
      return { error: `invalid symbol "${symbol}"` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return stack.length === 1 && stack[0] === 'Z';
    }
  },

  "palindrome": {
    name: "Palindrome (w wᴿ)",
    subtitle: "Pushdown Automaton for Palindrome (even length w wᴿ)",
    initialState: "q0",
    stackStart: "Z",
    allowedSymbols: /^[ab]*$/,
    examples: ['abba', 'baab', 'aaaa', 'aba'],
    transitions: function(symbol, state, stackTop, index, inputLength) {
      const mid = inputLength / 2;
      
      if (state === 'q0') {
        if (index < mid) {
          return { nextState: 'q0', operation: 'Push', pushValue: symbol, rule: `δ(q0, ${symbol}, X) → (q0, ${symbol}X)` };
        } else {
          // Switch to popping state at midpoint
          if (symbol === stackTop) {
            return { nextState: 'q1', operation: 'Pop', rule: `δ(q0, ${symbol}, ${symbol}) → (q1, ε)` };
          } else {
            return { error: `mismatch at index ${index}: expected ${stackTop}, got ${symbol}` };
          }
        }
      } else if (state === 'q1') {
        if (symbol === stackTop) {
          return { nextState: 'q1', operation: 'Pop', rule: `δ(q1, ${symbol}, ${symbol}) → (q1, ε)` };
        } else {
          return { error: `mismatch at index ${index}: expected ${stackTop}, got ${symbol}` };
        }
      }
      return { error: `invalid transition for symbol "${symbol}" in state ${state}` };
    },
    acceptanceCondition: function(stack, state, index, inputLength) {
      return stack.length === 1 && stack[0] === 'Z' && inputLength > 0 && inputLength % 2 === 0;
    }
  }
};

// ── Helpers ───────────────────────────────────────────

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
  
  // Remove and re-add pulse animation to trigger it
  opEl.classList.remove('active-pulse');
  void opEl.offsetWidth; // Trigger reflow

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

  // Render current stack from top to bottom
  // Top of stack (last element) should be at the top of the container
  for (let i = stack.length - 1; i >= 0; i--) {
    const slot = document.createElement('div');
    slot.className = 'stack-slot';

    if (i === stack.length - 1) slot.classList.add('top-slot');
    if (i === 0)                slot.classList.add('bottom-slot');

    if (animateTop && animType === 'push' && i === stack.length - 1) {
      slot.classList.add('anim-push');
    }

    slot.textContent = stack[i];
    el.appendChild(slot);
  }

  // Handle Pop animation: show the element that was just removed
  if (animateTop && animType === 'pop' && poppedValue !== undefined) {
    const slot = document.createElement('div');
    slot.className = 'stack-slot top-slot anim-pop';
    slot.textContent = poppedValue;
    // Insert at the very top of the list so it animates out from the top
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
    if (i < idx)  cell.classList.add('done');
    if (i === idx) cell.classList.add('active');
    cell.textContent = inputStr[i];
    el.appendChild(cell);
  }
}

// ── Acceptance / Rejection ─────────────────────────────

function checkAcceptance() {
  const config = pdaConfigs[currentLanguage];
  if (config.acceptanceCondition(stack, state, idx, inputStr.length)) {
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

  if (!inputStr && currentLanguage !== 'anbn' && currentLanguage !== 'anb2n') {
    // Some languages like anbn might allow empty string if n=0
    // but usually we want at least some input to visualize
  }
  
  if (inputStr === "" && (currentLanguage === 'anbn' || currentLanguage === 'anb2n' || currentLanguage === 'parentheses' || currentLanguage === 'palindrome')) {
    // allow empty string for these
  } else if (!inputStr) {
    setStatus('Please enter a string first', '');
    return;
  }

  // Validate symbols
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

  // All input consumed — check acceptance
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

  // Handle operations
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

  // After advancing, check if input is now exhausted
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
  document.getElementById('stack').innerHTML   = '';
  document.getElementById('tape').innerHTML    = '';
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
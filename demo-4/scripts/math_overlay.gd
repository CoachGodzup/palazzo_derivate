class_name MathOverlay
extends Node

# Web-only bridge to a MathLive HTML overlay. On Web it replaces the Godot
# PuzzlePanel: the function is shown as LaTeX and the answer is typed in a real
# MathLive <math-field> with a virtual keyboard. Verification stays in GDScript
# (MathParser), the HTML side only collects input and shows feedback.
#
# Styled after the "Retro 82" theme (demo-3): square panel, orange border,
# Georgia serif headings, #f6dcac text on #05182e background.

signal solved(puzzle: Dictionary)
signal closed

var _puzzle: Dictionary = {}
var _hint_index := 0
var _active := false
var _last_seq := 0
var _injected := false


func _ready() -> void:
	if OS.has_feature("web"):
		_inject()


func open(puzzle: Dictionary) -> void:
	_puzzle = puzzle
	_hint_index = 0
	_active = true
	if not OS.has_feature("web"):
		return
	_inject()
	var js := "window.MathUI.open({title:%s, prompt:%s, func:%s})" % [
		_js_str(str(puzzle.get("name", ""))),
		_js_str(str(puzzle.get("prompt", ""))),
		_js_str(str(puzzle.get("function_latex", ""))),
	]
	JavaScriptBridge.eval(js)


func close() -> void:
	_active = false
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.MathUI.close()")


func _process(_delta: float) -> void:
	if not _active or not OS.has_feature("web"):
		return
	var seq := int(JavaScriptBridge.eval("window.__mlSeq || 0"))
	if seq != _last_seq:
		_last_seq = seq
		_poll()


func _poll() -> void:
	var type := str(JavaScriptBridge.eval("window.__mlType || ''"))
	if type == "submit":
		_on_submit(str(JavaScriptBridge.eval("window.__mlAnswer || ''")))
	elif type == "hint":
		_on_hint()
	elif type == "close":
		_do_close()


func _on_submit(answer: String) -> void:
	var res := MathParser.verify(answer, str(_puzzle.get("derivative_eval", "")))
	if res["ok"]:
		JavaScriptBridge.eval("window.MathUI.setFeedback({ok:true, text:'Esatto, il meccanismo si risveglia...'})")
		JavaScriptBridge.eval("window.MathUI.setSolved()")
		var puzzle := _puzzle
		_active = false
		await get_tree().create_timer(0.9).timeout
		if OS.has_feature("web"):
			JavaScriptBridge.eval("window.MathUI.close()")
		solved.emit(puzzle)
	else:
		var msg := "Non è ancora corretta, riprova."
		match str(res["error"]):
			"empty":
				msg = "Scrivi una derivata prima di verificare."
			"syntax":
				msg = "Espressione non valida: controlla parentesi e operatori."
			"unsupported":
				msg = "Formato non supportato. Usa x, + - * /, ^ e sqrt."
			"domain":
				msg = "Impossibile valutare in alcuni punti (radici o divisioni)."
		JavaScriptBridge.eval("window.MathUI.setFeedback({ok:false, text:%s})" % _js_str(msg))


func _on_hint() -> void:
	var hints: Array = _puzzle.get("hints", [])
	if hints.is_empty() or _hint_index >= hints.size():
		return
	var text := "Indizio %d: %s" % [_hint_index + 1, str(hints[_hint_index])]
	_hint_index += 1
	JavaScriptBridge.eval("window.MathUI.setHint(%s)" % _js_str(text))


func _do_close() -> void:
	_active = false
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.MathUI.close()")
	closed.emit()


func _js_str(s: String) -> String:
	return JSON.stringify(s)


func _inject() -> void:
	if _injected or not OS.has_feature("web"):
		return
	_injected = true
	JavaScriptBridge.eval(JS_OVERLAY)


const JS_OVERLAY := """
(function(){
  if (window.MathUI) return;

  var CSS = ''
    + ':root{color-scheme:dark;'
    + '--r82-bg:#05182e;--r82-bg-darker:#020c17;--r82-bg-dark:#031222;--r82-bg-light:#0a2540;'
    + '--r82-fg:#f6dcac;--r82-accent:#faa968;--r82-muted:#2a6b78;--r82-cyan:#8cbfb8;'
    + '--r82-green:#028391;--r82-red:#f85525;--r82-selection:#134e5a;'
    + '--caret-color:#faa968;--selection-background-color:#134e5a;--selection-color:#f6dcac;'
    + '--keyboard-accent-color:#faa968;--keyboard-background:#031222;--keyboard-border:#0a2540;'
    + '--keycap-background:#0a2540;--keycap-background-hover:#2a6b78;'
    + '--keycap-background-active:#faa968;--keycap-background-pressed:#faa968;'
    + '--keycap-border:#2a6b78;--keycap-border-bottom:#020c17;'
    + '--keycap-text:#f6dcac;--keycap-text-hover:#f6dcac;'
    + '--keycap-text-active:#020c17;--keycap-text-pressed:#020c17;'
    + '--keycap-primary-background:#faa968;--keycap-primary-text:#020c17;'
    + '--keycap-primary-background-hover:#e97b3c;'
    + '--keycap-secondary-background:#2a6b78;--keycap-secondary-text:#f6dcac;'
    + '--variant-panel-background:#031222;}'
    + '#ml-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
    + 'background:rgba(2,12,23,.82);z-index:9999;'
    + 'font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'
    + '#ml-panel{background:radial-gradient(circle at 50% 0,rgba(250,169,104,.1),transparent 55%),#05182e;'
    + 'color:#f6dcac;border:1px solid #faa968;border-radius:0;'
    + 'padding:26px 30px;width:min(620px,94vw);max-height:94vh;overflow:auto;'
    + 'box-shadow:0 30px 120px rgba(0,0,0,.8);position:relative}'
    + '#ml-title{font-family:Georgia,"Times New Roman",serif;font-weight:400;letter-spacing:-.3px;'
    + 'font-size:28px;color:#fff;margin:0 0 2px;padding-right:34px}'
    + '#ml-close{position:absolute;top:12px;right:12px;width:44px;height:44px;background:none;border:0;'
    + 'color:#8cbfb8;font-size:28px;cursor:pointer;line-height:1}'
    + '#ml-close:hover{color:#f6dcac}'
    + '#ml-prompt{margin:4px 0 12px;font-size:14px;color:#8cbfb8;font-family:Georgia,"Times New Roman",serif}'
    + '.ml-row{display:flex;align-items:center;gap:10px;background:#020c17;border:1px solid #2a6b78;'
    + 'border-radius:0;padding:9px 13px;margin:9px 0}'
    + '.ml-row .lbl{font-family:Georgia,"Times New Roman",serif;font-size:17px;color:#faa968;white-space:nowrap}'
    + 'math-field{flex:1;font-size:26px;color:#f6dcac;background:transparent}'
    + 'math-field::part(container){background:transparent}'
    + 'math-field::part(menu-toggle){display:none}'
    + 'math-field::part(virtual-keyboard-toggle){display:none}'
    + '#ml-feedback{min-height:22px;margin:8px 0 2px;font-size:15px;font-family:Georgia,"Times New Roman",serif}'
    + '#ml-hint{min-height:20px;margin:4px 0;font-size:14px;color:#faa968;font-family:Georgia,"Times New Roman",serif}'
    + '.ml-btns{display:flex;gap:8px;margin-top:12px}'
    + '.ml-btns button{flex:1;padding:11px;border-radius:0;font-size:15px;cursor:pointer;'
    + 'font-family:Georgia,"Times New Roman",serif}'
    + '.ml-btns button.primary{border:1px solid #faa968;background:linear-gradient(110deg,#e97b3c,#faa968 55%,#f6dcac);color:#020c17}'
    + '.ml-btns button.secondary{border:1px solid #2a6b78;background:transparent;color:#f6dcac}'
    + '.ml-btns button:hover{filter:brightness(1.08)}'
    + '.ML__keyboard{z-index:10000 !important}';

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.id = 'ml-overlay';
  ov.innerHTML =
    '<div id="ml-panel">' +
      '<h2 id="ml-title"></h2>' +
      '<button id="ml-close" aria-label="Chiudi">×</button>' +
      '<p id="ml-prompt"></p>' +
      '<div class="ml-row"><span class="lbl">f(x) =</span><math-field id="ml-func" read-only></math-field></div>' +
      '<div class="ml-row"><span class="lbl">f′(x) =</span><math-field id="ml-answer" virtual-keyboard-policy="auto"></math-field></div>' +
      '<div id="ml-feedback" role="status"></div>' +
      '<div id="ml-hint"></div>' +
      '<div class="ml-btns">' +
        '<button id="ml-submit" class="primary">Verifica</button>' +
        '<button id="ml-hintbtn" class="secondary">Indizio</button>' +
        '<button id="ml-keyboard" class="secondary">⌨</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  window.__mlSeq = 0;
  window.__mlType = '';
  window.__mlAnswer = '';
  function emit(type, data){
    window.__mlType = type;
    window.__mlAnswer = (data && typeof data.answer === 'string') ? data.answer : '';
    window.__mlSeq++;
  }

  var answer = ov.querySelector('#ml-answer');
  ov.querySelector('#ml-close').addEventListener('click', function(){ emit('close'); });
  ov.querySelector('#ml-submit').addEventListener('click', function(){ emit('submit', {answer: (answer.getValue('ascii-math')||'').trim()}); });
  ov.querySelector('#ml-hintbtn').addEventListener('click', function(){ emit('hint'); });
  ov.querySelector('#ml-keyboard').addEventListener('click', function(){
    if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.visible = !window.mathVirtualKeyboard.visible;
  });
  answer.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); emit('submit', {answer: (answer.getValue('ascii-math')||'').trim()}); }
  });
  ov.addEventListener('click', function(e){ if (e.target === ov) emit('close'); });

  var customLayout = {
    id: 'derivatives-demo',
    label: 'Derivate',
    tooltip: 'Tastiera essenziale per le derivate',
    displayEditToolbar: false,
    rows: [
      [
        { latex: '\\sin', insert: '\\sin(#?)', label: 'sin' },
        { latex: '\\cos', insert: '\\cos(#?)', label: 'cos' },
        { latex: '\\ln', insert: '\\ln(#?)', label: 'ln' },
        { latex: '\\exp', insert: '\\exp(#?)', label: 'exp' },
        { latex: 'e', label: 'e' }
      ],
      [
        { latex: 'x' },
        { latex: 'x^{#?}', label: 'x^', class: 'small' },
        '\\sqrt{#0}',
        '[separator]',
        '[7]', '[8]', '[9]'
      ],
      [
        '[(]', '[)]',
        { latex: '\\frac{#@}{#?}', class: 'small' },
        '[separator]',
        '[4]', '[5]', '[6]'
      ],
      ['\\times', '[/]', '-', '[separator]', '[1]', '[2]', '[3]'],
      [
        '+', '[left]', '[right]',
        '[separator]',
        '[0]', '[.]',
        { label: '[backspace]', class: 'action hide-shift' }
      ]
    ]
  };

  function configureKeyboard(){
    var kb = window.mathVirtualKeyboard;
    if (!kb) return;
    kb.layouts = [customLayout, 'default'];
    if (window.__mlKbBound) return;
    window.__mlKbBound = true;
    function sync(){
      ov.style.paddingBottom = (kb.visible && kb.boundingRect) ? kb.boundingRect.height + 'px' : '';
    }
    kb.addEventListener('virtual-keyboard-toggle', sync);
    kb.addEventListener('geometrychange', sync);
    sync();
  }

  window.MathUI = {
    open: function(p){
      configureKeyboard();
      ov.querySelector('#ml-title').textContent = p.title || '';
      ov.querySelector('#ml-prompt').textContent = p.prompt || '';
      ov.querySelector('#ml-func').setValue(p.func || '');
      answer.setValue('');
      answer.disabled = false;
      ov.querySelector('#ml-submit').disabled = false;
      ov.querySelector('#ml-hintbtn').disabled = false;
      ov.querySelector('#ml-feedback').textContent = '';
      ov.querySelector('#ml-feedback').style.color = '#f6dcac';
      ov.querySelector('#ml-hint').textContent = '';
      ov.style.display = 'flex';
      setTimeout(function(){ answer.focus(); }, 60);
    },
    close: function(){ ov.style.display = 'none'; },
    setFeedback: function(f){
      var el = ov.querySelector('#ml-feedback');
      el.textContent = f.text || '';
      el.style.color = f.ok ? '#8cbfb8' : '#f85525';
    },
    setHint: function(t){ ov.querySelector('#ml-hint').textContent = t || ''; },
    setSolved: function(){
      answer.disabled = true;
      ov.querySelector('#ml-submit').disabled = true;
      ov.querySelector('#ml-hintbtn').disabled = true;
    }
  };
})();
"""

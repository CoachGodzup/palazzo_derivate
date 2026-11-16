class_name PuzzlePanel
extends CanvasLayer

# Exercise UI: shows the function to derive, a free-text input, progressive
# hints and feedback. Emits `solved` when the mock verifier accepts the answer.

signal solved(puzzle: Dictionary)
signal closed

const C_TEXT := Color("f6dcac")
const C_TITLE := Color("ffffff")
const C_SUCCESS := Color("5fd4a5")
const C_ERROR := Color("f85525")
const C_HINT := Color("faa968")
const C_BG := Color("0e2a47")
const C_BG_DIM := Color(0.02, 0.05, 0.09, 0.62)

var _puzzle: Dictionary = {}
var _hint_index := 0

var _panel: PanelContainer
var _title: Label
var _function: Label
var _prompt: Label
var _input: LineEdit
var _feedback: Label
var _hint_label: Label
var _hint_button: Button
var _submit_button: Button
var _close_button: Button


func _ready() -> void:
	layer = 10
	_build_ui()
	hide()


func open(puzzle: Dictionary) -> void:
	_puzzle = puzzle
	_hint_index = 0
	_title.text = str(puzzle.get("name", "Meccanismo"))
	_function.text = str(puzzle.get("function_display", "f(x)"))
	_prompt.text = str(puzzle.get("prompt", "Calcola la derivata f'(x)."))
	_input.text = ""
	_feedback.text = ""
	_feedback.modulate = C_TEXT
	_hint_label.text = "Usa: x, + - * /, ^ (potenza), √ (radice). Esempio: 6*x - 5"
	_hint_button.text = "Indizio (0)"
	_hint_button.disabled = false
	show()
	_input.call_deferred("grab_focus")
	_input.call_deferred("select_all")


func close() -> void:
	hide()
	closed.emit()


func _build_ui() -> void:
	var dim := ColorRect.new()
	dim.color = C_BG_DIM
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(dim)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	_panel = PanelContainer.new()
	_panel.custom_minimum_size = Vector2(600, 0)
	var style := StyleBoxFlat.new()
	style.bg_color = C_BG
	style.corner_radius_top_left = 14
	style.corner_radius_top_right = 14
	style.corner_radius_bottom_left = 14
	style.corner_radius_bottom_right = 14
	style.content_margin_left = 30
	style.content_margin_right = 30
	style.content_margin_top = 24
	style.content_margin_bottom = 24
	_panel.add_theme_stylebox_override("panel", style)
	center.add_child(_panel)

	var margin := MarginContainer.new()
	_panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	margin.add_child(vbox)

	_title = Label.new()
	_title.text = ""
	_title.add_theme_font_size_override("font_size", 26)
	_title.add_theme_color_override("font_color", C_TITLE)
	vbox.add_child(_title)

	_prompt = Label.new()
	_prompt.add_theme_font_size_override("font_size", 17)
	_prompt.add_theme_color_override("font_color", C_TEXT)
	vbox.add_child(_prompt)

	_function = Label.new()
	_function.add_theme_font_size_override("font_size", 30)
	_function.add_theme_color_override("font_color", C_HINT)
	vbox.add_child(_function)

	_input = LineEdit.new()
	_input.placeholder_text = "f'(x) = ..."
	_input.add_theme_font_size_override("font_size", 24)
	_input.custom_minimum_size = Vector2(0, 48)
	vbox.add_child(_input)
	_input.text_submitted.connect(_on_submit)
	_add_keyboard(vbox)

	_feedback = Label.new()
	_feedback.add_theme_font_size_override("font_size", 17)
	_feedback.add_theme_color_override("font_color", C_TEXT)
	vbox.add_child(_feedback)

	_hint_label = Label.new()
	_hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_hint_label.add_theme_font_size_override("font_size", 15)
	_hint_label.add_theme_color_override("font_color", C_HINT)
	vbox.add_child(_hint_label)

	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 10)
	vbox.add_child(buttons)

	_submit_button = Button.new()
	_submit_button.text = "Verifica"
	_submit_button.custom_minimum_size = Vector2(0, 46)
	_submit_button.add_theme_font_size_override("font_size", 18)
	buttons.add_child(_submit_button)
	_submit_button.pressed.connect(_on_submit)

	_hint_button = Button.new()
	_hint_button.text = "Indizio (0)"
	_hint_button.custom_minimum_size = Vector2(0, 46)
	_hint_button.add_theme_font_size_override("font_size", 18)
	buttons.add_child(_hint_button)
	_hint_button.pressed.connect(_on_hint)

	_close_button = Button.new()
	_close_button.text = "Chiudi"
	_close_button.custom_minimum_size = Vector2(0, 46)
	_close_button.add_theme_font_size_override("font_size", 18)
	buttons.add_child(_close_button)
	_close_button.pressed.connect(close)


func _on_submit(_text: String = "") -> void:
	var answer := _input.text
	var res := MathParser.verify(answer, str(_puzzle.get("derivative_eval", "")))
	if res["ok"]:
		_feedback.text = "Esatto! Il meccanismo si e' risvegliato."
		_feedback.modulate = C_SUCCESS
		_input.editable = false
		_submit_button.disabled = true
		_hint_button.disabled = true
		var puzzle := _puzzle
		await get_tree().create_timer(0.9).timeout
		hide()
		solved.emit(puzzle)
	else:
		_feedback.modulate = C_ERROR
		match str(res["error"]):
			"empty":
				_feedback.text = "Scrivi la derivata e premi Invio."
			"syntax":
				_feedback.text = "Espressione non valida: controlla parentesi e operatori."
			"unsupported":
				_feedback.text = "Formato non supportato. Usa x, + - * /, ^ e √."
			"domain":
				_feedback.text = "Impossibile valutare l'espressione in alcuni punti (controlla radici e divisioni)."
			_:
				_feedback.text = "Non e' ancora corretta, riprova."
		_input.grab_focus()


func _on_hint() -> void:
	var hints: Array = _puzzle.get("hints", [])
	if hints.is_empty():
		return
	if _hint_index >= hints.size():
		return
	_hint_label.text = "Indizio " + str(_hint_index + 1) + ": " + str(hints[_hint_index])
	_hint_index += 1
	_hint_button.text = "Indizio (" + str(_hint_index) + ")"
	if _hint_index >= hints.size():
		_hint_button.disabled = true
	_input.grab_focus()


func _add_keyboard(vbox: VBoxContainer) -> void:
	var grid := GridContainer.new()
	grid.columns = 5
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	vbox.add_child(grid)

	var keys := [
		["x", "x"], ["^", "^"], ["√", "√"], ["(", "("], [")", ")"],
		["7", "7"], ["8", "8"], ["9", "9"], ["÷", "/"], ["−", "-"],
		["4", "4"], ["5", "5"], ["6", "6"], ["×", "*"], ["+", "+"],
		["1", "1"], ["2", "2"], ["3", "3"], ["0", "0"], [".", "."],
	]
	for k in keys:
		_kb_button(grid, k[0], k[1])

	var utils := HBoxContainer.new()
	utils.add_theme_constant_override("separation", 6)
	vbox.add_child(utils)
	_kb_button(utils, "⌫", "back")
	_kb_button(utils, "C", "clear")
	_kb_button(utils, "=", "submit")


func _kb_button(parent: Node, label: String, value: String) -> void:
	var b := Button.new()
	b.text = label
	b.custom_minimum_size = Vector2(0, 44)
	b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	b.add_theme_font_size_override("font_size", 18)
	parent.add_child(b)
	b.pressed.connect(_on_key.bind(value))


func _on_key(value: String) -> void:
	match value:
		"submit":
			_on_submit()
			return
		"back":
			var t := _input.text
			if t.length() > 0:
				_input.text = t.substr(0, t.length() - 1)
				_input.caret_column = _input.text.length()
		"clear":
			_input.text = ""
		_:
			_input.insert_text_at_caret(value)
	_input.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		close()

class_name MobileControls
extends CanvasLayer

# Touch interface for phones and tablets: a virtual stick on the left for
# movement, a drag-to-look area over the rest of the screen and an
# "Interagisci" button on the right. The whole layer is hidden while the
# derivative popup is open, so the exercise gets the full screen.
#
# The layer is only shown on touch devices. For desktop testing pass
# `--touch` on the command line or open the Web build with `?touch=1`.

signal move_by(axis: Vector2)        # x: right, y: forward (up = +1)
signal look_by(relative: Vector2)    # drag delta in pixels
signal interact_pressed

const STICK_RADIUS := 78.0
const STICK_MARGIN := 30.0
const KNOB_SIZE := 62.0
const DEAD_ZONE := 0.15

const C_CREAM := Color("f6dcac")
const C_ORANGE := Color("faa968")
const C_TEAL := Color("8cbfb8")
const C_BG := Color(0.02, 0.09, 0.16, 0.52)

var is_touch := false

var _stick_touch := -1
var _look_touch := -1
var _mouse_look := false
var _stick_mouse := false
var _knob_offset := Vector2.ZERO

var _stick: Control
var _knob: Panel
var _look_area: Control
var _interact: Button
var _rotate: Control


func _ready() -> void:
	layer = 4
	is_touch = _detect_touch()
	_build()
	visible = false
	get_viewport().size_changed.connect(_update_orientation)


# --- public API ------------------------------------------------------------

func set_gameplay_visible(value: bool) -> void:
	visible = value and is_touch
	if visible:
		_update_orientation()


func set_interact_ready(ready: bool) -> void:
	if _interact == null:
		return
	_interact.add_theme_stylebox_override("normal", _pill_style(C_ORANGE if ready else Color(0.06, 0.22, 0.29, 0.72), true if ready else false))
	_interact.add_theme_stylebox_override("hover", _pill_style(C_ORANGE, true))
	_interact.add_theme_stylebox_override("pressed", _pill_style(Color("e97b3c"), true))
	_interact.add_theme_color_override("font_color", Color("020c17") if ready else C_CREAM)
	_interact.add_theme_color_override("font_hover_color", Color("020c17"))
	_interact.add_theme_color_override("font_pressed_color", Color("020c17"))


# --- build -----------------------------------------------------------------

func _build() -> void:
	_build_look_area()
	_build_stick()
	_build_interact()
	_build_rotate_hint()


func _build_look_area() -> void:
	# Full-screen transparent catcher, added first so the stick and the button
	# (added later) sit on top and win the touch.
	_look_area = Control.new()
	_look_area.name = "LookArea"
	_look_area.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_look_area.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_look_area)
	_look_area.gui_input.connect(_on_look_gui_input)


func _build_stick() -> void:
	_stick = Control.new()
	_stick.name = "Stick"
	_stick.anchor_left = 0.0
	_stick.anchor_right = 0.0
	_stick.anchor_top = 1.0
	_stick.anchor_bottom = 1.0
	_stick.offset_left = STICK_MARGIN
	_stick.offset_right = STICK_MARGIN + STICK_RADIUS * 2.0
	_stick.offset_top = -(STICK_RADIUS * 2.0 + STICK_MARGIN)
	_stick.offset_bottom = -STICK_MARGIN
	_stick.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_stick)
	_stick.gui_input.connect(_on_stick_gui_input)

	var base := Panel.new()
	base.name = "Base"
	base.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	base.mouse_filter = Control.MOUSE_FILTER_IGNORE
	base.add_theme_stylebox_override("panel", _circle_style(C_BG, Color(0.55, 0.75, 0.72, 0.45), int(STICK_RADIUS)))
	_stick.add_child(base)

	# Small cardinal marks to read the stick direction at a glance.
	for mark in [Vector2(0, -1), Vector2(1, 0), Vector2(0, 1), Vector2(-1, 0)]:
		var dot := Panel.new()
		dot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		dot.size = Vector2(6, 6)
		dot.position = Vector2(STICK_RADIUS, STICK_RADIUS) + mark * (STICK_RADIUS - 16.0) - Vector2(3, 3)
		dot.add_theme_stylebox_override("panel", _circle_style(Color(0.55, 0.75, 0.72, 0.5), Color(0, 0, 0, 0), 3))
		_stick.add_child(dot)

	_knob = Panel.new()
	_knob.name = "Knob"
	_knob.size = Vector2(KNOB_SIZE, KNOB_SIZE)
	_knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_knob.add_theme_stylebox_override("panel", _circle_style(Color(0.98, 0.66, 0.41, 0.9), C_CREAM, int(KNOB_SIZE * 0.5)))
	_stick.add_child(_knob)
	_center_knob()


func _build_interact() -> void:
	_interact = Button.new()
	_interact.name = "Interact"
	_interact.text = "Interagisci"
	_interact.focus_mode = Control.FOCUS_NONE
	_interact.anchor_left = 1.0
	_interact.anchor_right = 1.0
	_interact.anchor_top = 1.0
	_interact.anchor_bottom = 1.0
	_interact.offset_left = -250.0
	_interact.offset_right = -30.0
	_interact.offset_top = -132.0
	_interact.offset_bottom = -42.0
	_interact.add_theme_font_size_override("font_size", 22)
	add_child(_interact)
	_interact.pressed.connect(func() -> void: interact_pressed.emit())
	set_interact_ready(false)


func _build_rotate_hint() -> void:
	# Cover the screen in portrait, where the courtyard is unplayable.
	_rotate = ColorRect.new()
	_rotate.name = "RotateHint"
	_rotate.color = Color("05182e")
	_rotate.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_rotate.mouse_filter = Control.MOUSE_FILTER_STOP
	_rotate.visible = false
	add_child(_rotate)

	var label := Label.new()
	label.text = "Ruota il telefono\nin orizzontale per giocare"
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 48)
	label.add_theme_color_override("font_color", C_CREAM)
	_rotate.add_child(label)


func _update_orientation() -> void:
	if _rotate == null or not is_touch:
		return
	var vp := get_viewport().get_visible_rect().size
	_rotate.visible = visible and vp.y > vp.x


# --- stick -----------------------------------------------------------------

func _on_stick_gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and _stick_touch == -1:
			_stick_touch = event.index
			_apply_stick(event.position)
			_stick.accept_event()
		elif not event.pressed and event.index == _stick_touch:
			_stick_touch = -1
			_release_stick()
			_stick.accept_event()
	elif event is InputEventScreenDrag and event.index == _stick_touch:
		_apply_stick(event.position)
		_stick.accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.device == InputEvent.DEVICE_ID_EMULATION:
			return
		_stick_mouse = event.pressed
		if event.pressed:
			_apply_stick(event.position)
		else:
			_release_stick()
	elif event is InputEventMouseMotion and _stick_mouse and event.device != InputEvent.DEVICE_ID_EMULATION:
		_apply_stick(event.position)


func _apply_stick(local_pos: Vector2) -> void:
	var center := Vector2(STICK_RADIUS, STICK_RADIUS)
	var delta := local_pos - center
	if delta.length() > STICK_RADIUS:
		delta = delta.normalized() * STICK_RADIUS
	_knob_offset = delta
	_knob.position = center - Vector2(KNOB_SIZE, KNOB_SIZE) * 0.5 + delta

	var axis := delta / STICK_RADIUS
	if axis.length() < DEAD_ZONE:
		axis = Vector2.ZERO
	else:
		axis = axis.limit_length(1.0)
	move_by.emit(axis)


func _release_stick() -> void:
	_center_knob()
	move_by.emit(Vector2.ZERO)


func _center_knob() -> void:
	_knob_offset = Vector2.ZERO
	if _knob:
		_knob.position = Vector2(STICK_RADIUS, STICK_RADIUS) - Vector2(KNOB_SIZE, KNOB_SIZE) * 0.5


# --- look ------------------------------------------------------------------

func _on_look_gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			if _look_touch == -1:
				_look_touch = event.index
				_look_area.accept_event()
		elif event.index == _look_touch:
			_look_touch = -1
			_look_area.accept_event()
	elif event is InputEventScreenDrag and event.index == _look_touch:
		look_by.emit(event.relative)
		_look_area.accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.device != InputEvent.DEVICE_ID_EMULATION:
			_mouse_look = event.pressed
	elif event is InputEventMouseMotion and _mouse_look and event.device != InputEvent.DEVICE_ID_EMULATION:
		look_by.emit(event.relative)


# --- helpers ---------------------------------------------------------------

func _pill_style(bg: Color, bright: bool) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = C_CREAM if bright else Color(0.55, 0.75, 0.72, 0.55)
	s.set_border_width_all(2)
	s.set_corner_radius_all(24)
	s.content_margin_left = 18
	s.content_margin_right = 18
	return s


func _circle_style(bg: Color, border: Color, radius: int) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(2)
	s.set_corner_radius_all(radius)
	return s


func _detect_touch() -> bool:
	if OS.get_cmdline_user_args().has("--touch") or OS.get_cmdline_args().has("--touch"):
		return true
	if OS.has_feature("web"):
		var js := """
		(function(){
			try {
				var q = new URLSearchParams(window.location.search);
				if (q.has('touch')) return q.get('touch') !== '0' ? 1 : 0;
				var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
				return (coarse || navigator.maxTouchPoints > 0) ? 1 : 0;
			} catch (e) { return 0; }
		})()
		"""
		return int(JavaScriptBridge.eval(js)) == 1
	return DisplayServer.is_touchscreen_available() or OS.has_feature("mobile")

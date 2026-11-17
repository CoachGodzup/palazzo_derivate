class_name MobileControls
extends CanvasLayer

# Touch interface for phones and tablets: twin virtual sticks (left = move,
# right = look), a drag-to-look area on the remaining screen and an
# "Interagisci" button. The whole layer is hidden while the derivative popup is
# open, so the exercise gets the full screen.
#
# The layer is only shown on touch devices. For desktop testing pass
# `--touch` on the command line or open the Web build with `?touch=1`.

signal move_by(axis: Vector2)        # x: right, y: forward (up = +1)
signal look_by(relative: Vector2)    # look delta in pixels
signal interact_pressed

const STICK_RADIUS := 78.0
const LOOK_STICK_RADIUS := 68.0
const STICK_MARGIN := 30.0
const KNOB_SIZE := 62.0
const LOOK_KNOB_SIZE := 54.0
const DEAD_ZONE := 0.15
const LOOK_DEAD_ZONE := 0.12
# Pixels per second of look at full stick tilt. Player.apply_look turns the
# delta into radians with TOUCH_SENSITIVITY, so this stays consistent with the
# drag-to-look sensitivity.
const LOOK_RATE := 460.0

const C_CREAM := Color("f6dcac")
const C_ORANGE := Color("faa968")
const C_TEAL := Color("8cbfb8")
const C_BG := Color(0.02, 0.09, 0.16, 0.52)

var is_touch := false

var _stick_touch := -1
var _look_stick_touch := -1
var _look_touch := -1
var _mouse_look := false
var _stick_mouse := false
var _look_stick_mouse := false
var _look_axis := Vector2.ZERO

var _stick: Control
var _knob: Panel
var _look_stick: Control
var _look_knob: Panel
var _look_area: Control
var _interact: Button
var _rotate: Control


func _ready() -> void:
	layer = 4
	is_touch = _detect_touch()
	_build()
	visible = false
	get_viewport().size_changed.connect(_update_orientation)


func _process(delta: float) -> void:
	if _look_axis == Vector2.ZERO or not visible:
		return
	# `look_by` expects a drag delta (+y downward, like the mouse); the stick
	# uses +y upward, so flip it before applying the rotation.
	look_by.emit(Vector2(_look_axis.x, -_look_axis.y) * LOOK_RATE * delta)


# --- public API ------------------------------------------------------------

func set_gameplay_visible(value: bool) -> void:
	visible = value and is_touch
	if not visible:
		_release_stick()
		_release_look_stick()
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
	_stick = _build_stick("MoveStick", STICK_RADIUS, KNOB_SIZE, false, "MUOVI", C_ORANGE)
	_knob = _stick.get_node("Knob") as Panel
	_stick.gui_input.connect(_on_stick_gui_input)
	_look_stick = _build_stick(
		"LookStick", LOOK_STICK_RADIUS, LOOK_KNOB_SIZE, true, "GUARDA", C_TEAL
	)
	_look_knob = _look_stick.get_node("Knob") as Panel
	_look_stick.gui_input.connect(_on_look_stick_gui_input)
	_build_interact()
	_build_rotate_hint()


func _build_look_area() -> void:
	# Full-screen transparent catcher, added first so the sticks and the button
	# (added later) sit on top and win their touches. Dragging elsewhere remains
	# a quick way to look around.
	_look_area = Control.new()
	_look_area.name = "LookArea"
	_look_area.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_look_area.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_look_area)
	_look_area.gui_input.connect(_on_look_gui_input)


func _build_stick(
	name: String,
	radius: float,
	knob_size: float,
	from_right: bool,
	caption: String,
	knob_color: Color
) -> Control:
	var stick := Control.new()
	stick.name = name
	stick.anchor_top = 1.0
	stick.anchor_bottom = 1.0
	if from_right:
		stick.anchor_left = 1.0
		stick.anchor_right = 1.0
		stick.offset_left = -(radius * 2.0 + STICK_MARGIN)
		stick.offset_right = -STICK_MARGIN
	else:
		stick.anchor_left = 0.0
		stick.anchor_right = 0.0
		stick.offset_left = STICK_MARGIN
		stick.offset_right = STICK_MARGIN + radius * 2.0
	stick.offset_top = -(radius * 2.0 + STICK_MARGIN)
	stick.offset_bottom = -STICK_MARGIN
	stick.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(stick)

	var base := Panel.new()
	base.name = "Base"
	base.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	base.mouse_filter = Control.MOUSE_FILTER_IGNORE
	base.add_theme_stylebox_override("panel", _circle_style(C_BG, Color(0.55, 0.75, 0.72, 0.45), int(radius)))
	stick.add_child(base)

	# Small cardinal marks to read the stick direction at a glance.
	for mark in [Vector2(0, -1), Vector2(1, 0), Vector2(0, 1), Vector2(-1, 0)]:
		var dot := Panel.new()
		dot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		dot.size = Vector2(6, 6)
		dot.position = Vector2(radius, radius) + mark * (radius - 16.0) - Vector2(3, 3)
		dot.add_theme_stylebox_override("panel", _circle_style(Color(0.55, 0.75, 0.72, 0.5), Color(0, 0, 0, 0), 3))
		stick.add_child(dot)

	var knob := Panel.new()
	knob.name = "Knob"
	knob.size = Vector2(knob_size, knob_size)
	knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
	knob.add_theme_stylebox_override(
		"panel",
		_circle_style(Color(knob_color.r, knob_color.g, knob_color.b, 0.9), C_CREAM, int(knob_size * 0.5))
	)
	stick.add_child(knob)
	_center_knob(stick, knob, radius)

	var label := Label.new()
	label.name = "Caption"
	label.text = caption
	label.position = Vector2(0, -24)
	label.size = Vector2(radius * 2.0, 18)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 12)
	label.add_theme_color_override("font_color", C_TEAL)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stick.add_child(label)

	return stick


func _build_interact() -> void:
	_interact = Button.new()
	_interact.name = "Interact"
	_interact.text = "Interagisci"
	_interact.focus_mode = Control.FOCUS_NONE
	_interact.anchor_left = 0.5
	_interact.anchor_right = 0.5
	_interact.anchor_top = 1.0
	_interact.anchor_bottom = 1.0
	_interact.offset_left = -110.0
	_interact.offset_right = 110.0
	_interact.offset_top = -100.0
	_interact.offset_bottom = -36.0
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


# --- move stick ------------------------------------------------------------

func _on_stick_gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and _stick_touch == -1:
			_stick_touch = event.index
			move_by.emit(_apply_stick(_stick, _knob, event.position))
			_stick.accept_event()
		elif not event.pressed and event.index == _stick_touch:
			_stick_touch = -1
			_release_stick()
			_stick.accept_event()
	elif event is InputEventScreenDrag and event.index == _stick_touch:
		move_by.emit(_apply_stick(_stick, _knob, event.position))
		_stick.accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.device == InputEvent.DEVICE_ID_EMULATION:
			return
		_stick_mouse = event.pressed
		if event.pressed:
			move_by.emit(_apply_stick(_stick, _knob, event.position))
		else:
			_release_stick()
	elif event is InputEventMouseMotion and _stick_mouse and event.device != InputEvent.DEVICE_ID_EMULATION:
		move_by.emit(_apply_stick(_stick, _knob, event.position))


func _release_stick() -> void:
	_center_knob(_stick, _knob, _stick.size.x * 0.5)
	move_by.emit(Vector2.ZERO)


# --- look stick ------------------------------------------------------------

func _on_look_stick_gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and _look_stick_touch == -1:
			_look_stick_touch = event.index
			_look_axis = _apply_stick(_look_stick, _look_knob, event.position)
			_look_stick.accept_event()
		elif not event.pressed and event.index == _look_stick_touch:
			_look_stick_touch = -1
			_release_look_stick()
			_look_stick.accept_event()
	elif event is InputEventScreenDrag and event.index == _look_stick_touch:
		_look_axis = _apply_stick(_look_stick, _look_knob, event.position)
		_look_stick.accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.device == InputEvent.DEVICE_ID_EMULATION:
			return
		_look_stick_mouse = event.pressed
		if event.pressed:
			_look_axis = _apply_stick(_look_stick, _look_knob, event.position)
		else:
			_release_look_stick()
	elif event is InputEventMouseMotion and _look_stick_mouse and event.device != InputEvent.DEVICE_ID_EMULATION:
		_look_axis = _apply_stick(_look_stick, _look_knob, event.position)


func _release_look_stick() -> void:
	_look_axis = Vector2.ZERO
	_center_knob(_look_stick, _look_knob, _look_stick.size.x * 0.5)


# --- drag look -------------------------------------------------------------

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


# --- stick math ------------------------------------------------------------

func _apply_stick(stick: Control, knob: Panel, local_pos: Vector2) -> Vector2:
	var radius := stick.size.x * 0.5
	var center := Vector2(radius, radius)
	var delta := local_pos - center
	if delta.length() > radius:
		delta = delta.normalized() * radius
	knob.position = center - knob.size * 0.5 + delta
	return stick_axis(delta, radius)


static func stick_axis(delta: Vector2, radius: float) -> Vector2:
	# Screen coordinates have +y downward; joystick axis uses +y upward so the
	# player can map forward to local -Z without surprises.
	var raw := delta / radius
	if raw.length() < DEAD_ZONE:
		return Vector2.ZERO
	return Vector2(raw.x, -raw.y).limit_length(1.0)


func _center_knob(stick: Control, knob: Panel, radius: float) -> void:
	if knob == null:
		return
	knob.position = Vector2(radius, radius) - knob.size * 0.5


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

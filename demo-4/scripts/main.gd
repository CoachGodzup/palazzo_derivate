class_name Main
extends Node3D

# Room composition and game state. Builds the low-poly courtyard, the player,
# the four mechanisms and the central fountain, and wires the puzzle UI.

const SAVE_PATH := "user://demo4_save.json"
const SAVE_VERSION := "demo-4.0"

var _puzzles: Array = []
var _mechanisms: Array = []
var _solved_ids: Array = []

var _player: Player
var _fountain: Fountain
var _panel: PuzzlePanel
var _overlay: MathOverlay
var _active_mechanism: Mechanism = null

var _hud: CanvasLayer
var _prompt_label: Label
var _counter_label: Label
var _banner_label: Label
var _intro: CanvasLayer

var _center := Vector3.ZERO


func _ready() -> void:
	_load_puzzles()
	_build_environment()
	_build_room()
	_fountain = Fountain.new()
	_fountain.position = _center
	add_child(_fountain)
	_build_player()
	_build_mechanisms()
	if OS.has_feature("web"):
		_overlay = MathOverlay.new()
		add_child(_overlay)
		_overlay.solved.connect(_on_panel_solved)
		_overlay.closed.connect(_on_panel_closed)
	else:
		_panel = PuzzlePanel.new()
		add_child(_panel)
		_panel.solved.connect(_on_panel_solved)
		_panel.closed.connect(_on_panel_closed)
	_build_hud()
	_build_intro()
	_load_save()
	_update_counter()
	_player.set_can_move(false)
	_intro.visible = true
	_setup_web_pointer_lock()


func _setup_web_pointer_lock() -> void:
	if not OS.has_feature("web"):
		return
	# Request pointer lock directly inside the browser's click event (a real user
	# gesture), which strict browsers (Safari) require. Godot's deferred request
	# can fall outside the gesture window and be silently rejected.
	JavaScriptBridge.eval("""
	window.__lockRequested = true;
	document.addEventListener('click', function(){
		if (!window.__lockRequested) return;
		var c = document.querySelector('canvas');
		if (c && document.pointerLockElement !== c) {
			try { c.requestPointerLock(); } catch (e) {}
		}
	});
	""")


func _process(_delta: float) -> void:
	var target := _player.get_interact_target()
	if target is Mechanism and not target.is_solved:
		_prompt_label.text = "E · " + str(target.puzzle.get("name", "Meccanismo"))
		_prompt_label.visible = true
	elif target is Fountain and not _fountain.is_active:
		_prompt_label.text = "La fontana attende che i quattro meccanismi si risveglino..."
		_prompt_label.visible = true
	else:
		_prompt_label.visible = false


# ---- construction ---------------------------------------------------------

func _load_puzzles() -> void:
	var f := FileAccess.open("res://data/puzzles.json", FileAccess.READ)
	if f == null:
		push_error("puzzles.json non trovato")
		return
	var data = JSON.parse_string(f.get_as_text())
	if data == null:
		push_error("puzzles.json non valido")
		return
	_puzzles = data.get("puzzles", [])


func _build_environment() -> void:
	var env_node := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var sky_mat := ShaderMaterial.new()
	sky_mat.shader = load("res://assets/shaders/sunset_sky.gdshader")
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.5
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env_node.environment = env
	add_child(env_node)

	# Low, warm sunset sun casting long shadows across the court.
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-14, 45, 0)
	sun.light_color = Color("ff9d5c")
	sun.light_energy = 1.05
	sun.shadow_enabled = true
	add_child(sun)

	# Cool fill from the zenith keeps the shaded side readable.
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-80, -120, 0)
	fill.light_color = Color("9db8e8")
	fill.light_energy = 0.15
	fill.shadow_enabled = false
	add_child(fill)


func _build_room() -> void:
	var r := 6.0
	var wall_h := 3.2
	var t := 0.3
	# Invisible collision shell: physics stays on plain boxes while the visible
	# palace geometry comes from the imported CC0 models.
	Geometry.collision_box(self, Vector3(r * 2.0, 0.2, r * 2.0), Vector3(0, -0.1, 0))
	Geometry.collision_box(self, Vector3(r * 2.0, wall_h, t), Vector3(0, wall_h / 2.0, -r))
	Geometry.collision_box(self, Vector3(r * 2.0, wall_h, t), Vector3(0, wall_h / 2.0, r))
	Geometry.collision_box(self, Vector3(t, wall_h, r * 2.0), Vector3(-r, wall_h / 2.0, 0))
	Geometry.collision_box(self, Vector3(t, wall_h, r * 2.0), Vector3(r, wall_h / 2.0, 0))
	for sx in [-1, 1]:
		for sz in [-1, 1]:
			Geometry.collision_box(self, Vector3(0.5, wall_h, 0.5), Vector3(sx * (r - 0.28), wall_h / 2.0, sz * (r - 0.28)))

	_build_floor()
	_build_walls()
	_build_lights()
	_build_props()


func _model_path(model_name: String) -> String:
	return "res://assets/models/" + model_name + ".glb"


func _build_floor() -> void:
	# Zellige-style paving: a 4x4 grid of 3 m tiles over the flat collision box.
	for gx in range(4):
		for gz in range(4):
			var x := -4.5 + gx * 3.0
			var z := -4.5 + gz * 3.0
			Geometry.model(self, _model_path("courtyard-paving-m-d4922e1f"), Vector3(x, 0.0, z))


func _build_walls() -> void:
	# A colonnade rings the room: pointed-arch arcade bays face the courtyard,
	# a low boundary wall closes the outer side behind them. Physics stays on the
	# invisible collision boxes built in _build_room().
	var span := [-4.5, -1.5, 1.5, 4.5]
	var arcade_z := 4.49   # walkway centre; arch opens inward at ~2.92
	var wall_z := 6.0
	for x in span:
		Geometry.model(self, _model_path("courtyard-arcade-b-5ae70c52"), Vector3(x, 0.0, -arcade_z), 0.0)
		Geometry.model(self, _model_path("courtyard-arcade-b-5ae70c52"), Vector3(x, 0.0, arcade_z), 180.0)
		Geometry.model(self, _model_path("boundary-wall-run-08203b0a"), Vector3(x, 0.0, -wall_z), 0.0)
		Geometry.model(self, _model_path("boundary-wall-run-08203b0a"), Vector3(x, 0.0, wall_z), 180.0)
	for z in span:
		Geometry.model(self, _model_path("courtyard-arcade-b-5ae70c52"), Vector3(arcade_z, 0.0, z), -90.0)
		Geometry.model(self, _model_path("courtyard-arcade-b-5ae70c52"), Vector3(-arcade_z, 0.0, z), 90.0)
		Geometry.model(self, _model_path("boundary-wall-run-08203b0a"), Vector3(wall_z, 0.0, z), -90.0)
		Geometry.model(self, _model_path("boundary-wall-run-08203b0a"), Vector3(-wall_z, 0.0, z), 90.0)


func _build_lights() -> void:
	# Wall lanterns (one per wall) with warm point lights.
	var lanterns := [
		{"pos": Vector3(0.0, 2.6, -5.62), "yaw": 0.0},
		{"pos": Vector3(0.0, 2.6, 5.62), "yaw": 180.0},
		{"pos": Vector3(5.62, 2.6, 0.0), "yaw": -90.0},
		{"pos": Vector3(-5.62, 2.6, 0.0), "yaw": 90.0},
	]
	for lantern in lanterns:
		var pos: Vector3 = lantern["pos"]
		var yaw: float = lantern["yaw"]
		Geometry.model(self, _model_path("wall-lantern-brack-efd95d2d"), pos, yaw)
		var glow := pos.move_toward(Vector3.ZERO, 0.6)
		glow.y = pos.y
		_add_warm_light(glow, 1.5, 7.0)

	# Standing lamps in the rear corners.
	for x in [-4.0, 4.0]:
		Geometry.model(self, _model_path("standing-lamp-628d08e8"), Vector3(x, 0.0, -4.0))
		_add_warm_light(Vector3(x, 1.8, -4.0), 1.4, 6.0)


func _add_warm_light(pos: Vector3, energy: float, range_m: float) -> void:
	var light := OmniLight3D.new()
	light.light_color = Color("ffb36b")
	light.light_energy = energy
	light.omni_range = range_m
	light.shadow_enabled = false
	light.position = pos
	add_child(light)


func _build_props() -> void:
	# Sundial in the courtyard (thematic: La Corte delle Meridiane).
	Geometry.model(self, _model_path("courtyard-sundial-2988e4e8"), Vector3(-2.2, 0.0, -1.6), 30.0)
	# Seating nook against the south wall (clear of the hourglass mechanism).
	Geometry.model(self, _model_path("floor-cushion-set-25ee916f"), Vector3(-2.3, 0.0, 3.7), -20.0)
	Geometry.model(self, _model_path("floor-cushion-set-25ee916f"), Vector3(2.0, 0.0, 4.0), 25.0)
	Geometry.model(self, _model_path("folding-screen-sta-bfa8905d"), Vector3(-4.3, 0.0, 2.4), 60.0)
	# Study corner near the north-west.
	Geometry.model(self, _model_path("book-chest-c1c6462c"), Vector3(-3.6, 0.0, -2.9), -30.0)
	Geometry.model(self, _model_path("low-study-desk-68f899d4"), Vector3(-2.4, 0.0, -3.5), 15.0)
	# Water runnels feeding the central fountain.
	Geometry.model(self, _model_path("water-channel-runn-2ea19fd7"), Vector3(3.0, 0.0, 0.0), 90.0)
	Geometry.model(self, _model_path("water-channel-runn-2ea19fd7"), Vector3(-3.0, 0.0, 0.0), 90.0)


func _build_player() -> void:
	_player = Player.new()
	_player.position = Vector3(0, 0.05, 2.4)

	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.4
	cap.height = 1.8
	col.shape = cap
	col.position = Vector3(0, 0.9, 0)
	_player.add_child(col)

	var cam := Camera3D.new()
	cam.name = "Camera3D"
	cam.position = Vector3(0, 1.6, 0)
	cam.current = true
	cam.fov = 75.0
	_player.add_child(cam)

	var ray := RayCast3D.new()
	ray.name = "InteractRay"
	ray.target_position = Vector3(0, 0, -5.0)
	ray.collide_with_areas = false
	ray.collide_with_bodies = true
	ray.add_exception(_player)
	cam.add_child(ray)

	add_child(_player)


func _build_mechanisms() -> void:
	var positions := [
		Vector3(0, 1.4, -5.3),    # nord: sigillo
		Vector3(5.3, 1.4, 0),     # est: ingranaggi
		Vector3(0, 1.4, 5.3),     # sud: clessidra
		Vector3(-5.3, 1.4, 0),    # ovest: porta
	]
	for i in range(_puzzles.size()):
		var mech := Mechanism.new()
		mech.setup(_puzzles[i])
		mech.position = positions[i]
		var dir := (_center - mech.position).normalized()
		mech.rotation_degrees.y = rad_to_deg(atan2(dir.x, dir.z))
		add_child(mech)
		mech.puzzle_requested.connect(_on_puzzle_requested.bind(mech))
		mech.solved.connect(_on_mechanism_solved.bind(mech))
		_mechanisms.append(mech)


# ---- HUD & intro ----------------------------------------------------------

func _build_hud() -> void:
	_hud = CanvasLayer.new()
	add_child(_hud)

	var cross_center := CenterContainer.new()
	cross_center.set_anchors_preset(Control.PRESET_FULL_RECT)
	cross_center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(cross_center)
	var cross := Label.new()
	cross.text = "+"
	cross.add_theme_font_size_override("font_size", 26)
	cross.add_theme_color_override("font_color", Color(1, 1, 1, 0.55))
	cross_center.add_child(cross)

	_prompt_label = Label.new()
	_prompt_label.anchor_left = 0.5
	_prompt_label.anchor_right = 0.5
	_prompt_label.anchor_top = 0.82
	_prompt_label.anchor_bottom = 0.82
	_prompt_label.offset_left = -340
	_prompt_label.offset_right = 340
	_prompt_label.offset_top = 0
	_prompt_label.offset_bottom = 36
	_prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_prompt_label.add_theme_font_size_override("font_size", 18)
	_prompt_label.add_theme_color_override("font_color", Color("f6dcac"))
	_prompt_label.visible = false
	_hud.add_child(_prompt_label)

	_counter_label = Label.new()
	_counter_label.offset_left = 20
	_counter_label.offset_top = 16
	_counter_label.offset_right = 320
	_counter_label.offset_bottom = 48
	_counter_label.add_theme_font_size_override("font_size", 18)
	_counter_label.add_theme_color_override("font_color", Color("f6dcac"))
	_hud.add_child(_counter_label)

	_banner_label = Label.new()
	_banner_label.anchor_left = 0.5
	_banner_label.anchor_right = 0.5
	_banner_label.anchor_top = 0.3
	_banner_label.anchor_bottom = 0.3
	_banner_label.offset_left = -400
	_banner_label.offset_right = 400
	_banner_label.offset_top = 0
	_banner_label.offset_bottom = 70
	_banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner_label.add_theme_font_size_override("font_size", 40)
	_banner_label.add_theme_color_override("font_color", Color("5fd4a5"))
	_banner_label.text = "La fontana si e' risvegliata"
	_banner_label.modulate = Color(1, 1, 1, 0)
	_banner_label.visible = false
	_hud.add_child(_banner_label)


func _build_intro() -> void:
	_intro = CanvasLayer.new()
	_intro.layer = 5
	add_child(_intro)

	var dim := ColorRect.new()
	dim.color = Color(2.0 / 255.0, 12.0 / 255.0, 23.0 / 255.0, 0.82)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_intro.add_child(dim)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_intro.add_child(center)

	var serif := _load_serif_font()

	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color("05182e")
	style.border_color = Color("faa968")
	style.set_border_width_all(1)
	style.content_margin_left = 32
	style.content_margin_right = 32
	style.content_margin_top = 28
	style.content_margin_bottom = 28
	panel.add_theme_stylebox_override("panel", style)
	panel.custom_minimum_size = Vector2(620, 0)
	center.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 14)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "La Corte delle Meridiane"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", Color("ffffff"))
	if serif:
		title.add_theme_font_override("font", serif)
	vbox.add_child(title)

	var body := Label.new()
	body.text = "Esplora la stanza e interagisci con i quattro meccanismi (tasto E o clic).\nCalcola la derivata richiesta: risolvili tutti per risvegliare la fontana al centro.\n\nWASD / frecce per muoverti · mouse per guardare · Esc per il mouse."
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_theme_font_size_override("font_size", 15)
	body.add_theme_color_override("font_color", Color("8cbfb8"))
	if serif:
		body.add_theme_font_override("font", serif)
	vbox.add_child(body)

	var start := Button.new()
	start.text = "Inizia"
	start.custom_minimum_size = Vector2(0, 50)
	start.add_theme_font_size_override("font_size", 18)
	start.add_theme_color_override("font_color", Color("020c17"))
	start.add_theme_color_override("font_hover_color", Color("020c17"))
	start.add_theme_color_override("font_pressed_color", Color("020c17"))
	if serif:
		start.add_theme_font_override("font", serif)
	start.add_theme_stylebox_override("normal", _intro_button_style(Color("faa968")))
	start.add_theme_stylebox_override("hover", _intro_button_style(Color("e97b3c")))
	start.add_theme_stylebox_override("pressed", _intro_button_style(Color("e97b3c")))
	vbox.add_child(start)
	start.pressed.connect(_on_start)


func _load_serif_font() -> Font:
	return load("res://assets/fonts/DejaVuSerif.ttf") as Font


func _intro_button_style(bg: Color) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = Color("faa968")
	s.set_border_width_all(1)
	return s


func _on_start() -> void:
	_intro.visible = false
	_player.set_can_move(true)


# ---- game flow ------------------------------------------------------------

func _on_puzzle_requested(puzzle: Dictionary, mech: Mechanism) -> void:
	_active_mechanism = mech
	_player.set_can_move(false)
	if _overlay:
		_overlay.open(puzzle)
	else:
		_panel.open(puzzle)


func _on_panel_solved(puzzle: Dictionary) -> void:
	if _active_mechanism:
		_active_mechanism.mark_solved()
	_active_mechanism = null
	_player.set_can_move(true)


func _on_panel_closed() -> void:
	_active_mechanism = null
	_player.set_can_move(true)


func _on_mechanism_solved(mech: Mechanism) -> void:
	var id := str(mech.puzzle.get("id", ""))
	if id == "" or _solved_ids.has(id):
		return
	_solved_ids.append(id)
	_save()
	_update_counter()
	if _solved_ids.size() >= _puzzles.size():
		_fountain.activate()
		_show_banner()


func _update_counter() -> void:
	_counter_label.text = "Meccanismi risolti: %d / %d" % [_solved_ids.size(), _puzzles.size()]


func _show_banner() -> void:
	_banner_label.visible = true
	var tw := create_tween()
	tw.tween_property(_banner_label, "modulate:a", 1.0, 0.6)
	tw.tween_interval(2.5)
	tw.tween_property(_banner_label, "modulate:a", 0.0, 1.2)


# ---- persistence ----------------------------------------------------------

func _save() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify({"version": SAVE_VERSION, "solved": _solved_ids}))


func _load_save() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return
	var data = JSON.parse_string(f.get_as_text())
	if data == null or data.get("version", "") != SAVE_VERSION:
		return
	var saved: Array = data.get("solved", [])
	for mech in _mechanisms:
		if saved.has(str(mech.puzzle.get("id", ""))):
			mech.mark_solved()

class_name Mechanism
extends StaticBody3D

# A stationary puzzle mechanism. It knows its puzzle, builds a low-poly visual
# from primitives based on `kind`, and animates once solved.

signal puzzle_requested(puzzle: Dictionary)
signal solved

var puzzle: Dictionary = {}
var is_solved := false

var _kind := "sigil"
var _visual: Node3D
var _phase := 0.0
var _rotor_a: Node3D
var _rotor_b: Node3D
var _sigil_mat: StandardMaterial3D
var _sigil_ring_mat: StandardMaterial3D
var _hourglass: Node3D
var _door_pivot: Node3D
var _glow_mat: StandardMaterial3D


func setup(data: Dictionary) -> void:
	puzzle = data
	_kind = str(data.get("kind", "sigil"))
	_add_collision()
	_visual = Node3D.new()
	_visual.name = "Visual"
	add_child(_visual)
	_build_visual()
	_add_solved_lamp()


func interact() -> void:
	if not is_solved:
		puzzle_requested.emit(puzzle)


func mark_solved() -> void:
	if is_solved:
		return
	is_solved = true
	_glow_mat.albedo_color = Geometry.COLORS["teal"]
	_glow_mat.emission = Geometry.COLORS["teal"]
	_glow_mat.emission_energy_multiplier = 2.0
	_start_animation()
	solved.emit()


func _process(delta: float) -> void:
	if not is_solved:
		return
	_phase += delta
	match _kind:
		"gears":
			_rotor_a.rotate_z(delta * 1.8)
			_rotor_b.rotate_z(-delta * 1.8)
		"sigil":
			var e := 1.2 + 0.7 * sin(_phase * 2.4)
			_sigil_mat.emission_energy_multiplier = e
			_sigil_ring_mat.emission_energy_multiplier = 1.0 + 0.6 * sin(_phase * 2.4 + 1.0)


func _add_collision() -> void:
	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = _collision_size()
	col.shape = shape
	add_child(col)


func _collision_size() -> Vector3:
	match _kind:
		"sigil":
			return Vector3(1.7, 1.7, 0.5)
		"gears":
			return Vector3(2.4, 2.2, 0.7)
		"hourglass":
			return Vector3(1.4, 2.3, 1.4)
		"gate":
			return Vector3(2.3, 3.1, 0.7)
	return Vector3(1.5, 1.5, 0.5)


func _build_visual() -> void:
	match _kind:
		"sigil":
			_build_sigil()
		"gears":
			_build_gears()
		"hourglass":
			_build_hourglass()
		"gate":
			_build_gate()


func _build_sigil() -> void:
	# Backing plate (stone).
	Geometry.add(_visual, Geometry.cylinder_mesh(0.72, 0.72, 0.08, 18), Geometry.COLORS["stone"], Vector3(0, 0, 0), Vector3(90, 0, 0))
	# Golden disc (the seal), facing +Z.
	var disc := Geometry.cylinder_mesh(0.52, 0.52, 0.1, 20)
	_sigil_mat = Geometry.mat(Geometry.COLORS["gold"], true, 1.2)
	var mi := MeshInstance3D.new()
	mi.mesh = disc
	mi.material_override = _sigil_mat
	mi.position = Vector3(0, 0, 0.1)
	mi.rotation_degrees = Vector3(90, 0, 0)
	_visual.add_child(mi)
	# Ring (torus).
	_sigil_ring_mat = Geometry.mat(Geometry.COLORS["gold"], true, 1.0)
	var ring := MeshInstance3D.new()
	ring.mesh = Geometry.torus_mesh(0.56, 0.7, 24, 8)
	ring.material_override = _sigil_ring_mat
	ring.position = Vector3(0, 0, 0.13)
	ring.rotation_degrees = Vector3(90, 0, 0)
	_visual.add_child(ring)
	# Sun rays.
	for k in range(8):
		var ang := TAU * k / 8.0
		var pos := Vector3(cos(ang) * 0.5, sin(ang) * 0.5, 0.1)
		Geometry.add(_visual, Geometry.box_mesh(Vector3(0.16, 0.12, 0.08)), Geometry.COLORS["gold"], pos, Vector3(0, 0, rad_to_deg(ang)))


func _build_gears() -> void:
	_rotor_a = _make_gear(-0.62)
	_rotor_b = _make_gear(0.62)


func _make_gear(x: float) -> Node3D:
	var rotor := Node3D.new()
	rotor.position = Vector3(x, 0, 0.05)
	_visual.add_child(rotor)
	# Wheel disc, facing +Z.
	var disc := MeshInstance3D.new()
	disc.mesh = Geometry.cylinder_mesh(0.5, 0.5, 0.16, 12)
	disc.material_override = Geometry.mat(Geometry.COLORS["trim"])
	disc.rotation_degrees = Vector3(90, 0, 0)
	rotor.add_child(disc)
	# Teeth.
	for k in range(8):
		var ang := TAU * k / 8.0
		var pos := Vector3(cos(ang) * 0.56, sin(ang) * 0.56, 0.0)
		Geometry.add(rotor, Geometry.box_mesh(Vector3(0.16, 0.16, 0.2)), Geometry.COLORS["column"], pos, Vector3(0, 0, rad_to_deg(ang)))
	# Hub.
	var hub := MeshInstance3D.new()
	hub.mesh = Geometry.cylinder_mesh(0.14, 0.14, 0.2, 10)
	hub.material_override = Geometry.mat(Geometry.COLORS["teal"], true, 0.6)
	hub.rotation_degrees = Vector3(90, 0, 0)
	rotor.add_child(hub)
	return rotor


func _build_hourglass() -> void:
	_hourglass = Node3D.new()
	_hourglass.name = "Hourglass"
	_visual.add_child(_hourglass)
	# Top bulb (wide at bottom).
	Geometry.add(_hourglass, Geometry.cylinder_mesh(0.06, 0.42, 0.72, 12), Geometry.COLORS["water"], Vector3(0, 0.5, 0))
	# Bottom bulb (wide at top).
	Geometry.add(_hourglass, Geometry.cylinder_mesh(0.42, 0.06, 0.72, 12), Geometry.COLORS["water"], Vector3(0, -0.5, 0))
	# Neck.
	Geometry.add(_hourglass, Geometry.cylinder_mesh(0.1, 0.1, 0.18, 10), Geometry.COLORS["trim"], Vector3(0, 0, 0))
	# Frame posts and plates.
	Geometry.add(_hourglass, Geometry.box_mesh(Vector3(0.08, 1.7, 0.08)), Geometry.COLORS["column"], Vector3(-0.5, 0, 0))
	Geometry.add(_hourglass, Geometry.box_mesh(Vector3(0.08, 1.7, 0.08)), Geometry.COLORS["column"], Vector3(0.5, 0, 0))
	Geometry.add(_hourglass, Geometry.box_mesh(Vector3(1.1, 0.08, 0.9)), Geometry.COLORS["trim"], Vector3(0, 0.95, 0))
	Geometry.add(_hourglass, Geometry.box_mesh(Vector3(1.1, 0.08, 0.9)), Geometry.COLORS["trim"], Vector3(0, -0.95, 0))


func _build_gate() -> void:
	# Frame.
	Geometry.add(_visual, Geometry.box_mesh(Vector3(0.28, 2.9, 0.28)), Geometry.COLORS["column"], Vector3(-0.95, 0, 0))
	Geometry.add(_visual, Geometry.box_mesh(Vector3(0.28, 2.9, 0.28)), Geometry.COLORS["column"], Vector3(0.95, 0, 0))
	Geometry.add(_visual, Geometry.box_mesh(Vector3(2.2, 0.3, 0.28)), Geometry.COLORS["trim"], Vector3(0, 1.6, 0))
	# Door pivot at left hinge; door panel hangs to the right.
	_door_pivot = Node3D.new()
	_door_pivot.position = Vector3(-0.95, 0, 0)
	_visual.add_child(_door_pivot)
	var panel := MeshInstance3D.new()
	panel.mesh = Geometry.box_mesh(Vector3(1.75, 2.75, 0.14))
	panel.material_override = Geometry.mat(Geometry.COLORS["floor"])
	panel.position = Vector3(0.9, 0, 0)
	_door_pivot.add_child(panel)
	# Sundial emblem on the door.
	Geometry.add(_door_pivot, Geometry.cylinder_mesh(0.28, 0.28, 0.06, 14), Geometry.COLORS["gold"], Vector3(0.9, 0, 0.1), Vector3(90, 0, 0), true, 0.8)


func _add_solved_lamp() -> void:
	var lamp_y := _collision_size().y * 0.5 + 0.25
	var sphere := MeshInstance3D.new()
	sphere.mesh = Geometry.sphere_mesh(0.16, 2.0, 12, 6)
	_glow_mat = Geometry.mat(Geometry.COLORS["gold"], true, 0.35)
	sphere.material_override = _glow_mat
	sphere.position = Vector3(0, lamp_y, 0.1)
	_visual.add_child(sphere)


func _start_animation() -> void:
	match _kind:
		"gears":
			pass  # continuous rotation handled in _process
		"sigil":
			pass  # continuous pulse handled in _process
		"hourglass":
			var tw := create_tween()
			tw.tween_property(_hourglass, "rotation_degrees:x", 180.0, 1.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
		"gate":
			var tw := create_tween()
			tw.tween_property(_door_pivot, "rotation_degrees:y", -105.0, 1.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)

class_name Fountain
extends StaticBody3D

# Central fountain. Idle until the room is solved, then sprays water and glows.

var is_active := false
var _water_mat: StandardMaterial3D
var _orb_mat: StandardMaterial3D
var _phase := 0.0
var _particles: GPUParticles3D


func _ready() -> void:
	_build()


func _build() -> void:
	var col := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = 1.5
	shape.height = 0.6
	col.shape = shape
	col.position = Vector3(0, 0.3, 0)
	add_child(col)

	Geometry.add(self, Geometry.cylinder_mesh(1.5, 1.2, 0.6, 20), Geometry.COLORS["stone"], Vector3(0, 0.3, 0))
	Geometry.add(self, Geometry.torus_mesh(1.42, 1.54, 28, 8), Geometry.COLORS["column"], Vector3(0, 0.6, 0))

	var wm := MeshInstance3D.new()
	wm.mesh = Geometry.cylinder_mesh(1.35, 1.35, 0.06, 20)
	_water_mat = Geometry.mat(Geometry.COLORS["water"], true, 0.9)
	wm.material_override = _water_mat
	wm.position = Vector3(0, 0.56, 0)
	add_child(wm)

	Geometry.add(self, Geometry.cylinder_mesh(0.2, 0.3, 1.5, 12), Geometry.COLORS["column"], Vector3(0, 1.05, 0))
	Geometry.add(self, Geometry.cylinder_mesh(0.55, 0.22, 0.32, 14), Geometry.COLORS["stone"], Vector3(0, 1.85, 0))

	var orb := MeshInstance3D.new()
	orb.mesh = Geometry.sphere_mesh(0.24)
	_orb_mat = Geometry.mat(Geometry.COLORS["gold"], true, 1.0)
	orb.material_override = _orb_mat
	orb.position = Vector3(0, 2.1, 0)
	add_child(orb)

	_particles = _make_particles()
	add_child(_particles)


func activate() -> void:
	if is_active:
		return
	is_active = true
	_particles.emitting = true
	_orb_mat.emission_energy_multiplier = 2.6


func _process(delta: float) -> void:
	if not is_active:
		return
	_phase += delta
	_water_mat.emission_energy_multiplier = 2.2 + 0.6 * sin(_phase * 3.0)


func _make_particles() -> GPUParticles3D:
	var gp := GPUParticles3D.new()
	var pm := ParticleProcessMaterial.new()
	pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	pm.emission_sphere_radius = 0.18
	pm.direction = Vector3(0, 1, 0)
	pm.spread = 24.0
	pm.initial_velocity_min = 2.6
	pm.initial_velocity_max = 4.8
	pm.gravity = Vector3(0, -7.2, 0)
	pm.scale_min = 0.04
	pm.scale_max = 0.12
	pm.lifetime_randomness = 0.3
	gp.process_material = pm
	gp.amount = 340
	gp.lifetime = 1.7
	gp.position = Vector3(0, 1.95, 0)
	gp.emitting = false
	var dm := SphereMesh.new()
	dm.radius = 0.05
	dm.height = 0.1
	dm.radial_segments = 6
	dm.rings = 3
	gp.draw_pass_1 = dm
	gp.material_override = Geometry.mat(Geometry.COLORS["water"], false)
	return gp

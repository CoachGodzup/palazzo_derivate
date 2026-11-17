class_name Geometry
extends RefCounted

# Helpers to build the low-poly room procedurally: flat-shaded materials and
# primitive meshes. No external assets: everything here is authored by us and
# therefore CC0-compatible. The palette is documented in demo-4/CREDITS.md.

const COLORS := {
	"floor": Color("a2734c"),
	"wall": Color("d9c9a0"),
	"wall_low": Color("c2b189"),
	"ceiling": Color("e8dfc4"),
	"column": Color("cbb98e"),
	"trim": Color("8c7a5b"),
	"water": Color("3fa7c9"),
	"water_deep": Color("1f6f8f"),
	"gold": Color("f6c344"),
	"teal": Color("028391"),
	"orange": Color("faa968"),
	"stone": Color("9b8a6f"),
	"dark": Color("3a3226"),
}

static func mat(color: Color, emissive := false, energy := 1.0, unshaded := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.95
	m.shading_mode = BaseMaterial3D.SHADING_MODE_PER_VERTEX
	if unshaded:
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	if emissive:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = energy
	return m


static func add(parent: Node, mesh: Mesh, color: Color, pos := Vector3.ZERO, rot_deg := Vector3.ZERO, emissive := false, energy := 1.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat(color, emissive, energy)
	mi.position = pos
	mi.rotation_degrees = rot_deg
	parent.add_child(mi)
	return mi


static func static_box(parent: Node, size: Vector3, pos: Vector3, color: Color, rot_deg := Vector3.ZERO) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = pos
	body.rotation_degrees = rot_deg
	parent.add_child(body)
	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	col.shape = shape
	body.add_child(col)
	var mi := MeshInstance3D.new()
	mi.mesh = box_mesh(size)
	mi.material_override = mat(color)
	body.add_child(mi)
	return body


static func collision_box(parent: Node, size: Vector3, pos: Vector3, rot_deg := Vector3.ZERO) -> StaticBody3D:
	# Invisible collision-only box, used to keep the physics layout while the
	# visible geometry is provided by imported GLB models.
	var body := StaticBody3D.new()
	body.position = pos
	body.rotation_degrees = rot_deg
	parent.add_child(body)
	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	col.shape = shape
	body.add_child(col)
	return body


static func model(parent: Node, path: String, pos: Vector3, rot_y_deg := 0.0, model_scale := Vector3.ONE, shadow := true) -> Node3D:
	# Instantiate an imported GLB/GLTF scene (metre scale, +Y up) as a visual.
	# The pack has no collision: physics stays on the collision-only boxes.
	var packed: PackedScene = load(path) as PackedScene
	var inst: Node3D = packed.instantiate()
	inst.position = pos
	inst.rotation_degrees.y = rot_y_deg
	inst.scale = model_scale
	parent.add_child(inst)
	if not shadow:
		for m in inst.find_children("*", "GeometryInstance3D", true, false):
			(m as GeometryInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return inst


static func static_cylinder(parent: Node, top_r: float, bottom_r: float, height: float, pos: Vector3, color: Color, radial := 16) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = pos
	parent.add_child(body)
	var col := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = maxf(top_r, bottom_r)
	shape.height = height
	col.shape = shape
	body.add_child(col)
	var mi := MeshInstance3D.new()
	mi.mesh = cylinder_mesh(top_r, bottom_r, height, radial)
	mi.material_override = mat(color)
	body.add_child(mi)
	return body


static func box_mesh(size: Vector3) -> BoxMesh:
	var m := BoxMesh.new()
	m.size = size
	return m


static func cylinder_mesh(top_r: float, bottom_r: float, height: float, radial := 16, rings := 1) -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = top_r
	m.bottom_radius = bottom_r
	m.height = height
	m.radial_segments = radial
	m.rings = rings
	return m


static func sphere_mesh(radius: float, height := 2.0, radial := 14, rings := 7) -> SphereMesh:
	var m := SphereMesh.new()
	m.radius = radius
	m.height = height
	m.radial_segments = radial
	m.rings = rings
	return m


static func torus_mesh(inner: float, outer: float, rings := 24, ring_segments := 8) -> TorusMesh:
	var m := TorusMesh.new()
	m.inner_radius = inner
	m.outer_radius = outer
	m.rings = rings
	m.ring_segments = ring_segments
	return m

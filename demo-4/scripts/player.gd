class_name Player
extends CharacterBody3D

# First-person controller: mouse look, WASD/arrows movement and a
# center-screen interaction ray.

const MOUSE_SENSITIVITY := 0.002
const TOUCH_SENSITIVITY := 0.0042
const MOVE_SPEED := 4.0
const INTERACT_REACH := 3.6

var can_move := true
var touch_mode := false
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)

# Movement requested by the on-screen stick (x = right, y = forward). Mixed
# with the keyboard so a hybrid device can use either.
var _touch_move := Vector2.ZERO

@onready var camera: Camera3D = $Camera3D
@onready var interact_ray: RayCast3D = $Camera3D/InteractRay


func _unhandled_input(event: InputEvent) -> void:
	if not can_move:
		return
	# On touch devices we drive look/interaction from the on-screen controls;
	# ignore the mouse events Godot emulates from touches to avoid double input.
	if touch_mode and event is InputEventMouse and event.device == InputEvent.DEVICE_ID_EMULATION:
		return
	if event is InputEventMouseMotion:
		rotate_y(-event.relative.x * MOUSE_SENSITIVITY)
		camera.rotate_x(-event.relative.y * MOUSE_SENSITIVITY)
		camera.rotation.x = clampf(camera.rotation.x, deg_to_rad(-85.0), deg_to_rad(85.0))
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		_toggle_mouse()
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_E:
		_try_interact()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_try_interact()


func _physics_process(delta: float) -> void:
	if not can_move:
		velocity = Vector3.ZERO
		return

	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = 0.0

	var input_dir := _touch_move
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		input_dir.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		input_dir.y += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		input_dir.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		input_dir.x += 1.0
	input_dir = input_dir.limit_length(1.0)

	var direction := (transform.basis * Vector3(input_dir.x, 0.0, input_dir.y))
	direction.y = 0.0
	if direction.length() > 1.0:
		direction = direction.normalized()
	velocity.x = direction.x * MOVE_SPEED
	velocity.z = direction.z * MOVE_SPEED

	move_and_slide()


func get_interact_target() -> Node3D:
	if not can_move:
		return null
	if interact_ray.is_colliding():
		var collider := interact_ray.get_collider()
		if collider is Node3D:
			return collider
	if touch_mode:
		return _nearest_interactable()
	return null


func set_touch_move(axis: Vector2) -> void:
	# `axis.y` is +1 when the stick points up: forward is -Z in local input.
	_touch_move = Vector2(axis.x, -axis.y)


func apply_look(relative: Vector2) -> void:
	if not can_move:
		return
	rotate_y(-relative.x * TOUCH_SENSITIVITY)
	camera.rotate_x(-relative.y * TOUCH_SENSITIVITY)
	camera.rotation.x = clampf(camera.rotation.x, deg_to_rad(-85.0), deg_to_rad(85.0))


func try_interact() -> void:
	_try_interact()


func set_can_move(value: bool) -> void:
	can_move = value
	if touch_mode:
		# Touch devices have no cursor to lock and pointer lock would fail.
		_set_lock_requested(false)
		return
	_set_lock_requested(value)
	if value:
		_try_capture()
	else:
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)


func _set_lock_requested(value: bool) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__lockRequested = " + ("true" if value else "false") + ";")


func _try_capture() -> void:
	if touch_mode:
		return
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	# Give the browser a couple of frames; if the lock did not engage, fall back
	# to a hidden cursor so the player can still look around.
	await get_tree().process_frame
	await get_tree().process_frame
	if can_move and Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
		Input.set_mouse_mode(Input.MOUSE_MODE_HIDDEN)


func _toggle_mouse() -> void:
	if Input.get_mouse_mode() == Input.MOUSE_MODE_VISIBLE:
		_try_capture()
	else:
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)


func _try_interact() -> void:
	var target := get_interact_target()
	if target and target.has_method("interact"):
		target.interact()


# Touch clients can't aim precisely with a crosshair, so fall back to the
# nearest unsolved mechanism roughly in front of the player.
func _nearest_interactable() -> Node3D:
	var forward := -global_transform.basis.z
	forward.y = 0.0
	if forward.length_squared() < 0.001:
		return null
	forward = forward.normalized()
	var origin := global_position + Vector3(0.0, 1.2, 0.0)
	var best: Node3D = null
	var best_score := 0.3
	for node in get_tree().get_nodes_in_group("interactables"):
		if not (node is Node3D):
			continue
		if node is Mechanism and node.is_solved:
			continue
		var to: Vector3 = node.global_position - origin
		var dist := to.length()
		if dist > INTERACT_REACH:
			continue
		var flat := Vector3(to.x, 0.0, to.z)
		if flat.length_squared() < 0.0001:
			continue
		var facing := forward.dot(flat.normalized())
		if facing < 0.35:
			continue
		var score := facing - dist * 0.12
		if score > best_score:
			best_score = score
			best = node
	return best

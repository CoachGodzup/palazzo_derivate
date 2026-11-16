class_name Player
extends CharacterBody3D

# First-person controller: mouse look, WASD/arrows movement and a
# center-screen interaction ray.

const MOUSE_SENSITIVITY := 0.002
const MOVE_SPEED := 4.0

var can_move := true
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)

@onready var camera: Camera3D = $Camera3D
@onready var interact_ray: RayCast3D = $Camera3D/InteractRay


func _unhandled_input(event: InputEvent) -> void:
	if not can_move:
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

	var input_dir := Vector2.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		input_dir.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		input_dir.y += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		input_dir.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		input_dir.x += 1.0
	input_dir = input_dir.normalized()

	var direction := (transform.basis * Vector3(input_dir.x, 0.0, input_dir.y)).normalized()
	velocity.x = direction.x * MOVE_SPEED
	velocity.z = direction.z * MOVE_SPEED

	move_and_slide()


func get_interact_target() -> Node3D:
	if not can_move:
		return null
	if interact_ray.is_colliding():
		return interact_ray.get_collider()
	return null


func set_can_move(value: bool) -> void:
	can_move = value
	_set_lock_requested(value)
	if value:
		_try_capture()
	else:
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)


func _set_lock_requested(value: bool) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__lockRequested = " + ("true" if value else "false") + ";")


func _try_capture() -> void:
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

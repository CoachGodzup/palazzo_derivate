extends SceneTree

# Headless check of the touch interface wiring: the stick moves the player,
# dragging turns the camera, "Interagisci" opens the exercise popup and the
# whole gameplay UI disappears until the popup is closed.
# Run with:
#   godot --headless --path demo-4 --script res://tests/test_mobile_controls.gd

var _main: Node = null
var _player = null
var _controls = null
var _panel = null


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	_main = load("res://scenes/main.tscn").instantiate()
	root.add_child(_main)
	await process_frame
	await process_frame

	_controls = _find(_main, "MobileControls")
	_panel = _find(_main, "PuzzlePanel")
	_player = _find(_main, "Player")
	if _controls == null or _panel == null or _player == null:
		print("missing nodes: controls=", _controls, " panel=", _panel, " player=", _player)
		quit(1)
		return

	# Pretend this is a touch device and start the game.
	_controls.is_touch = true
	_main._touch_mode = true
	_player.touch_mode = true
	_main._on_start()
	await process_frame

	var start_ok: bool = _controls.visible and _main._hud_visible
	print("controls visible on start: ", _controls.visible)
	print("gameplay hud visible on start: ", _main._hud_visible)

	# Stick forward -> player input forward (negative Z).
	_controls.move_by.emit(Vector2(0.0, 1.0))
	await process_frame
	var move_ok: bool = _player._touch_move.is_equal_approx(Vector2(0.0, -1.0))
	print("stick forward -> _touch_move: ", _player._touch_move, " ok=", move_ok)

	# Look drag turns the player.
	var yaw_before: float = _player.rotation.y
	_controls.look_by.emit(Vector2(120.0, 0.0))
	await process_frame
	var look_ok: bool = not is_equal_approx(_player.rotation.y, yaw_before)
	print("look drag changes yaw: ", yaw_before, " -> ", _player.rotation.y, " ok=", look_ok)

	# Stand in front of the north mechanism and interact from the button.
	_player.position = Vector3(0.0, 0.05, -4.0)
	_player.rotation_degrees = Vector3.ZERO
	_player.camera.rotation_degrees = Vector3.ZERO
	await process_frame
	_controls.interact_pressed.emit()
	await process_frame
	await process_frame

	var popup_ok: bool = _panel.visible and not _controls.visible and not _main._hud_visible
	print("popup visible: ", _panel.visible)
	print("controls hidden in popup: ", not _controls.visible)
	print("hud hidden in popup: ", not _main._hud_visible)

	_panel.close()
	await process_frame

	var restore_ok: bool = _controls.visible and _main._hud_visible
	print("controls restored after close: ", _controls.visible)
	print("hud restored after close: ", _main._hud_visible)

	var ok: bool = start_ok and move_ok and look_ok and popup_ok and restore_ok
	print("---")
	print("RESULT: ", "PASS" if ok else "FAIL")
	quit(0 if ok else 1)


func _find(node: Node, type_name: String) -> Node:
	for c in node.find_children("*", type_name, true, false):
		return c
	return null

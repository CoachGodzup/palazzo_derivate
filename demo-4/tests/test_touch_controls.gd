extends SceneTree

# Headless check of the touch sticks: screen coordinates must map to the
# joystick convention used by the player (up = forward = local -Z), and the
# twin-stick layer must build without errors.
#   godot --headless --path demo-4 --script res://tests/test_touch_controls.gd

func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var ok := true
	ok = _check("stick up is forward", MobileControls.stick_axis(Vector2(0, -78), 78), Vector2(0, 1)) and ok
	ok = _check("stick down is backward", MobileControls.stick_axis(Vector2(0, 78), 78), Vector2(0, -1)) and ok
	ok = _check("stick right is right", MobileControls.stick_axis(Vector2(78, 0), 78), Vector2(1, 0)) and ok
	ok = _check("dead zone is neutral", MobileControls.stick_axis(Vector2(2, -2), 78), Vector2.ZERO) and ok
	ok = _check(
		"player maps forward to -Z",
		Player.joystick_to_move(Vector2(0, 1)),
		Vector2(0, -1)
	) and ok
	ok = _check(
		"player maps backward to +Z",
		Player.joystick_to_move(Vector2(0, -1)),
		Vector2(0, 1)
	) and ok

	var controls := MobileControls.new()
	root.add_child(controls)
	await process_frame
	await process_frame
	var move_stick := controls.get_node_or_null("MoveStick")
	var look_stick := controls.get_node_or_null("LookStick")
	var interact := controls.get_node_or_null("Interact")
	print("move stick: ", move_stick != null)
	print("look stick: ", look_stick != null)
	print("interact button: ", interact != null)
	ok = move_stick != null and look_stick != null and interact != null and ok

	controls.queue_free()
	quit(0 if ok else 1)


func _check(label: String, actual: Vector2, expected: Vector2) -> bool:
	var passed := actual.is_equal_approx(expected)
	print(("PASS " if passed else "FAIL ") + label + ": ", actual)
	return passed

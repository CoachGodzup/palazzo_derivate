extends SceneTree

# Headless check that the interaction ray actually hits a mechanism.
# Run with:
#   godot --headless --path demo-4 --script res://tests/test_raycast.gd

func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var main: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	await process_frame
	await process_frame

	var player = _find(main, "Player")
	var mech = _find(main, "Mechanism")  # first built = sigillo, at (0,1.4,-5.3)
	if player == null or mech == null:
		print("missing nodes: player=", player, " mech=", mech)
		quit(1)
		return

	# Place the player close to the first mechanism, facing it (-Z).
	player.can_move = true
	player.position = Vector3(0, 0.05, -2.0)
	player.rotation_degrees = Vector3.ZERO
	player.camera.rotation_degrees = Vector3.ZERO
	await process_frame

	player.interact_ray.force_raycast_update()
	var target = player.get_interact_target()
	print("ray target is mechanism: ", target == mech, " (", target, ")")
	quit(0 if target == mech else 1)


func _find(node: Node, type_name: String) -> Node:
	for c in node.find_children("*", type_name, true, false):
		return c
	return null

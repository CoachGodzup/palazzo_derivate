extends SceneTree

# Headless integration check of the interaction chain: a mechanism's interact()
# must open the puzzle panel. Run with:
#   godot --headless --path demo-4 --script res://tests/test_interaction.gd

var _panel: CanvasLayer = null
var _mech: Node = null


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var main: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	await process_frame
	await process_frame

	_mech = _find(main, "Mechanism")
	_panel = _find(main, "PuzzlePanel")

	var initial: bool = _panel.visible if _panel else false
	if _mech:
		_mech.interact()
	await process_frame

	var after: bool = _panel.visible if _panel else false
	print("mechanism found: ", _mech != null)
	print("panel initially visible: ", initial)
	print("panel visible after interact: ", after)

	var ok := _mech != null and _panel != null and after and not initial
	quit(0 if ok else 1)


func _find(node: Node, type_name: String) -> Node:
	for c in node.find_children("*", type_name, true, false):
		return c
	return null

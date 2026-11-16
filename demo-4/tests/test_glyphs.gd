extends SceneTree

# Headless check: which math glyphs the bundled DejaVu font can render.
#   godot --headless --path demo-4 --script res://tests/test_glyphs.gd

func _initialize() -> void:
	var font := FontFile.new()
	var err := font.load_dynamic_font("res://assets/fonts/DejaVuSans.ttf")
	if err != OK:
		print("FONT LOAD ERROR: ", err)
		quit(1)
		return
	var chars := ["²", "³", "⁴", "⁵", "⁻", "⁺", "√", "−", "·", "×", "÷", "⌫", "⁻²", "x⁻²"]
	var all_ok := true
	for c in chars:
		var ok := true
		for i in c.length():
			if not font.has_char(c.unicode_at(i)):
				ok = false
				break
		if not ok:
			all_ok = false
		print(c, " -> ", "OK" if ok else "MISSING")
	print("--- all_ok: ", all_ok)
	quit(0 if all_ok else 1)

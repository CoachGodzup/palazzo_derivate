extends SceneTree

# Quick headless check of the mock verifier. Run with:
#   godot --headless --path demo-4 --script res://tests/test_math_parser.gd

const MP = preload("res://scripts/math_parser.gd")

func _initialize() -> void:
	var cases := [
		# [answer, expected, want_ok, want_error]
		["6*x - 5", "6*x - 5", true, ""],
		["6x-5", "6*x - 5", true, ""],
		["6x -5", "6*x - 5", true, ""],
		["6*x-5.0", "6*x - 5", true, ""],
		["9*x^2 + 6*x - 2", "9*x^2 + 6*x - 2", true, ""],
		["9x^2+6x-2", "9*x^2 + 6*x - 2", true, ""],
		["6*x*(x+1)+(3*x^2-2)*1", "9*x^2 + 6*x - 2", true, ""],
		["3/(2*sqrt(x)) + 3*sqrt(x)", "3/(2*sqrt(x)) + 3*sqrt(x)", true, ""],
		["3/(2sqrt(x))+3sqrt(x)", "3/(2*sqrt(x)) + 3*sqrt(x)", true, ""],
		["10*x^4 + 8*x^(-3)", "10*x^4 + 8*x^(-3)", true, ""],
		["10x^4+8x^-3", "10*x^4 + 8*x^(-3)", true, ""],
		["6*x", "6*x - 5", false, ""],
		["6*x - 6", "6*x - 5", false, ""],
		["6*x-", "6*x - 5", false, "syntax"],
		["sin(x)", "6*x - 5", false, "unsupported"],
		["", "6*x - 5", false, "empty"],
		["2x^5-4x^-2+3", "10*x^4 + 8*x^(-3)", false, ""],
		["3/(2*√x)+3*√x", "3/(2*sqrt(x)) + 3*sqrt(x)", true, ""],
		["3/(2√x)+3√x", "3/(2*sqrt(x)) + 3*sqrt(x)", true, ""],
		["6*x÷1-5", "6*x - 5", true, ""],
	]
	var fails := 0
	for c in cases:
		var res: Dictionary = MP.verify(c[0], c[1])
		var ok_pass: bool = (res["ok"] == c[2]) and (str(res["error"]) == c[3])
		if not ok_pass:
			fails += 1
		print(("PASS" if ok_pass else "FAIL"), "  verify(\"", c[0], "\") -> ok=", res["ok"], " err=\"", res["error"], "\"")
	print("---")
	print("FAILURES: ", fails, " / ", cases.size())
	quit(fails)

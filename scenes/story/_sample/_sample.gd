extends "res://scenes/story/story_scene.gd"
## Smoke test for the base script and the preview runner: arena with Dain's sprites, a balloon, a chat choice.

func run() -> void:
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	pixel_sprite("res://assets/dain/arena-bg.png", Vector2(0, ARENA_TOP))
	var lia := pixel_sprite("res://assets/dain/lia-wizard.png", Vector2(300, ARENA_FLOOR - 43 * PIX))
	var wolf := pixel_sprite("res://assets/dain/wolf.png", Vector2(900, ARENA_FLOOR - 37 * PIX))
	await mark("sample.1 arena")
	var b := balloon("Thank you for calling. My name is Lia.", lia.position + Vector2(23 * PIX, 0))
	await hold(1.0)
	await mark("sample.2 balloon")
	remove_balloon(b)
	chat_panel(["lia_ph: ez"], Vector2(190, 170), Vector2(900, 300), "00:03")
	var pick := await choose(["okay that was clean", "fuck off"], Vector2(230, 420))
	await mark("sample.3 choice")
	wolf.flip_h = true
	await wait_advance()
	finish({"pick": pick})

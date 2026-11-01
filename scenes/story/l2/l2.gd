extends "res://scenes/story/story_scene.gd"
## Board "Opening loss 2 / clean outplay" (storyboard key loss2, Figma node 77-134).
## Five cards on one fixed wide shot of Dain's arena: Lia's wizard left, the player's wolf right.
## L2.1 rematch; L2.2 the wolf hops over her cyan spell; L2.3 the wolf commits left with the white
## crescent and she waits; L2.4 she counters, the wolf is knocked right past the platform edge, DEFEAT;
## L2.5 REMATCH? pause, no new chat. Ends with finish({"loss": 2}).

const LIA_X := 300.0
const WOLF_X := 900.0
const LIA_H := 43.0 * PIX        # lia-wizard.png is 46x43
const WOLF_H := 37.0 * PIX       # wolf.png is 32x37
const WOLF_W := 32.0 * PIX
const HOP := 160.0               # clears the spell's thin right tip (lower half of lia-spell.png)
const COMMIT_X := 560.0          # where the wolf's leftward approach stops, crescent between it and Lia

var lia: Sprite2D
var wolf: Sprite2D

func run() -> void:
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	pixel_sprite("res://assets/dain/arena-bg.png", Vector2(0, ARENA_TOP))
	hud()
	lia = pixel_sprite("res://assets/dain/lia-wizard.png", Vector2(LIA_X, ARENA_FLOOR - LIA_H))
	wolf = pixel_sprite("res://assets/dain/wolf.png", Vector2(WOLF_X, ARENA_FLOOR - WOLF_H))

	# L2.1 Rematch, same arena. Wolf right resets guard; wizard left raises staff.
	sfx("queue")                             # round cue; footsteps have no clip (cue: responsive footsteps)
	await mark("L2.1")
	await hold(0.8)

	# L2.2 A genuine dodge. Wizard fires the cyan spell rightward; the wolf hops above it, then lands.
	var spell := pixel_sprite("res://assets/dain/lia-spell.png", Vector2(LIA_X + 34.0 * PIX, ARENA_FLOOR - 73.0 * PIX))
	move_child(spell, wolf.get_index())      # spell passes under the wolf
	sfx("blast")                             # spell hiss
	var up := create_tween()
	up.tween_property(wolf, "position:y", ARENA_FLOOR - WOLF_H - HOP, secs(0.16)).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await up.finished
	await mark("L2.2")
	await hold(0.5)
	var down := create_tween()
	down.tween_property(wolf, "position:y", ARENA_FLOOR - WOLF_H, secs(0.16)).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await down.finished                      # landing has no clip (cue: landing)
	spell.queue_free()

	# L2.3 She waits for the repeat. Wolf commits leftward with the white crescent; wizard holds staff.
	sfx("swing")                             # cloak swish
	var go := create_tween()
	go.tween_property(wolf, "position:x", COMMIT_X, secs(0.25)).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	await go.finished
	var crescent := pixel_sprite("res://assets/dain/wolf-crescent.png", Vector2(COMMIT_X - 41.0 * PIX - 6.0, ARENA_FLOOR - WOLF_H + 6.0))
	await mark("L2.3")
	await hold(0.4)                          # brief quiet

	# L2.4 Clean punish / DEFEAT. Wizard counters; wolf knocked right, beyond the platform. No lag excuse.
	crescent.queue_free()
	sfx("hit")                               # clean hit
	var slash := counter_slash(Vector2(LIA_X + 42.0 * PIX, ARENA_FLOOR - 100.0), Vector2(COMMIT_X + 30.0, ARENA_FLOOR - 70.0))
	var fly := create_tween().set_parallel(true)
	fly.tween_property(wolf, "position:x", W - WOLF_W - 10.0, secs(0.3)).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	fly.tween_property(wolf, "position:y", ARENA_FLOOR - WOLF_H - 150.0, secs(0.3)).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	fly.tween_property(wolf, "rotation_degrees", 28.0, secs(0.3))
	await fly.finished
	sfx("ko")                                # GAME
	var defeat := overlay("DEFEAT", PAPER, 88)
	await mark("L2.4")
	await hold(0.8)
	await wait_advance()                     # result hold; no new insult

	# L2.5 One more attempt. Result settles; wolf expects another attempt. Short pause, not a chat branch.
	for n in defeat:
		n.queue_free()
	slash.queue_free()
	wolf.rotation_degrees = 0.0
	wolf.position = Vector2(WOLF_X, ARENA_FLOOR - WOLF_H)
	overlay("REMATCH?", GOLD, 64)            # quiet menu tick has no clip (cue: quiet menu tick)
	await mark("L2.5")
	await hold(0.7)
	await wait_advance()                     # rematch advance
	stop_sfx()
	finish({"loss": 2})

func _exit_tree() -> void:
	stop_sfx()

# ---------- helpers local to this scene ----------

## Tween lengths follow the draft times; autoplay shortens them the way hold() does.
func secs(s: float) -> float:
	return s if not autoplay else minf(s, 0.12)

## Name tags and bars in the top letterbox band, as the graybox cards draw them.
func hud() -> void:
	label("LIA / WIZARD", 22, PAPER, Vector2(40, 16))
	rect(Vector2(40, 52), Vector2(220, 8), DIM)
	label("YOU / WOLF", 22, PAPER, Vector2(W - 260, 16), 220, HORIZONTAL_ALIGNMENT_RIGHT)
	rect(Vector2(W - 260, 52), Vector2(220, 8), PAPER)

## Upper-left result word with an ink shadow so it reads over the arches. Returns [shadow, text].
func overlay(txt: String, col: Color, size: int) -> Array:
	var shadow := label(txt, size, INK, Vector2(64, 104))
	var text := label(txt, size, col, Vector2(60, 100))
	return [shadow, text]

## Thin white sliver from Lia's staff to the wolf's chest: the counter that lands.
func counter_slash(from: Vector2, to: Vector2) -> Polygon2D:
	var p := Polygon2D.new()
	p.color = PAPER
	var side := (to - from).normalized().orthogonal() * 7.0
	p.polygon = PackedVector2Array([from, to + side, to - side])
	add_child(p)
	return p

## Plays assets/sfx/<name>.mp3 from the source file, so it works in a worktree with no .godot import cache.
func sfx(name: String) -> void:
	var path := "res://assets/sfx/%s.mp3" % name
	var bytes := FileAccess.get_file_as_bytes(path)
	if bytes.is_empty():
		push_warning("l2: missing sfx " + path)
		return
	var stream := AudioStreamMP3.new()
	stream.data = bytes
	var p := AudioStreamPlayer.new()
	p.stream = stream
	add_child(p)
	p.finished.connect(p.queue_free)
	p.play()

## A clip still playing when the scene ends would leak its playback at engine exit (seen in the preview run).
func stop_sfx() -> void:
	for c in get_children():
		if c is AudioStreamPlayer:
			c.stop()
			c.stream = null

extends "res://scenes/story/story_scene.gd"
## Scene 2: the first humiliation. Storyboard SCENE-02.md (Figma board node 58-134), cards 2.01 to 2.08C.
## Lia's wizard stands on the left and the wolf (you) on the right, on Dain's arena at PIX.
## The reply pair is the shared one from the scene contract: "okay that was clean" / "fuck off";
## the 00:03 timer running out is silence. Lia answers "ty boss 😭", "HAHAHAHA", or requests a rematch.

const LIA_SIZE := Vector2(46, 43)
const WOLF_SIZE := Vector2(32, 37)
const SPELL_SIZE := Vector2(238, 73)
const CRESCENT_SIZE := Vector2(41, 32)
const PING := "248ms"
const REPLIES := ["okay that was clean", "fuck off"]
const SILENCE := "silence"
const CHAT_SECS := 3                       # the storyboard's 00:03, read as a countdown to silence
const BAR_W := 300.0
const BAR_BACK := Color("2a2c44")
const GRAY_BOX := Color("d9d9d9")

var lia: Sprite2D
var wolf: Sprite2D
var lia_fill: ColorRect
var you_fill: ColorRect
var _choosing := false

func run() -> void:
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	pixel_sprite("res://assets/dain/arena-bg.png", Vector2(0, ARENA_TOP))
	lia = fighter("res://assets/dain/lia-wizard.png", LIA_SIZE, 360.0)
	wolf = fighter("res://assets/dain/wolf.png", WOLF_SIZE, 900.0)
	hud()

	# 2.01 Control works: two fighters, the platform, full health bars.
	# SOUND: footsteps respond immediately (no footstep clip in assets/sfx).
	await mark("2.01")
	await hold(1.0)

	# 2.02 Your hit lands: the wolf closes in, the crescent connects, Lia staggers.
	set_feet(wolf, 520.0)
	var crescent := slash(Vector2(395.0, ARENA_FLOOR - 118.0))
	lia.position.x -= 16.0
	lia.rotation = -0.18
	set_hp(lia_fill, 0.72, false)
	sfx("hit")
	await mark("2.02")
	await hold(0.8)

	# 2.03 The follow-up freezes: your next attack pose hangs for half a second; Lia keeps moving.
	# SOUND: music continues; no whole-game pause.
	crescent.queue_free()
	lia.rotation = 0.0
	set_feet(lia, 300.0)
	var hung := slash(Vector2(400.0, ARENA_FLOOR - 118.0))
	hung.modulate = Color(1, 1, 1, 0.35)
	await mark("2.03")
	await hold(0.5)

	# 2.04 Lia launches you: her spell crosses the arena, the wolf is knocked back. Camera stays fixed.
	hung.queue_free()
	set_feet(lia, 360.0)
	var spell := pixel_sprite("res://assets/dain/lia-spell.png", Vector2(lia.position.x + 40.0, 372.0))
	set_feet(wolf, 1000.0, 150.0)
	wolf.rotation = 0.7
	set_hp(you_fill, 0.3, true)
	sfx("blast")
	sfx("hit")
	await mark("2.04")
	await hold(0.8)

	# 2.05 The guard arrives late: the block comes up after the hit; the network warning shows.
	spell.queue_free()
	wolf.rotation = 0.0
	set_feet(wolf, 900.0)
	set_feet(lia, 760.0)
	var late_guard := [
		rect(Vector2(838.0, ARENA_FLOOR - 104.0), Vector2(10.0, 104.0), Color(PAPER, 0.85)),
		rect(Vector2(240.0, 150.0), Vector2(800.0, 64.0), GRAY_BOX),
		label("NETWORK DELAY — " + PING, 36, INK, Vector2(240.0, 158.0), 800.0, HORIZONTAL_ALIGNMENT_CENTER),
	]
	set_hp(you_fill, 0.12, true)
	sfx("whiff")
	await mark("2.05")
	await hold(1.0)

	# 2.06 DEFEAT. Announcer: GAME! Then the chat notification pings.
	free_all(late_guard)
	wolf.rotation = PI / 2.0
	wolf.position = Vector2(900.0, ARENA_FLOOR - WOLF_SIZE.x * PIX / 2.0)
	set_feet(lia, 700.0)
	set_hp(you_fill, 0.0, true)
	var result_screen := [
		big("DEFEAT", Color.WHITE, 96, 190.0),
		label("GAME!", 40, GOLD, Vector2(0, 300.0), W, HORIZONTAL_ALIGNMENT_CENTER),
	]
	sfx("ko")
	await hold(1.2)
	result_screen.append(rect(Vector2(900.0, 655.0), Vector2(340.0, 50.0), BAR_BACK))
	result_screen.append(label("MATCH CHAT", 24, Color.WHITE, Vector2(900.0, 664.0), 340.0, HORIZONTAL_ALIGNMENT_CENTER))
	sfx("chat")
	await mark("2.06")
	await hold(0.8)

	# 2.07 MATCH CHAT 00:03, lia_ph: ez, two replies. Letting the timer run out is silence.
	free_all(result_screen)
	var chat := chat_panel(["lia_ph: ez"], Vector2(190, 150), Vector2(900, 420), "00:03")
	var t0 := Time.get_ticks_msec()
	_choosing = true
	countdown(chat)
	var raw := await choose(REPLIES, Vector2(230, 300), 26, "2.07")
	_choosing = false
	var reply_ms := Time.get_ticks_msec() - t0
	var pick: String = raw.uri_decode()     # the preview passes pick=fuck%20off on the command line
	if pick not in REPLIES:
		pick = SILENCE
	chat.queue_free()

	# 2.08A / 2.08B / 2.08C: mutually exclusive outcomes.
	match pick:
		"okay that was clean":
			var p := chat_panel(["lia_ph: ez", "you: " + pick, "lia_ph: ty boss 😭"], Vector2(190, 150), Vector2(900, 420))
			emoji_fallback(p)
			sfx("chat")
			await mark("2.08A")
		"fuck off":
			chat_panel(["lia_ph: ez", "you: " + pick, "lia_ph: HAHAHAHA"], Vector2(190, 150), Vector2(900, 420))
			sfx("chat")
			await mark("2.08B")
		_:
			chat_panel(["lia_ph: ez"], Vector2(190, 150), Vector2(900, 420))
			rect(Vector2(214.0, 494.0), Vector2(852.0, 56.0), Color("3a3d5c"))
			label("lia_ph requested a rematch", 26, Color.WHITE, Vector2(232.0, 506.0))
			sfx("queue")                    # rematch-request ping; no automatic acceptance
			await mark("2.08C")
	await hold(1.2)
	await wait_advance()
	finish({"pick": pick, "reply_ms": reply_ms})

# ---------- helpers local to this scene ----------

## A fighter sprite drawn from its centre so it can lean and tumble; feet on ARENA_FLOOR.
func fighter(path: String, size_px: Vector2, feet_x: float, flip := false) -> Sprite2D:
	var s := pixel_sprite(path, Vector2.ZERO, PIX, flip)
	s.centered = true
	s.set_meta("size", size_px * PIX)
	set_feet(s, feet_x)
	return s

func set_feet(s: Sprite2D, feet_x: float, lift := 0.0) -> void:
	var sz: Vector2 = s.get_meta("size")
	s.position = Vector2(feet_x, ARENA_FLOOR - sz.y / 2.0 - lift)

## The wolf's crescent slash. The wolf faces left as drawn, so the crescent flies left unflipped.
func slash(pos: Vector2) -> Sprite2D:
	return pixel_sprite("res://assets/dain/wolf-crescent.png", pos)

## Health bars in the top letterbox band: lia_ph on the left over Lia, YOU on the right over the wolf.
func hud() -> void:
	var lx := 40.0
	var rx := W - 40.0 - BAR_W
	rect(Vector2(lx, 22), Vector2(BAR_W, 14), BAR_BACK)
	lia_fill = rect(Vector2(lx, 22), Vector2(BAR_W, 14), PINK)
	label(HER, 20, PINK, Vector2(lx, 42))
	rect(Vector2(rx, 22), Vector2(BAR_W, 14), BAR_BACK)
	you_fill = rect(Vector2(rx, 22), Vector2(BAR_W, 14), CYAN)
	label("YOU", 20, CYAN, Vector2(rx, 42), BAR_W, HORIZONTAL_ALIGNMENT_RIGHT)
	label(PING, 18, DIM, Vector2(rx, 44))

## Shrinks a bar to frac of BAR_W. A right-anchored bar keeps its right edge in place.
func set_hp(fill: ColorRect, frac: float, anchor_right: bool) -> void:
	var w := BAR_W * clampf(frac, 0.0, 1.0)
	if anchor_right:
		fill.position.x = W - 40.0 - w
	fill.size.x = w

func free_all(nodes: Array) -> void:
	for n in nodes:
		if is_instance_valid(n):
			n.queue_free()

## Counts the chat timer down from 00:03; when it reaches zero with no reply, the choice is silence.
## Runs beside choose(): setting _choice ends its wait. Autoplay picks within 0.3 s, so the timer is moot there.
## The tick comes from a child Timer, so if the scene is freed early the coroutine is dropped, never resumed.
func countdown(panel: Control) -> void:
	var t: Label = panel.find_child("Timer", true, false)
	var tick := Timer.new()
	add_child(tick)
	tick.start(1.0)
	for left in range(CHAT_SECS - 1, -1, -1):
		await tick.timeout
		if not _choosing or _choice != "":
			break
		if is_instance_valid(t):
			t.text = "00:%02d" % left
	tick.queue_free()
	if _choosing and _choice == "":
		_choice = SILENCE

## Gives the label holding the emoji a system colour-emoji fallback; Godot's bundled font has no emoji glyphs.
func emoji_fallback(panel: Control) -> void:
	var sysf := SystemFont.new()
	sysf.font_names = PackedStringArray(["Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"])
	var fv := FontVariation.new()
	fv.base_font = ThemeDB.fallback_font
	var fb: Array[Font] = [sysf]
	fv.fallbacks = fb
	for l in panel.find_children("*", "Label", true, false):
		if "😭" in (l as Label).text:
			(l as Label).add_theme_font_override("font", fv)

## Plays one clip from assets/sfx by reading the mp3 bytes directly (worktrees have no .godot import cache).
func sfx(clip: String) -> void:
	var gp := ProjectSettings.globalize_path("res://assets/sfx/%s.mp3" % clip)
	if not FileAccess.file_exists(gp):
		push_warning("s2: no sfx clip " + clip)
		return
	var stream := AudioStreamMP3.new()
	stream.data = FileAccess.get_file_as_bytes(gp)
	var p := AudioStreamPlayer.new()
	p.stream = stream
	add_child(p)
	p.finished.connect(p.queue_free)
	p.play()

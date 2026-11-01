extends "res://scenes/story/story_scene.gd"
## M2 "Second match, knowing doesn't help" (storyboard board m2, Figma node 99-964), ten cards.
## Same arena and the same two reply buttons as Scene 2. One inner line varies with ctx.seen
## (badge, phone, food; first match in that order, badge by default). Ends with the screen folding
## inward on CONNECTION LOST. Dialogue is the exact storyboard text.

const LIA_X := 300.0          # Scene 2 start positions (same as the sample scene)
const WOLF_X := 900.0
const BAND := Color("0c0d1c")  # HUD band in the letterbox, as the storyboard draws it
const GUARD := Color("b9bcc8") # gray guard slab
const PUSH := 40.0             # the hit pushes the wolf 40 px right

const INNER_ORDER := ["badge", "phone", "food"]
const INNER_LINES := {
	"badge": "Isn't her break almost over?",
	"phone": "She still hasn't answered her mom.",
	"food": "She's probably laughing with her mouth full of rice again.",
}
const REPLIES := ["okay that was clean", "fuck off"]

var lia: Sprite2D
var wolf: Sprite2D
var wolf_bar: ColorRect
var defeat: Label
var panel: PanelContainer
var timer_lbl: Label
var reply_row: HBoxContainer
var _timed_choice := ""

func run() -> void:
	# ---- M2.1 Arena returns: hard cut, full arcade colour in one frame, no fade.
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	pixel_sprite("res://assets/dain/arena-bg.png", Vector2(0, ARENA_TOP))
	lia = pixel_sprite("res://assets/dain/lia-wizard.png", Vector2(LIA_X, ARENA_FLOOR - 43 * PIX))
	wolf = pixel_sprite("res://assets/dain/wolf.png", Vector2(WOLF_X, ARENA_FLOOR - 37 * PIX))
	_hud()
	# sound cue: arena music resumes loud mid-phrase; the fan cuts dead (no music clip in assets/sfx)
	var raise := create_tween()  # wizard raises the staff; wolf settles into idle
	raise.tween_property(lia, "position:y", lia.position.y - 3 * PIX, 0.15).set_trans(Tween.TRANS_SINE)
	raise.tween_property(lia, "position:y", lia.position.y, 0.15)
	await raise.finished
	await mark("M2.1")
	await hold(0.8)

	# ---- M2.2 One inner line, chosen from what the player observed.
	var strip := rect(Vector2(0, ARENA_FLOOR + 22), Vector2(W, 46), Color(0.04, 0.04, 0.11, 0.86))
	var voice := label("\"%s\"" % _inner_line(), 24, PAPER, Vector2(60, ARENA_FLOOR + 30), W - 120)
	strip.modulate.a = 0.0
	voice.modulate.a = 0.0
	var fin := create_tween().set_parallel(true)
	fin.tween_property(strip, "modulate:a", 1.0, 0.3)
	fin.tween_property(voice, "modulate:a", 1.0, 0.3)
	await fin.finished
	await mark("M2.2")
	await hold(1.6)
	var fout := create_tween().set_parallel(true)
	fout.tween_property(strip, "modulate:a", 0.0, 0.3)
	fout.tween_property(voice, "modulate:a", 0.0, 0.3)
	await fout.finished
	strip.queue_free()
	voice.queue_free()

	# ---- M2.3 Lia lands a hit: cyan spell rightward, wolf pushed 40 px and flinches, chat pops top-right.
	var spell := await _cast(LIA_X + 90, 0.3)
	await _flinch(PUSH)
	_wolf_hp(220)
	var pop := _chat_pop("lia_ph: bro just block 😭")
	await mark("M2.3")
	await hold(1.5)
	pop.queue_free()
	spell.queue_free()

	# ---- M2.4 You try to block, late: the guard lands 0.4 s after the press, after the second spell passed.
	# sound cue: button press (no clip in assets/sfx)
	var spell2 := await _cast(LIA_X + 240, 0.3)
	await _flinch(0.0)
	_wolf_hp(80)
	await hold(0.4)  # press-to-guard delay
	var slab := rect(wolf.position + Vector2(-30, 10), Vector2(14, 78), GUARD)
	# sound cue: delayed guard clack (no clip in assets/sfx)
	var delay := big("NETWORK DELAY", Color.WHITE, 30, 92)
	await mark("M2.4")
	var flash := create_tween()
	flash.tween_property(delay, "modulate:a", 0.0, 0.5)
	await flash.finished
	delay.queue_free()
	slab.queue_free()
	spell2.queue_free()

	# ---- M2.5 Knocked off the platform: launched right and up, rotated 20 degrees; DEFEAT after 0.3 s.
	var start := wolf.position
	var tip := Vector2(40, 46)
	var streak := Line2D.new()
	streak.width = 3
	streak.default_color = Color(1, 1, 1, 0.8)
	streak.points = PackedVector2Array([start + tip, start + tip])
	add_child(streak)
	move_child(streak, wolf.get_index())
	_sfx("blast")  # launch whoosh
	var target := Vector2(1130, 170)
	var launch := create_tween().set_parallel(true)
	launch.tween_property(wolf, "position", target, 0.5).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	launch.tween_property(wolf, "rotation_degrees", 20.0, 0.5)
	launch.tween_method(func(p: Vector2): streak.set_point_position(1, p), start + tip, target + tip, 0.5)
	await launch.finished
	await hold(0.3)
	_sfx("ko")  # announcer GAME
	defeat = big("DEFEAT", Color.WHITE, 72, 180)
	defeat.modulate.a = 0.0
	var drop := create_tween().set_parallel(true)
	drop.tween_property(defeat, "position:y", 250.0, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	drop.tween_property(defeat, "modulate:a", 1.0, 0.2)
	await drop.finished
	await mark("M2.5")
	await wait_advance()

	# ---- M2.6 ez, and the same two replies. MATCH CHAT slides up over the frozen result.
	defeat.add_theme_font_size_override("font_size", 44)
	var lift := create_tween()
	lift.tween_property(defeat, "position:y", 100.0, 0.3)
	panel = chat_panel(["lia_ph: ez"], Vector2(190, H), Vector2(900, 380), "00:03")
	timer_lbl = panel.find_child("Timer", true, false) as Label
	_sfx("chat")
	var up := create_tween()
	up.tween_property(panel, "position:y", 170.0, 0.4).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	await up.finished
	var pick := await _choose_timed(REPLIES, Vector2(230, 420), 3.0, "M2.6")

	if pick != "":
		# ---- M2.7A give her credit / M2.7B lash out. Her reply lands 0.8 s later; nothing else changes.
		reply_row.queue_free()
		_chat_add("you: " + pick)
		_sfx("type")  # send blip
		await hold(0.8)
		var a := pick == REPLIES[0]
		_chat_add("lia_ph: " + ("wait weren't you here earlier" if a else "HAHAHA still mad"))
		_sfx("chat")  # reply ping
		await mark("M2.7A" if a else "M2.7B")
		await wait_advance()
	else:
		# ---- M2.7C say nothing: 00:00, the reply box greys out and closes, no message from Lia.
		if timer_lbl:
			timer_lbl.text = "00:00"
		_chat_add("00:00")
		_chat_add("(nothing sent)")
		for b in reply_row.get_children():
			b.queue_free()
		var closed := button("(reply box closed)", 22)
		closed.disabled = true
		closed.modulate.a = 0.55
		closed.custom_minimum_size.x = 820
		reply_row.add_child(closed)
		await mark("M2.7C")
		await hold(1.0)

	# ---- M2.8 Disconnect: the screen folds inward to a line of light.
	await _fold()
	finish({"pick": pick if pick != "" else "silence"})

# ---------- cards' helpers ----------

func _hud() -> void:
	rect(Vector2.ZERO, Vector2(W, ARENA_TOP), BAND)
	rect(Vector2(0, ARENA_TOP + 224 * PIX), Vector2(W, H - ARENA_TOP - 224 * PIX), BAND)
	label("LIA / WIZARD", 20, Color.WHITE, Vector2(40, 18))
	rect(Vector2(40, 52), Vector2(360, 6), Color(1, 1, 1, 0.85))
	label("YOU / WOLF", 20, Color.WHITE, Vector2(880, 18), 360, HORIZONTAL_ALIGNMENT_RIGHT)
	wolf_bar = rect(Vector2(880, 52), Vector2(360, 6), Color.WHITE)

func _wolf_hp(width: float) -> void:
	wolf_bar.position.x = 1240 - width
	wolf_bar.size.x = width

## The one inner line: first match of badge, phone, food among ctx.seen; badge when none.
func _inner_line() -> String:
	var seen: Array = []
	for s in ctx.get("seen", []):
		seen.append(str(s).strip_edges())
	for k in INNER_ORDER:
		if seen.has(k):
			return INNER_LINES[k]
	return INNER_LINES["badge"]

## Lia's cyan spell (Dain's lia-spell sprite), fired rightward from her staff, passing behind the wolf.
func _cast(to_x: float, secs: float) -> Sprite2D:
	var s := pixel_sprite("res://assets/dain/lia-spell.png", Vector2(LIA_X + 30, ARENA_FLOOR - 73 * PIX))
	move_child(s, wolf.get_index())
	s.modulate.a = 0.0
	_sfx("swing")  # spell hiss
	var tw := create_tween().set_parallel(true)
	tw.tween_property(s, "position:x", to_x, secs).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(s, "modulate:a", 1.0, minf(secs, 0.15))
	await tw.finished
	return s

## Hit: pushed right by `push`, flinch tint 0.2 s, feet stay on the platform.
func _flinch(push: float) -> void:
	_sfx("hit")
	var tw := create_tween()
	tw.tween_property(wolf, "position:x", wolf.position.x + push, 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(wolf, "modulate", Color(1, 0.55, 0.55), 0.08)
	tw.tween_property(wolf, "modulate", Color.WHITE, 0.12)
	await tw.finished

## Read-only mid-match chat line, top-right, over the arena.
func _chat_pop(txt: String) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_style(Color("0f1020", 0.92), 6))
	p.position = Vector2(770, 92)
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", 22)
	l.add_theme_color_override("font_color", PINK)
	l.add_theme_font_override("font", _emoji_font())
	p.add_child(l)
	add_child(p)
	_sfx("chat")  # one chat ping
	return p

## Default font with a colour-emoji fallback so "😭" renders instead of a box.
func _emoji_font() -> Font:
	var emoji := SystemFont.new()
	emoji.font_names = PackedStringArray(["Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji"])
	var fv := FontVariation.new()
	fv.base_font = ThemeDB.fallback_font
	var fb: Array[Font] = [emoji]
	fv.fallbacks = fb
	return fv

func _chat_add(txt: String) -> void:
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", 28)
	l.add_theme_color_override("font_color", PINK if txt.begins_with(HER) else Color.WHITE)
	panel.get_child(0).add_child(l)

## The Scene 2 reply pair with a live 3 s timer. Returns the reply, or "" when the clock runs out.
## Autoplay: ctx.pick, "silence" for the timeout, else the first option.
func _choose_timed(options: Array, pos: Vector2, secs: float, mark_card: String) -> String:
	reply_row = HBoxContainer.new()
	reply_row.position = pos
	reply_row.add_theme_constant_override("separation", 24)
	add_child(reply_row)
	_timed_choice = ""
	for o in options:
		var b := button(str(o), 26)
		b.pressed.connect(func(): _timed_choice = str(o))
		reply_row.add_child(b)
	await mark(mark_card)
	if autoplay:
		await hold(0.3)
		var p := str(ctx.get("pick", options[0]))
		if p == "silence":
			return ""
		return p if options.has(p) else str(options[0])
	var left := secs
	var shown := -1
	while _timed_choice == "":
		var s := ceili(left)
		if s != shown:
			shown = s
			if timer_lbl:
				timer_lbl.text = "00:%02d" % maxi(s, 0)
			# sound cue: the timer ticks each second (no tick clip in assets/sfx)
		if left <= 0.0:
			return ""
		left -= get_process_delta_time()
		await get_tree().process_frame
	return _timed_choice

## Capture the frame, then fold its two halves inward to a thin vertical line of light.
func _fold() -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	await clear_children()
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	var halves: Array[Sprite2D] = []
	if img != null:
		var tex := ImageTexture.create_from_image(img)
		var vw := float(img.get_width())
		var vh := float(img.get_height())
		for i in 2:
			var s := Sprite2D.new()
			s.texture = tex
			s.centered = false
			s.region_enabled = true
			s.region_rect = Rect2(i * vw / 2.0, 0, vw / 2.0, vh)
			s.offset = Vector2(-vw / 2.0 if i == 0 else 0.0, 0)
			s.position = Vector2(W / 2.0, 0)
			s.scale = Vector2(W / vw, H / vh)
			add_child(s)
			halves.append(s)
	else:
		push_warning("m2: viewport capture failed; folding a blank frame")
	var crease := rect(Vector2(W / 2.0 - 1, 0), Vector2(2, H), Color(1, 1, 1, 0))
	var over := label("CONNECTION LOST\nRECONNECTING TO HOST: lia_ph", 30, Color.WHITE, Vector2(0, 100), W, HORIZONTAL_ALIGNMENT_CENTER)
	over.add_theme_color_override("font_outline_color", NIGHT)  # reads over the folding frame's own text
	over.add_theme_constant_override("outline_size", 10)
	# sound cue: music pitches down and stops; soft suction, far quieter than the first pull (no clip)
	var tw := create_tween().set_parallel(true)
	for s in halves:
		tw.tween_property(s, "scale:x", s.scale.x * 0.35, 0.55).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tw.tween_property(crease, "color:a", 1.0, 0.55)
	await tw.finished
	await mark("M2.8")
	var tw2 := create_tween().set_parallel(true)
	for s in halves:
		tw2.tween_property(s, "scale:x", 0.0, 0.35)
	tw2.tween_property(crease, "position:x", W / 2.0 - 3, 0.35)
	tw2.tween_property(crease, "size:x", 6.0, 0.35)
	await tw2.finished
	await hold(0.4)

## Existing clip from assets/sfx, loaded straight from the file so the worktree needs no import cache.
func _sfx(name: String) -> void:
	var path := ProjectSettings.globalize_path("res://assets/sfx/%s.mp3" % name)
	if not FileAccess.file_exists(path):
		push_warning("m2: no sound clip " + path)
		return
	var stream := AudioStreamMP3.load_from_file(path)
	if stream == null:
		push_warning("m2: could not load " + path)
		return
	var p := AudioStreamPlayer.new()
	p.stream = stream
	add_child(p)
	p.finished.connect(p.queue_free)
	p.play()

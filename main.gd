extends Node2D
# The whole demo in one script:
#   pick a username -> matchmaking -> a rigged retro match -> you flame her -> the controller
#   hits the screen -> her room, which you explore by clicking -> rematch, same two replies
#   -> what you said both times -> a short feedback form.
# Draft by Claude for Carl and Dain, 2026-10-28. Every line of text is a placeholder until
# you two rewrite it; the Tagalog needs Carl's check.

# GHOST = true is the Checkpoint framing (you were a ghost and climb through the crack).
# GHOST = false is the plain framing (the camera just shows the other side).
const GHOST := false

# PostHog project key (the public "phc_..." key; safe to ship in a web game). Empty = events
# and feedback are only printed and saved to user://feedback.jsonl on the player's machine.
const POSTHOG_KEY := ""
const POSTHOG_URL := "https://us.i.posthog.com/i/v0/e/"

const W := 1280.0
const H := 720.0
# The stone platform in bg-arena.png, measured from the image.
const FLOOR_Y := 436.0
const STAGE_L := 120.0
const STAGE_R := 1160.0
const GRAV := 2400.0
const MATCH_TIME := 30.0
const REPLY_WINDOW := 3.0   # seconds you get to answer "ez" before it counts as silence
const RAGE_AFTER := 3       # losses since the last room visit before RAGE QUIT appears
const FORCED_AFTER := 5     # losses since the last room visit before the controller flies on its own
const MAX_LOSSES := 8
const TAUNTS := ["ez", "ez", "gg ez", "ez", "lol ez", "ez"]
const HER_NAME := "lia_ph"
const OPT_NICE := "wow, you're good"
const OPT_MEAN := "fuck you"
# Where the monitor sits in room-reveal.png (0..1 of width, height); the zoom starts there.
const MONITOR_UV := Vector2(0.66, 0.31)

# Things to click in her room: [name, position in room-reveal.png (0..1), what you learn].
# "phone" opens the phone. The rematch pops once the phone and two other things are seen.
const HOTSPOTS := [
	["monitor", Vector2(0.66, 0.31), "Her rank: Diamond II. 412 hours this season. The one place she is winning."],
	["phone", Vector2(0.83, 0.70), ""],
	["lanyard", Vector2(0.72, 0.90), "Her work ID. Customer care, night shift, 10 PM to 7 AM."],
	["noodles", Vector2(0.83, 0.52), "Pancit canton from a cup. Dinner, at 2 AM."],
	["notes", Vector2(0.84, 0.06), "A note on the wall: Qualifier on Saturday. Prize money is two months of rent."],
	["fan", Vector2(0.14, 0.38), "The electric fan. The aircon costs too much to run."],
]

const PHONE := [
	["Aling Nena (landlady)", "Hija, yung upa mo ha. Bukas na.", "Your rent, okay? It's due tomorrow."],
	["Mama", "Masakit na naman ulo mo? Kaka-computer mo yan.", "Headache again? That's from all the computer."],
	["Mama", "Naglalaro ka na naman? Yan lang ang galing mo sa buhay mo.", "Playing that game again? It's the only thing you're good at in this life of yours."],
	["TL Jasmine", "Shift mo 10PM bukas. Wag ka na ma-late ulit ha.", "Your shift is 10 PM tomorrow. Don't be late again."],
	["Notes", "isang panalo pa tapos tulog na", "one more win, then sleep"],
]

enum S { TITLE, NAME, QUEUE, FIGHT, KO, CHOICE, SENT, POSTMATCH, CRASH, REVEAL, ROOM, PHONE_S, HERSIDE, REMATCH_CARD, END, FEEDBACK, THANKS }


class Fighter:
	var node: Sprite2D
	var pos := Vector2.ZERO
	var vel := Vector2.ZERO
	var dmg := 0.0
	var face := 1
	var native_face := 1
	var cd := 0.0
	var stun := 0.0
	var on_floor := false


class Shot:
	var node: ColorRect
	var pos := Vector2.ZERO
	var vel := Vector2.ZERO
	var power := 1.0


var state: int = S.TITLE
var t := 0.0
var losses := 0
var since_room := 0        # losses since the controller last flew
var rematch := false       # true once you have lost at least once
var loops: Array = []      # one dict per loss: pick, reply_ms, rage
var choices: Array[String] = []
var nice_streak := 0
var visits := 0
var end_reason := ""
var whiffed := false
var match_s := 0.0        # how long the last match ran
var lagged := false
var lag_pending := 0.0
var username := "player"
var session_id := ""
var jump_req := false
var atk_req := false
var advance_req := false
var shake := 0.0
var charging := false
var phone_i := 0
var herside_step := 0
var seen := {}
var fb := {"stars": 0, "pause": ""}

# Self-playing mode for recording frames: godot --path . -- --autoplay
var autoplay := "--autoplay" in OS.get_cmdline_user_args()
var bot_t := 0.0
var bot_dir := 0.0

var world: Node2D
var you := Fighter.new()
var her := Fighter.new()
var shots: Array[Shot] = []
var sfx := {}
var room_loop: AudioStreamPlayer

var crt: ColorRect
var hud_layer: CanvasLayer
var lbl_you: Label
var lbl_her: Label
var lbl_big: Label
var lbl_timer: Label
var chat_box: VBoxContainer
var choice_box: HBoxContainer
var reply_bar: Label
var post_box: HBoxContainer
var rage_btn: Button
var logoff_btn: Button
var top_layer: CanvasLayer
var caption: Label
var crack: TextureRect
var flash: ColorRect
var controller: Sprite2D
var room: Sprite2D
var hotspot_layer: Control
var phone: PanelContainer
var phone_list: VBoxContainer
var portrait: TextureRect
var her_screen: PanelContainer
var her_screen_list: VBoxContainer
var card: Label
var name_box: VBoxContainer
var name_edit: LineEdit
var fb_box: VBoxContainer
var fb_text: LineEdit
var http: HTTPRequest


func _ready() -> void:
	randomize()
	session_id = "%x%x" % [Time.get_unix_time_from_system(), randi()]
	http = HTTPRequest.new()
	add_child(http)
	_load_sfx()
	_build_world()
	_build_hud()
	_build_top()
	_enter(S.TITLE)


# ---------- building ----------

func _tex(path: String, fallback: Vector2i, col: Color) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path)
	var img := Image.create(fallback.x, fallback.y, false, Image.FORMAT_RGBA8)
	img.fill(col)
	return ImageTexture.create_from_image(img)


func _load_sfx() -> void:
	for n in ["swing", "hit", "blast", "ko", "chat", "queue", "smash", "phone", "room"]:
		var p := "res://assets/sfx/%s.mp3" % n
		if ResourceLoader.exists(p):
			var a := AudioStreamPlayer.new()
			a.stream = load(p)
			add_child(a)
			sfx[n] = a
	room_loop = sfx.get("room")
	if room_loop:
		room_loop.volume_db = -6.0


func _play(n: String, pitch := 1.0) -> void:
	if sfx.has(n):
		sfx[n].pitch_scale = pitch
		sfx[n].play()


# Freeze the whole match for a few real milliseconds. The eye reads it as weight.
func _hitstop(secs: float, scale := 0.08) -> void:
	Engine.time_scale = scale
	get_tree().create_timer(secs, true, false, true).timeout.connect(func() -> void:
		Engine.time_scale = 1.0)


func _label(txt: String, size: int, col := Color.WHITE) -> Label:
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_outline_color", Color.BLACK)
	l.add_theme_constant_override("outline_size", 6)
	return l


func _panel(bg: Color, radius := 12) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	sb.set_content_margin_all(14)
	return sb


func _button(txt: String, size := 26) -> Button:
	var b := Button.new()
	b.text = "  " + txt + "  "
	b.add_theme_font_size_override("font_size", size)
	return b


func _build_world() -> void:
	world = Node2D.new()
	add_child(world)
	var bg := Sprite2D.new()
	bg.texture = _tex("res://assets/bg-arena.png", Vector2i(1280, 720), Color(0.25, 0.15, 0.35))
	bg.centered = false
	bg.scale = Vector2(W / bg.texture.get_width(), H / bg.texture.get_height())
	world.add_child(bg)
	if not ResourceLoader.exists("res://assets/bg-arena.png"):
		var plat := ColorRect.new()
		plat.color = Color(0.45, 0.4, 0.5)
		plat.position = Vector2(STAGE_L, FLOOR_Y)
		plat.size = Vector2(STAGE_R - STAGE_L, 40)
		world.add_child(plat)
	for f in [you, her]:
		f.node = Sprite2D.new()
		f.node.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		world.add_child(f.node)
	you.node.texture = _tex("res://assets/fighter-you.png", Vector2i(24, 40), Color(0.9, 0.85, 0.6))
	her.node.texture = _tex("res://assets/fighter-her.png", Vector2i(24, 44), Color(0.9, 0.3, 0.3))
	you.native_face = 1
	her.native_face = -1
	for f in [you, her]:
		# Every fighter is drawn about 150 px tall, feet on the floor.
		var s: float = 150.0 / f.node.texture.get_height()
		f.node.scale = Vector2.ONE * s
		f.node.offset = Vector2(0, -f.node.texture.get_height() / 2.0)
	controller = Sprite2D.new()
	controller.texture = _tex("res://assets/controller.png", Vector2i(40, 24), Color(0.1, 0.1, 0.1))
	controller.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	controller.visible = false
	room = Sprite2D.new()
	room.texture = _tex("res://assets/room-reveal.png", Vector2i(1344, 768), Color(0.12, 0.12, 0.2))
	room.visible = false
	add_child(room)


func _build_hud() -> void:
	hud_layer = CanvasLayer.new()
	hud_layer.layer = 1
	add_child(hud_layer)
	lbl_you = _label("", 40, Color(1, 0.95, 0.7))
	lbl_you.position = Vector2(260, 630)
	hud_layer.add_child(lbl_you)
	lbl_her = _label("", 40, Color(1, 0.6, 0.6))
	lbl_her.position = Vector2(800, 630)
	hud_layer.add_child(lbl_her)
	lbl_timer = _label("", 30)
	lbl_timer.position = Vector2(620, 20)
	hud_layer.add_child(lbl_timer)
	lbl_big = _label("", 120, Color(1, 0.9, 0.2))
	lbl_big.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl_big.position = Vector2(0, 200)
	lbl_big.size = Vector2(W, 160)
	hud_layer.add_child(lbl_big)
	var chat_panel := PanelContainer.new()
	chat_panel.add_theme_stylebox_override("panel", _panel(Color(0, 0, 0, 0.45), 6))
	chat_panel.position = Vector2(20, 20)
	chat_panel.custom_minimum_size = Vector2(380, 0)
	hud_layer.add_child(chat_panel)
	chat_box = VBoxContainer.new()
	chat_panel.add_child(chat_box)
	choice_box = HBoxContainer.new()
	choice_box.add_theme_constant_override("separation", 24)
	choice_box.position = Vector2(330, 300)
	choice_box.visible = false
	hud_layer.add_child(choice_box)
	for opt in [OPT_NICE, OPT_MEAN]:
		var b := _button(opt, 30)
		b.custom_minimum_size = Vector2(290, 70)
		b.pressed.connect(_on_choice.bind(opt))
		choice_box.add_child(b)
	reply_bar = _label("", 26, Color(1, 0.8, 0.5))
	reply_bar.position = Vector2(330, 390)
	reply_bar.visible = false
	hud_layer.add_child(reply_bar)
	# The old-TV filter sits above the match and its chat, below everything after the crash.
	var crt_layer := CanvasLayer.new()
	crt_layer.layer = 2
	add_child(crt_layer)
	crt = ColorRect.new()
	crt.size = Vector2(W, H)
	crt.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = load("res://crt.gdshader")
	crt.material = mat
	crt_layer.add_child(crt)


func _build_top() -> void:
	top_layer = CanvasLayer.new()
	top_layer.layer = 3
	add_child(top_layer)
	crack = TextureRect.new()
	crack.texture = _tex("res://assets/crack.png", Vector2i(4, 4), Color(1, 1, 1, 0))
	crack.size = Vector2(W, H)
	crack.stretch_mode = TextureRect.STRETCH_SCALE
	crack.visible = false
	crack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_layer.add_child(crack)
	var holder := Node2D.new()
	top_layer.add_child(holder)
	holder.add_child(controller)
	hotspot_layer = Control.new()
	hotspot_layer.size = Vector2(W, H)
	hotspot_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hotspot_layer.visible = false
	top_layer.add_child(hotspot_layer)
	portrait = TextureRect.new()
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.position = Vector2(40, 60)
	portrait.size = Vector2(600, 600)
	portrait.visible = false
	top_layer.add_child(portrait)
	phone = PanelContainer.new()
	phone.add_theme_stylebox_override("panel", _panel(Color(0.08, 0.08, 0.1, 0.97), 36))
	phone.position = Vector2(840, 740)
	phone.custom_minimum_size = Vector2(400, 0)
	top_layer.add_child(phone)
	phone_list = VBoxContainer.new()
	phone_list.add_theme_constant_override("separation", 10)
	phone.add_child(phone_list)
	her_screen = PanelContainer.new()
	her_screen.add_theme_stylebox_override("panel", _panel(Color(0, 0, 0, 0.8), 6))
	her_screen.position = Vector2(700, 200)
	her_screen.custom_minimum_size = Vector2(480, 220)
	her_screen.visible = false
	top_layer.add_child(her_screen)
	her_screen_list = VBoxContainer.new()
	her_screen.add_child(her_screen_list)
	post_box = HBoxContainer.new()
	post_box.add_theme_constant_override("separation", 40)
	post_box.position = Vector2(380, 430)
	post_box.visible = false
	top_layer.add_child(post_box)
	var again := _button("REMATCH", 34)
	again.custom_minimum_size = Vector2(240, 80)
	again.pressed.connect(_on_rematch)
	post_box.add_child(again)
	rage_btn = _button("RAGE QUIT", 34)
	rage_btn.custom_minimum_size = Vector2(240, 80)
	rage_btn.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	rage_btn.pressed.connect(_on_rage)
	post_box.add_child(rage_btn)
	logoff_btn = _button("log off", 22)
	logoff_btn.position = Vector2(W - 170, 20)
	logoff_btn.visible = false
	logoff_btn.pressed.connect(_on_logoff)
	top_layer.add_child(logoff_btn)
	caption = _label("", 28)
	caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	caption.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	caption.position = Vector2(100, 630)
	caption.size = Vector2(W - 200, 80)
	top_layer.add_child(caption)
	card = _label("", 40)
	card.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	card.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	card.position = Vector2(140, 0)
	card.size = Vector2(W - 280, H)
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_layer.add_child(card)
	# Username entry.
	name_box = VBoxContainer.new()
	name_box.position = Vector2(390, 420)
	name_box.custom_minimum_size = Vector2(500, 0)
	name_box.add_theme_constant_override("separation", 12)
	name_box.visible = false
	top_layer.add_child(name_box)
	name_edit = LineEdit.new()
	name_edit.placeholder_text = "your username"
	name_edit.max_length = 16
	name_edit.add_theme_font_size_override("font_size", 32)
	name_edit.text_submitted.connect(func(_s: String) -> void: _submit_name())
	name_box.add_child(name_edit)
	var play := _button("Play", 30)
	play.pressed.connect(_submit_name)
	name_box.add_child(play)
	# Feedback form.
	fb_box = VBoxContainer.new()
	fb_box.position = Vector2(240, 110)
	fb_box.custom_minimum_size = Vector2(800, 0)
	fb_box.add_theme_constant_override("separation", 14)
	fb_box.visible = false
	top_layer.add_child(fb_box)
	fb_box.add_child(_label("How did that feel? (1 = nothing, 5 = it got me)", 26))
	var stars := HBoxContainer.new()
	stars.add_theme_constant_override("separation", 12)
	fb_box.add_child(stars)
	for i in range(1, 6):
		var b := _button(str(i), 28)
		b.toggle_mode = true
		b.pressed.connect(func() -> void:
			fb["stars"] = i
			for c in stars.get_children():
				c.button_pressed = c == b)
		stars.add_child(b)
	fb_box.add_child(_label("Next time someone types \"ez\" at you, will you pause before typing back?", 26))
	var pause_row := HBoxContainer.new()
	pause_row.add_theme_constant_override("separation", 12)
	fb_box.add_child(pause_row)
	for opt in ["yes", "maybe", "no"]:
		var b := _button(opt, 28)
		b.toggle_mode = true
		b.pressed.connect(func() -> void:
			fb["pause"] = opt
			for c in pause_row.get_children():
				c.button_pressed = c == b)
		pause_row.add_child(b)
	fb_box.add_child(_label("Anything else? (optional)", 26))
	fb_text = LineEdit.new()
	fb_text.max_length = 280
	fb_text.add_theme_font_size_override("font_size", 24)
	fb_box.add_child(fb_text)
	var send := _button("Send", 28)
	send.pressed.connect(_send_feedback)
	fb_box.add_child(send)
	flash = ColorRect.new()
	flash.color = Color(1, 1, 1, 0)
	flash.size = Vector2(W, H)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_layer.add_child(flash)


# Screen position of a point given as 0..1 of the room picture, at the room's resting zoom.
func _room_point(uv: Vector2) -> Vector2:
	var tex_size := Vector2(room.texture.get_width(), room.texture.get_height())
	var fit: float = max(W / tex_size.x, H / tex_size.y)
	return Vector2(W / 2, H / 2) + (uv - Vector2(0.5, 0.5)) * tex_size * fit


func _build_hotspots() -> void:
	for c in hotspot_layer.get_children():
		c.queue_free()
	for h in HOTSPOTS.slice(0, _hotspots_now()):
		var b := Button.new()
		b.flat = true
		b.text = "◯"
		b.tooltip_text = h[0]
		b.add_theme_font_size_override("font_size", 44)
		b.add_theme_color_override("font_color", Color(1, 1, 0.7, 0.9))
		b.add_theme_color_override("font_hover_color", Color(1, 1, 1, 1))
		b.size = Vector2(70, 70)
		b.position = _room_point(h[1]) - b.size / 2.0
		b.pressed.connect(_on_hotspot.bind(h[0], h[2], b))
		hotspot_layer.add_child(b)
		var tw := b.create_tween().set_loops()
		tw.tween_property(b, "modulate:a", 0.35, 0.7)
		tw.tween_property(b, "modulate:a", 1.0, 0.7)
		b.set_meta("tw", tw)


func _hotspots_now() -> int:
	# Visit 1 shows the phone and two things; every later visit adds one more.
	return min(HOTSPOTS.size(), 2 + visits)


# ---------- state machine ----------

func _enter(s: int) -> void:
	state = s
	t = 0.0
	match s:
		S.TITLE:
			card.text = "GG\n\n[ space ]\n\nmove: A D or arrows   jump: W   sword: J"
			fb_box.visible = false
			_show_match(true)
		S.NAME:
			card.text = "Pick a username"
			card.position.y = -120
			name_box.visible = true
			name_edit.grab_focus()
		S.QUEUE:
			card.position.y = 0
			name_box.visible = false
			card.text = "Finding a match..."
			_track("queue", {})
		S.FIGHT:
			card.text = ""
			lbl_big.text = ""
			post_box.visible = false
			charging = false
			whiffed = false
			lagged = false
			lag_pending = 0.0
			her.dmg = 0.0
			you.pos = Vector2(420, FLOOR_Y)
			you.vel = Vector2.ZERO
			you.dmg = 0.0
			you.stun = 0.0
			you.face = 1
			her.pos = Vector2(860, FLOOR_Y)
			her.vel = Vector2.ZERO
			her.cd = 1.2
			for sh in shots:
				sh.node.queue_free()
			shots.clear()
		S.KO:
			losses += 1
			since_room += 1
			lbl_big.add_theme_color_override("font_color", Color(1, 0.9, 0.2))
			lbl_big.text = "KO"
			Engine.time_scale = 1.0
			lbl_her.scale = Vector2.ONE
			if her.dmg >= 90.0:
				card.text = "\n\n\n\n\n\n\n\n\nshe had %d%% to go" % int(100.0 - her.dmg)
			elif her.dmg >= 50.0:
				card.text = "\n\n\n\n\n\n\n\n\nshe was at %d%%" % int(her.dmg)
			_play("ko")
			_chat(HER_NAME, TAUNTS[min(losses - 1, TAUNTS.size() - 1)], Color(1, 0.6, 0.6))
			_track("ko", {"loss": losses, "her_dmg": int(her.dmg), "you_dmg": int(you.dmg), "match_s": snapped(match_s, 0.1)})
		S.CHOICE:
			lbl_big.text = ""
			card.text = ""
			choice_box.visible = true
			reply_bar.visible = true
		S.SENT:
			choice_box.visible = false
			reply_bar.visible = false
		S.POSTMATCH:
			rematch = true
			card.text = "Defeat %d\n\n%s is still in the lobby.\n\n\n\n\n\n" % [losses, HER_NAME]
			rage_btn.visible = since_room >= RAGE_AFTER
			post_box.visible = true
		S.CRASH:
			post_box.visible = false
			card.text = ""
			since_room = 0
			controller.visible = true
			controller.position = Vector2(W / 2, H + 150)
			controller.scale = Vector2.ONE * 1.5
			controller.rotation = -0.6
			var tw := create_tween().set_parallel(true)
			tw.tween_property(controller, "position", Vector2(W / 2 + 40, H / 2 - 20), 0.35).set_ease(Tween.EASE_IN)
			tw.tween_property(controller, "scale", Vector2.ONE * 9.0, 0.35).set_ease(Tween.EASE_IN)
			tw.tween_property(controller, "rotation", 0.4, 0.35)
			tw.chain().tween_callback(_impact)
		S.REVEAL:
			visits += 1
			seen.clear()
			crack.visible = false
			controller.visible = false
			_show_match(false)
			room.visible = true
			room.modulate = Color.WHITE
			if room_loop:
				room_loop.play()
			var tex_size := Vector2(room.texture.get_width(), room.texture.get_height())
			var fit: float = max(W / tex_size.x, H / tex_size.y)
			var start := fit * 2.8
			room.scale = Vector2.ONE * start
			room.position = Vector2(W / 2, H / 2) - (MONITOR_UV - Vector2(0.5, 0.5)) * tex_size * start
			var tw := create_tween().set_parallel(true).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
			tw.tween_property(room, "scale", Vector2.ONE * fit, 4.0)
			tw.tween_property(room, "position", Vector2(W / 2, H / 2), 4.0)
			caption.text = "You climb through the crack." if GHOST else "Meanwhile, on the other side of the match."
		S.ROOM:
			room.modulate = Color.WHITE
			hotspot_layer.visible = true
			logoff_btn.visible = true
			if seen.is_empty():
				_build_hotspots()
				var minute := 14 + 26 * (visits - 1)
				caption.text = "%d:%02d AM, Quezon City. Look around." % [2 + minute / 60, minute % 60] if visits == 1 \
					else "%d:%02d AM. Her room again. Something you did not see last time." % [2 + minute / 60, minute % 60]
		S.PHONE_S:
			hotspot_layer.visible = false
			logoff_btn.visible = false
			caption.text = "[ space ]"
			phone_i = 0
			for c in phone_list.get_children():
				c.queue_free()
			_play("phone")
			create_tween().tween_property(room, "modulate", Color(0.55, 0.55, 0.6), 0.6)
			create_tween().tween_property(phone, "position", Vector2(840, 24), 0.5).set_trans(Tween.TRANS_BACK)
		S.HERSIDE:
			hotspot_layer.visible = false
			logoff_btn.visible = false
			create_tween().tween_property(room, "modulate", Color(0.55, 0.55, 0.6), 0.6)
			herside_step = 0
			portrait.texture = _tex("res://assets/portrait-her-sad.png", Vector2i(400, 400), Color(0.3, 0.3, 0.4))
			portrait.visible = true
			her_screen.visible = true
			for c in her_screen_list.get_children():
				c.queue_free()
			_screen_line("[%s] %s" % [HER_NAME, TAUNTS[min(losses - 1, TAUNTS.size() - 1)]], Color(1, 0.6, 0.6))
			var last: String = choices[-1] if choices.size() > 0 else ""
			if last == OPT_MEAN:
				_screen_line("[%s] %s" % [username, OPT_MEAN], Color(1, 0.95, 0.7))
				caption.text = "She reads it.   [ space ]"
			elif last == "":
				_screen_line("[%s left the match]" % username, Color(0.7, 0.7, 0.7))
				caption.text = "You said nothing. She only saw you leave.   [ space ]"
			elif losses == 1:
				_screen_line("[%s left the match]" % username, Color(0.7, 0.7, 0.7))
				caption.text = "Your message never reached her. She only saw you leave.   [ space ]"
			else:
				_screen_line("[%s] %s" % [username, OPT_NICE], Color(1, 0.95, 0.7))
				caption.text = "She reads it twice.   [ space ]"
		S.REMATCH_CARD:
			portrait.visible = false
			her_screen.visible = false
			room.visible = false
			if room_loop:
				room_loop.stop()
			caption.text = ""
			_show_match(true)
			_play("queue")
			card.text = "Match found: %s\n\n[ space ]" % HER_NAME
		S.END:
			_show_match(false)
			post_box.visible = false
			logoff_btn.visible = false
			room.visible = false
			if room_loop:
				room_loop.stop()
			var lines: Array[String] = []
			for i in loops.size():
				var l: Dictionary = loops[i]
				var how: String = "rage quit" if l["rage"] else "%.1f s" % (l["reply_ms"] / 1000.0)
				lines.append("loss %d: %s   (%s)" % [i + 1, l["pick"], how])
			var tail := ""
			match end_reason:
				"nice_twice":
					tail = "[%s] gg. you too.\n\n%s logged off at 3:02 AM. Her shift starts at 10 PM." % [HER_NAME, HER_NAME]
				"quit_room":
					tail = "You logged off from her room.\n%s is still queuing." % HER_NAME
				_:
					tail = "%s is still queuing. So were you." % HER_NAME
			card.text = "\n".join(lines) + "\n\n" + tail + "\n\n[ space ]"
			_track("result", {"losses": losses, "picks": choices.duplicate(), "visits": visits, "reason": end_reason, "loops": loops.duplicate(true)})
		S.FEEDBACK:
			card.text = ""
			fb_box.visible = true
		S.THANKS:
			fb_box.visible = false
			card.text = "Thank you. gg.\n\n[ space to play again ]"


func _show_match(on: bool) -> void:
	world.visible = on
	hud_layer.visible = on
	crt.visible = on
	if on:
		crt.material.set_shader_parameter("strength", 1.0)


func _impact() -> void:
	crack.visible = true
	controller.visible = false
	shake = 0.6
	_play("smash")
	flash.color = Color(1, 1, 1, 1)
	create_tween().tween_property(flash, "color", Color(1, 1, 1, 0), 0.5)


func _submit_name() -> void:
	if state != S.NAME:
		return
	var n := name_edit.text.strip_edges()
	username = n if n != "" else "player%d" % (randi() % 9000 + 1000)
	_track("start", {"username": username})
	_enter(S.QUEUE)


# opt == "" means the reply window closed with nothing typed.
func _on_choice(opt: String) -> void:
	if state != S.CHOICE:
		return
	var reply_ms := int(t * 1000.0)
	choices.append(opt)
	loops.append({"pick": opt if opt != "" else "said nothing", "reply_ms": reply_ms, "rage": false})
	_track("choice", {"pick": opt if opt != "" else "nothing", "reply_ms": reply_ms, "loss": losses})
	if opt == "":
		_chat("system", "%s left the match." % username, Color(0.7, 0.7, 0.7))
	else:
		_chat(username, opt, Color(1, 0.95, 0.7))
	if losses == 1 and opt == OPT_NICE:
		# Rigged: the first kind word does not go through. It does not count toward the streak.
		_chat("system", "Message could not be sent.", Color(0.7, 0.7, 0.7))
		nice_streak = 0
	elif opt == OPT_NICE:
		nice_streak += 1
	else:
		nice_streak = 0
	# The game ends on two kind replies in a row, once you have seen her room.
	if nice_streak >= 2 and visits >= 1:
		end_reason = "nice_twice"
	_enter(S.SENT)


func _on_rematch() -> void:
	if state != S.POSTMATCH:
		return
	_track("rematch", {"loss": losses})
	_enter(S.QUEUE)


func _on_rage() -> void:
	if state != S.POSTMATCH:
		return
	if loops.size() > 0:
		loops[-1]["rage"] = true
	_track("rage_quit", {"loss": losses, "since_room": since_room})
	_enter(S.CRASH)


func _on_logoff() -> void:
	if state != S.ROOM:
		return
	end_reason = "quit_room"
	_track("logoff", {"loss": losses, "visit": visits})
	_enter(S.END)


func _on_hotspot(thing: String, line: String, b: Button) -> void:
	if state != S.ROOM:
		return
	seen[thing] = true
	if b.has_meta("tw"):
		b.get_meta("tw").kill()
	b.modulate = Color(1, 1, 1, 0.25)
	_track("look", {"thing": thing})
	if thing == "phone":
		_enter(S.PHONE_S)
		return
	caption.text = line
	_check_room_done()


func _check_room_done() -> void:
	if seen.has("phone") and seen.size() >= _hotspots_now() and state == S.ROOM:
		get_tree().create_timer(2.5).timeout.connect(func() -> void:
			if state == S.ROOM:
				_play("queue")
				caption.text = "Her screen: MATCH FOUND."
				get_tree().create_timer(1.5).timeout.connect(func() -> void:
					if state == S.ROOM:
						_enter(S.HERSIDE)))


func _send_feedback() -> void:
	var props := {"stars": fb["stars"], "pause": fb["pause"], "text": fb_text.text.strip_edges(),
		"losses": losses, "picks": choices.duplicate(), "reason": end_reason}
	_track("feedback", props)
	_enter(S.THANKS)


func _input(event: InputEvent) -> void:
	if state in [S.NAME, S.FEEDBACK]:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_W, KEY_UP:
				jump_req = true
			KEY_J, KEY_Z, KEY_X:
				atk_req = true
			KEY_SPACE, KEY_ENTER:
				advance_req = true
	elif event is InputEventMouseButton and event.pressed and state in [S.TITLE, S.PHONE_S, S.HERSIDE, S.REMATCH_CARD, S.END, S.THANKS]:
		advance_req = true


func _process(d: float) -> void:
	t += d
	if autoplay:
		_bot(d)
	var adv := advance_req
	advance_req = false
	match state:
		S.TITLE:
			if adv:
				losses = 0
				since_room = 0
				rematch = false
				choices.clear()
				loops.clear()
				nice_streak = 0
				visits = 0
				end_reason = ""
				seen.clear()
				fb = {"stars": 0, "pause": ""}
				fb_text.text = ""
				for c in chat_box.get_children():
					c.queue_free()
				_enter(S.NAME)
		S.QUEUE:
			var wait := 2.0 if rematch else 4.0
			if t < wait:
				card.text = "Finding a match...  0:%02d" % int(t)
			elif card.text.begins_with("Finding"):
				_play("queue")
				card.text = "Match found: %s\n\nYou: %s" % [HER_NAME, username]
			if t > wait + 2.0:
				_enter(S.FIGHT)
		S.FIGHT:
			_fight(d)
		S.KO:
			if t > 1.6:
				_enter(S.CHOICE)
		S.CHOICE:
			reply_bar.text = "reply   %.1f" % max(REPLY_WINDOW - t, 0.0)
			if t > REPLY_WINDOW:
				_on_choice("")
		S.SENT:
			if t > 1.4:
				if end_reason != "" or losses >= MAX_LOSSES:
					if end_reason == "":
						end_reason = "max_losses"
					_enter(S.END)
				elif since_room >= FORCED_AFTER:
					# Nobody pressed anything. The controller goes anyway.
					if loops.size() > 0:
						loops[-1]["rage"] = true
					_track("rage_quit", {"loss": losses, "since_room": since_room, "forced": true})
					_enter(S.CRASH)
				else:
					_enter(S.POSTMATCH)
		S.POSTMATCH:
			if adv:
				_on_rematch()
		S.CRASH:
			if t > 2.6:
				_enter(S.REVEAL)
		S.REVEAL:
			if t > 4.5:
				_enter(S.ROOM)
		S.PHONE_S:
			if adv:
				if phone_i < PHONE.size():
					_play("chat")
					_phone_msg(PHONE[phone_i])
					phone_i += 1
				else:
					create_tween().tween_property(phone, "position", Vector2(840, 740), 0.4)
					caption.text = "Look around."
					_enter(S.ROOM)
					_check_room_done()
		S.HERSIDE:
			if adv:
				herside_step += 1
				if herside_step == 1:
					portrait.texture = _tex("res://assets/portrait-her.png", Vector2i(400, 400), Color(0.3, 0.3, 0.4))
					_screen_line("[%s] queue again" % HER_NAME, Color(1, 0.6, 0.6))
					caption.text = "\"Isang laro pa.\" (One more game.)   [ space ]"
				else:
					_enter(S.REMATCH_CARD)
		S.REMATCH_CARD:
			if adv:
				rematch = true
				card.text = ""
				_enter(S.FIGHT)
		S.END:
			if adv:
				_enter(S.FEEDBACK)
		S.THANKS:
			if adv:
				_enter(S.TITLE)
	jump_req = false
	atk_req = false
	if shake > 0.0:
		shake -= d
		position = Vector2(randf_range(-12, 12), randf_range(-12, 12)) * (shake / 0.6)
	else:
		position = Vector2.ZERO


# ---------- the rigged match ----------

func _fight(d: float) -> void:
	var limit: float = MATCH_TIME
	match_s = t
	lbl_timer.text = "%d" % ceil(max(limit - t, 0.0))
	_update_you(d)
	_update_her(d, limit)
	_step(you, d)
	_step(her, d)
	_update_shots(d)
	lbl_you.text = "%s  %d%%" % [username, int(you.dmg)]
	lbl_her.text = "%s  %d%%" % [HER_NAME, int(her.dmg)]
	lbl_her.add_theme_color_override("font_color", Color(1, 0.25, 0.25) if her.dmg >= 90.0 else Color(1, 0.6, 0.6))
	lbl_her.scale = Vector2.ONE * (1.0 + 0.08 * sin(t * 18.0)) if her.dmg >= 90.0 else Vector2.ONE
	if you.pos.x < -150 or you.pos.x > W + 150 or you.pos.y > H + 250 or you.pos.y < -400:
		_enter(S.KO)


func _update_you(d: float) -> void:
	var dir := bot_dir
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		dir -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		dir += 1.0
	dir = clamp(dir, -1.0, 1.0)
	if you.stun > 0.0:
		you.stun -= d
	else:
		you.vel.x = move_toward(you.vel.x, dir * 380.0, 3200.0 * d)
		if dir != 0.0:
			you.face = int(sign(dir))
		if jump_req and you.on_floor:
			you.vel.y = -950.0
	you.cd -= d
	if lag_pending > 0.0:
		lag_pending -= d
		if lag_pending <= 0.0:
			atk_req = true
	if atk_req and her.dmg >= 90.0 and not lagged:
		# Rigged: the one input that mattered arrives late.
		lagged = true
		lag_pending = 0.45
		_big("...", Color(0.7, 0.7, 0.7))
		atk_req = false
	if atk_req and you.cd <= 0.0:
		you.cd = 0.35
		_play("swing")
		var tw := create_tween()
		tw.tween_property(you.node, "rotation", 0.5 * you.face, 0.06)
		tw.tween_property(you.node, "rotation", 0.0, 0.1)
		var gap := her.pos - you.pos
		if abs(gap.x) < 150.0 and abs(gap.y) < 140.0 and sign(gap.x) == you.face:
			if her.dmg >= 90.0 and not whiffed:
				# Rigged: the finisher whiffs, once, when she is one hit from gone.
				whiffed = true
				her.pos.x = clamp(her.pos.x + 330.0 * sign(gap.x), STAGE_L + 50.0, STAGE_R - 50.0)
				_big("WHIFF", Color(1, 1, 1))
				_play("swing", 0.55)
				_hitstop(0.1, 0.2)
			elif randf() < 0.3:
				her.pos.x = clamp(her.pos.x + 330.0 * sign(gap.x), STAGE_L + 50.0, STAGE_R - 50.0)
			else:
				_play("hit")
				her.dmg += randf_range(9.0, 14.0)
				her.vel.x = (160.0 + her.dmg * 5.0) * sign(gap.x)
				her.stun = 0.15
				shake = 0.08
				_hitstop(0.06 if her.dmg < 90.0 else 0.14)
				var fl := create_tween()
				fl.tween_property(her.node, "modulate", Color(3, 3, 3), 0.05)
				fl.tween_property(her.node, "modulate", Color.WHITE, 0.08)


func _update_her(d: float, limit: float) -> void:
	var dx := you.pos.x - her.pos.x
	her.face = 1 if dx > 0.0 else -1
	var target := 0.0
	if abs(dx) > 320.0:
		target = sign(dx) * 300.0
	elif abs(dx) < 200.0:
		target = -sign(dx) * 300.0
	if (her.pos.x < STAGE_L + 70.0 and target < 0.0) or (her.pos.x > STAGE_R - 70.0 and target > 0.0):
		target = 0.0
	if her.stun > 0.0:
		her.stun -= d
	else:
		her.vel.x = move_toward(her.vel.x, target, 2600.0 * d)
	# Rigged: she never leaves the stage, however hard she is hit. She "teched it".
	her.pos.x = clamp(her.pos.x, STAGE_L + 40.0, STAGE_R - 40.0)
	if her.on_floor and randf() < 0.7 * d:
		her.vel.y = -850.0
	if (t > limit or her.dmg >= 90.0) and not charging:
		# Time is up, or she is one hit from gone: she winds up one shot you cannot survive.
		charging = true
		her.cd = 0.8
		var tw := create_tween().set_loops(4)
		tw.tween_property(her.node, "modulate", Color(3, 3, 3), 0.1)
		tw.tween_property(her.node, "modulate", Color.WHITE, 0.1)
	her.cd -= d
	if her.cd <= 0.0:
		if charging:
			# Keeps firing the finisher until it lands, so a round can never stall.
			_fire(her, 7.0)
			her.cd = 0.5
		else:
			_fire(her, 1.0)
			her.cd = randf_range(0.6, 1.1)


func _step(f: Fighter, d: float) -> void:
	var prev_y := f.pos.y
	f.vel.y += GRAV * d
	f.pos += f.vel * d
	var over := f.pos.x > STAGE_L and f.pos.x < STAGE_R
	if over and f.vel.y >= 0.0 and prev_y <= FLOOR_Y + 1.0 and f.pos.y >= FLOOR_Y:
		f.pos.y = FLOOR_Y
		f.vel.y = 0.0
		f.on_floor = true
		if f.stun > 0.0:
			f.vel.x = move_toward(f.vel.x, 0.0, 1500.0 * d)
	else:
		f.on_floor = false
	f.node.position = f.pos
	f.node.flip_h = f.face != f.native_face


func _fire(f: Fighter, power: float) -> void:
	var sh := Shot.new()
	sh.node = ColorRect.new()
	sh.node.color = Color(0.4, 0.9, 1.0) if power < 2.0 else Color(1.0, 1.0, 0.6)
	sh.node.size = Vector2(26, 10) * (1.0 if power < 2.0 else 2.2)
	sh.power = power
	sh.pos = f.pos + Vector2(40.0 * f.face, -75.0)
	sh.vel = Vector2(950.0 * f.face, 0.0)
	if power >= 2.0:
		sh.vel = (you.pos + Vector2(0, -60) - sh.pos).normalized() * 1100.0
	_play("blast")
	world.add_child(sh.node)
	shots.append(sh)


func _update_shots(d: float) -> void:
	for sh: Shot in shots.duplicate():
		sh.pos += sh.vel * d
		sh.node.position = sh.pos - sh.node.size / 2.0
		var hit: bool = sh.pos.distance_to(you.pos + Vector2(0, -60)) < 60.0 * (1.0 if sh.power < 2.0 else 1.8)
		if hit:
			_play("hit")
			you.dmg += randf_range(8.0, 13.0) if sh.power < 2.0 else 40.0
			var knock: float = (220.0 + you.dmg * 9.0) * (1.0 if sh.power < 2.0 else 2.5)
			you.vel = Vector2(sign(sh.vel.x) * knock, -knock * 0.5)
			you.stun = 0.2 + you.dmg * 0.004
			shake = 0.15 if sh.power < 2.0 else 0.4
			_hitstop(0.05 if sh.power < 2.0 else 0.22, 0.08 if sh.power < 2.0 else 0.03)
		if hit or sh.pos.x < -100.0 or sh.pos.x > W + 100.0 or sh.pos.y < -200.0 or sh.pos.y > H + 200.0:
			sh.node.queue_free()
			shots.erase(sh)


# ---------- text, metrics, test bot ----------

func _big(txt: String, col: Color, secs := 0.5) -> void:
	lbl_big.text = txt
	lbl_big.add_theme_color_override("font_color", col)
	get_tree().create_timer(secs).timeout.connect(func() -> void:
		if state == S.FIGHT and lbl_big.text == txt:
			lbl_big.text = "")


func _chat(who: String, msg: String, col: Color) -> void:
	_play("chat")
	chat_box.add_child(_label("[%s] %s" % [who, msg], 24, col))
	while chat_box.get_child_count() > 7:
		var old := chat_box.get_child(0)
		chat_box.remove_child(old)
		old.queue_free()


func _screen_line(msg: String, col: Color) -> void:
	her_screen_list.add_child(_label(msg, 28, col))


func _phone_msg(m: Array) -> void:
	var box := VBoxContainer.new()
	box.add_child(_label(m[0], 16, Color(0.6, 0.8, 1.0)))
	var body := _label(m[1], 20)
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.custom_minimum_size = Vector2(370, 0)
	box.add_child(body)
	var tr := _label(m[2], 15, Color(0.72, 0.72, 0.72))
	tr.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tr.custom_minimum_size = Vector2(370, 0)
	box.add_child(tr)
	phone_list.add_child(box)


func _track(event: String, props: Dictionary) -> void:
	props["session"] = session_id
	props["username"] = username
	props["build"] = "web" if OS.has_feature("web") else OS.get_name()
	print("[gg] ", event, " ", JSON.stringify(props))
	if event == "feedback" or event == "result":
		var f := FileAccess.open("user://feedback.jsonl", FileAccess.READ_WRITE if FileAccess.file_exists("user://feedback.jsonl") else FileAccess.WRITE)
		if f:
			f.seek_end()
			f.store_line(JSON.stringify({"event": event, "props": props}))
			f.close()
	if POSTHOG_KEY == "" or autoplay:
		return
	var body := JSON.stringify({"api_key": POSTHOG_KEY, "event": "gg_" + event, "distinct_id": session_id, "properties": props})
	# One request at a time per HTTPRequest node; a busy node gets a fresh one.
	var req := http if http.get_http_client_status() == HTTPClient.STATUS_DISCONNECTED else HTTPRequest.new()
	if req != http:
		add_child(req)
		req.request_completed.connect(func(_a, _b, _c, _d) -> void: req.queue_free())
	var err := req.request(POSTHOG_URL, ["Content-Type: application/json"], HTTPClient.METHOD_POST, body)
	if err != OK:
		push_error("PostHog send failed: %d" % err)


func _bot(d: float) -> void:
	bot_t += d
	if state == S.FIGHT:
		bot_dir = sign(her.pos.x - you.pos.x)
		if randf() < 1.5 * d:
			jump_req = true
		if randf() < 4.0 * d:
			atk_req = true
	else:
		bot_dir = 0.0
	if state == S.NAME and t > 1.0:
		name_edit.text = "carl_ph"
		_submit_name()
	if state in [S.TITLE, S.PHONE_S, S.HERSIDE, S.REMATCH_CARD, S.END] and bot_t > 1.6:
		bot_t = 0.0
		advance_req = true
	if state == S.ROOM and bot_t > 1.6:
		bot_t = 0.0
		for b in hotspot_layer.get_children():
			if b is Button and not seen.has(b.tooltip_text):
				b.pressed.emit()
				break
	# Bot script: mean, silent, mean then rage quit, nice, nice -> end.
	if state == S.CHOICE and t > 1.2 and losses != 2:
		_on_choice(OPT_NICE if losses >= 4 else OPT_MEAN)
	if state == S.POSTMATCH and bot_t > 1.6:
		bot_t = 0.0
		if since_room >= RAGE_AFTER:
			_on_rage()
		else:
			_on_rematch()
	if state == S.FEEDBACK and t > 1.5:
		fb["stars"] = 4
		fb["pause"] = "maybe"
		_send_feedback()
	if state == S.THANKS and t > 2.0:
		get_tree().quit()

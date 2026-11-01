extends "res://scenes/story/story_scene.gd"
## Scene 1: the title screen and matchmaking. The ten approved cards from SCENE-01.md, 1.01 to 1.10.
## The city, menu and matchmaking panel are graybox rects and labels. The two fighters and the arena
## reveal are Dain's sprites. Sound cues with no clip in assets/sfx are left as comments.

const GROUND := 560.0                  # ground line of the title-screen city, 1280x720 frame
const MENU_CX := 540.0                 # the menu block sits a little left of centre, as on the board
const START_POS := Vector2(320, 306)
const START_SIZE := Vector2(440, 84)
const PANEL_POS := Vector2(125, 110)   # matchmaking panel, board column C scaled x2
const PANEL_SIZE := Vector2(1027, 505)
const PANEL_X := 178.0                 # left edge of the panel text
const FIELD := Color("0f1020")
const PANEL_BG := Color("16172c")
const CELL_OFF := Color("2a2c44")
const CITY_A := Color("2c2e4c")
const CITY_B := Color("3a3c5c")
const VIOLET := Color("7b6fb5")

var menu: Node2D                       # title, subtitle and the Start box; moves as one during the snap
var start_box: ColorRect
var start_text: Label
var trails: Array[Node] = []

func run() -> void:
	# ---- A / MENU ----
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	_city()
	var wolf := pixel_sprite("res://assets/dain/wolf.png", Vector2(380, GROUND - 37 * 2.0), 2.0, true)
	var lia := pixel_sprite("res://assets/dain/lia-wizard.png", Vector2(860, GROUND - 43 * 2.0), 2.0, true)
	menu = Node2D.new()
	add_child(menu)
	_into(menu, label("GG EZ", 150, Color.WHITE, Vector2(MENU_CX - 500, 70), 1000, HORIZONTAL_ALIGNMENT_CENTER))
	_into(menu, label("READY FOR ANOTHER ROUND?", 22, Color.WHITE, Vector2(MENU_CX - 500, 250), 1000, HORIZONTAL_ALIGNMENT_CENTER))
	_into(menu, rect(Vector2(MENU_CX - 150, 290), Vector2(300, 2), DIM))
	start_box = _into(menu, rect(START_POS, START_SIZE, FIELD))
	start_text = _into(menu, label("START GAME", 34, Color.WHITE, START_POS + Vector2(0, 20), START_SIZE.x, HORIZONTAL_ALIGNMENT_CENTER))
	label("OPTIONS · CREDITS", 22, DIM, Vector2(0, 648), W, HORIZONTAL_ALIGNMENT_CENTER)
	# SOUND: energetic arcade loop and light combat ticks. No loop clip in assets/sfx.
	await mark("1.01")
	await wait_advance()                # 1.01 holds until selection input

	# 1.02 Start selected: cyan outline, cyan label and a left cursor mark START GAME. The button is live.
	wolf.position.x += 24               # background sparring continues
	start_box.visible = false
	start_text.visible = false
	var cursor := rect(START_POS + Vector2(-26, 32), Vector2(10, 20), CYAN)
	# SOUND: one selection tick, not repeating. No clip in assets/sfx.
	await choose(["START GAME"], START_POS, 34, "1.02")

	# 1.03 Start confirmed: the button drops four pixels and flashes light.
	cursor.queue_free()
	start_box.visible = true
	start_text.visible = true
	start_box.position.y += 4
	start_text.position.y += 4
	start_box.color = PAPER
	start_text.add_theme_color_override("font_color", INK)
	lia.position.x -= 24
	# SOUND: sharp confirm; music continues. No clip in assets/sfx.
	await mark("1.03")
	await hold(0.12)

	# ---- B / SNAP ----
	# 1.04 Snap starts: title, subtitle and Start move left together. 95 px on the 640 board is 190 here.
	start_box.color = FIELD
	start_text.add_theme_color_override("font_color", Color.WHITE)
	menu.position.x = -190
	_trail(Vector2(540, 150), 360, PINK)
	_trail(Vector2(600, 196), 420, CYAN)
	_trail(Vector2(560, 276), 440, CYAN)
	_trail(Vector2(700, 352), 380, PINK)
	# SOUND: a short sideways whoosh begins. No clip in assets/sfx.
	await mark("1.04")
	await hold(0.1)

	# 1.05 Snap midpoint: title displaced 330 board px (660 here); the connecting panel enters at x=944.
	menu.position.x = -660
	_clear_trails()
	_trail(Vector2(0, 150), 700, PINK)
	_trail(Vector2(40, 170), 520, CYAN)
	_trail(Vector2(0, 196), 760, CYAN)
	_trail(Vector2(90, 276), 640, CYAN)
	_trail(Vector2(0, 352), 560, PINK)
	var mm := Node2D.new()              # the matchmaking screen sliding in from the right
	mm.position.x = 944
	add_child(mm)
	_into(mm, rect(Vector2.ZERO, Vector2(W, H), NIGHT))
	var edge := _into(mm, rect(Vector2.ZERO, Vector2(4, H), CYAN))
	var incoming := _into(mm, label("CONNECTING...", 44, CYAN, Vector2(120, 300)))
	# SOUND: whoosh peaks, arcade loop unbroken.
	await mark("1.05")
	await hold(0.1)
	var tw := create_tween()
	tw.tween_property(mm, "position:x", 0.0, 0.15 if not autoplay else 0.05)
	await tw.finished
	incoming.queue_free()
	edge.queue_free()
	menu.queue_free()
	_clear_trails()

	# ---- C / MATCHMAKING ----
	# 1.06 Connecting: CONNECTING... plus cycling cells. "Looking for an opponent" is interface copy.
	rect(PANEL_POS, PANEL_SIZE, PANEL_BG)
	rect(PANEL_POS, Vector2(PANEL_SIZE.x, 4), CYAN)
	label("MATCHMAKING", 18, DIM, Vector2(PANEL_X, 165))
	var status := label("CONNECTING...", 44, CYAN, Vector2(PANEL_X, 228))
	var cells: Array[Node] = []
	for i in 5:
		cells.append(rect(Vector2(PANEL_X + i * 52, 378), Vector2(40, 12), CYAN if i < 3 else CELL_OFF))
	var looking := label("Looking for an opponent", 22, DIM, Vector2(PANEL_X, 452))
	label("ONLINE / 1 v 1", 18, DIM, Vector2(125, 655))
	sfx("res://assets/sfx/queue.mp3")   # quiet loading pulse
	await mark("1.06")
	await hold(0.4)

	# 1.07 Opponent: OPPONENT FOUND: lia_ph appears, status changes to CONNECTED.
	status.text = "CONNECTED"
	for c in cells:
		c.queue_free()
	looking.queue_free()
	label("OPPONENT FOUND: lia_ph", 32, Color.WHITE, Vector2(PANEL_X, 330))
	sfx("res://assets/sfx/chat.mp3")    # one notification ping
	await mark("1.07")
	await hold(0.4)

	# 1.08 Region: one new line below the unchanged username, no reflow.
	label("REGION: PH", 28, Color.WHITE, Vector2(PANEL_X, 415))
	# SOUND: a small interface tick. No clip in assets/sfx.
	await mark("1.08")
	await hold(0.4)

	# 1.09 Ping: PING: 248ms and amber connection bars. Amber is reserved for the warning.
	label("PING: 248ms", 32, GOLD, Vector2(PANEL_X, 478))
	for i in 4:
		var h := 10 + i * 8
		rect(Vector2(930 + i * 22, 556 - h), Vector2(14, h), GOLD if i < 2 else CELL_OFF)
	# SOUND: brief warning chirp. No clip in assets/sfx.
	await mark("1.09")
	await hold(0.6)

	# ---- D / ARENA ----
	# 1.10 Arena reveal: loading clears. YOU, lia_ph, health bars, READY and the ping indicator.
	await clear_children()
	rect(Vector2.ZERO, Vector2(W, H), NIGHT)
	pixel_sprite("res://assets/dain/arena-bg.png", Vector2(0, ARENA_TOP))
	pixel_sprite("res://assets/dain/wolf.png", Vector2(300, ARENA_FLOOR - 37 * PIX), PIX, true)
	pixel_sprite("res://assets/dain/lia-wizard.png", Vector2(W - 300 - 46 * PIX, ARENA_FLOOR - 43 * PIX), PIX, true)
	rect(Vector2(40, 28), Vector2(420, 14), CYAN)
	label("YOU", 24, Color.WHITE, Vector2(40, 48))
	big("VS", Color.WHITE, 28, 36)
	rect(Vector2(W - 460, 28), Vector2(420, 14), PINK)
	label("lia_ph", 24, Color.WHITE, Vector2(W - 460, 48), 420, HORIZONTAL_ALIGNMENT_RIGHT)
	label("248ms", 20, GOLD, Vector2(W - 460, 80), 420, HORIZONTAL_ALIGNMENT_RIGHT)
	big("READY", Color.WHITE, 84, 250)
	# SOUND: loading tone ends; arena ambience comes forward. No ambience clip in assets/sfx.
	await mark("1.10")
	await hold(0.5)
	finish({"started": true})

# ---------- helpers local to this scene ----------

## Moves a node drawn by the base helpers under another parent, keeping its local position.
func _into(parent: Node, n: Node) -> Node:
	n.get_parent().remove_child(n)
	parent.add_child(n)
	return n

## The title-screen city: graybox blocks of two depths with small window lines, a cyan ground line,
## and a dark foreground band below it.
func _city() -> void:
	var blocks := [[0, 90, 190], [110, 60, 120], [190, 110, 260], [320, 70, 150], [410, 120, 300],
		[550, 80, 170], [650, 130, 240], [800, 70, 130], [890, 120, 280], [1030, 90, 200], [1140, 140, 320]]
	for i in blocks.size():
		var b: Array = blocks[i]
		var x := float(b[0])
		var w := float(b[1])
		var h := float(b[2])
		rect(Vector2(x, GROUND - h), Vector2(w, h), CITY_A if i % 2 == 0 else CITY_B)
		for k in 3:
			var ly := GROUND - h + 22 + k * 34
			if ly < GROUND - 20:
				rect(Vector2(x + 12, ly), Vector2(w - 24, 4), VIOLET)
	rect(Vector2(60, GROUND - 110), Vector2(70, 8), PINK)      # coral accent on the left block
	rect(Vector2(1100, GROUND - 130), Vector2(90, 8), CYAN)    # cyan accent on the right block
	rect(Vector2(0, GROUND), Vector2(W, H - GROUND), Color("15162a"))
	rect(Vector2(0, GROUND - 2), Vector2(W, 4), CYAN)
	rect(Vector2(0, GROUND + 20), Vector2(110, 36), Color("101124"))
	rect(Vector2(W - 150, GROUND + 20), Vector2(150, 36), Color("101124"))

## One horizontal echo left behind by the departing letters.
func _trail(pos: Vector2, length: float, col: Color) -> void:
	trails.append(rect(pos, Vector2(length, 5), Color(col, 0.85)))

func _clear_trails() -> void:
	for t in trails:
		t.queue_free()
	trails.clear()

## The START GAME button as the board draws it at 1.02: dark box, cyan outline, cyan label.
## choose() in the base calls button(), so this override styles the one button this scene has.
func button(txt: String, size := 26) -> Button:
	var b := Button.new()
	b.text = txt
	b.custom_minimum_size = START_SIZE
	b.add_theme_font_size_override("font_size", size)
	b.add_theme_color_override("font_color", CYAN)
	b.add_theme_color_override("font_focus_color", CYAN)
	b.add_theme_color_override("font_hover_color", Color.WHITE)
	b.add_theme_color_override("font_pressed_color", INK)
	b.add_theme_stylebox_override("normal", _start_style(FIELD))
	b.add_theme_stylebox_override("focus", _start_style(FIELD))
	b.add_theme_stylebox_override("hover", _start_style(Color("1a1c33")))
	b.add_theme_stylebox_override("pressed", _start_style(PAPER))
	return b

func _start_style(bg: Color) -> StyleBoxFlat:
	var st := StyleBoxFlat.new()
	st.bg_color = bg
	st.set_border_width_all(3)
	st.border_color = CYAN
	st.set_content_margin_all(14)
	return st

## Plays one clip from assets/sfx without the import step (worktrees have no .godot cache).
func sfx(path: String) -> void:
	var abs_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(abs_path):
		push_warning("s1: no sound file at " + path)
		return
	var stream := AudioStreamMP3.load_from_file(abs_path)
	if stream == null:
		push_warning("s1: could not decode " + path)
		return
	var p := AudioStreamPlayer.new()
	p.stream = stream
	add_child(p)
	p.finished.connect(p.queue_free)
	p.play()

class_name StoryScene
extends Node2D
## Base for storyboard scenes (Godot 4.7). One scene per storyboard board. A scene never touches main.gd.
## Lifecycle: start(ctx) -> run() awaits beats -> finished(result). Each storyboard card calls mark("<card id>")
## when it is fully on screen, so the preview runner can save one PNG per card.
## ctx keys: autoplay (bool, shortens holds and auto-advances), pick (String, the reply chosen in autoplay),
## seen (Array of discovery ids the player observed earlier, e.g. ["badge", "phone", "food"]).

signal beat(name: String)
signal finished(result: Dictionary)

const W := 1280.0
const H := 720.0
const PIX := 2.5                     # Dain's arena is 512x224; 2.5x fills the 1280 width (1280x560), letterboxed
const ARENA_TOP := (H - 224.0 * PIX) / 2.0
const ARENA_FLOOR := ARENA_TOP + 196.0 * PIX   # feet line measured on Dain's arena background
const INK := Color("141625")
const PAPER := Color("f4f2eb")
const NIGHT := Color("111226")
const CYAN := Color("65f8d1")
const PINK := Color("ff729b")
const GOLD := Color("ffd46e")
const DIM := Color("8991b9")

var ctx := {}
var autoplay := false
var result := {}
var _advance := false
var _choice := ""

func start(c: Dictionary) -> void:
	ctx = c
	autoplay = bool(c.get("autoplay", false))
	run()

## Override. Await beats; call mark() per card; end with finish().
func run() -> void:
	finish({})

func finish(r: Dictionary) -> void:
	result = r
	finished.emit(r)

func mark(card: String) -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	beat.emit(card)
	await get_tree().process_frame

## Draft timing from the storyboard. Autoplay shortens every hold so a preview runs in seconds.
func hold(secs: float) -> void:
	await get_tree().create_timer(secs if not autoplay else minf(secs, 0.25)).timeout

## Space, Enter or a click advances. Autoplay advances by itself.
func wait_advance() -> void:
	if autoplay:
		await hold(0.2)
		return
	_advance = false
	while not _advance:
		await get_tree().process_frame

func _unhandled_input(e: InputEvent) -> void:
	if e.is_action_pressed("ui_accept") or (e is InputEventMouseButton and e.pressed):
		_advance = true

## Two or more buttons; returns the chosen text. Autoplay picks ctx.pick, else the first option.
## Pass mark_card (e.g. "M2.6") to capture the card while the buttons are still on screen.
func choose(options: Array, pos: Vector2, size := 26, mark_card := "") -> String:
	var row := HBoxContainer.new()
	row.position = pos
	row.add_theme_constant_override("separation", 24)
	add_child(row)
	_choice = ""
	for o in options:
		var b := button(str(o), size)
		b.pressed.connect(func(): _choice = str(o))
		row.add_child(b)
	if mark_card != "":
		await mark(mark_card)
	if autoplay:
		await hold(0.3)
		_choice = str(ctx.get("pick", options[0])) if ctx.has("pick") else str(options[0])
	while _choice == "":
		await get_tree().process_frame
	row.queue_free()
	return _choice

# ---------- drawing helpers, same look as main.gd ----------

## Loads the image file directly, so new PNGs work without Godot's import step (worktrees have no .godot cache).
func texture_from_file(path: String) -> Texture2D:
	var res := ResourceLoader.load(path) if ResourceLoader.exists(path) else null
	if res is Texture2D:
		return res
	var img := Image.load_from_file(ProjectSettings.globalize_path(path))
	if img == null:
		push_error("StoryScene: cannot load image " + path)
		return null
	return ImageTexture.create_from_image(img)

func pixel_sprite(path: String, pos: Vector2, scale := PIX, flip_h := false) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = texture_from_file(path)
	s.centered = false
	s.position = pos
	s.scale = Vector2(scale, scale)
	s.flip_h = flip_h
	s.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(s)
	return s

func rect(pos: Vector2, size: Vector2, col: Color) -> ColorRect:
	var r := ColorRect.new()
	r.position = pos
	r.size = size
	r.color = col
	add_child(r)
	return r

func label(txt: String, size: int, col := Color.WHITE, pos := Vector2.ZERO, width := 0.0, align := HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.position = pos
	l.horizontal_alignment = align
	if width > 0:
		l.custom_minimum_size.x = width
		l.size.x = width
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(l)
	return l

func panel_style(bg: Color, radius := 12) -> StyleBoxFlat:
	var st := StyleBoxFlat.new()
	st.bg_color = bg
	st.set_corner_radius_all(radius)
	st.set_content_margin_all(14)
	return st

func button(txt: String, size := 26) -> Button:
	var b := Button.new()
	b.text = txt
	b.add_theme_font_size_override("font_size", size)
	b.add_theme_stylebox_override("normal", panel_style(Color("2a2c44")))
	b.add_theme_stylebox_override("hover", panel_style(Color("3a3d5c")))
	b.add_theme_stylebox_override("pressed", panel_style(Color("1e2034")))
	return b

## SANABI-style speech balloon: white box with the line, pointer below toward the speaker's head.
func balloon(txt: String, head: Vector2, width := 420.0) -> Control:
	var box := PanelContainer.new()
	box.add_theme_stylebox_override("panel", panel_style(PAPER, 8))
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", 24)
	l.add_theme_color_override("font_color", INK)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = width
	box.add_child(l)
	box.position = Vector2(clampf(head.x - width * 0.3, 20, W - width - 60), maxf(head.y - 150, 20))
	add_child(box)
	var ptr := Polygon2D.new()
	ptr.color = PAPER
	var base := Vector2(box.position.x + width * 0.3, box.position.y + 62)
	ptr.polygon = PackedVector2Array([base, base + Vector2(22, 0), head + Vector2(0, -8)])
	add_child(ptr)
	box.set_meta("pointer", ptr)
	return box

func remove_balloon(box: Control) -> void:
	if box.has_meta("pointer"):
		box.get_meta("pointer").queue_free()
	box.queue_free()

## Dark chat panel with lines like ["lia_ph: ez", "you: okay that was clean"]. Returns the panel.
func chat_panel(lines: Array, pos := Vector2(190, 170), size := Vector2(900, 380), timer := "") -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_style(Color("0f1020", 0.96), 10))
	p.position = pos
	p.custom_minimum_size = size
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	p.add_child(v)
	var head := HBoxContainer.new()
	v.add_child(head)
	var t := Label.new(); t.text = "MATCH CHAT"; t.add_theme_font_size_override("font_size", 20); t.add_theme_color_override("font_color", DIM)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	if timer != "":
		var c := Label.new(); c.text = timer; c.add_theme_font_size_override("font_size", 20); c.add_theme_color_override("font_color", DIM); c.name = "Timer"
		head.add_child(c)
	for ln in lines:
		var l := Label.new(); l.text = str(ln); l.add_theme_font_size_override("font_size", 28)
		l.add_theme_color_override("font_color", PINK if str(ln).begins_with(HER) else Color.WHITE)
		v.add_child(l)
	add_child(p)
	return p

const HER := "lia_ph"

## Big centered word over everything, e.g. DEFEAT.
func big(txt: String, col := Color.WHITE, size := 72, y := 250.0) -> Label:
	return label(txt, size, col, Vector2(0, y), W, HORIZONTAL_ALIGNMENT_CENTER)

func fade_to_black(secs := 0.6) -> ColorRect:
	var r := rect(Vector2.ZERO, Vector2(W, H), Color(0, 0, 0, 0))
	var tw := create_tween()
	tw.tween_property(r, "color:a", 1.0, secs if not autoplay else 0.1)
	await tw.finished
	return r

func clear_children() -> void:
	for c in get_children():
		c.queue_free()
	await get_tree().process_frame

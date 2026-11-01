extends Node2D
## Preview runner: plays one story scene with autoplay and saves a PNG per storyboard card.
## Run from the project folder (needs a window, so on the Mac run it through gui_run.py):
##   godot --path . scenes/story/preview.tscn -- scene=res://scenes/story/<id>/<id>.tscn [pick=<reply>] [seen=badge,phone]
## Output: build/preview/<id>/NN-<card>.png and result.json. Prints PREVIEW_DONE on success, exits 2 on failure.

var target := ""
var out_dir := ""
var shots := 0
var ctx := {"autoplay": true}

func _ready() -> void:
	get_tree().create_timer(120.0).timeout.connect(func():
		push_error("preview: scene did not finish within 120 s")
		get_tree().quit(2))
	for a in OS.get_cmdline_user_args():
		if a.begins_with("scene="):
			target = a.substr(6)
		elif a.begins_with("pick="):
			ctx["pick"] = a.substr(5)
		elif a.begins_with("seen="):
			ctx["seen"] = Array(a.substr(5).split(","))
	if target == "":
		push_error("preview: pass -- scene=res://scenes/story/<id>/<id>.tscn")
		get_tree().quit(2)
		return
	var packed = load(target)
	if packed == null:
		push_error("preview: cannot load " + target)
		get_tree().quit(2)
		return
	var sc = packed.instantiate()
	if not sc.has_signal("beat") or not sc.has_signal("finished"):
		push_error("preview: " + target + " is not a StoryScene (script failed to parse?)")
		get_tree().quit(2)
		return
	add_child(sc)
	var id := target.get_file().get_basename()
	out_dir = ProjectSettings.globalize_path("res://build/preview/" + id)
	DirAccess.make_dir_recursive_absolute(out_dir)
	for f in DirAccess.get_files_at(out_dir):
		DirAccess.remove_absolute(out_dir.path_join(f))
	sc.beat.connect(_on_beat)
	sc.finished.connect(_on_finished)
	await get_tree().process_frame
	sc.start(ctx)

func _on_beat(card: String) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	shots += 1
	var path := out_dir.path_join("%02d-%s.png" % [shots, card.replace("/", "-").replace(" ", "_")])
	var err := img.save_png(path)
	if err != OK:
		push_error("preview: could not save " + path)
		get_tree().quit(2)

func _on_finished(r: Dictionary) -> void:
	await _on_beat("end")
	var f := FileAccess.open(out_dir.path_join("result.json"), FileAccess.WRITE)
	f.store_string(JSON.stringify(r, "  "))
	f.close()
	print("PREVIEW_DONE %d shots %s" % [shots, out_dir])
	await get_tree().process_frame
	get_tree().quit(0)

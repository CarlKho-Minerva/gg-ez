shader_type canvas_item;
// Old-TV look for the fake match: curve, scanlines, colour fringe, dark corners.
uniform sampler2D screen_tex : hint_screen_texture, filter_linear;
uniform float strength = 1.0;

void fragment() {
	vec2 c = SCREEN_UV - 0.5;
	vec2 uv = 0.5 + c * (1.0 + 0.10 * strength * dot(c, c));
	float ab = 0.0018 * strength;
	vec3 col = vec3(
		texture(screen_tex, uv + vec2(ab, 0.0)).r,
		texture(screen_tex, uv).g,
		texture(screen_tex, uv - vec2(ab, 0.0)).b);
	float scan = 0.82 + 0.18 * sin(uv.y * 720.0 * 3.14159);
	col *= mix(1.0, scan, strength);
	col *= mix(1.0, smoothstep(0.85, 0.25, length(c)), 0.55 * strength);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { col = vec3(0.0); }
	COLOR = vec4(col, 1.0);
}

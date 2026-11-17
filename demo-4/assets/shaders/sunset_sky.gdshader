shader_type sky;

// Procedural sunset sky with drifting clouds (no external textures).
// Warm amber horizon, cool violet zenith, low sun glow and soft fbm clouds.
// Authored for demo-4, CC0.

uniform vec3 zenith : source_color = vec3(0.16, 0.13, 0.34);
uniform vec3 horizon : source_color = vec3(0.98, 0.52, 0.20);
uniform vec3 ground : source_color = vec3(0.30, 0.16, 0.12);
uniform vec3 sun_color : source_color = vec3(1.0, 0.48, 0.18);
uniform vec3 sun_direction = vec3(0.66, 0.24, 0.66);
uniform vec3 cloud_light : source_color = vec3(1.0, 0.62, 0.42);
uniform vec3 cloud_shadow : source_color = vec3(0.42, 0.28, 0.42);
uniform float cloud_speed = 0.012;
uniform float cloud_scale = 2.3;

float hash(vec3 p) {
	p = fract(p * 0.3183099 + 0.1);
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(
			mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
			mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
			f.y),
		mix(
			mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
			mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
			f.y),
		f.z);
}

float fbm(vec3 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 5; i++) {
		v += a * vnoise(p);
		p = p * 2.03 + vec3(11.7, 5.1, 3.7);
		a *= 0.5;
	}
	return v;
}

void sky() {
	vec3 dir = normalize(EYEDIR);
	float h = dir.y;

	vec3 col;
	if (h >= 0.0) {
		col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55));
	} else {
		col = mix(horizon, ground, clamp(-h * 5.0, 0.0, 1.0));
	}

	vec3 sun_dir = normalize(sun_direction);
	float s = clamp(dot(dir, sun_dir), 0.0, 1.0);
	col += sun_color * pow(s, 900.0) * 3.0;   // solar disc
	col += sun_color * pow(s, 8.0) * 0.35;    // wide warm glow

	// Clouds clustered in the upper sky, fading out toward the horizon.
	if (h > 0.03) {
		vec3 cp = dir / h * cloud_scale;
		cp.x += TIME * cloud_speed;
		cp.z += TIME * cloud_speed * 0.6;
		float n = fbm(cp);
		float cloud = smoothstep(0.45, 0.82, n);
		cloud *= smoothstep(0.03, 0.35, h);
		vec3 ccol = mix(cloud_shadow, cloud_light, clamp(s * 2.0, 0.0, 1.0));
		col = mix(col, ccol, cloud * 0.85);
	}

	COLOR = col;
}

precision mediump float;

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Fondo
 * @color
 * @default #F5EEDD
 */
uniform vec3 u_bg;

/**
 * @label Burbujas
 * @color
 * @default #84B3CE
 */
uniform vec3 u_bubble;

/**
 * @label Ola
 * @color
 * @default #16587B
 */
uniform vec3 u_wave;

/**
 * @label Altura de la ola
 * @default 0.30
 * @range 0.0, 0.6
 */
uniform float u_waveHeight;

/**
 * @label Velocidad
 * @default 1.0
 * @range 0.0, 3.0
 */
uniform float u_speed;

vec2 ballCenter(float fi, float t) {
  vec2 c = vec2(
    0.5 + 0.42 * sin(t * (0.21 + fi * 0.037) + fi * 1.7),
    0.62 + 0.30 * cos(t * (0.17 + fi * 0.029) + fi * 2.3)
  );
  c.x *= u_resolution.x / u_resolution.y;
  return c;
}

float ballRadius(float fi) {
  return 0.032 + 0.026 * mod(fi * 3.0, 4.0) / 3.0;
}

void main() {
  float t = u_time * u_speed;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);

  vec3 col = u_bg;

  float f = 0.0;
  float spec = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    vec2 c = ballCenter(fi, t);
    float r = ballRadius(fi);
    vec2 d = p - c;
    f += r * r / dot(d, d);
    vec2 hp = d - vec2(-0.38, 0.38) * r;
    spec = max(spec, smoothstep(r * 0.30, r * 0.05, length(hp * vec2(1.0, 1.35))));
  }

  float edge = smoothstep(0.95, 1.05, f);
  float depth = smoothstep(1.0, 3.0, f);
  vec3 body = mix(mix(u_bubble, u_bg, 0.55), mix(u_bubble, u_bg, 0.25), depth);
  col = mix(col, body, edge * 0.85);

  float ring = smoothstep(0.90, 1.0, f) - smoothstep(1.0, 1.12, f);
  float hue = 6.2831 * (uv.x * 0.8 + uv.y * 0.6 + t * 0.05);
  vec3 iri = 0.5 + 0.5 * cos(hue + vec3(0.0, 2.1, 4.2));
  vec3 rimCol = mix(vec3(1.0), mix(u_bubble, iri, 0.35), 0.45);
  col = mix(col, rimCol, ring * 0.9);
  col = mix(col, vec3(1.0), spec * edge * 0.85);

  float h = u_waveHeight;
  float w1 = h + 0.035 * sin(uv.x * 6.0 + t * 0.9) + 0.02 * sin(uv.x * 11.0 - t * 1.3);
  float w2 = h - 0.05 + 0.03 * sin(uv.x * 5.0 - t * 0.7 + 1.5) + 0.015 * sin(uv.x * 13.0 + t * 1.1);
  float aa = 1.5 / u_resolution.y;
  col = mix(col, u_bubble, smoothstep(w1 + aa, w1 - aa, uv.y) * 0.9);
  col = mix(col, u_wave, smoothstep(w2 + aa, w2 - aa, uv.y));

  gl_FragColor = vec4(col, 1.0);
}

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

float field(vec2 p, float t) {
  float f = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    vec2 c = vec2(
      0.5 + 0.42 * sin(t * (0.21 + fi * 0.037) + fi * 1.7),
      0.62 + 0.30 * cos(t * (0.17 + fi * 0.029) + fi * 2.3)
    );
    c.x *= u_resolution.x / u_resolution.y;
    float r = 0.032 + 0.026 * mod(fi * 3.0, 4.0) / 3.0;
    vec2 d = p - c;
    f += r * r / dot(d, d);
  }
  return f;
}

void main() {
  float t = u_time * u_speed;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);

  vec3 col = u_bg;

  float f = field(p, t);
  float edge = smoothstep(0.95, 1.05, f);
  float rim = smoothstep(1.0, 1.6, f);
  vec3 bubble = mix(u_bubble * 1.08, u_bubble, rim);
  float gloss = smoothstep(1.25, 2.6, field(p + vec2(0.012, -0.018), t)) * 0.0;
  col = mix(col, mix(bubble, u_bg, 0.45), edge * 0.8);
  float ring = smoothstep(0.92, 1.0, f) - smoothstep(1.0, 1.08, f);
  col = mix(col, vec3(1.0), ring * 0.85 + gloss);

  float h = u_waveHeight;
  float w1 = h + 0.035 * sin(uv.x * 6.0 + t * 0.9) + 0.02 * sin(uv.x * 11.0 - t * 1.3);
  float w2 = h - 0.05 + 0.03 * sin(uv.x * 5.0 - t * 0.7 + 1.5) + 0.015 * sin(uv.x * 13.0 + t * 1.1);
  float aa = 1.5 / u_resolution.y;
  col = mix(col, u_bubble, smoothstep(w1 + aa, w1 - aa, uv.y) * 0.9);
  col = mix(col, u_wave, smoothstep(w2 + aa, w2 - aa, uv.y));

  gl_FragColor = vec4(col, 1.0);
}

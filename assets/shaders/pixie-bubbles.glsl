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
 * @label Altura de la ola (0 = sin ola)
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

/**
 * @label Escala de burbujas
 * @default 1.0
 * @range 0.4, 2.0
 */
uniform float u_scale;

const int N = 10;

vec2 center(float fi, float t, float aspect) {
  vec2 c = vec2(
    0.5 + 0.44 * sin(t * (0.13 + fi * 0.023) + fi * 1.7),
    0.55 + 0.42 * cos(t * (0.11 + fi * 0.019) + fi * 2.3)
  );
  c.y += 0.015 * sin(t * 0.9 + fi);
  c.x *= aspect;
  return c;
}

float radius(float fi, float t) {
  float base = 0.022 + 0.05 * fract(sin(fi * 12.9898) * 43758.5453);
  return base * u_scale * (1.0 + 0.04 * sin(t * 1.3 + fi * 2.0));
}

float fieldAt(vec2 p, float t, float aspect) {
  float f = 0.0;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    vec2 d = p - center(fi, t, aspect);
    float r = radius(fi, t);
    float wob = 1.0 + 0.05 * sin(atan(d.y, d.x) * 3.0 + t * 1.7 + fi);
    f += r * r * wob / dot(d, d);
  }
  return f;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  float t = u_time * u_speed;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float px = 1.0 / u_resolution.y;

  vec3 col = u_bg;

  float shadow = fieldAt(p + vec2(-0.004, 0.018), t, aspect);
  col = mix(col, u_bubble * 0.85, smoothstep(0.7, 1.2, shadow) * 0.10);

  float f = fieldAt(p, t, aspect);
  float inside = smoothstep(0.97, 1.03, f);

  float fres = 1.0 - smoothstep(1.0, 2.6, f);
  fres = pow(fres, 1.6);

  float hue = 6.2831 * (f * 0.35 + uv.x * 0.6 - uv.y * 0.4 + t * 0.06);
  vec3 iri = 0.5 + 0.5 * cos(hue + vec3(0.0, 2.1, 4.2));
  vec3 film = mix(u_bubble, iri, 0.28);

  vec3 body = mix(u_bg, vec3(1.0), 0.18);
  body = mix(body, u_bubble, 0.16);
  vec3 bubbleCol = mix(body, film, fres * 0.85);

  float spec = 0.0;
  float spec2 = 0.0;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    vec2 d = p - center(fi, t, aspect);
    float r = radius(fi, t);
    vec2 h1 = (d - vec2(-0.42, 0.40) * r) * vec2(1.0, 1.5);
    spec = max(spec, smoothstep(r * 0.26, r * 0.02, length(h1)));
    vec2 h2 = d - vec2(0.38, -0.42) * r;
    spec2 = max(spec2, smoothstep(r * 0.10, r * 0.0, length(h2)));
  }
  bubbleCol = mix(bubbleCol, vec3(1.0), clamp(spec * 0.95 + spec2 * 0.6, 0.0, 1.0));

  col = mix(col, bubbleCol, inside);

  float edge = smoothstep(0.93, 1.0, f) - smoothstep(1.0, 1.07, f);
  col = mix(col, mix(vec3(1.0), u_bubble, 0.25), edge * 0.7);

  vec2 g = floor(p * 38.0);
  float h = hash(g);
  vec2 cell = fract(p * 38.0) - 0.5;
  float tw = 0.5 + 0.5 * sin(t * (1.5 + h * 3.0) + h * 40.0);
  float star = smoothstep(0.08, 0.0, length(cell)) * step(0.965, h) * tw;
  col = mix(col, vec3(1.0), star * 0.8 * (1.0 - inside));

  if (u_waveHeight > 0.001) {
    float wh = u_waveHeight;
    float w1 = wh + 0.035 * sin(uv.x * 6.0 + t * 0.9) + 0.02 * sin(uv.x * 11.0 - t * 1.3);
    float w2 = wh - 0.05 + 0.03 * sin(uv.x * 5.0 - t * 0.7 + 1.5) + 0.015 * sin(uv.x * 13.0 + t * 1.1);
    float aa = 1.5 * px;
    col = mix(col, u_bubble, smoothstep(w1 + aa, w1 - aa, uv.y) * 0.9);
    float crest = smoothstep(w2 + 3.0 * px, w2, uv.y) - smoothstep(w2, w2 - 3.0 * px, uv.y);
    col = mix(col, u_wave, smoothstep(w2 + aa, w2 - aa, uv.y));
    col = mix(col, vec3(1.0), crest * 0.35);
  }

  gl_FragColor = vec4(col, 1.0);
}

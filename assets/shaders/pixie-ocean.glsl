precision mediump float;

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Agua clara
 * @color
 * @default #C2D9E7
 */
uniform vec3 u_light;

/**
 * @label Sombra del agua
 * @color
 * @default #84B3CE
 */
uniform vec3 u_shadow;

/**
 * @label Líneas de luz
 * @color
 * @default #FFFFFF
 */
uniform vec3 u_line;

/**
 * @label Profundo
 * @color
 * @default #16587B
 */
uniform vec3 u_deep;

/**
 * @label Abismo
 * @color
 * @default #0B3A55
 */
uniform vec3 u_abyss;

/**
 * @label Profundidad arriba (0 = superficie)
 * @default 0.0
 * @range 0.0, 1.0
 */
uniform float u_depthTop;

/**
 * @label Profundidad abajo
 * @default 1.0
 * @range 0.0, 1.0
 */
uniform float u_depthBottom;

/**
 * @label Tamaño de las celdas (px)
 * @default 130
 * @range 50, 300
 */
uniform float u_cell;

/**
 * @label Intensidad de cáusticas
 * @default 1.0
 * @range 0.0, 1.0
 */
uniform float u_caustics;

/**
 * @label Velocidad
 * @default 1.0
 * @range 0.0, 3.0
 */
uniform float u_speed;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash1(i);
  float b = hash1(i + vec2(1.0, 0.0));
  float c = hash1(i + vec2(0.0, 1.0));
  float d = hash1(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float cellEdge(vec2 x, float t) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.35 * sin(t + 6.2831 * o);
      float d = length(g + o - f);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
  }
  return f2 - f1;
}

vec2 warp(vec2 x, float t) {
  vec2 q = vec2(vnoise(x * 0.9 + vec2(t * 0.15, 0.0)), vnoise(x * 0.9 + vec2(5.2, t * 0.12)));
  vec2 r = vec2(vnoise(x * 2.1 + q * 2.0 + vec2(1.7, t * 0.2)), vnoise(x * 2.1 + q * 2.0 + vec2(8.3, -t * 0.18)));
  return x + (q - 0.5) * 0.9 + (r - 0.5) * 0.35;
}

float network(vec2 x, float t, float widthMul) {
  vec2 w = warp(x, t);
  float e = cellEdge(w, t * 0.5);
  float th = (0.065 + 0.05 * vnoise(w * 1.5 + t * 0.3)) * widthMul;
  float aa = 0.008;
  return 1.0 - smoothstep(th, th + aa, e);
}

float ring(vec2 p, vec2 c, float r, float w) {
  float d = abs(length(p - c) - r);
  return 1.0 - smoothstep(w, w * 1.8, d);
}

void main() {
  float t = u_time * u_speed;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 px = gl_FragCoord.xy;
  float depth = mix(u_depthTop, u_depthBottom, 1.0 - uv.y);

  vec3 surface = u_light;
  vec3 col = mix(surface, u_deep, smoothstep(0.36, 0.5, depth));
  col = mix(col, u_abyss, smoothstep(0.68, 1.0, depth));

  float caus = u_caustics * (1.0 - smoothstep(0.33, 0.46, depth));
  vec2 x = px / u_cell;
  if (caus > 0.001) {
    float sh = network(x + vec2(0.16, 0.13), t, 2.1);
    float ln = network(x, t, 1.0);
    vec3 shadowCol = mix(u_shadow, u_deep, 0.18);
    col = mix(col, shadowCol, sh * (1.0 - ln) * caus);
    col = mix(col, u_line, ln * caus);

    vec2 cid = floor(x * 1.0);
    vec2 cf = fract(x) - 0.5;
    float hh = hash1(cid);
    if (hh > 0.55) {
      vec2 c = (hash2(cid + 3.1) - 0.5) * 0.5;
      float r = 0.05 + 0.05 * hash1(cid + 7.0);
      col = mix(col, u_line, ring(cf, c, r, 0.012) * caus * 0.9);
    }
  }

  float rayZone = smoothstep(0.42, 0.55, depth) * (1.0 - smoothstep(0.8, 0.95, depth));
  if (rayZone > 0.001) {
    float a = uv.x * u_resolution.x / 220.0 + uv.y * u_resolution.y / 900.0;
    float rays = 0.5 + 0.5 * sin(a * 3.0 + t * 0.25) * sin(a * 1.7 - t * 0.17 + 1.3);
    rays = smoothstep(0.55, 1.0, rays);
    col = mix(col, u_line, rays * rayZone * 0.1);
  }

  float bubZone = smoothstep(0.42, 0.55, depth);
  if (bubZone > 0.001) {
    for (int k = 0; k < 2; k++) {
      float fk = float(k);
      float sc = 70.0 + fk * 45.0;
      vec2 q = px / sc;
      q.y -= t * (0.35 + fk * 0.2);
      q.x += 0.25 * sin(q.y * 1.3 + fk * 4.0);
      vec2 id = floor(q);
      vec2 f = fract(q) - 0.5;
      float h = hash1(id + fk * 17.0);
      if (h > 0.72) {
        vec2 c = (hash2(id + fk) - 0.5) * 0.5;
        float r = 0.07 + 0.1 * hash1(id + 5.0 + fk);
        float b = ring(f, c, r, 0.03);
        float dot2 = 1.0 - smoothstep(r * 0.25, r * 0.35, length(f - c - vec2(-0.35, 0.35) * r));
        col = mix(col, u_line, (b * 0.65 + dot2 * 0.8) * bubZone);
      }
    }
  }

  float snowZone = smoothstep(0.6, 0.9, depth);
  if (snowZone > 0.001) {
    vec2 q = px / 26.0;
    q.y += t * 0.25;
    q.x += 0.3 * sin(q.y * 0.4 + t * 0.2);
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash1(id + 9.0);
    float s = (1.0 - smoothstep(0.03, 0.07, length(f - (hash2(id) - 0.5) * 0.6))) * step(0.9, h);
    float tw = 0.6 + 0.4 * sin(t * 2.0 + h * 30.0);
    col = mix(col, u_line, s * tw * snowZone * 0.55);
  }

  gl_FragColor = vec4(col, 1.0);
}

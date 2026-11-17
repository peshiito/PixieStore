precision mediump float;

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/** @label Contenido */
uniform sampler2D u_content;

/**
 * @label Intensidad
 * @default 0.35
 * @range 0.0, 1.0
 */
uniform float u_strength;

/**
 * @label Cada cuántos segundos
 * @default 3.2
 * @range 1.0, 8.0
 */
uniform float u_period;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 c = texture2D(u_content, uv);
  float ph = fract(u_time / u_period) * 2.2 - 0.6;
  float d = uv.x + uv.y * 0.35 - ph;
  float band = smoothstep(0.16, 0.0, abs(d));
  c.rgb += vec3(1.0) * band * u_strength * c.a;
  gl_FragColor = c;
}

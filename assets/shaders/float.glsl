precision mediump float;

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/** @label Contenido */
uniform sampler2D u_content;

/**
 * @label Amplitud (px)
 * @default 6
 * @range 0, 24
 */
uniform float u_amp;

/**
 * @label Velocidad
 * @default 1.0
 * @range 0.0, 3.0
 */
uniform float u_speed;

/**
 * @label Desfase
 * @default 0.0
 * @range 0.0, 6.28
 */
uniform float u_phase;

void main() {
  float t = u_time * u_speed + u_phase;
  vec2 off = vec2(0.0, u_amp * sin(t * 1.4)) + vec2(u_amp * 0.25 * sin(t * 0.7), 0.0);
  vec2 uv = (gl_FragCoord.xy - off) / u_resolution;
  gl_FragColor = texture2D(u_content, uv);
}

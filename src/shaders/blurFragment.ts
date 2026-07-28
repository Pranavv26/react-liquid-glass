export const blurVertex = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const blurHorizontal = `
precision highp float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_blurRadius;
varying vec2 v_texCoord;
void main() {
  vec2 off = vec2(u_blurRadius / u_resolution.x, 0.0);
  vec4 color = texture2D(u_texture, v_texCoord) * 0.227027;
  color += texture2D(u_texture, v_texCoord + off * 1.0) * 0.1945946;
  color += texture2D(u_texture, v_texCoord - off * 1.0) * 0.1945946;
  color += texture2D(u_texture, v_texCoord + off * 2.0) * 0.1216216;
  color += texture2D(u_texture, v_texCoord - off * 2.0) * 0.1216216;
  color += texture2D(u_texture, v_texCoord + off * 3.0) * 0.054054;
  color += texture2D(u_texture, v_texCoord - off * 3.0) * 0.054054;
  color += texture2D(u_texture, v_texCoord + off * 4.0) * 0.016216;
  color += texture2D(u_texture, v_texCoord - off * 4.0) * 0.016216;
  gl_FragColor = color;
}
`

export const blurVertical = `
precision highp float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_blurRadius;
varying vec2 v_texCoord;
void main() {
  vec2 off = vec2(0.0, u_blurRadius / u_resolution.y);
  vec4 color = texture2D(u_texture, v_texCoord) * 0.227027;
  color += texture2D(u_texture, v_texCoord + off * 1.0) * 0.1945946;
  color += texture2D(u_texture, v_texCoord - off * 1.0) * 0.1945946;
  color += texture2D(u_texture, v_texCoord + off * 2.0) * 0.1216216;
  color += texture2D(u_texture, v_texCoord - off * 2.0) * 0.1216216;
  color += texture2D(u_texture, v_texCoord + off * 3.0) * 0.054054;
  color += texture2D(u_texture, v_texCoord - off * 3.0) * 0.054054;
  color += texture2D(u_texture, v_texCoord + off * 4.0) * 0.016216;
  color += texture2D(u_texture, v_texCoord - off * 4.0) * 0.016216;
  gl_FragColor = color;
}
`

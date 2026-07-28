export default `
precision highp float;

uniform sampler2D u_background;
uniform sampler2D u_blurred;
uniform vec2 u_resolution;
uniform vec2 u_bgScale;
uniform vec2 u_glassCenter;
uniform vec2 u_glassSize;
uniform float u_cornerRadius;
uniform float u_refractionStrength;
uniform float u_rimWidth;
uniform float u_blurAmount;
uniform float u_saturation;
uniform vec3 u_tintColor;
uniform float u_tintOpacity;
uniform float u_chromaticAberration;
uniform float u_specularIntensity;
uniform float u_highlightBoost;
uniform vec2 u_lightDir;
uniform int u_shapeType;
uniform int u_debugShowDisplacement;

varying vec2 v_texCoord;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}

float sdPill(vec2 p, vec2 halfSize) {
  float radius = min(halfSize.x, halfSize.y);
  vec2 q = abs(p);
  if (halfSize.x > halfSize.y) {
    q.x = max(0.0, q.x - (halfSize.x - radius));
  } else {
    q.y = max(0.0, q.y - (halfSize.y - radius));
  }
  return length(q) - radius;
}

float sdShape(vec2 p, vec2 halfSize, float cornerRadius, int shapeType) {
  if (shapeType == 1) {
    float radius = min(halfSize.x, halfSize.y);
    return sdCircle(p, radius);
  } else if (shapeType == 2) {
    return sdPill(p, halfSize);
  }
  return sdRoundedRect(p, halfSize, cornerRadius);
}

vec2 sdGradient(vec2 p, vec2 halfSize, float cornerRadius, int shapeType, float eps) {
  vec2 e = vec2(eps, 0.0);
  float dx = sdShape(p + e.xy, halfSize, cornerRadius, shapeType) - sdShape(p - e.xy, halfSize, cornerRadius, shapeType);
  float dy = sdShape(p + e.yx, halfSize, cornerRadius, shapeType) - sdShape(p - e.yx, halfSize, cornerRadius, shapeType);
  return normalize(vec2(dx, dy));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 bgUV = (uv - 0.5) * u_bgScale + 0.5;
  vec2 p = gl_FragCoord.xy - u_glassCenter;
  vec2 halfSize = u_glassSize * 0.5;

  float dist = sdShape(p, halfSize, u_cornerRadius, u_shapeType);

  if (dist > 0.0) {
    gl_FragColor = texture2D(u_background, bgUV);
    return;
  }

  float eps = 1.0;
  vec2 grad = sdGradient(p, halfSize, u_cornerRadius, u_shapeType, eps);

  float rim = smoothstep(-u_rimWidth, 0.0, dist);
  float displace = rim * u_refractionStrength * 24.0;

  vec2 displacementUV = (grad * displace) / u_resolution;
  vec2 baseUV = bgUV + displacementUV;

  float ca = u_chromaticAberration * rim * 4.0;

  vec2 rUV = bgUV + (grad * (displace + ca)) / u_resolution;
  vec2 gUV = bgUV + (grad * displace) / u_resolution;
  vec2 bUV = bgUV + (grad * (displace - ca)) / u_resolution;

  vec3 color;
  float blurWeight = u_blurAmount / 40.0;
  if (blurWeight > 0.001) {
    vec3 origR = texture2D(u_background, rUV).rgb;
    vec3 origG = texture2D(u_background, gUV).rgb;
    vec3 origB = texture2D(u_background, bUV).rgb;

    vec3 blurR = texture2D(u_blurred, rUV).rgb;
    vec3 blurG = texture2D(u_blurred, gUV).rgb;
    vec3 blurB = texture2D(u_blurred, bUV).rgb;

    vec3 rCol = mix(origR, blurR, blurWeight);
    vec3 gCol = mix(origG, blurG, blurWeight);
    vec3 bCol = mix(origB, blurB, blurWeight);
    color = vec3(rCol.r, gCol.g, bCol.b);
  } else {
    float r = texture2D(u_background, rUV).r;
    float g = texture2D(u_background, gUV).g;
    float b = texture2D(u_background, bUV).b;
    color = vec3(r, g, b);
  }

  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, u_saturation);

  color = mix(color, u_tintColor, u_tintOpacity);

  float facing = max(dot(grad, normalize(u_lightDir)), 0.0);
  float specular = pow(facing, 3.0) * rim * u_specularIntensity / 100.0 * 0.9 * u_highlightBoost;
  color += specular;

  float centerFalloff = 1.0 - smoothstep(0.0, u_rimWidth * 0.5, abs(dist));
  color += specular * centerFalloff * 0.3;

  if (u_debugShowDisplacement == 1) {
    float debugVal = displace / 24.0;
    vec3 debugColor = mix(vec3(0.0, 0.0, 0.2), vec3(1.0, 0.2, 0.0), debugVal);
    gl_FragColor = vec4(mix(color, debugColor, 0.7), 1.0);
  } else {
    gl_FragColor = vec4(color, 1.0);
  }
}
`

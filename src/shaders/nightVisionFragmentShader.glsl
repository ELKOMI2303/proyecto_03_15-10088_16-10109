//#version 300 es
precision highp float;

out vec4 FragColor;
in vec2 vUv;
uniform float time;
uniform float noiseIntensity;
uniform float contrast;
uniform float nightVisionActive; // 🔴 Nuevo uniforme

float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 color = vec3(0.0, 1.0, 0.0); // Verde visión nocturna
    float noise = random(vUv * time) * noiseIntensity;

    color = mix(vec3(0.0, 0.5, 0.0), color, contrast);
    color += vec3(noise);

    // 🔴 Solo activar el efecto si nightVisionActive es 1.0
    color = mix(vec3(0.0), color, nightVisionActive);

    FragColor = vec4(color, 1.0);
}
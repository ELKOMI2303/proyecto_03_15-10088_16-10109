precision highp float;

uniform sampler2D tDiffuse;
uniform float time;
uniform float noiseIntensity;
uniform float contrast;
uniform float nightVisionActive;

in vec2 vUv;
out vec4 fragColor;

float rand(vec2 co){
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(){
    // Si nightVision está desactivado, mostrar textura original y salir
    if (nightVisionActive < 0.5) {
        fragColor = texture(tDiffuse, vUv);
        return;
    }

    // Si está activa, aplicar efecto
    vec4 color = texture(tDiffuse, vUv);

    float noise = rand(vUv * time) * noiseIntensity;
    color.rgb += vec3(0.0, noise * 0.2, 0.0); // Ruido solo verde

    color.rgb = (color.rgb - 0.5) * contrast + 0.5; // Contraste

    color.rgb *= vec3(0.1, 1.0, 0.1); // Tinte verde

    fragColor = vec4(color.rgb, 1.0);
}

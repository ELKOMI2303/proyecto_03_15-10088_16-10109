precision highp float;

uniform sampler2D tDiffuse;
uniform float time;
uniform float noiseIntensity;
uniform float contrast;
uniform float nightVisionActive;
uniform vec3 cameraPosition; // Posición de la cámara
uniform float visionRadius;  // Radio de visión en modo normal

in vec2 vUv;
out vec4 fragColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 color = texture(tDiffuse, vUv);

    // Si nightVision está activado, mostrar todo el modelo
    if (nightVisionActive > 0.5) {
        // Mantener colores originales y aplicar tinte verde
        vec3 originalColor = color.rgb;
        vec3 greenTint = originalColor * vec3(0.8, 1.0, 0.8); // Tinte verde sutil

        // Añadir ruido verde
        float noise = rand(vUv * time) * noiseIntensity;
        greenTint += vec3(0.0, noise * 0.1, 0.0);

        // Resaltar áreas iluminadas
        float brightness = dot(originalColor, vec3(0.299, 0.587, 0.114)); // Luminancia
        greenTint += brightness * vec3(0.0, 0.5, 0.0); // Brillo verde adicional

        // Ajustar contraste
        greenTint = (greenTint - 0.5) * contrast + 0.5;

        fragColor = vec4(greenTint, color.a);
        return;
    }

    // Si nightVision está desactivado, aplicar el radio de visión
    float distanceToCamera = length(cameraPosition.xy - gl_FragCoord.xy / gl_FragCoord.w);

    // Atenuar el color fuera del radio de visión
    if (distanceToCamera > visionRadius) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0); // Fragmento fuera del radio
        return;
    }

    fragColor = color; // Fragmento dentro del radio
}

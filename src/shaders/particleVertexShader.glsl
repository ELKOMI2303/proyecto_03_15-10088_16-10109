//#version 300 es
precision highp float;
precision highp int;// Precisión explícita para enteros

in vec3 position;
in float size;
in vec3 customColor;

out vec3 vColor;
uniform float time;
uniform float amplitud;// param1
uniform float frecuencia;// param2
uniform float fase;// param3
uniform int behavior;
uniform float velocidad;// Nueva uniforme para la velocidad
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
out vec2 vGridIndex;// Pasar la posición de la celda a fragment shader
out vec2 vCellSize;// Pasar el tamaño de la celda
uniform vec2 gridSize;// Número de celdas en el grid (e.g., vec2(4.0, 4.0))

// Gradiente aleatorio (hash)
vec2 random2(vec2 st) {
    return vec2(
        fract(sin(dot(st, vec2(127.1, 311.7))) * 43758.5453123),
        fract(sin(dot(st, vec2(269.5, 183.3))) * 43758.5453123)
    );
}

// Función de ruido Perlin (2D)
float perlinNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Interpolación suave
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Gradientes
    float a = dot(random2(i), f - vec2(0.0, 0.0));
    float b = dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main(){
    vColor=customColor;
    vec3 pos=position;
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
    
    if (behavior == 0) {
        // Movimiento ascendente con ruido para simular humo
        float noise = perlinNoise(vec2(position.x * 0.1, position.y * 0.1 + time * 0.1));
        pos.y += velocidad * amplitud * noise;
        pos.x += velocidad * amplitud * noise;
    } else if (behavior == 1) {
        // Gravedad con oscilaciones aleatorias
        pos.y -= velocidad * amplitud * time;
        vec3 attractionPoint = vec3(0., 0., 0.);
        vec3 direction = normalize(attractionPoint - pos);
        float noise = perlinNoise(vec2(position.x * 0.5, position.y * 0.5 + time));
        pos.x += noise * 0.5; // Oscilación lateral aleatoria
        pos += direction * velocidad * 0.1 * amplitud;
    } else if (behavior == 2) {
        // Estelas con ondulación
        float noise = perlinNoise(vec2(time * 0.1, position.x * 0.1));
        pos.x += velocidad * sin(time * frecuencia + position.x) * amplitud + noise;
        pos.y += velocidad * cos(time * frecuencia + position.y) * amplitud + noise;
        pos.z += 0.5 * velocidad * sin(time * frecuencia + position.z + fase) + noise;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.);
    gl_PointSize = size * (300. / -mvPosition.z) * amplitud;
    gl_Position = projectionMatrix * mvPosition;
}

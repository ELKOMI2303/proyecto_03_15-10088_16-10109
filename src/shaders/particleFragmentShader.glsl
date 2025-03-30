//#version 300 es
precision highp float;
precision highp int;// Precisión explícita para enteros

in vec3 vColor;// Color interpolado desde el vertex shader
out vec4 fragColor;// Color de salida del fragmento

uniform int behavior;// Uniforme que define el comportamiento
uniform sampler2D texturejpg;// Uniforme para la textura (si existe)

// Umbral para determinar qué fragmentos descartar
const float discardThreshold=.01;
in vec2 vGridIndex;// Índice de celda
in vec2 vCellSize;// Tamaño de cada celda

void main(){
    // Calcula un alpha básico para bordes suaves
    float alpha=max(0.,1.-length(gl_PointCoord-.5)*2.);
    
    // Ajusta las coordenadas UV para apuntar al grid
    // vec2 adjustedUV=vGridIndex*vCellSize+gl_PointCoord*vCellSize;
    
    // Obtén el color de la textura en la posición ajustada
    vec4 texColor=texture(texturejpg,gl_PointCoord);
    
    // Comportamiento según el valor de 'behavior'
    if(behavior==0){
        // Humo: Desvanecimiento gradual
        float fade=1.-(gl_FragCoord.y/500.);// Desvanecimiento con la altura
        fragColor=vec4(vec3(.5,.5,.5),alpha*fade);// Gris con opacidad disminuyendo
    }else if(behavior==1){
        // Gravedad: Partículas brillantes con menor desvanecimiento
        fragColor=vec4(vColor*.8,alpha);// Color más tenue
    }else if(behavior==2){
        // Estelas: Partículas más brillantes y sin bordes duros
        fragColor=vec4(vColor*alpha,.8*alpha);// Desvanecimiento rápido
    }else{
        // Comportamiento por defecto (fallo seguro)
        fragColor=vec4(vColor,alpha);// Sin modificaciones especiales
    }
    
    // Descarta fragmentos con color negro (o casi negro)
    if(texColor.r<=discardThreshold&&texColor.g<=discardThreshold&&texColor.b<=discardThreshold){
        discard;// Ignora este fragmento
    }
}

import * as THREE from 'three';
import GUI from 'lil-gui';
import particleVertexShader from './shaders/particleVertexShader.glsl';
import particleFragmentShader from './shaders/particleFragmentShader.glsl';

const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load(
    './textures/humo.png',
    () => console.log('Textura cargada correctamente'),
    undefined,
    (error) => console.error('Error al cargar la textura:', error)
);

export class ParticleSystem {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private particleSystem!: THREE.Points;
    private particleMaterial!: THREE.RawShaderMaterial;
    private startTime: number;
    private gui!: GUI;
    private params: { amplitud: number; frecuencia: number; fase: number; behavior: number, velocidad: number };

    // Inicialización de parámetros
   
    
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(() => this.animate());
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // this.renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5)); // Fondo gris claro

         
        const container = document.getElementById('app-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }

        this.startTime = Date.now();
        this.params = { amplitud: 0.5, frecuencia: 1.0, fase: 1.5, behavior: 0, velocidad: 1.0 };

        if (this.params.behavior === 0) {
            this.renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5)); // Fondo gris
        } else {
            this.renderer.setClearColor(new THREE.Color(0, 0, 0)); // Fondo negro
        }
        
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('wheel', (event) => this.onZoom(event));

        this.init();
    }

    public destroy(): void {
        this.gui.destroy();
        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('wheel', this.onZoom);
    }

    private init(): void {
        this.createParticleSystem();
        this.setupGUI();
    }

    private createParticleSystem(): void {
        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() * 2 - 1) * 50;
            positions[i * 3 + 1] = (Math.random() * 2 - 1) * 50;
            positions[i * 3 + 2] = (Math.random() * 2 - 1) * 50;

            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();

            sizes[i] = 20;
        }

        const particles = new THREE.BufferGeometry();
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.particleMaterial = new THREE.RawShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: { 
                time: { value: 0.0 },
                amplitud: { value: this.params.amplitud },
                frecuencia: { value: this.params.frecuencia },
                fase: { value: this.params.fase },
                behavior: { value: this.params.behavior },
                velocidad: { value: this.params.velocidad },
                texturejpg: { value: particleTexture }, // Uniforme para la textura
                modelViewMatrix: { value: new THREE.Matrix4() },
                projectionMatrix: { value: new THREE.Matrix4() }
            },
            glslVersion: THREE.GLSL3,
            transparent: true,
            blending: THREE.NormalBlending, // Activa el blending aditivo
        });
        
        

        this.particleSystem = new THREE.Points(particles, this.particleMaterial);
        this.scene.add(this.particleSystem);
    }

    private setupGUI(): void {
        if (this.gui) this.gui.destroy();
        this.gui = new GUI();
        this.gui.add(this.params, 'amplitud', 0, 1).name('Amplitud').onChange((value: number) => this.particleMaterial.uniforms.amplitud.value = value);
        this.gui.add(this.params, 'frecuencia', 0, 1).name('Frecuencia').onChange((value: number) => this.particleMaterial.uniforms.frecuencia.value = value);
        this.gui.add(this.params, 'fase', 0, 1).name('Fase').onChange((value: number) => this.particleMaterial.uniforms.fase.value = value);
        this.gui.add(this.params, 'velocidad', 0.1, 10.0).name('Velocidad').onChange((value: number) => this.particleMaterial.uniforms.velocidad.value = value);
        this.gui.add(this.params, 'behavior', { Humo: 0, Gravedad: 1, Estelas: 2 }).name('Comportamiento').onChange((value: number) => {
            this.particleMaterial.uniforms.behavior.value = value

            // Cambia el color del fondo según el comportamiento
            if (value === 0) {
                this.renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5)); // Fondo gris para "Humo"
            } else {
                this.renderer.setClearColor(new THREE.Color(0, 0, 0)); // Fondo negro para "Gravedad" y "Estelas"
            }
        });
        this.gui.add(this.particleMaterial, 'blending', {
            Normal: THREE.NormalBlending,
            Additive: THREE.AdditiveBlending,
            Subtractive: THREE.SubtractiveBlending
        }).name('Blending').onChange((value: THREE.Blending) => {
            this.particleMaterial.blending = value;
            this.particleMaterial.needsUpdate = true; // Asegura que los cambios se reflejen
        });   
    }
    

    private lastFrameTime = 0;
    private frameInterval = 1000 / 60; // 60 FPS
    
    private animate(): void {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
    
        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime;
    
            const delta = (currentTime - this.startTime) / 1000;
            this.particleMaterial.uniforms.time.value = delta;
            this.particleMaterial.uniforms.modelViewMatrix.value = this.camera.matrixWorldInverse;
            this.particleMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
    
            this.renderer.render(this.scene, this.camera);
        }
    }
    

    private onResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            const container = document.getElementById('app-container');
            if (container) container.innerHTML = ''; 
            this.gui.destroy();
            window.location.reload();
        }
        // } else if (event.key === '1') {
        //     this.params.behavior = 0;
        //     this.particleMaterial.uniforms.behavior.value = 0;

        // } else if (event.key === '2') {
        //     this.params.behavior = 1;
        //     this.particleMaterial.uniforms.behavior.value = 1;
        // } else if (event.key === '3') {
        //     this.params.behavior = 2;
        //     this.particleMaterial.uniforms.behavior.value = 2;
        // }
    }

    private onZoom(event: WheelEvent): void {
        this.camera.position.z += event.deltaY * 0.01;
    }
}
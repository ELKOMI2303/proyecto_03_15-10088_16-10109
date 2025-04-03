import * as THREE from 'three';
import GUI from 'lil-gui';
import nightVisionVertexShader from './shaders/nightVisionVertexShader.glsl';
import nightVisionFragmentShader from './shaders/nightVisionFragmentShader.glsl';

export class NightVision {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private material!: THREE.RawShaderMaterial;
    private standardMaterial!: THREE.MeshPhongMaterial;
    private startTime: number;
    private gui!: GUI;
    private params: { noiseIntensity: number; contrast: number };
    private sphere!: THREE.Mesh;
    private nightVisionActive: boolean = false;
    

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(() => this.animate());
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(new THREE.Color(0, 0, 0)); // 🔴 Inicialmente negro, sin efecto nocturno

        document.body.appendChild(this.renderer.domElement);

        this.startTime = Date.now();
        this.params = { noiseIntensity: 0.5, contrast: 1.2 };

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('wheel', (event) => this.onZoom(event));

        this.init();
    }

    private init(): void {
        this.createShaderEffect();
        this.createSphereObject();
        this.setupGUI();
    }

    private createShaderEffect(): void {
        const geometry = new THREE.PlaneGeometry(2, 2);

        this.material = new THREE.RawShaderMaterial({
            vertexShader: nightVisionVertexShader,
            fragmentShader: nightVisionFragmentShader,
            uniforms: {
                time: { value: 0.0 },
                noiseIntensity: { value: this.params.noiseIntensity },
                contrast: { value: this.params.contrast },
                nightVisionActive: { value: 0.0 } // 🔴 Nuevo uniforme: efecto desactivado al inicio
            },
            glslVersion: THREE.GLSL3,
            transparent: true
        });

        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
    }
    private createSphereObject(): void {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
    
        // 🔴 Material inicial oscuro para que destaque con la visión nocturna
        this.standardMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    
        this.sphere = new THREE.Mesh(geometry, this.standardMaterial);
        this.sphere.position.z = -3;
    
        // 🔴 Ajuste de iluminación
        const light = new THREE.PointLight(0xffffff, 0.5); // 🔧 Reduce intensidad de luz
        light.position.set(2, 2, 5); // 🔧 Mueve la luz para dar efecto más natural
        this.scene.add(light);
    
        this.scene.add(this.sphere);
    }

    private setupGUI(): void {
        this.gui = new GUI();
        this.gui.add(this.params, 'noiseIntensity', 0.0, 1.0).name('Intensidad de Ruido').onChange((value: number) => {
            this.material.uniforms.noiseIntensity.value = value;
        });
        this.gui.add(this.params, 'contrast', 0.5, 2.0).name('Contraste').onChange((value: number) => {
            this.material.uniforms.contrast.value = value;
        });
    }

    private animate(): void {
        const delta = (Date.now() - this.startTime) / 1000;
        this.material.uniforms.time.value = delta;
        this.renderer.render(this.scene, this.camera);
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

        // 🔴 Alternar visión nocturna con la tecla "1"
        if (event.key === '1') {
            this.toggleNightVision();
        }
    }

    private onZoom(event: WheelEvent): void {
        this.camera.position.z += event.deltaY * 0.01;
    }

    private toggleNightVision(): void {
        this.nightVisionActive = !this.nightVisionActive;
        this.sphere.material = this.nightVisionActive ? this.material : this.standardMaterial;
        this.material.uniforms.nightVisionActive.value = this.nightVisionActive ? 1.0 : 0.0; // 🔴 Alterna el efecto
        this.renderer.setClearColor(this.nightVisionActive ? new THREE.Color(0, 0.2, 0) : new THREE.Color(0, 0, 0)); // 🔴 Ajusta el fondo
    }
}
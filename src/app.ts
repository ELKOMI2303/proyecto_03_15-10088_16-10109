import * as THREE from "three";
import GUI from "lil-gui";
import nightVisionVertexShader from "./shaders/nightVisionVertexShader.glsl";
import nightVisionFragmentShader from "./shaders/nightVisionFragmentShader.glsl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class NightVision {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private material!: THREE.RawShaderMaterial;
  private startTime: number;
  private gui!: GUI;
  private params: { noiseIntensity: number; contrast: number };
  private nightVisionActive: boolean = false;
  private renderTarget!: THREE.WebGLRenderTarget;
  private screenScene!: THREE.Scene;
  private screenCamera!: THREE.OrthographicCamera;
  private screenMesh!: THREE.Mesh;
  private controls!: OrbitControls;
  private ambientLight!: THREE.AmbientLight; // Referencia a la luz ambiental

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setAnimationLoop(() => this.animate());
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new THREE.Color(0, 0, 0));

    const container = document.getElementById("app-container");
    if (container) {
      container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }

    this.startTime = Date.now();
    this.params = { noiseIntensity: 0.5, contrast: 1.2 };

    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("keydown", (event) => this.onKeyDown(event));
    window.addEventListener("wheel", (event) => this.onZoom(event));

    this.init();
  }

  public destroy(): void {
    this.gui.destroy();
    this.renderer.dispose();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("wheel", this.onZoom);
  }

  private init(): void {
    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    this.renderTarget.texture.format = THREE.RGBAFormat;
    this.renderTarget.texture.minFilter = THREE.LinearFilter;
    this.renderTarget.texture.magFilter = THREE.LinearFilter;

    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.screenScene = new THREE.Scene();

    this.material = new THREE.RawShaderMaterial({
      vertexShader: nightVisionVertexShader,
      fragmentShader: nightVisionFragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        noiseIntensity: { value: this.params.noiseIntensity },
        contrast: { value: this.params.contrast },
        nightVisionActive: { value: 1.0 },
        cameraPosition: { value: new THREE.Vector3() }, // Posición de la cámara
        visionRadius: { value: 10.0 }, // Radio de visión en modo normal
      },
      glslVersion: THREE.GLSL3,
    });

    const quad = new THREE.PlaneGeometry(2, 2);
    this.screenMesh = new THREE.Mesh(quad, this.material);
    this.screenScene.add(this.screenMesh);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;

    this.loadCityModel();
    this.setupGUI();
  }

  private loadCityModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      "/ciudad/scene.gltf",
      (gltf: GLTF) => {
        console.log("City model loaded:", gltf);
        const city: THREE.Group = gltf.scene;
        city.scale.set(0.5, 0.5, 0.5);
        city.position.set(0, -1.5, -5);

        city.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh: THREE.Mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Conservar el material original del modelo
            mesh.userData.originalMaterial = mesh.material;
          }
        });

        const moonLight = new THREE.DirectionalLight(0xaabbff, 0.8);
        moonLight.position.set(5, 10, -5);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 1024;
        moonLight.shadow.mapSize.height = 1024;
        this.scene.add(moonLight);

        // Crear luz ambiental con intensidad inicial baja
        this.ambientLight = new THREE.AmbientLight(0x8899aa, 0.1); // Intensidad baja
        this.scene.add(this.ambientLight);

        this.scene.add(city);
      },
      undefined,
      (error: unknown) => {
        const errorEvent = error as ErrorEvent;
        console.error("Error loading the city model:", errorEvent);
      }
    );
  }

  private setupGUI(): void {
    this.gui = new GUI();
    this.gui
      .add(this.params, "noiseIntensity", 0.0, 1.0)
      .name("Intensidad de Ruido")
      .onChange((value: number) => {
        this.material.uniforms.noiseIntensity.value = value;
      });
    this.gui
      .add(this.params, "contrast", 0.5, 2.0)
      .name("Contraste")
      .onChange((value: number) => {
        this.material.uniforms.contrast.value = value;
      });
  }

  private animate(): void {
    const now = Date.now();
    const elapsed = now - this.startTime;
  
    if (elapsed >= 1000 / 30) { // 1000 ms / 60 FPS
      this.startTime = now;
  
      const delta = elapsed / 1000;
      this.material.uniforms.time.value = delta;
  
      this.material.uniforms.cameraPosition.value.copy(this.camera.position);
  
      if (this.nightVisionActive) {
        this.material.uniforms.nightVisionActive.value = 1.0;
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
  
        this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.renderer.render(this.screenScene, this.screenCamera);
      } else {
        this.material.uniforms.nightVisionActive.value = 0.0;
        this.renderer.render(this.scene, this.camera);
      }
  
      this.controls.update();
    }
  
    requestAnimationFrame(() => this.animate());
  }
  

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderTarget.setSize(window.innerWidth, window.innerHeight);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      const container = document.getElementById("app-container");
      if (container) container.innerHTML = "";
      this.gui.destroy();
      window.location.reload();
    }

    if (event.key === "1") {
      // Ajustar la intensidad de la luz ambiental
      this.ambientLight.intensity = this.nightVisionActive ? 0.5 : 0.1;
      this.nightVisionActive = !this.nightVisionActive;
      this.material.uniforms.nightVisionActive.value = this.nightVisionActive
        ? 1.0
        : 0.0;
      console.log(
        `Night Vision ${this.nightVisionActive ? "Activado" : "Desactivado"}`
      );
    }

    if (event.key === "n" || event.key === "N") {
      // Ajustar la intensidad de la luz ambiental
      this.ambientLight.intensity = this.nightVisionActive ? 0.5 : 0.1;
      this.nightVisionActive = !this.nightVisionActive;
      this.material.uniforms.nightVisionActive.value = this.nightVisionActive
        ? 1.0
        : 0.0;
      console.log(
        `Night Vision ${this.nightVisionActive ? "Activado" : "Desactivado"}`
      );
    }
  }

  private onZoom(event: WheelEvent): void {
    this.camera.position.z += event.deltaY * 0.01;
  }
}

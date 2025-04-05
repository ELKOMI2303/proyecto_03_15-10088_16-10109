import * as THREE from "three";
import GUI from "lil-gui";
import nightVisionVertexShader from "./shaders/nightVisionVertexShader.glsl";
import nightVisionFragmentShader from "./shaders/nightVisionFragmentShader.glsl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  // Variables nuevas
  private renderTarget!: THREE.WebGLRenderTarget;
  private screenScene!: THREE.Scene;
  private screenCamera!: THREE.OrthographicCamera;
  private screenMesh!: THREE.Mesh;

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
    this.renderer.setClearColor(new THREE.Color(0, 0, 0)); // 🔴 Inicialmente negro, sin efecto nocturno

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

    // Cámara ortográfica para pantalla completa
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.screenScene = new THREE.Scene();

    this.material = new THREE.RawShaderMaterial({
      vertexShader: nightVisionVertexShader,
      fragmentShader: nightVisionFragmentShader,
      uniforms: {
        tDiffuse: { value: null }, // 🔴 la textura renderizada de la escena
        time: { value: 0.0 },
        noiseIntensity: { value: this.params.noiseIntensity },
        contrast: { value: this.params.contrast },
        nightVisionActive: { value: 1.0 },
      },
      glslVersion: THREE.GLSL3,
    });

    const quad = new THREE.PlaneGeometry(2, 2);
    this.screenMesh = new THREE.Mesh(quad, this.material);
    this.screenScene.add(this.screenMesh);

    this.createShaderEffect();
    this.createSphereObject();
    this.loadCityModel(); // ← aquí cargas la ciudad
    this.setupGUI();
  }

  private createShaderEffect(): void {
    const geometry = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.RawShaderMaterial({
      vertexShader: nightVisionVertexShader,
      fragmentShader: nightVisionFragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        noiseIntensity: { value: this.params.noiseIntensity },
        contrast: { value: this.params.contrast },
        nightVisionActive: { value: 0.0 }, // 🔴 Nuevo uniforme: efecto desactivado al inicio
      },
      glslVersion: THREE.GLSL3,
      transparent: true,
    });

    // const mesh = new THREE.Mesh(geometry, this.material);
    // this.scene.add(mesh);
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

  private loadCityModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      "/ciudad/scene.gltf",
      (gltf: GLTF) => {
        console.log("City model loaded:", gltf); // 🔴 Log para depuración
        const city: THREE.Group = gltf.scene;
        city.scale.set(0.5, 0.5, 0.5); // Adjust size
        city.position.set(0, -1.5, -5); // Position visible from the camera

        city.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh: THREE.Mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Apply a dimmed material when night vision is inactive
            mesh.material = new THREE.MeshPhongMaterial({ color: 0x111111 });
            mesh.userData.originalMaterial = mesh.material; // Store original material
          }
        });

        const light = new THREE.PointLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        this.scene.add(light);

        const ambient = new THREE.AmbientLight(0xffffff, 0.1); // luz baja
        this.scene.add(ambient);

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

  // private animate(): void {
  //     const delta = (Date.now() - this.startTime) / 1000;
  //     this.material.uniforms.time.value = delta;
  //     this.renderer.render(this.scene, this.camera);
  // }

//   private animate(): void {
//     const delta = (Date.now() - this.startTime) / 1000;
//     this.material.uniforms.time.value = delta;
  
//     // 1. Renderiza la escena al render target (como textura)
//     this.renderer.setRenderTarget(this.renderTarget);
//     this.renderer.render(this.scene, this.camera);
//     this.renderer.setRenderTarget(null);
  
//     // 2. Pasa la textura al shader de pantalla
//     this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
  
//     // 3. Renderiza el quad de pantalla con el shader aplicado
//     this.renderer.render(this.screenScene, this.screenCamera);
//   }

//   private animate(): void {
//     const delta = (Date.now() - this.startTime) / 1000;
//     this.material.uniforms.time.value = delta;
  
//     // 1. Renderiza la escena al renderTarget
//     this.renderer.setRenderTarget(this.renderTarget);
//     this.renderer.clear(); // Limpia antes de renderizar
//     this.renderer.render(this.scene, this.camera);
//     this.renderer.setRenderTarget(null);
  
//     // 2. Pasa la textura al shader de pantalla
//     this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
  
//     // 3. Renderiza el quad a pantalla completa
//     this.renderer.render(this.screenScene, this.screenCamera);
//   }

  // 👇 al final del archivo app.ts

private animate(): void {
    const delta = (Date.now() - this.startTime) / 1000;
    this.material.uniforms.time.value = delta;
  
    if (this.nightVisionActive) {
      // 1. Renderiza la escena al renderTarget (no se muestra aún)
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null); // volver al frame buffer por defecto
  
      // 2. Pasa la textura al shader de pantalla
      this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
      this.material.uniforms.nightVisionActive.value = 1.0;
  
      // 3. Renderiza la pantalla completa con efecto
      this.renderer.render(this.screenScene, this.screenCamera);
    } else {
      this.material.uniforms.nightVisionActive.value = 0.0;
      this.renderer.render(this.scene, this.camera); // render normal
    }
  }
  
  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  
    this.renderTarget.setSize(window.innerWidth, window.innerHeight);
  }
  
  
  

//   private onResize(): void {
//     this.camera.aspect = window.innerWidth / window.innerHeight;
//     this.camera.updateProjectionMatrix();
//     this.renderer.setSize(window.innerWidth, window.innerHeight);
//   }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      const container = document.getElementById("app-container");
      if (container) container.innerHTML = "";
      this.gui.destroy();
      window.location.reload();
    }

    // 🔴 Alternar visión nocturna con la tecla "1"
    if (event.key === "1") {
      this.toggleNightVision();
    }

    if (event.key === "n" || event.key === "N") {
        this.nightVisionActive = !this.nightVisionActive;
        this.material.uniforms.nightVisionActive.value = this.nightVisionActive ? 1.0 : 0.0;
        console.log(`Night Vision ${this.nightVisionActive ? "Activado" : "Desactivado"}`);
      }
  }

  private onZoom(event: WheelEvent): void {
    this.camera.position.z += event.deltaY * 0.01;
  }

  private toggleNightVision(): void {
    this.nightVisionActive = !this.nightVisionActive;

    // Traverse all objects in the scene and update materials
    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (this.nightVisionActive) {
          // Apply night vision shader material
          mesh.material = this.material;
        } else {
          // Restore original material
          mesh.material =
            mesh.userData.originalMaterial ||
            new THREE.MeshPhongMaterial({ color: 0x111111 });
        }
      }
    });

    this.material.uniforms.nightVisionActive.value = this.nightVisionActive ? 1.0 : 0.0;

    this.renderer.setClearColor(
      this.nightVisionActive
        ? new THREE.Color(0, 0.2, 0)
        : new THREE.Color(0, 0, 0)
    );
  }
}

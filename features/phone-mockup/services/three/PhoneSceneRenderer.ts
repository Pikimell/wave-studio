import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getPhoneModel } from '../../domain/models';
import { getPhonePreset } from '../../domain/presets';
import type { PhoneMockupProject, PhoneModelConfig } from '../../domain/types';
import { createScreenCanvas } from '../screenCanvas';

const LANDSCAPE_ROLL = Math.PI / 2;
const Q_FRONT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));

export class PhoneSceneRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly gltfLoader = new GLTFLoader();
  private readonly orientRig = new THREE.Group();
  private readonly arcball = new THREE.Group();
  private readonly rig = new THREE.Group();
  private readonly qArc = new THREE.Quaternion();
  private readonly qArcTarget = new THREE.Quaternion();
  private readonly lights: THREE.DirectionalLight[] = [];
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0xdfe4ff, 0.9);
  private animationId = 0;
  private modelGroup: THREE.Group | null = null;
  private currentModel: PhoneModelConfig;
  private screenMaterial: THREE.MeshStandardMaterial | null = null;
  private originalScreenMap: THREE.Texture | null = null;
  private screenTexture: THREE.Texture | null = null;
  private screenshot: (CanvasImageSource & { width: number; height: number }) | null = null;
  private project: PhoneMockupProject;
  private disposed = false;
  private lastSize = { width: 0, height: 0 };

  constructor(private readonly container: HTMLElement, initialProject: PhoneMockupProject) {
    this.project = initialProject;
    this.currentModel = getPhoneModel(initialProject.deviceId);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.25, 100);
    this.camera.position.set(0, 0, 6);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.enableRotate = false;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 14;

    const env = new THREE.PMREMGenerator(this.renderer).fromScene(new RoomEnvironment(), 0.04);
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.environment = env.texture;
    this.scene.environmentIntensity = 2.4;

    this.scene.add(this.orientRig);
    this.orientRig.add(this.arcball);
    this.arcball.add(this.rig);
    this.scene.add(this.hemi);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    this.createLightRig();
    this.bindDrag();
    this.resize();
    this.animate();
  }

  async loadCurrentModel() {
    await this.loadModel(getPhoneModel(this.project.deviceId));
    this.applyProject(this.project);
  }

  async updateProject(project: PhoneMockupProject) {
    const modelChanged = project.deviceId !== this.project.deviceId;
    this.project = project;

    if (modelChanged) {
      await this.loadModel(getPhoneModel(project.deviceId));
    }

    this.applyProject(project);
  }

  setScreenshot(image: CanvasImageSource & { width: number; height: number }) {
    this.screenshot = image;
    this.refreshScreenTexture();
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height || (width === this.lastSize.width && height === this.lastSize.height)) return;

    this.lastSize = { width, height };
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  exportPng() {
    const url = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.project.deviceId}-mockup.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.controls.dispose();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }

  private createLightRig() {
    const group = new THREE.Group();
    const directions = [
      [0, 0, 1],
      [0, 0, -1],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [1, 1, 1],
      [-1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1]
    ];

    directions.forEach(([x, y, z]) => {
      const light = new THREE.DirectionalLight(0xffffff, 1.15);
      light.position.set(x * 6, y * 6, z * 6);
      group.add(light);
      this.lights.push(light);
    });

    this.scene.add(group);
  }

  private async loadModel(model: PhoneModelConfig) {
    this.currentModel = model;
    const gltf = await this.gltfLoader.loadAsync(model.assetPath);
    this.clearModel();
    this.modelGroup = gltf.scene;
    this.fitModel(this.modelGroup);
    this.rig.add(this.modelGroup);
    this.findAndPrepareMaterials(this.modelGroup);
    this.refreshScreenTexture();
  }

  private clearModel() {
    if (this.modelGroup) this.rig.remove(this.modelGroup);
    this.modelGroup = null;
    this.screenMaterial = null;
    this.originalScreenMap = null;
  }

  private fitModel(root: THREE.Group) {
    const [x, y, z] = this.currentModel.baseRotation;
    root.rotation.set(x, y, z);
    root.position.set(0, 0, 0);
    root.scale.setScalar(1);
    root.updateMatrixWorld(true);

    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(root).getSize(size);
    root.scale.setScalar(3 / size.y);
    root.updateMatrixWorld(true);

    const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    root.position.sub(center);
  }

  private findAndPrepareMaterials(root: THREE.Group) {
    const processed = new Set<THREE.Material>();
    root.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return;
      const mesh = object as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((material) => {
        if (!material || processed.has(material)) return;
        processed.add(material);
        if (!('color' in material)) return;

        const mat = material as THREE.MeshStandardMaterial;
        const tweak = this.currentModel.materialTweaks?.[mat.name];

        if (mat.name === this.currentModel.screenMaterialName) {
          this.screenMaterial = mat;
          this.originalScreenMap = mat.emissiveMap ?? mat.map ?? null;
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 1;
          mat.toneMapped = false;
          mat.metalness = 0;
          mat.roughness = 1;
          mat.envMapIntensity = 0;
          mat.color = new THREE.Color(0x000000);
          mat.map = null;
          mat.emissiveMap = this.originalScreenMap;
          mat.needsUpdate = true;
          return;
        }

        if (!tweak) return;

        Object.entries(tweak).forEach(([key, value]) => {
          if (key === 'color' && typeof value === 'number') mat.color = new THREE.Color(value);
          else if (key === 'emissive' && typeof value === 'number') mat.emissive = new THREE.Color(value);
          else if (key === 'emissiveFromMap' && value && mat.map) {
            mat.emissiveMap = mat.map;
            mat.emissive = new THREE.Color(0xffffff);
            mat.toneMapped = false;
          } else {
            (mat as unknown as Record<string, unknown>)[key] = value;
          }
        });
        mat.needsUpdate = true;
      });
    });
  }

  private applyProject(project: PhoneMockupProject) {
    const exposure = project.scene.exposure / 100;
    this.scene.environmentIntensity = 2.4 * exposure;
    this.renderer.toneMappingExposure = 1.35 * (0.7 + 0.3 * exposure);
    this.lights.forEach((light) => {
      light.intensity = 1.15 * exposure;
    });
    this.hemi.intensity = 0.9 * exposure;
    this.orientRig.rotation.z = project.orientation === 'landscape' ? LANDSCAPE_ROLL : 0;
    this.applyPresetOrCustomRotation(project);
    this.refreshScreenTexture();
  }

  private applyPresetOrCustomRotation(project: PhoneMockupProject) {
    const preset = getPhonePreset(project.presetId);

    if (preset) {
      this.qArcTarget.copy(this.presetQuaternion(project.mirrored
        ? { ...preset, azimuth: -preset.azimuth, rotationY: -preset.rotationY, rotationZ: -preset.rotationZ }
        : preset));
      this.camera.position.normalize().multiplyScalar(preset.distance);
      return;
    }

    this.qArcTarget.setFromEuler(new THREE.Euler(
      (project.scene.rotation.x / 100) * Math.PI * 2,
      (project.scene.rotation.y / 100) * Math.PI * 2,
      (project.scene.rotation.z / 100) * Math.PI * 2,
      'XYZ'
    ));
  }

  private presetQuaternion(preset: { azimuth: number; elevation: number; rotationY: number; rotationZ: number }) {
    const eye = new THREE.Object3D();
    const azimuth = THREE.MathUtils.degToRad(preset.azimuth);
    const polar = THREE.MathUtils.degToRad(90 - preset.elevation);
    const sinP = Math.sin(polar);

    eye.position.set(sinP * Math.sin(azimuth), Math.cos(polar), sinP * Math.cos(azimuth));
    eye.lookAt(0, 0, 0);
    eye.updateMatrixWorld(true);

    const q = eye.quaternion.clone().invert();
    q.multiply(Q_FRONT);
    q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, preset.rotationY, preset.rotationZ, 'YXZ')));
    return q;
  }

  private refreshScreenTexture() {
    if (!this.screenMaterial) return;

    if (!this.screenshot) {
      this.screenMaterial.emissiveMap = this.originalScreenMap;
      this.screenMaterial.needsUpdate = true;
      return;
    }

    if (this.screenTexture) this.screenTexture.dispose();

    const canvas = createScreenCanvas(this.screenshot, this.currentModel, this.project.filters);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    texture.flipY = this.originalScreenMap?.flipY ?? false;
    texture.wrapS = this.originalScreenMap?.wrapS ?? THREE.ClampToEdgeWrapping;
    texture.wrapT = this.originalScreenMap?.wrapT ?? THREE.ClampToEdgeWrapping;

    const uv = this.currentModel.uv;
    if (uv) {
      texture.center.set(0.5, 0.5);
      if (uv.rotation) texture.rotation += uv.rotation;
      if (uv.mirrorX) texture.repeat.x = -Math.abs(texture.repeat.x || 1);
      if (uv.flipY !== undefined) texture.flipY = uv.flipY;
      if (uv.repeat) {
        texture.center.set(0, 0);
        texture.rotation = 0;
        texture.repeat.set(uv.repeat[0], uv.repeat[1]);
      }
      if (uv.offset) texture.offset.set(uv.offset[0], uv.offset[1]);
      if (uv.clamp) {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
      }
    }

    texture.needsUpdate = true;
    this.screenTexture = texture;
    this.screenMaterial.emissiveMap = texture;
    this.screenMaterial.needsUpdate = true;
  }

  private bindDrag() {
    let active = false;
    let previous = { x: 0, y: 0 };

    const getNdc = (event: PointerEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      };
    };

    const projectTrackball = (x: number, y: number) => {
      const radius = 1.1;
      const d2 = x * x + y * y;
      const r2 = radius * radius;
      const z = d2 <= r2 * 0.5 ? Math.sqrt(r2 - d2) : (r2 * 0.5) / Math.sqrt(d2);
      return new THREE.Vector3(x, y, z).normalize();
    };

    const move = (event: PointerEvent) => {
      if (!active) return;
      const next = getNdc(event);
      const a = projectTrackball(previous.x, previous.y);
      const b = projectTrackball(next.x, next.y);
      const axis = new THREE.Vector3().crossVectors(a, b);
      const length = axis.length();
      if (length > 1e-6) {
        axis.divideScalar(length);
        const angle = Math.acos(Math.min(1, a.dot(b))) * 2.2;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        this.camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
        const worldAxis = right
          .multiplyScalar(axis.x)
          .addScaledVector(up, axis.y)
          .addScaledVector(this.camera.getWorldDirection(new THREE.Vector3()), -axis.z)
          .normalize();
        this.qArcTarget.premultiply(new THREE.Quaternion().setFromAxisAngle(worldAxis, angle));
      }
      previous = next;
    };

    this.renderer.domElement.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      active = true;
      previous = getNdc(event);
      this.project = { ...this.project, presetId: 'custom' };
    });
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', () => {
      active = false;
    });
  }

  private animate = () => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);
    this.resize();
    this.qArc.slerp(this.qArcTarget, 0.18);
    this.arcball.quaternion.copy(this.qArc);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

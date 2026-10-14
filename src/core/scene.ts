import * as THREE from "three";

export interface SceneBundle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  shadowPlane: THREE.Mesh;
  updateAspect: () => void;
  dispose: () => void;
}

export function createScene(): SceneBundle {
  const scene = new THREE.Scene();
  scene.background = null; // Transparent background blends seamlessly with DOM styling
  scene.fog = new THREE.FogExp2(0x050506, 0.02);

  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
  camera.position.set(4.2, 1.6, 5.0);
  camera.lookAt(0, 0.45, 0);

  // 1. Hemisphere light (soft nocturnal bounce with warm sky and cool ground)
  const hemiLight = new THREE.HemisphereLight(0x383e54, 0x14141c, 0.55);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  // 2. Overhead key light (warm streetlight source, casts vehicle shadow)
  const keyLight = new THREE.DirectionalLight(0xffe7c4, 2.8);
  keyLight.position.set(2.5, 7.0, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 18;
  keyLight.shadow.camera.left = -3.2;
  keyLight.shadow.camera.right = 3.2;
  keyLight.shadow.camera.top = 3.2;
  keyLight.shadow.camera.bottom = -3.2;
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  // 3. Crisp rim lights to define the silhouette of the body against the backdrop
  // Rear quarter rim (cool)
  const rimLightRear = new THREE.DirectionalLight(0xb2ccf2, 2.6);
  rimLightRear.position.set(-4.5, 2.5, -4.0);
  scene.add(rimLightRear);

  // Front three-quarter grazing rim (warm)
  const rimLightFront = new THREE.DirectionalLight(0xffdfba, 1.8);
  rimLightFront.position.set(4.5, 2.2, 3.5);
  scene.add(rimLightFront);

  // Soft low fill light to keep wheel arches and rockers legible
  const sideFill = new THREE.DirectionalLight(0x404558, 0.7);
  sideFill.position.set(-3.5, 0.8, 2.0);
  scene.add(sideFill);

  // Faint warm bounce from the floor in front (lifts tires and lower valance)
  const bounceLight = new THREE.DirectionalLight(0xff9a5c, 0.35);
  bounceLight.position.set(0, 0.4, 4.0);
  scene.add(bounceLight);

  // 4. Studio floor: dark, slight sheen, fades into the void at the rim.
  // Receives the real key-light shadow so the car sits grounded.
  const floorFadeCanvas = document.createElement("canvas");
  floorFadeCanvas.width = 256;
  floorFadeCanvas.height = 256;
  const fCtx = floorFadeCanvas.getContext("2d")!;
  const fGrad = fCtx.createRadialGradient(128, 128, 20, 128, 128, 128);
  fGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
  fGrad.addColorStop(0.55, "rgba(255, 255, 255, 1)");
  fGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  fCtx.fillStyle = fGrad;
  fCtx.fillRect(0, 0, 256, 256);
  const floorAlpha = new THREE.CanvasTexture(floorFadeCanvas);

  const planeGeo = new THREE.CircleGeometry(9, 64);
  const planeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0b0c10),
    roughness: 0.42,
    metalness: 0.55,
    envMapIntensity: 0.5,
    transparent: true,
    alphaMap: floorAlpha,
  });
  const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
  shadowPlane.rotation.x = -Math.PI * 0.5;
  shadowPlane.position.y = 0; // Wheels rest exactly on y=0
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Subtle contact darkening pool beneath the chassis
  const poolCanvas = document.createElement("canvas");
  poolCanvas.width = 256;
  poolCanvas.height = 256;
  const pCtx = poolCanvas.getContext("2d")!;
  const pGrad = pCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
  pGrad.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  pGrad.addColorStop(0.6, "rgba(2, 2, 3, 0.28)");
  pGrad.addColorStop(1, "rgba(5, 5, 6, 0)");
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 256, 256);

  const poolTexture = new THREE.CanvasTexture(poolCanvas);
  const poolGeo = new THREE.PlaneGeometry(5.2, 3.2);
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTexture,
    transparent: true,
    depthWrite: false,
  });
  const contactPool = new THREE.Mesh(poolGeo, poolMat);
  contactPool.rotation.x = -Math.PI * 0.5;
  contactPool.position.y = 0.002;
  scene.add(contactPool);

  // 5. Minimal cyclorama backdrop: seamless dark studio sweep, visible from any
  // orbit angle. Kept near-black so the car stays the hero.
  const cycCanvas = document.createElement("canvas");
  cycCanvas.width = 16;
  cycCanvas.height = 256;
  const cCtx = cycCanvas.getContext("2d")!;
  const cGrad = cCtx.createLinearGradient(0, 0, 0, 256);
  cGrad.addColorStop(0, "#040406");
  cGrad.addColorStop(0.42, "#0d0f16");
  cGrad.addColorStop(0.5, "#241d14"); // Faint warm horizon band
  cGrad.addColorStop(0.58, "#0a0b0f");
  cGrad.addColorStop(1, "#050506");
  cCtx.fillStyle = cGrad;
  cCtx.fillRect(0, 0, 16, 256);
  const cycTexture = new THREE.CanvasTexture(cycCanvas);
  cycTexture.colorSpace = THREE.SRGBColorSpace;
  const cycGeo = new THREE.CylinderGeometry(20, 20, 18, 48, 1, true);
  const cycMat = new THREE.MeshBasicMaterial({
    map: cycTexture,
    side: THREE.BackSide,
  });
  const cyclorama = new THREE.Mesh(cycGeo, cycMat);
  cyclorama.position.y = 6;
  scene.add(cyclorama);

  const updateAspect = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  const dispose = () => {
    planeGeo.dispose();
    planeMat.dispose();
    floorAlpha.dispose();
    poolGeo.dispose();
    poolMat.dispose();
    poolTexture.dispose();
    cycGeo.dispose();
    cycMat.dispose();
    cycTexture.dispose();
  };

  return {
    scene,
    camera,
    shadowPlane,
    updateAspect,
    dispose,
  };
}

import * as THREE from "three";

export function createProceduralEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const tempScene = new THREE.Scene();

  // 1. Sky dome: deep neutral gradient with a narrow, restrained horizon warmth.
  // Kept dark so red paint keeps its shading gradation instead of clipping.
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#06070b");
  gradient.addColorStop(0.42, "#101218");
  gradient.addColorStop(0.5, "#2b241a"); // Narrow warm horizon seam
  gradient.addColorStop(0.58, "#090a0e");
  gradient.addColorStop(1, "#030304");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);

  // Faint warm glow, low in the sky (sunset-afterglow feel, not a spotlight)
  const radial = ctx.createRadialGradient(256, 128, 8, 256, 128, 170);
  radial.addColorStop(0, "rgba(255, 214, 160, 0.28)");
  radial.addColorStop(0.5, "rgba(255, 179, 92, 0.08)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 512, 256);

  const skyTexture = new THREE.CanvasTexture(canvas);
  skyTexture.mapping = THREE.EquirectangularReflectionMapping;
  skyTexture.colorSpace = THREE.SRGBColorSpace;

  const skyGeo = new THREE.SphereGeometry(50, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  tempScene.add(skyMesh);

  // 2. Studio softboxes (HDR colors >1) for soft, photographic clearcoat streaks.
  // One strong overhead strip, one warm side kicker, one cool rim card.
  const softboxGeo = new THREE.PlaneGeometry(16, 4);

  // Long overhead strip (hood and roof streak)
  const overheadMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(4.5, 4.2, 3.8),
    side: THREE.DoubleSide,
  });
  const overheadStrip = new THREE.Mesh(softboxGeo, overheadMat);
  overheadStrip.position.set(0, 6, 0);
  overheadStrip.rotation.x = Math.PI * 0.5;
  overheadStrip.scale.set(1.5, 0.5, 1);
  tempScene.add(overheadStrip);

  // Warm side kicker (hip/shoulder contour streak)
  const warmMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.6, 1.15, 0.8),
    side: THREE.DoubleSide,
  });
  const sideStrip = new THREE.Mesh(softboxGeo, warmMat);
  sideStrip.position.set(5, 2, -1);
  sideStrip.rotation.y = -Math.PI * 0.35;
  sideStrip.scale.set(0.8, 0.28, 1);
  tempScene.add(sideStrip);

  // Cool rim card, opposite side (edge definition on dark paint)
  const coolMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.75, 0.9, 1.2),
    side: THREE.DoubleSide,
  });
  const secondSideStrip = new THREE.Mesh(softboxGeo, coolMat);
  secondSideStrip.position.set(-5, 2.2, 1);
  secondSideStrip.rotation.y = Math.PI * 0.35;
  secondSideStrip.scale.set(0.8, 0.28, 1);
  tempScene.add(secondSideStrip);

  // 3. Dark floor in the env scene so the lower hemisphere falls off naturally
  // (kills the milky under-glow that made trim look like plastic).
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.015, 0.015, 0.018) });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI * 0.5;
  floorMesh.position.y = -1;
  tempScene.add(floorMesh);

  // Generate prefiltered environment map
  const renderTarget = pmremGenerator.fromScene(tempScene, 0.04);
  const envTexture = renderTarget.texture;

  // Cleanup temporary resources immediately
  pmremGenerator.dispose();
  skyGeo.dispose();
  skyMat.dispose();
  skyTexture.dispose();
  softboxGeo.dispose();
  overheadMat.dispose();
  warmMat.dispose();
  coolMat.dispose();
  floorGeo.dispose();
  floorMat.dispose();

  return envTexture;
}

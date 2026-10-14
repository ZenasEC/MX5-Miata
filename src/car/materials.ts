import * as THREE from "three";

export interface CarMaterials {
  bodyPaint: THREE.MeshPhysicalMaterial;
  glass: THREE.MeshPhysicalMaterial;
  chrome: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  wheelAlloy: THREE.MeshStandardMaterial;
  chassisDark: THREE.MeshStandardMaterial;
  headlightLens: THREE.MeshStandardMaterial;
  tailLightRed: THREE.MeshPhysicalMaterial;
  turnSignalAmber: THREE.MeshStandardMaterial;
  interior: THREE.MeshStandardMaterial;
  licensePlate: THREE.MeshStandardMaterial;
}

export function createCarMaterials(envMap?: THREE.Texture): CarMaterials {
  // Brilliant Obsidian Black body paint with deep glossy clearcoat
  const bodyPaint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x1a1c24), // Rich deep metallic charcoal/black with subtle navy undertone
    metalness: 0.3,
    roughness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 1.0,
    side: THREE.DoubleSide,
    envMap: envMap || null,
    envMapIntensity: 1.6,
  });

  // Dark tinted roadster windshield glass
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x161820),
    metalness: 0.1,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    transparent: true,
    opacity: 0.82,
    reflectivity: 1.0,
    envMap: envMap || null,
    envMapIntensity: 1.8,
  });

  // Chrome badges, wiper arms, door handles, exhaust
  const chrome = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xf0f0f5),
    metalness: 0.95,
    roughness: 0.12,
    envMap: envMap || null,
  });

  // Matte rubber for tires, window seals, bumper trim
  const rubber = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x18181a),
    roughness: 0.88,
    metalness: 0.05,
  });

  // NA original 14-inch "Daisy" alloy wheels
  const wheelAlloy = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd5d6da),
    metalness: 0.85,
    roughness: 0.22,
    envMap: envMap || null,
    envMapIntensity: 1.3,
  });

  // Undercarriage, inner wells and panel gap depths
  const chassisDark = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x050506),
    roughness: 0.95,
    metalness: 0.0,
  });

  // Pop-up headlight sealed-beam halogen lens (glow controlled by rig)
  const headlightLens = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffffff),
    emissive: new THREE.Color(0xffb35c),
    emissiveIntensity: 0.0,
    roughness: 0.15,
    metalness: 0.4,
    envMap: envMap || null,
  });

  // Iconic NA rear pill combination tail lamps
  const tailLightRed = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x8b0808),
    emissive: new THREE.Color(0x550000),
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.1,
    clearcoat: 0.8,
  });

  // Front bumper indicator / parking lights
  const turnSignalAmber = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xe67e22),
    emissive: new THREE.Color(0x934500),
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });

  // Cockpit seats, dash, center console
  const interior = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x141416),
    roughness: 0.85,
    metalness: 0.05,
  });

  const licensePlate = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x222226),
    roughness: 0.6,
  });

  return {
    bodyPaint,
    glass,
    chrome,
    rubber,
    wheelAlloy,
    chassisDark,
    headlightLens,
    tailLightRed,
    turnSignalAmber,
    interior,
    licensePlate,
  };
}

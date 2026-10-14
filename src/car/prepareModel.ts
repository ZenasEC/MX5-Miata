import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/**
 * Explicit node/material mapping for the licensed model, verified against the
 * GLB JSON chunk (Step 1 inspection):
 *
 *  File: public/models/miata.glb — 0.78 MB (< 10 MB limit)
 *  Extensions used: KHR_materials_emissive_strength (supported natively by three's GLTFLoader)
 *  Animations: none. Images/textures: 8/9 (paint/plate decals).
 *
 *  Nodes (all direct children of the scene, no nested hierarchy):
 *   [0] "body"               -> mesh "body(simple)"      (Paint/Glass/Plastic/front vent/taillights/front blinkers)
 *   [1] "exhaust"            -> mesh "exhaust(simple)"   (Plastic/metallic)
 *   [2] "Headlights(simple)" -> mesh "Headlights(simple)" (Plastic/Paint/"pop up 1"/LED)
 *   [3] "Mirrors"            -> mesh "Mirrors"           (Paint/Glass)
 *   [4] "plate"              -> mesh "plate"             (plate)
 *   [5] "wheels"             -> mesh "wheels(simple)"    (rims/rubber — all 4 wheels MERGED, cannot spin individually)
 *   [6] "trunk light"        -> mesh "body(simple).001"  (trunk light)
 *   [7] "extras"             -> mesh "Plane"             (side blinkers)
 *   [8] "emblem"             -> mesh "Circle"            (emblem)
 *
 *  Headlight strategy: "Headlights(simple)" is ONE merged mesh holding BOTH pop-up
 *  pods, modelled in the UP (deployed) pose. Vertex/index analysis of the real BIN
 *  chunk proves the two pods are disjoint islands: zero vertices with |x| < 0.05 and
 *  zero triangles spanning x = 0 (prim tris 236/22/160/64, cross-center tris 0/0/0/0).
 *  We therefore split each primitive by triangle-centroid x-sign into clean left/right
 *  halves (no tearing, no invented geometry) and parent each half under its own hinge
 *  pivot ("headlight_L" / "headlight_R") placed at the pod's rear-top edge (on the
 *  lid's rear edge), so the existing toggle + Wink scroll-scrub rig drives them.
 *
 *  Closed-pose calibration (measured from the real BIN chunk, Oct 2026):
 *  - Lid-face normal averages to (+/-0.05, 0.88, -0.47): the lid leans back ~28.3
 *    degrees from horizontal. Rotating +0.49 rad about X lays it exactly flat.
 *  - The hood is SOLID under the pods (continuous body verts y 0.28..1.04 in the
 *    pod footprint, no cutout). Per-vertex measurement shows the lid lands flat
 *    at y~1.01 after a +0.52 rad close rotation, so each pivot also dips by a
 *    numerically measured amount (virtual lid rotation vs. sampled hood skin)
 *    to sit flush. No guessing, no new geometry.
 */
export const MODEL_MAP = {
  headlightsNodeName: "Headlights(simple)",
  wheelsNodeName: "wheels",
  bodyNodeName: "body",
  /** Lamp-face materials that glow when the pods are up. */
  lampMaterialNames: ["LED", "pop up 1"],
  /** Lid-cover material within the headlight subtree (used for flush-fit measuring). */
  lidMaterialNames: ["Paint"],
  /** Materials expected toward the nose of the car (used for forward detection). */
  frontIndicatorMaterials: ["front blinkers", "front vent", "LED", "pop up 1"],
  /** Materials expected toward the tail of the car (used for forward detection). */
  rearIndicatorMaterials: ["taillights", "trunk light"],
  /** Overall length (nose z=1.95 to tail z=-1.90) of the procedural car we match. */
  targetLength: 3.85,
  /**
   * Retracted angle. Measured lid normal (0.88 up => 28.3 deg back-tilt) lays flat
   * at 0.49 rad; +0.03 rad bias settles the leading edge a hair nose-down.
   * Rest pose (as modelled, UP) is pivot rotation 0 = OPEN.
   */
  closeAngle: 0.52,
  /** Closed lid sits this far proud of the sampled hood skin (avoids z-fighting). */
  lidProud: 0.01,
} as const;

export interface PreparedGLB {
  root: THREE.Group;
  headlight_L: THREE.Group;
  headlight_R: THREE.Group;
  lampMaterials: THREE.MeshStandardMaterial[];
  spotlight_L: THREE.SpotLight;
  spotlight_R: THREE.SpotLight;
  closeAngle: number;
  /** Downward settle travel (container units) applied at full close, per side. */
  closedDipL: number;
  closedDipR: number;
  dispose: () => void;
}

/**
 * Split a BufferGeometry into one side (x > 0 or x < 0) by triangle-centroid sign.
 * All vertex attributes (position/normal/uv/...) are remapped consistently.
 * Returns null when the side is empty.
 */
export function splitGeometryByX(
  source: THREE.BufferGeometry,
  side: 1 | -1
): THREE.BufferGeometry | null {
  const position = source.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!position) return null;

  const keep: Array<[number, number, number]> = [];
  const take = side === 1 ? (cx: number) => cx > 0 : (cx: number) => cx < 0;
  const index = source.getIndex();

  if (index) {
    for (let t = 0; t < index.count; t += 3) {
      const a = index.getX(t);
      const b = index.getX(t + 1);
      const c = index.getX(t + 2);
      const cx = (position.getX(a) + position.getX(b) + position.getX(c)) / 3;
      if (take(cx)) keep.push([a, b, c]);
    }
  } else {
    for (let v = 0; v + 2 < position.count; v += 3) {
      const cx = (position.getX(v) + position.getX(v + 1) + position.getX(v + 2)) / 3;
      if (take(cx)) keep.push([v, v + 1, v + 2]);
    }
  }

  if (keep.length === 0) return null;

  const attrNames = Object.keys(source.attributes);
  const itemSizes = new Map<string, number>();
  const data = new Map<string, number[]>();
  for (const name of attrNames) {
    const attr = source.getAttribute(name) as THREE.BufferAttribute;
    itemSizes.set(name, attr.itemSize);
    data.set(name, []);
  }

  const remap = new Map<number, number>();
  const pushVertex = (oldIndex: number): number => {
    const existing = remap.get(oldIndex);
    if (existing !== undefined) return existing;
    const newIndex = remap.size;
    remap.set(oldIndex, newIndex);
    for (const name of attrNames) {
      const attr = source.getAttribute(name) as THREE.BufferAttribute;
      const out = data.get(name);
      if (out) {
        for (let k = 0; k < attr.itemSize; k++) out.push(attr.getComponent(oldIndex, k));
      }
    }
    return newIndex;
  };

  const newIndex: number[] = [];
  for (const [a, b, c] of keep) {
    newIndex.push(pushVertex(a), pushVertex(b), pushVertex(c));
  }

  const out = new THREE.BufferGeometry();
  for (const name of attrNames) {
    const itemSize = itemSizes.get(name) ?? 3;
    const arr = data.get(name) ?? [];
    out.setAttribute(name, new THREE.BufferAttribute(new Float32Array(arr), itemSize));
  }
  out.setIndex(newIndex);
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}

function materialName(mat: THREE.Material | THREE.Material[] | undefined): string[] {
  if (!mat) return [];
  const list = Array.isArray(mat) ? mat : [mat];
  return list.map((m) => m.name);
}

/** Average world-space Z centroid of all primitives using one of the given materials. */
function averageCentroidZ(container: THREE.Object3D, names: readonly string[]): number | null {
  const wanted = new Set(names);
  let sum = 0;
  let count = 0;
  const center = new THREE.Vector3();
  container.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const namesOnMesh = materialName(mesh.material as THREE.Material | THREE.Material[]);
    if (!namesOnMesh.some((n) => wanted.has(n))) return;
    const geo = mesh.geometry as THREE.BufferGeometry | undefined;
    if (!geo) return;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    const sphere = geo.boundingSphere;
    if (!sphere) return;
    center.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
    sum += center.z;
    count += 1;
  });
  return count > 0 ? sum / count : null;
}

export function prepareModel(gltf: GLTF): PreparedGLB {
  const container = gltf.scene;
  container.updateMatrixWorld(true);

  // 1. Forward-direction check: nose indicators must sit at +Z (procedural convention).
  // Only auto-flip when BOTH indicator sets are found; otherwise trust the export.
  const frontZ = averageCentroidZ(container, MODEL_MAP.frontIndicatorMaterials);
  const rearZ = averageCentroidZ(container, MODEL_MAP.rearIndicatorMaterials);
  const flipped = frontZ !== null && rearZ !== null && frontZ < rearZ;
  if (flipped) {
    container.rotation.y = Math.PI;
    container.updateMatrixWorld(true);
  }

  // 2. Locate the merged headlight assembly (one node, one or more primitive meshes).
  const hlNode = container.getObjectByName(MODEL_MAP.headlightsNodeName);
  if (!hlNode) {
    throw new Error(
      `[prepareModel] Required node "${MODEL_MAP.headlightsNodeName}" not found in miata.glb.`
    );
  }
  const hlMeshes: THREE.Mesh[] = [];
  hlNode.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) hlMeshes.push(child as THREE.Mesh);
  });
  if (hlMeshes.length === 0) {
    throw new Error(`[prepareModel] Node "${MODEL_MAP.headlightsNodeName}" contains no meshes.`);
  }

  // 3. Bake each primitive into container space, then split into left/right halves.
  const invContainer = new THREE.Matrix4().copy(container.matrixWorld).invert();
  const createdGeos: THREE.BufferGeometry[] = [];
  const sideGeosL: THREE.BufferGeometry[] = [];
  const sideGeosR: THREE.BufferGeometry[] = [];
  const sideMatsL: THREE.Material[] = [];
  const sideMatsR: THREE.Material[] = [];
  const lidGeosL: THREE.BufferGeometry[] = [];
  const lidGeosR: THREE.BufferGeometry[] = [];

  for (const mesh of hlMeshes) {
    const rel = new THREE.Matrix4().copy(mesh.matrixWorld).premultiply(invContainer);
    const baked = (mesh.geometry as THREE.BufferGeometry).clone().applyMatrix4(rel);
    createdGeos.push(baked);
    const mat = mesh.material as THREE.Material;
    const geoL = splitGeometryByX(baked, 1);
    const geoR = splitGeometryByX(baked, -1);
    if (geoL) {
      createdGeos.push(geoL);
      sideGeosL.push(geoL);
      sideMatsL.push(mat);
      if ((MODEL_MAP.lidMaterialNames as readonly string[]).includes(mat.name)) lidGeosL.push(geoL);
    }
    if (geoR) {
      createdGeos.push(geoR);
      sideGeosR.push(geoR);
      sideMatsR.push(mat);
      if ((MODEL_MAP.lidMaterialNames as readonly string[]).includes(mat.name)) lidGeosR.push(geoR);
    }
    mesh.visible = false; // Keep for bounds/dispose; pivots carry the visible halves.
  }

  if (sideGeosL.length === 0 || sideGeosR.length === 0) {
    throw new Error("[prepareModel] Headlight split produced an empty side — aborting.");
  }

  // 4. Hinge pivots at each pod's rear-top edge (rear = min Z, top = max Y).
  const headlight_L = new THREE.Group();
  headlight_L.name = "headlight_L";
  const headlight_R = new THREE.Group();
  headlight_R.name = "headlight_R";

  const placeSide = (
    geos: THREE.BufferGeometry[],
    mats: THREE.Material[],
    pivot: THREE.Group
  ): void => {
    const bounds = new THREE.Box3();
    for (const g of geos) {
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox;
      if (bb) bounds.union(bb);
    }
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    const hinge = new THREE.Vector3(center.x, bounds.max.y - 0.015, bounds.min.z + 0.015);
    pivot.position.copy(hinge);
    for (let i = 0; i < geos.length; i++) {
      const m = new THREE.Mesh(geos[i], mats[i]);
      m.castShadow = true;
      m.receiveShadow = true;
      m.position.copy(hinge).negate();
      pivot.add(m);
    }
  };

  placeSide(sideGeosL, sideMatsL, headlight_L);
  placeSide(sideGeosR, sideMatsR, headlight_R);
  container.add(headlight_L);
  container.add(headlight_R);

  // 4b. Closed-state settle dip, measured numerically from the LID cover (Paint
  // prim) only: rotate its verts VIRTUALLY by closeAngle about the hinge, read
  // where the lid's top face lands, and dip the pivot so that face settles onto
  // the sampled hood skin. (The lid plane rides below the hinge axis and the
  // bucket's rear rail stays near hinge height, so whole-pod bounds would
  // over-dip and bury the lid.)
  const sampleHoodY = (geos: THREE.BufferGeometry[]): number | null => {
    const lid = new THREE.Box3();
    for (const g of geos) {
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox;
      if (bb) lid.union(bb);
    }
    let hoodY: number | null = null;
    const bodyNode = container.getObjectByName(MODEL_MAP.bodyNodeName);
    if (!bodyNode) return null;
    const v = new THREE.Vector3();
    bodyNode.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const geo = mesh.geometry as THREE.BufferGeometry | undefined;
      const pos = geo?.getAttribute("position") as THREE.BufferAttribute | undefined;
      if (!pos) return;
      for (let i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i))
          .applyMatrix4(mesh.matrixWorld)
          .applyMatrix4(invContainer);
        if (
          v.x >= lid.min.x - 0.06 &&
          v.x <= lid.max.x + 0.06 &&
          v.z >= lid.min.z - 0.12 &&
          v.z <= lid.max.z + 0.03
        ) {
          hoodY = hoodY === null ? v.y : Math.max(hoodY, v.y);
        }
      }
    });
    return hoodY;
  };

  const measureDip = (
    geos: THREE.BufferGeometry[],
    hinge: THREE.Vector3,
    hoodY: number | null
  ): number => {
    if (hoodY === null || geos.length === 0) return 0;
    const cos = Math.cos(MODEL_MAP.closeAngle);
    const sin = Math.sin(MODEL_MAP.closeAngle);
    let top = -Infinity;
    const rotated: number[] = [];
    for (const g of geos) {
      const pos = g.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const yr = hinge.y + (pos.getY(i) - hinge.y) * cos - (pos.getZ(i) - hinge.z) * sin;
        rotated.push(yr);
        if (yr > top) top = yr;
      }
    }
    // Lid top face = mean of verts within a thin band below the max.
    let sum = 0;
    let count = 0;
    for (const yr of rotated) {
      if (yr >= top - 0.04) {
        sum += yr;
        count += 1;
      }
    }
    const lidTop = count > 0 ? sum / count : top;
    return Math.max(0, lidTop - (hoodY + MODEL_MAP.lidProud));
  };

  const hoodYL = sampleHoodY(lidGeosL.length > 0 ? lidGeosL : sideGeosL);
  const hoodYR = sampleHoodY(lidGeosR.length > 0 ? lidGeosR : sideGeosR);
  const closedDipL = measureDip(
    lidGeosL.length > 0 ? lidGeosL : sideGeosL,
    headlight_L.position,
    hoodYL
  );
  const closedDipR = measureDip(
    lidGeosR.length > 0 ? lidGeosR : sideGeosR,
    headlight_R.position,
    hoodYR
  );

  // 5. Materials: de-plastic the licensed model while keeping its low-poly look
  // (normals untouched, original colors/maps kept). Paint becomes a true
  // clearcoat car paint; trim/glass/rubber get studio-sane reflection levels
  // so nothing blows out to flat gray or milky white. Lamp faces keep their
  // animated emissive (intensity driven by the rig).
  const lampMaterials: THREE.MeshStandardMaterial[] = [];
  const seenLamp = new Set<THREE.Material>();
  const replacedPaint = new Map<THREE.Material, THREE.Material>();

  const toCarPaint = (m: THREE.Material): THREE.Material => {
    const existing = replacedPaint.get(m);
    if (existing) return existing;
    const src = m as THREE.MeshStandardMaterial;
    const srcMaps = src as unknown as {
      map?: THREE.Texture | null;
      normalMap?: THREE.Texture;
      roughnessMap?: THREE.Texture;
      metalnessMap?: THREE.Texture;
    };
    const paint = new THREE.MeshPhysicalMaterial({
      color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
      map: srcMaps.map ?? null,
      metalness: 0.08,
      roughness: THREE.MathUtils.clamp(src.roughness ?? 0.35, 0.28, 0.42),
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.0,
    });
    if (srcMaps.normalMap) paint.normalMap = srcMaps.normalMap;
    if (srcMaps.roughnessMap) paint.roughnessMap = srcMaps.roughnessMap;
    if (srcMaps.metalnessMap) paint.metalnessMap = srcMaps.metalnessMap;
    replacedPaint.set(m, paint);
    return paint;
  };

  container.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const tune = (m: THREE.Material): THREE.Material => {
      const std = m as THREE.MeshStandardMaterial;
      if (!std) return m;
      if (std.name === "Paint") return toCarPaint(m);
      if (std.name === "Glass" && "envMapIntensity" in std) std.envMapIntensity = 1.2;
      if ((std.name === "rims" || std.name === "metallic") && "roughness" in std) {
        std.roughness = 0.32;
        std.metalness = 0.9;
        if ("envMapIntensity" in std) std.envMapIntensity = 1.0;
      }
      if ((std.name === "rubber" || std.name === "Plastic") && "envMapIntensity" in std) {
        std.envMapIntensity = 0.4;
        if ("roughness" in std) std.roughness = Math.max(std.roughness, 0.7);
      }
      return m;
    };
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(tune);
    else if (mesh.material) mesh.material = tune(mesh.material);

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const std = m as THREE.MeshStandardMaterial;
      if (
        std &&
        (MODEL_MAP.lampMaterialNames as readonly string[]).includes(std.name) &&
        !seenLamp.has(std)
      ) {
        seenLamp.add(std);
        if ("emissive" in std && "emissiveIntensity" in std) {
          std.emissive = new THREE.Color(0xffb35c);
          std.emissiveIntensity = 0.0;
          lampMaterials.push(std);
        }
      }
    }
  });

  // 6. Beam spotlights parented to the pivots (intensity driven by the rig).
  const makeSpot = (): THREE.SpotLight => {
    const spot = new THREE.SpotLight(0xffb35c, 0.0, 16, Math.PI * 0.24, 0.45, 1.2);
    spot.position.set(0, -0.1, 0.35);
    spot.target.position.set(0, -0.8, 6.0);
    return spot;
  };
  const spotlight_L = makeSpot();
  headlight_L.add(spotlight_L);
  headlight_L.add(spotlight_L.target);
  const spotlight_R = makeSpot();
  headlight_R.add(spotlight_R);
  headlight_R.add(spotlight_R.target);

  // 7. Normalize: scale to procedural length, center X/Z, rest lowest point on y=0.
  const root = new THREE.Group();
  root.name = "Miata_GLB_Root";
  root.add(container);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scaleFactor = MODEL_MAP.targetLength / (size.z || 1);
  root.scale.setScalar(scaleFactor);
  root.updateMatrixWorld(true);

  const grounded = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  grounded.getCenter(center);
  root.position.set(-center.x, -grounded.min.y, -center.z);
  root.updateMatrixWorld(true);

  // eslint-disable-next-line no-console
  console.info(
    `[prepareModel] GLB normalized: length=${(size.z * scaleFactor).toFixed(2)} ` +
      `width=${(size.x * scaleFactor).toFixed(2)} scale=${scaleFactor.toFixed(3)} ` +
      `hingeL=${headlight_L.position.toArray().map((v) => v.toFixed(2)).join(",")} ` +
      `hingeR=${headlight_R.position.toArray().map((v) => v.toFixed(2)).join(",")} ` +
      `dipL=${closedDipL.toFixed(3)} dipR=${closedDipR.toFixed(3)} ` +
      `frontZ=${frontZ?.toFixed(2) ?? "n/a"} rearZ=${rearZ?.toFixed(2) ?? "n/a"} ` +
      `flipped=${flipped}`
  );

  const dispose = (): void => {
    for (const g of createdGeos) g.dispose();
    const seenMats = new Set<THREE.Material>();
    container.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const geo = mesh.geometry as THREE.BufferGeometry | undefined;
      if (geo && !createdGeos.includes(geo)) geo.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m && !seenMats.has(m)) {
          seenMats.add(m);
          m.dispose();
        }
      }
    });
    // Original Paint materials swapped out for clearcoat versions.
    for (const old of replacedPaint.keys()) {
      if (!seenMats.has(old)) old.dispose();
    }
  };

  return {
    root,
    headlight_L,
    headlight_R,
    lampMaterials,
    spotlight_L,
    spotlight_R,
    closeAngle: MODEL_MAP.closeAngle,
    closedDipL,
    closedDipR,
    dispose,
  };
}

import * as THREE from "three";
import { CarMaterials } from "./materials";

export interface ProceduralCarBundle {
  root: THREE.Group;
  headlight_L: THREE.Group;
  headlight_R: THREE.Group;
  spotlight_L: THREE.SpotLight;
  spotlight_R: THREE.SpotLight;
  materials: CarMaterials;
  dispose: () => void;
}

export function buildProceduralCar(materials: CarMaterials): ProceduralCarBundle {
  const root = new THREE.Group();
  root.name = "Miata_NA_Root";

  const geometriesToDispose: THREE.BufferGeometry[] = [];

  // ==========================================
  // 1. PROCEDURAL BODY SHELL VIA CROSS-SECTION LOFT
  // ==========================================

  // Cross section station definitions along Z (front +1.95 to rear -1.90)
  // Continuous watertight sculptural sports car shell with iconic NA proportions:
  // low & wide stance, long hood, compact rounded cabin, and short rear deck.
  interface StationDef {
    z: number;
    pts: [number, number][]; // [x, y] pairs from centerline top (x=0) around contour to centerline bottom (x=0)
  }

  const stations: StationDef[] = [
    // 0: Nose chin / lower intake (z = 1.95)
    {
      z: 1.95,
      pts: [
        [0.0, 0.38],
        [0.18, 0.37],
        [0.34, 0.34],
        [0.48, 0.28],
        [0.55, 0.24],
        [0.52, 0.18],
        [0.42, 0.15],
        [0.24, 0.14],
        [0.0, 0.14],
      ],
    },
    // 1: Nose crown / bumper mouth level (z = 1.80)
    {
      z: 1.80,
      pts: [
        [0.0, 0.49],
        [0.24, 0.48],
        [0.44, 0.44],
        [0.60, 0.36],
        [0.66, 0.28],
        [0.64, 0.20],
        [0.52, 0.15],
        [0.28, 0.14],
        [0.0, 0.14],
      ],
    },
    // 2: Pop-up headlights front area (z = 1.55)
    {
      z: 1.55,
      pts: [
        [0.0, 0.56],
        [0.26, 0.55],
        [0.48, 0.52],
        [0.66, 0.44],
        [0.72, 0.32],
        [0.69, 0.22],
        [0.58, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 3: Pop-up headlights rear hinge / fender flare (z = 1.34)
    {
      z: 1.34,
      pts: [
        [0.0, 0.60],
        [0.28, 0.59],
        [0.52, 0.57],
        [0.72, 0.50],
        [0.76, 0.36],
        [0.72, 0.24],
        [0.60, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 4: Front wheel arch peak (z = 1.15)
    {
      z: 1.15,
      pts: [
        [0.0, 0.62],
        [0.28, 0.61],
        [0.54, 0.58],
        [0.74, 0.53],
        [0.79, 0.38],
        [0.74, 0.25],
        [0.62, 0.16],
        [0.32, 0.14],
        [0.0, 0.14],
      ],
    },
    // 5: Long hood rear / door front (z = 0.75)
    {
      z: 0.75,
      pts: [
        [0.0, 0.65],
        [0.28, 0.64],
        [0.52, 0.61],
        [0.71, 0.54],
        [0.75, 0.36],
        [0.70, 0.24],
        [0.58, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 6: Windshield base / cowl (z = 0.38)
    {
      z: 0.38,
      pts: [
        [0.0, 0.68],
        [0.28, 0.67],
        [0.52, 0.64],
        [0.71, 0.56],
        [0.75, 0.36],
        [0.71, 0.24],
        [0.58, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 7: Mid windshield / raked A-pillars (z = 0.08)
    {
      z: 0.08,
      pts: [
        [0.0, 0.94], // Raked windshield glass center
        [0.26, 0.91],
        [0.46, 0.86], // A-pillar upper frame
        [0.68, 0.57], // Door beltline
        [0.74, 0.36],
        [0.70, 0.24],
        [0.58, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 8: Compact rounded cabin roof peak (z = -0.28)
    {
      z: -0.28,
      pts: [
        [0.0, 1.08], // Iconic NA curved roofline apex
        [0.28, 1.06],
        [0.48, 0.98], // Roof side rail / window header
        [0.70, 0.58], // Door beltline / coke-bottle waist
        [0.75, 0.36],
        [0.71, 0.24],
        [0.58, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 9: Cabin rear / fastback rear glass slope (z = -0.62)
    {
      z: -0.62,
      pts: [
        [0.0, 0.92], // Rear window glass center
        [0.26, 0.89],
        [0.48, 0.84], // C-pillar curved transition
        [0.71, 0.57], // Rear quarter beltline
        [0.76, 0.36],
        [0.71, 0.24],
        [0.60, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 10: Short rear deck / trunk lid front (z = -0.95)
    {
      z: -0.95,
      pts: [
        [0.0, 0.65], // Classic NA short rear trunk lid
        [0.28, 0.64],
        [0.52, 0.61],
        [0.72, 0.56],
        [0.77, 0.37],
        [0.72, 0.25],
        [0.60, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 11: Rear wheel arch crest / muscular rear hip (z = -1.24)
    {
      z: -1.24,
      pts: [
        [0.0, 0.64],
        [0.28, 0.63],
        [0.54, 0.60],
        [0.75, 0.55],
        [0.80, 0.38], // Athletic rear haunch bulge
        [0.75, 0.26],
        [0.62, 0.16],
        [0.32, 0.14],
        [0.0, 0.14],
      ],
    },
    // 12: Rear quarter panel (z = -1.55)
    {
      z: -1.55,
      pts: [
        [0.0, 0.61],
        [0.27, 0.60],
        [0.52, 0.56],
        [0.71, 0.49],
        [0.75, 0.36],
        [0.70, 0.24],
        [0.58, 0.16],
        [0.30, 0.14],
        [0.0, 0.14],
      ],
    },
    // 13: Rear tail panel / tail lamps (z = -1.82)
    {
      z: -1.82,
      pts: [
        [0.0, 0.57],
        [0.24, 0.56],
        [0.46, 0.51],
        [0.63, 0.42],
        [0.68, 0.30],
        [0.64, 0.20],
        [0.52, 0.15],
        [0.26, 0.14],
        [0.0, 0.14],
      ],
    },
    // 14: Rear bumper lower valance (z = -1.90)
    {
      z: -1.90,
      pts: [
        [0.0, 0.44],
        [0.20, 0.43],
        [0.38, 0.38],
        [0.52, 0.28],
        [0.56, 0.20],
        [0.50, 0.16],
        [0.38, 0.14],
        [0.20, 0.14],
        [0.0, 0.14],
      ],
    },
  ];

  // Build symmetrical mesh from stations
  const numStations = stations.length;
  const numPtsPerSide = stations[0].pts.length;
  // Full ring: left side mirrored, top center, right side
  // From bottom-left rocker around top to bottom-right rocker
  const ringSize = numPtsPerSide * 2 - 1;

  const vertices: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < numStations; s++) {
    const st = stations[s];
    // Left side: x from -maxX to 0
    for (let p = numPtsPerSide - 1; p >= 1; p--) {
      vertices.push(-st.pts[p][0], st.pts[p][1], st.z);
    }
    // Center point (x=0) and right side: x from 0 to +maxX
    for (let p = 0; p < numPtsPerSide; p++) {
      vertices.push(st.pts[p][0], st.pts[p][1], st.z);
    }
  }

  // Connect adjacent station rings with quad triangles (counter-clockwise outward facing)
  for (let s = 0; s < numStations - 1; s++) {
    const ringA = s * ringSize;
    const ringB = (s + 1) * ringSize;

    for (let r = 0; r < ringSize - 1; r++) {
      const a1 = ringA + r;
      const a2 = ringA + r + 1;
      const b1 = ringB + r;
      const b2 = ringB + r + 1;

      indices.push(a1, a2, b1);
      indices.push(a2, b2, b1);
    }
  }

  // Front cap (nose closing outward facing)
  const frontRing = 0;
  const frontCenterIdx = vertices.length / 3;
  vertices.push(0, 0.26, 1.95); // center front nose vertex
  for (let r = 0; r < ringSize - 1; r++) {
    indices.push(frontCenterIdx, frontRing + r, frontRing + r + 1);
  }

  // Rear cap (tail closing outward facing)
  const rearRing = (numStations - 1) * ringSize;
  const rearCenterIdx = vertices.length / 3;
  vertices.push(0, 0.32, -1.90); // center rear tail vertex
  for (let r = 0; r < ringSize - 1; r++) {
    indices.push(rearCenterIdx, rearRing + r + 1, rearRing + r);
  }

  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  bodyGeo.setIndex(indices);
  bodyGeo.computeVertexNormals();
  geometriesToDispose.push(bodyGeo);

  const bodyMesh = new THREE.Mesh(bodyGeo, materials.bodyPaint);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Underbody flat floor pan to seal bottom and cast clean shadow
  const underbodyGeo = new THREE.BoxGeometry(1.42, 0.04, 3.65);
  geometriesToDispose.push(underbodyGeo);
  const underbody = new THREE.Mesh(underbodyGeo, materials.chassisDark);
  underbody.position.set(0, 0.15, 0.05);
  root.add(underbody);

  // ==========================================
  // 2. COCKPIT, WINDSHIELD & CABIN
  // ==========================================

  // Dark cockpit interior tub
  const cockpitGeo = new THREE.BoxGeometry(1.15, 0.35, 1.1);
  geometriesToDispose.push(cockpitGeo);
  const cockpit = new THREE.Mesh(cockpitGeo, materials.interior);
  cockpit.position.set(0, 0.44, -0.22);
  root.add(cockpit);

  // Twin bucket seat headrests (NA tombstone style headrests)
  const headrestGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.28, 16);
  geometriesToDispose.push(headrestGeo);

  const seatLeft = new THREE.Mesh(headrestGeo, materials.interior);
  seatLeft.position.set(0.28, 0.74, -0.48);
  seatLeft.rotation.x = -0.15;
  root.add(seatLeft);

  const seatRight = new THREE.Mesh(headrestGeo, materials.interior);
  seatRight.position.set(-0.28, 0.74, -0.48);
  seatRight.rotation.x = -0.15;
  root.add(seatRight);

  // Steering wheel rim
  const wheelRimGeo = new THREE.TorusGeometry(0.11, 0.018, 12, 24);
  geometriesToDispose.push(wheelRimGeo);
  const wheelRim = new THREE.Mesh(wheelRimGeo, materials.interior);
  wheelRim.position.set(0.28, 0.72, 0.08);
  wheelRim.rotation.x = -0.65;
  root.add(wheelRim);

  // Raked curved windshield glass
  // Created as a custom curved quad mesh with smooth normals
  const glassW = 1.18;
  const glassGeo = new THREE.PlaneGeometry(glassW, 0.58, 16, 4);
  geometriesToDispose.push(glassGeo);
  const gPos = glassGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const x = gPos.getX(i);
    // Subtle lateral aerodynamic curve (swept back at the pillars)
    const curveZ = (x * x) * 0.18;
    gPos.setZ(i, gPos.getZ(i) - curveZ);
  }
  glassGeo.computeVertexNormals();

  const windshield = new THREE.Mesh(glassGeo, materials.glass);
  windshield.position.set(0, 0.88, 0.06);
  windshield.rotation.x = -0.74; // Raked back ~42 degrees
  windshield.castShadow = true;
  root.add(windshield);

  // Slim Windshield A-pillar frame (body paint)
  const pillarGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.62, 8);
  geometriesToDispose.push(pillarGeo);

  const pillarL = new THREE.Mesh(pillarGeo, materials.bodyPaint);
  pillarL.position.set(0.55, 0.87, 0.02);
  pillarL.rotation.x = -0.74;
  pillarL.rotation.z = -0.16;
  root.add(pillarL);

  const pillarR = new THREE.Mesh(pillarGeo, materials.bodyPaint);
  pillarR.position.set(-0.55, 0.87, 0.02);
  pillarR.rotation.x = -0.74;
  pillarR.rotation.z = 0.16;
  root.add(pillarR);

  // Windshield top header bar
  const headerGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.05, 8);
  geometriesToDispose.push(headerGeo);
  const headerBar = new THREE.Mesh(headerGeo, materials.bodyPaint);
  headerBar.position.set(0, 1.09, -0.15);
  headerBar.rotation.z = Math.PI * 0.5;
  root.add(headerBar);

  // Aerodynamic bullet door mirrors
  const mirrorGeo = new THREE.SphereGeometry(0.055, 12, 10);
  mirrorGeo.scale(1.3, 0.75, 0.9);
  geometriesToDispose.push(mirrorGeo);

  const mirrorL = new THREE.Mesh(mirrorGeo, materials.bodyPaint);
  mirrorL.position.set(0.68, 0.72, 0.22);
  mirrorL.rotation.y = -0.2;
  root.add(mirrorL);

  const mirrorR = new THREE.Mesh(mirrorGeo, materials.bodyPaint);
  mirrorR.position.set(-0.68, 0.72, 0.22);
  mirrorR.rotation.y = 0.2;
  root.add(mirrorR);

  // ==========================================
  // 3. WHEELS & 14" NA "DAISY" ALLOYS
  // ==========================================

  function createDaisyWheel(): THREE.Group {
    const wheelGroup = new THREE.Group();

    // Tire rubber
    const tireGeo = new THREE.CylinderGeometry(0.285, 0.285, 0.185, 32);
    geometriesToDispose.push(tireGeo);
    const tire = new THREE.Mesh(tireGeo, materials.rubber);
    tire.rotation.z = Math.PI * 0.5;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Alloy rim barrel
    const rimGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.19, 28);
    geometriesToDispose.push(rimGeo);
    const rim = new THREE.Mesh(rimGeo, materials.wheelAlloy);
    rim.rotation.z = Math.PI * 0.5;
    wheelGroup.add(rim);

    // Rim face disc
    const faceGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.02, 24);
    geometriesToDispose.push(faceGeo);
    const face = new THREE.Mesh(faceGeo, materials.wheelAlloy);
    face.position.x = 0.09;
    face.rotation.z = Math.PI * 0.5;
    wheelGroup.add(face);

    // Daisy spoke pattern (7 circular cooling holes)
    const spokeCount = 7;
    const holeRadius = 0.038;
    const holeDist = 0.11;
    const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius, 0.03, 16);
    geometriesToDispose.push(holeGeo);

    for (let k = 0; k < spokeCount; k++) {
      const angle = (k / spokeCount) * Math.PI * 2;
      const hole = new THREE.Mesh(holeGeo, materials.chassisDark);
      hole.position.set(0.095, Math.cos(angle) * holeDist, Math.sin(angle) * holeDist);
      hole.rotation.z = Math.PI * 0.5;
      wheelGroup.add(hole);
    }

    // Center hub cap
    const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 20);
    geometriesToDispose.push(hubGeo);
    const hub = new THREE.Mesh(hubGeo, materials.chrome);
    hub.position.x = 0.10;
    hub.rotation.z = Math.PI * 0.5;
    wheelGroup.add(hub);

    // Brake disc inside rim
    const discGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.015, 20);
    geometriesToDispose.push(discGeo);
    const disc = new THREE.Mesh(discGeo, materials.chrome);
    disc.position.x = 0.02;
    disc.rotation.z = Math.PI * 0.5;
    wheelGroup.add(disc);

    return wheelGroup;
  }

  // 4 Wheel instances
  const wheelFL = createDaisyWheel();
  wheelFL.position.set(0.72, 0.285, 1.15);
  root.add(wheelFL);

  const wheelFR = createDaisyWheel();
  wheelFR.position.set(-0.72, 0.285, 1.15);
  wheelFR.rotation.y = Math.PI; // Face outwards
  root.add(wheelFR);

  const wheelRL = createDaisyWheel();
  wheelRL.position.set(0.72, 0.285, -1.22);
  root.add(wheelRL);

  const wheelRR = createDaisyWheel();
  wheelRR.position.set(-0.72, 0.285, -1.22);
  wheelRR.rotation.y = Math.PI; // Face outwards
  root.add(wheelRR);

  // ==========================================
  // 4. POP-UP HEADLIGHT PODS (THE CENTERPIECE)
  // ==========================================

  // Pod rear hinge pivot points on the hood
  const PIVOT_Y = 0.59;
  const PIVOT_Z = 1.34;
  const PIVOT_X = 0.38;

  function createHeadlightPod(isLeft: boolean): {
    podGroup: THREE.Group;
    spotlight: THREE.SpotLight;
  } {
    const podGroup = new THREE.Group();
    podGroup.name = isLeft ? "headlight_L" : "headlight_R";
    podGroup.position.set(isLeft ? PIVOT_X : -PIVOT_X, PIVOT_Y, PIVOT_Z);

    // The pod body is pivoted at (0, 0, 0) locally.
    // Length: 0.24, Width: 0.24, Height: 0.16.
    // When rotation.x = 0, the pod lies flush with the hood angle (~ -7 deg slope).
    const podBodyGeo = new THREE.BoxGeometry(0.25, 0.13, 0.24);
    geometriesToDispose.push(podBodyGeo);

    // Tilt the pod body so when rotation.x = 0, top lid surface is flush with hood slope
    const podMesh = new THREE.Mesh(podBodyGeo, materials.bodyPaint);
    podMesh.position.set(0, -0.045, 0.12);
    podMesh.castShadow = true;
    podGroup.add(podMesh);

    // Front sealed-beam round lamp
    // Chrome trim bezel ring
    const bezelGeo = new THREE.TorusGeometry(0.082, 0.012, 16, 32);
    geometriesToDispose.push(bezelGeo);
    const bezel = new THREE.Mesh(bezelGeo, materials.chrome);
    bezel.position.set(0, -0.045, 0.245);
    podGroup.add(bezel);

    // Round sealed-beam glass lens (glowing)
    const lensGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.015, 28);
    geometriesToDispose.push(lensGeo);
    const lens = new THREE.Mesh(lensGeo, materials.headlightLens);
    lens.position.set(0, -0.045, 0.242);
    lens.rotation.x = Math.PI * 0.5;
    podGroup.add(lens);

    // Forward beam Spotlight
    const spotlight = new THREE.SpotLight(0xffb35c, 0.0, 16, Math.PI * 0.24, 0.45, 1.2);
    spotlight.position.set(0, -0.045, 0.26);
    spotlight.target.position.set(0, -0.35, 6.0); // Aimed forward and down onto road
    podGroup.add(spotlight);
    podGroup.add(spotlight.target);

    // Recessed dark well beneath pod (stays fixed on chassis)
    const wellGeo = new THREE.BoxGeometry(0.26, 0.09, 0.25);
    geometriesToDispose.push(wellGeo);
    const wellMesh = new THREE.Mesh(wellGeo, materials.chassisDark);
    wellMesh.position.set(isLeft ? PIVOT_X : -PIVOT_X, PIVOT_Y - 0.05, PIVOT_Z + 0.12);
    root.add(wellMesh);

    // Panel gap seam outline around closed pod
    const seamGeo = new THREE.RingGeometry(0.12, 0.13, 4);
    geometriesToDispose.push(seamGeo);
    const seam = new THREE.Mesh(seamGeo, materials.chassisDark);
    seam.position.set(isLeft ? PIVOT_X : -PIVOT_X, PIVOT_Y + 0.005, PIVOT_Z + 0.12);
    seam.rotation.x = -Math.PI * 0.5;
    seam.scale.set(1.1, 1.05, 1.0);
    root.add(seam);

    return { podGroup, spotlight };
  }

  const { podGroup: headlight_L, spotlight: spotlight_L } = createHeadlightPod(true);
  const { podGroup: headlight_R, spotlight: spotlight_R } = createHeadlightPod(false);

  root.add(headlight_L);
  root.add(headlight_R);

  // ==========================================
  // 5. ICONIC NA FRONT & REAR LIGHTING DETAILS
  // ==========================================

  // Front bumper oval intake "smile"
  const intakeGeo = new THREE.PlaneGeometry(0.48, 0.11);
  geometriesToDispose.push(intakeGeo);
  const intake = new THREE.Mesh(intakeGeo, materials.chassisDark);
  intake.position.set(0, 0.22, 1.948);
  root.add(intake);

  // Front bumper turn signals / running lights (amber)
  const turnGeo = new THREE.BoxGeometry(0.16, 0.042, 0.03);
  geometriesToDispose.push(turnGeo);

  const turnL = new THREE.Mesh(turnGeo, materials.turnSignalAmber);
  turnL.position.set(0.46, 0.27, 1.84);
  turnL.rotation.y = 0.35;
  root.add(turnL);

  const turnR = new THREE.Mesh(turnGeo, materials.turnSignalAmber);
  turnR.position.set(-0.46, 0.27, 1.84);
  turnR.rotation.y = -0.35;
  root.add(turnR);

  // Iconic NA rear combination pill tail lights
  const tailGeo = new THREE.CapsuleGeometry(0.062, 0.28, 8, 16);
  geometriesToDispose.push(tailGeo);

  const tailL = new THREE.Mesh(tailGeo, materials.tailLightRed);
  tailL.position.set(0.48, 0.47, -1.88);
  tailL.rotation.z = Math.PI * 0.5;
  tailL.rotation.y = 0.18;
  root.add(tailL);

  const tailR = new THREE.Mesh(tailGeo, materials.tailLightRed);
  tailR.position.set(-0.48, 0.47, -1.88);
  tailR.rotation.z = Math.PI * 0.5;
  tailR.rotation.y = -0.18;
  root.add(tailR);

  // Rear single polished stainless exhaust tip (right rear)
  const exhaustGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.18, 16, 1, true);
  geometriesToDispose.push(exhaustGeo);
  const exhaust = new THREE.Mesh(exhaustGeo, materials.chrome);
  exhaust.position.set(-0.46, 0.17, -1.85);
  exhaust.rotation.x = Math.PI * 0.5;
  root.add(exhaust);

  // Rear license plate indent
  const plateGeo = new THREE.BoxGeometry(0.36, 0.14, 0.02);
  geometriesToDispose.push(plateGeo);
  const plate = new THREE.Mesh(plateGeo, materials.licensePlate);
  plate.position.set(0, 0.34, -1.895);
  root.add(plate);

  const dispose = () => {
    geometriesToDispose.forEach((geo) => geo.dispose());
  };

  return {
    root,
    headlight_L,
    headlight_R,
    spotlight_L,
    spotlight_R,
    materials,
    dispose,
  };
}

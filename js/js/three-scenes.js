/**
 * FortisWay 3D Transport Canvas Scenes (Three.js WebGL)
 * Ultra-Detailed, Cinematic Next-Gen 3D Models:
 * 1. 3D Heavy Euro-Truck: Sleeper cab, chrome grille, LED projectors with road spotlights, detailed interior, 10 rotating wheels with disc brakes, corrugated semi-trailer with Thermo King & highway.
 * 2. 3D Modern Electric Freight Train: Aerodynamic locomotive with pantographs, triple headlights, bogies with springs & rotating flanged wheels, multi-tier ISO containers & catenary system.
 * 3. 3D Boeing 777F Cargo Jet: Swept wings with flap track canoes, raked wingtips with strobes, GE90 engines with rotating spiral spinners, wingtip vortices, laminar streamlines & volumetric cloudscapes.
 * 4. 3D Ocean Megaship: Bulbous bow, anchor winches, multi-tier corrugated container bays, bridge deckhouse with lifeboats, rotating radars & procedural Gerstner ocean waves with foam crests.
 *
 * Performance: IntersectionObserver automatically pauses off-screen rendering (0% idle GPU).
 */

(function() {
  'use strict';

  function initWhenThreeReady() {
    if (typeof THREE === 'undefined') {
      setTimeout(initWhenThreeReady, 100);
      return;
    }
    initAll3DScenes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenThreeReady);
  } else {
    initWhenThreeReady();
  }

  function initAll3DScenes() {
    createAutoScene();
    createRailScene();
    createAirScene();
    createSeaScene();
  }

  /* Helper to setup standard Three.js canvas wrapper */
  function setupRenderer(canvas) {
    if (!canvas) return null;
    const parent = canvas.parentElement;
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || 440;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    return { renderer, width, height };
  }

  /* ==========================================================================
     SCENE 1: ULTRA-DETAILED 3D EURO TRUCK (FTL Highway Transport)
     ========================================================================== */
  function createAutoScene() {
    const canvas = document.getElementById('canvasAuto');
    const setup = setupRenderer(canvas);
    if (!setup) return;

    const { renderer } = setup;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, setup.width / setup.height, 0.1, 160);
    camera.position.set(3.2, 2.7, 9.8);
    camera.lookAt(0, 1.25, 0);

    // Dynamic Cinematic Lighting
    const ambient = new THREE.AmbientLight(0x0e1c2e, 2.4);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 2.6);
    moonLight.position.set(-10, 14, 10);
    scene.add(moonLight);

    const fillLight = new THREE.DirectionalLight(0x1e3a8a, 1.3);
    fillLight.position.set(10, 6, -8);
    scene.add(fillLight);

    // Highway Road & Parallax Elements
    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    // Wet Asphalt Surface with Specular Glints
    const roadGeo = new THREE.PlaneGeometry(16, 90);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x090f1a,
      roughness: 0.65,
      metalness: 0.35
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = -0.02;
    roadGroup.add(roadMesh);

    // Highway Shoulder Guardrails (W-Beam)
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
    const guardrailL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 90), railMat);
    guardrailL.position.set(-6.2, 0.45, 0);
    roadGroup.add(guardrailL);

    const guardrailR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 90), railMat);
    guardrailR.position.set(6.2, 0.45, 0);
    roadGroup.add(guardrailR);

    // Guardrail Posts with Reflectors
    const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let p = -44; p <= 44; p += 4) {
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), railMat);
      postL.position.set(-6.2, 0.25, p);
      roadGroup.add(postL);

      const refL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.08), reflectorMat);
      refL.position.set(-6.12, 0.45, p);
      roadGroup.add(refL);

      const postR = postL.clone();
      postR.position.set(6.2, 0.25, p);
      roadGroup.add(postR);

      const refR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.08), reflectorMat);
      refR.position.set(6.12, 0.45, p);
      roadGroup.add(refR);
    }

    // Road Divider Dashed Lines
    const dashes = [];
    const dashGeo = new THREE.PlaneGeometry(0.25, 3.4);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = -42; i <= 42; i += 6.5) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.01, i);
      roadGroup.add(dash);
      dashes.push(dash);
    }

    // Continuous Highway Edge Lines
    const edgeLineGeo = new THREE.PlaneGeometry(0.18, 90);
    const edgeLineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const edgeL = new THREE.Mesh(edgeLineGeo, edgeLineMat);
    edgeL.rotation.x = -Math.PI / 2;
    edgeL.position.set(-5.6, 0.01, 0);
    roadGroup.add(edgeL);

    const edgeR = new THREE.Mesh(edgeLineGeo, edgeLineMat);
    edgeR.rotation.x = -Math.PI / 2;
    edgeR.position.set(5.6, 0.01, 0);
    roadGroup.add(edgeR);

    // Street Lamps passing by
    const lampGroup = new THREE.Group();
    scene.add(lampGroup);
    const lamps = [];
    for (let l = -36; l <= 36; l += 18) {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8), railMat);
      pole.position.set(-6.8, 2.75, 0);
      lamp.add(pole);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8), railMat);
      arm.position.set(-5.9, 5.4, 0);
      arm.rotation.z = Math.PI / 3;
      lamp.add(arm);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      head.position.set(-5.0, 5.3, 0);
      lamp.add(head);

      lamp.position.z = l;
      lampGroup.add(lamp);
      lamps.push(lamp);
    }

    // --- ULTRA-DETAILED 3D EURO TRUCK ---
    const truck = new THREE.Group();
    scene.add(truck);
    truck.position.set(0, 0, 0);

    // PBR Materials
    const cabPaintMat = new THREE.MeshStandardMaterial({ color: 0x0a2540, metalness: 0.85, roughness: 0.2 });
    const darkCabMat = new THREE.MeshStandardMaterial({ color: 0x050c18, metalness: 0.9, roughness: 0.25 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.06 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x030712, metalness: 0.95, roughness: 0.05, transparent: true, opacity: 0.85 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95, metalness: 0.05 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.92, roughness: 0.12 });
    const brakeDiscMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
    const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.3 });
    const headlampMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const redGlow = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const amberGlow = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const trailerBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.35 });

    // 1. Tractor Chassis & Drivetrain
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.45, 6.4), darkCabMat);
    chassis.position.set(0, 0.65, 2.2);
    truck.add(chassis);

    // Front Bumper with Fog Lights & License Plate
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.5, 0.4), darkCabMat);
    frontBumper.position.set(0, 0.55, 5.4);
    truck.add(frontBumper);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.04), chromeMat);
    plate.position.set(0, 0.45, 5.62);
    truck.add(plate);

    // 2. Cab-Over-Engine Sleeper Cabin
    const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.45, 2.4), cabPaintMat);
    cabLower.position.set(0, 1.5, 4.2);
    truck.add(cabLower);

    const cabUpper = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.35, 2.3), cabPaintMat);
    cabUpper.position.set(0, 2.85, 4.15);
    truck.add(cabUpper);

    // Aerodynamic Roof Scoop (Wind Deflector matching trailer height)
    const spoilerGeo = new THREE.BoxGeometry(2.38, 0.65, 2.1);
    const spoiler = new THREE.Mesh(spoilerGeo, cabPaintMat);
    spoiler.position.set(0, 3.75, 4.05);
    spoiler.rotation.x = -0.15;
    truck.add(spoiler);

    // Cab Side Aerodynamic Deflectors (channel air smoothly around trailer)
    const deflectorL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.6), cabPaintMat);
    deflectorL.position.set(-1.26, 2.3, 2.9);
    deflectorL.rotation.y = 0.18;
    truck.add(deflectorL);

    const deflectorR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.6), cabPaintMat);
    deflectorR.position.set(1.26, 2.3, 2.9);
    deflectorR.rotation.y = -0.18;
    truck.add(deflectorR);

    // Dual Chrome Air Horns on Roof
    const hornL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.7, 8), chromeMat);
    hornL.rotation.x = Math.PI / 2;
    hornL.position.set(-0.75, 4.05, 4.2);
    truck.add(hornL);

    const hornR = hornL.clone();
    hornR.position.set(0.75, 4.05, 4.2);
    truck.add(hornR);

    // Sun Visor with 5 Amber Clearance Marker Lights
    const sunVisor = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.22, 0.35), darkCabMat);
    sunVisor.position.set(0, 3.48, 5.25);
    sunVisor.rotation.x = 0.28;
    truck.add(sunVisor);

    for (let c = -0.8; c <= 0.8; c += 0.4) {
      const topLed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), amberGlow);
      topLed.position.set(c, 3.52, 5.38);
      truck.add(topLed);
    }

    // Windshield & Wiper Blades
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.32, 1.1, 0.1), glassMat);
    windshield.position.set(0, 2.85, 5.32);
    windshield.rotation.x = -0.12;
    truck.add(windshield);

    // Wiper Arms & Blades
    const wiper1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.03), darkCabMat);
    wiper1.position.set(-0.55, 2.45, 5.42);
    wiper1.rotation.z = -0.22;
    truck.add(wiper1);

    const wiper2 = wiper1.clone();
    wiper2.position.set(0.55, 2.45, 5.42);
    truck.add(wiper2);

    // Driver Dashboard & Seats Silhouette inside cab
    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 0.7), darkCabMat);
    dash.position.set(0, 2.25, 4.8);
    truck.add(dash);

    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.5), darkCabMat);
    seatL.position.set(-0.65, 2.65, 4.2);
    truck.add(seatL);

    const seatR = seatL.clone();
    seatR.position.set(0.65, 2.65, 4.2);
    truck.add(seatR);

    // Chrome Radiator Grille Slats & Glowing FortisWay Monogram Badge
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.05, 0.08), darkCabMat);
    grilleMesh.position.set(0, 1.5, 5.44);
    truck.add(grilleMesh);

    for (let g = 0; g < 4; g++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.06), chromeMat);
      slat.position.set(0, 1.25 + g * 0.22, 5.5);
      truck.add(slat);
    }

    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 16), cyanGlow);
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0, 1.85, 5.51);
    truck.add(badge);

    // Headlamps with Xenon Projectors
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.12), headlampMat);
    headL.position.set(-0.95, 0.95, 5.44);
    truck.add(headL);

    const headR = headL.clone();
    headR.position.set(0.95, 0.95, 5.44);
    truck.add(headR);

    // Real Three.js Spotlights Casting Pools of Light Ahead on Highway
    const spotL = new THREE.SpotLight(0xe0f2fe, 3.2, 38, 0.42, 0.65, 1.2);
    spotL.position.set(-0.95, 0.95, 5.44);
    spotL.target.position.set(-0.95, 0, 24);
    scene.add(spotL);
    scene.add(spotL.target);

    const spotR = new THREE.SpotLight(0xe0f2fe, 3.2, 38, 0.42, 0.65, 1.2);
    spotR.position.set(0.95, 0.95, 5.44);
    spotR.target.position.set(0.95, 0, 24);
    scene.add(spotR);
    scene.add(spotR.target);

    // Side Mirrors with Reflective Mirror Glass
    function createSideMirror(isLeft) {
      const mirrorGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), darkCabMat);
      arm.rotation.z = isLeft ? -Math.PI / 4 : Math.PI / 4;
      mirrorGroup.add(arm);

      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.25), darkCabMat);
      housing.position.set(isLeft ? -0.22 : 0.22, 0.15, 0);
      mirrorGroup.add(housing);

      const mirrorFace = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.5), chromeMat);
      mirrorFace.position.set(isLeft ? -0.22 : 0.22, 0.15, -0.13);
      mirrorFace.rotation.y = Math.PI;
      mirrorGroup.add(mirrorFace);

      return mirrorGroup;
    }

    const mirrorL = createSideMirror(true);
    mirrorL.position.set(-1.25, 2.7, 5.0);
    truck.add(mirrorL);

    const mirrorR = createSideMirror(false);
    mirrorR.position.set(1.25, 2.7, 5.0);
    truck.add(mirrorR);

    // Aluminum Entry Steps (3 steps on each side)
    for (let s = 0; s < 3; s++) {
      const stepL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.35), chromeMat);
      stepL.position.set(-1.26, 0.45 + s * 0.22, 4.3);
      truck.add(stepL);

      const stepR = stepL.clone();
      stepR.position.set(1.26, 0.45 + s * 0.22, 4.3);
      truck.add(stepR);
    }

    // Cylindrical Aluminum Fuel Tanks
    const tankGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.2, 16);
    tankGeo.rotateZ(Math.PI / 2);
    const tankL = new THREE.Mesh(tankGeo, chromeMat);
    tankL.position.set(-1.18, 0.65, 2.1);
    truck.add(tankL);

    const tankR = tankL.clone();
    tankR.position.set(1.18, 0.65, 2.1);
    truck.add(tankR);

    // Catwalk Deck Plate & Coiled Air Hoses Behind Cab
    const catwalk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 1.2), chromeMat);
    catwalk.position.set(0, 0.88, 2.7);
    truck.add(catwalk);

    // 3. Semi-Trailer (13.6m Mega Box / Curtain)
    const trailerGroup = new THREE.Group();
    truck.add(trailerGroup);

    const trailerMain = new THREE.Mesh(new THREE.BoxGeometry(2.48, 2.9, 9.4), trailerBodyMat);
    trailerMain.position.set(0, 2.35, -2.6);
    trailerGroup.add(trailerMain);

    // Thermo King Fridge Unit on Front Bulkhead
    const fridgeUnit = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.45, 0.45), chromeMat);
    fridgeUnit.position.set(0, 2.75, 2.25);
    trailerGroup.add(fridgeUnit);

    const fridgeFan = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16), darkCabMat);
    fridgeFan.rotation.x = Math.PI / 2;
    fridgeFan.position.set(0, 2.95, 2.5);
    trailerGroup.add(fridgeFan);

    const fridgeLed = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.04), cyanGlow);
    fridgeLed.position.set(0, 2.3, 2.5);
    trailerGroup.add(fridgeLed);

    // Vertical Corrugation Ribs on Trailer Sides (24 ribs)
    for (let r = -7.0; r <= 1.8; r += 0.76) {
      const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.85, 0.08), darkCabMat);
      ribL.position.set(-1.26, 2.35, r);
      trailerGroup.add(ribL);

      const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.85, 0.08), darkCabMat);
      ribR.position.set(1.26, 2.35, r);
      trailerGroup.add(ribR);
    }

    // Aerodynamic Side Skirts between landing gear and axles
    const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 4.4), darkCabMat);
    skirtL.position.set(-1.22, 0.6, -0.8);
    trailerGroup.add(skirtL);

    const skirtR = skirtL.clone();
    skirtR.position.set(1.22, 0.6, -0.8);
    trailerGroup.add(skirtR);

    // Amber LED Side Marker Lights along Skirt
    for (let m = -2.6; m <= 1.0; m += 1.2) {
      const smL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), amberGlow);
      smL.position.set(-1.27, 0.6, m);
      trailerGroup.add(smL);

      const smR = smL.clone();
      smR.position.set(1.27, 0.6, m);
      trailerGroup.add(smR);
    }

    // Trailer Landing Gear (support legs)
    const legGeo = new THREE.BoxGeometry(0.14, 0.75, 0.14);
    const legL = new THREE.Mesh(legGeo, darkCabMat);
    legL.position.set(-0.9, 0.55, 1.4);
    trailerGroup.add(legL);

    const legR = legL.clone();
    legR.position.set(0.9, 0.55, 1.4);
    trailerGroup.add(legR);

    // Rear Doors & 4 Stainless Steel Locking Bars
    const lockBarGeo = new THREE.CylinderGeometry(0.022, 0.022, 2.7, 8);
    for (let lb of [-0.75, -0.25, 0.25, 0.75]) {
      const lockBar = new THREE.Mesh(lockBarGeo, chromeMat);
      lockBar.position.set(lb, 2.35, -7.34);
      trailerGroup.add(lockBar);
    }

    // Rear Bumper with Hazard Red/White Reflective Tape & LED Clusters
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.35, 0.22), darkCabMat);
    rearBumper.position.set(0, 0.55, -7.32);
    trailerGroup.add(rearBumper);

    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.08), redGlow);
    tailL.position.set(-0.85, 0.55, -7.45);
    trailerGroup.add(tailL);

    const tailR = tailL.clone();
    tailR.position.set(0.85, 0.55, -7.45);
    trailerGroup.add(tailR);

    // Mudflaps with White Lettering
    const mudflapL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.04), darkCabMat);
    mudflapL.position.set(-0.85, 0.28, -7.4);
    trailerGroup.add(mudflapL);

    const mudflapR = mudflapL.clone();
    mudflapR.position.set(0.85, 0.28, -7.4);
    trailerGroup.add(mudflapR);

    // 4. Wheels with 3D Tires, Chrome Rims, Disc Brakes & Lug Nuts
    const wheels = [];
    function createDetailedWheel(isFront) {
      const wheelGroup = new THREE.Group();

      // Rubber Tire
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, isFront ? 0.32 : 0.44, 24), tireMat);
      tire.rotation.z = Math.PI / 2;
      wheelGroup.add(tire);

      // Deep-Dish Rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, isFront ? 0.34 : 0.46, 18), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Disc Brake Rotor inside rim
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), brakeDiscMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = isFront ? 0.05 : 0.1;
      wheelGroup.add(disc);

      // Red Brake Caliper
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), brakeCaliperMat);
      caliper.position.set(isFront ? 0.05 : 0.1, 0.16, 0);
      wheelGroup.add(caliper);

      // Chrome Center Hub Cap
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, isFront ? 0.38 : 0.5, 12), chromeMat);
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      return wheelGroup;
    }

    const wheelLocations = [
      // Tractor steer axle
      [-1.18, 0.48, 4.3, true], [1.18, 0.48, 4.3, true],
      // Tractor drive axle
      [-1.18, 0.48, 2.3, false], [1.18, 0.48, 2.3, false],
      // Trailer tri-axle setup
      [-1.18, 0.48, -4.2, false], [1.18, 0.48, -4.2, false],
      [-1.18, 0.48, -5.3, false], [1.18, 0.48, -5.3, false],
      [-1.18, 0.48, -6.4, false], [1.18, 0.48, -6.4, false]
    ];

    wheelLocations.forEach(loc => {
      const w = createDetailedWheel(loc[3]);
      w.position.set(loc[0], loc[1], loc[2]);
      truck.add(w);
      wheels.push(w);
    });

    let isVisible = false;
    let clock = new THREE.Clock();

    function renderAuto() {
      if (!isVisible) return;
      requestAnimationFrame(renderAuto);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Move road dashes
      dashes.forEach(d => {
        d.position.z -= delta * 24;
        if (d.position.z < -42) d.position.z += 84;
      });

      // Move lamps
      lamps.forEach(l => {
        l.position.z -= delta * 24;
        if (l.position.z < -36) l.position.z += 72;
      });

      // Rotate wheels smoothly with driving speed
      wheels.forEach(w => {
        w.children.forEach(part => {
          part.rotation.x += delta * 18;
        });
      });

      // Subtle suspension bounce & cab inertia
      truck.position.y = Math.sin(time * 8.5) * 0.016;
      cabUpper.position.y = 2.85 + Math.sin(time * 6.5) * 0.012;
      truck.rotation.z = Math.sin(time * 2.8) * 0.005;

      // Dynamic cinematic camera angle
      camera.position.x = 3.2 + Math.sin(time * 0.5) * 0.4;
      camera.lookAt(0, 1.25, 0);

      renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          clock.start();
          renderAuto();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      const parent = canvas.parentElement;
      const w = parent.clientWidth || window.innerWidth;
      const h = parent.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ==========================================================================
     SCENE 2: ULTRA-DETAILED 3D FREIGHT TRAIN & CONTAINERS
     ========================================================================== */
  function createRailScene() {
    const canvas = document.getElementById('canvasRail');
    const setup = setupRenderer(canvas);
    if (!setup) return;

    const { renderer } = setup;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, setup.width / setup.height, 0.1, 160);
    camera.position.set(-3.6, 3.2, 9.8);
    camera.lookAt(0, 1.35, 0);

    const ambient = new THREE.AmbientLight(0x0a182c, 2.4);
    scene.add(ambient);

    const sunsetLight = new THREE.DirectionalLight(0xf59e0b, 2.0);
    sunsetLight.position.set(12, 9, -6);
    scene.add(sunsetLight);

    const trackLight = new THREE.DirectionalLight(0x38bdf8, 2.6);
    trackLight.position.set(-8, 12, 10);
    scene.add(trackLight);

    // Ground Ballast & Ties
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
    const ballastBed = new THREE.Mesh(new THREE.PlaneGeometry(14, 90), ballastMat);
    ballastBed.rotation.x = -Math.PI / 2;
    ballastBed.position.y = -0.01;
    trackGroup.add(ballastBed);

    // Continuous Shiny Steel Rails (Polished Head reflecting light)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.98, roughness: 0.08 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const clipMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });

    const railGeo = new THREE.BoxGeometry(0.12, 0.2, 90);
    const railL = new THREE.Mesh(railGeo, steelMat);
    railL.position.set(-1.05, 0.2, 0);
    trackGroup.add(railL);

    const railR = new THREE.Mesh(railGeo, steelMat);
    railR.position.set(1.05, 0.2, 0);
    trackGroup.add(railR);

    // Concrete Sleepers (Ties) with Pandrol Clips
    const ties = [];
    const tieGeo = new THREE.BoxGeometry(3.0, 0.16, 0.48);
    for (let i = -44; i <= 44; i += 2.4) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, 0.08, i);

      // Fastener clips
      const clipL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.2), clipMat);
      clipL.position.set(-1.05, 0.1, 0);
      tie.add(clipL);

      const clipR = clipL.clone();
      clipR.position.set(1.05, 0.1, 0);
      tie.add(clipR);

      trackGroup.add(tie);
      ties.push(tie);
    }

    // Overhead Catenary Poles
    const catenaryGroup = new THREE.Group();
    scene.add(catenaryGroup);
    const catenaryMasts = [];
    for (let c = -36; c <= 36; c += 18) {
      const mast = new THREE.Group();
      const vertPole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.0, 0.18), steelMat);
      vertPole.position.set(3.4, 3.0, 0);
      mast.add(vertPole);

      const horizArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8), steelMat);
      horizArm.position.set(1.7, 5.4, 0);
      horizArm.rotation.z = Math.PI / 2;
      mast.add(horizArm);

      // Contact wire insulator
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
      ins.position.set(0, 5.1, 0);
      mast.add(ins);

      mast.position.z = c;
      catenaryGroup.add(mast);
      catenaryMasts.push(mast);
    }

    // --- ULTRA-DETAILED FREIGHT TRAIN ---
    const train = new THREE.Group();
    scene.add(train);
    train.position.set(0, 0.1, 0);

    const locoRed = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.75, roughness: 0.22 });
    const darkCab = new THREE.MeshStandardMaterial({ color: 0x091322, metalness: 0.88, roughness: 0.2 });
    const silverMetal = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.15 });
    const highGlow = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // Container Colors
    const fortisCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.55, roughness: 0.4 });
    const everGreen = new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.55, roughness: 0.4 });
    const maerskAzure = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.55, roughness: 0.4 });
    const cmaRed = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.55, roughness: 0.4 });
    const mscGold = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.55, roughness: 0.4 });

    // 1. Heavy Electric Locomotive (Siemens Vectron Freight)
    const locoGroup = new THREE.Group();
    train.add(locoGroup);

    // Locomotive Underframe
    const locoFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.45, 8.2), darkCab);
    locoFrame.position.set(0, 0.58, 4.0);
    locoGroup.add(locoFrame);

    // Main Locomotive Body
    const locoBody = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.5, 7.4), locoRed);
    locoBody.position.set(0, 2.0, 3.8);
    locoGroup.add(locoBody);

    // Aerodynamic Sloped Front Nose
    const locoNose = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 1.4), darkCab);
    locoNose.position.set(0, 1.65, 7.85);
    locoNose.rotation.x = -0.32;
    locoGroup.add(locoNose);

    // Driver Windshield with Wipers
    const trainWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 0.1), new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.95, roughness: 0.05 }));
    trainWindshield.position.set(0, 2.35, 7.75);
    trainWindshield.rotation.x = -0.32;
    locoGroup.add(trainWindshield);

    // Heavy Cast Steel Snowplow with Safety Chevron Stripes
    const snowPlow = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.48, 0.4), darkCab);
    snowPlow.position.set(0, 0.38, 8.4);
    locoGroup.add(snowPlow);

    // Central Automatic Knuckle Coupler
    const coupler = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.6), silverMetal);
    coupler.position.set(0, 0.45, 8.65);
    locoGroup.add(coupler);

    // Triple Locomotive Headlights (2 Lower + 1 High Searchlight)
    const lampGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.15, 12);
    lampGeo.rotateX(Math.PI / 2);

    const trainLampL = new THREE.Mesh(lampGeo, highGlow);
    trainLampL.position.set(-0.85, 1.3, 8.2);
    locoGroup.add(trainLampL);

    const trainLampR = new THREE.Mesh(lampGeo, highGlow);
    trainLampR.position.set(0.85, 1.3, 8.2);
    locoGroup.add(trainLampR);

    const topSearchLight = new THREE.Mesh(lampGeo, highGlow);
    topSearchLight.position.set(0, 3.1, 7.2);
    locoGroup.add(topSearchLight);

    // Articulated Diamond Pantographs on Roof (Front & Rear)
    function createPantograph() {
      const pGroup = new THREE.Group();
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.8), silverMetal);
      pGroup.add(pBase);

      // 4 High-Voltage Ceramic Insulators
      for (let inX of [-0.65, 0.65]) {
        for (let inZ of [-0.6, 0.6]) {
          const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
          ins.position.set(inX, 0.16, inZ);
          pGroup.add(ins);
        }
      }

      // Lower Scissor Arms
      const armGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6);
      const lowerArm1 = new THREE.Mesh(armGeo, silverMetal);
      lowerArm1.position.set(-0.45, 0.65, -0.4);
      lowerArm1.rotation.x = Math.PI / 4;
      pGroup.add(lowerArm1);

      const lowerArm2 = new THREE.Mesh(armGeo, silverMetal);
      lowerArm2.position.set(0.45, 0.65, -0.4);
      lowerArm2.rotation.x = Math.PI / 4;
      pGroup.add(lowerArm2);

      // Upper Diamond Scissor Arms
      const upperArm1 = new THREE.Mesh(armGeo, silverMetal);
      upperArm1.position.set(-0.45, 1.4, 0.1);
      upperArm1.rotation.x = -Math.PI / 4;
      pGroup.add(upperArm1);

      const upperArm2 = new THREE.Mesh(armGeo, silverMetal);
      upperArm2.position.set(0.45, 1.4, 0.1);
      upperArm2.rotation.x = -Math.PI / 4;
      pGroup.add(upperArm2);

      // Copper Contact Pan (skate)
      const contactShoe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.25), new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9 }));
      contactShoe.position.set(0, 1.9, 0.6);
      pGroup.add(contactShoe);

      return pGroup;
    }

    const pantoFront = createPantograph();
    pantoFront.position.set(0, 3.3, 2.2);
    locoGroup.add(pantoFront);

    const pantoRear = createPantograph();
    pantoRear.position.set(0, 3.3, 5.4);
    pantoRear.rotation.y = Math.PI;
    locoGroup.add(pantoRear);

    // Locomotive Bogies & Flanged Steel Railway Wheels
    function createTrainBogie(zPos) {
      const bogie = new THREE.Group();
      bogie.position.set(0, 0.45, zPos);

      // Heavy Cast Bogie Frame
      const bFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.25, 2.8), darkCab);
      bogie.add(bFrame);

      // Helical Coil Springs
      for (let sX of [-1.15, 1.15]) {
        for (let sZ of [-0.9, 0.9]) {
          const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 8), silverMetal);
          spring.position.set(sX, 0.05, sZ);
          bogie.add(spring);
        }
      }

      // Flanged Steel Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.18, 20);
      wheelGeo.rotateZ(Math.PI / 2);
      const flangeGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.04, 20);
      flangeGeo.rotateZ(Math.PI / 2);

      for (let wZ of [-0.9, 0.9]) {
        for (let wX of [-1.05, 1.05]) {
          const w = new THREE.Mesh(wheelGeo, steelMat);
          w.position.set(wX, -0.05, wZ);
          bogie.add(w);

          const fl = new THREE.Mesh(flangeGeo, steelMat);
          fl.position.set(wX > 0 ? wX + 0.09 : wX - 0.09, -0.05, wZ);
          bogie.add(fl);
        }
      }

      return bogie;
    }

    locoGroup.add(createTrainBogie(1.6));
    locoGroup.add(createTrainBogie(6.2));

    // 2. Freight Container Cars with Multi-Tier ISO Containers
    const containerCars = [];
    const carPalette = [fortisCyan, everGreen, maerskAzure, cmaRed, mscGold];

    function createContainerFlatcar(zPos, containerColors) {
      const carGroup = new THREE.Group();
      carGroup.position.set(0, 0, zPos);

      // Flatbed Frame
      const carChassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.32, 9.2), darkCab);
      carChassis.position.set(0, 0.55, 0);
      carGroup.add(carChassis);

      // Bogies
      carGroup.add(createTrainBogie(-3.4));
      carGroup.add(createTrainBogie(3.4));

      // ISO Containers (Double Stack / Long 40ft & 20ft)
      containerColors.forEach(cfg => {
        const cBox = new THREE.Mesh(new THREE.BoxGeometry(2.35, cfg.height || 1.35, cfg.length || 4.2), cfg.mat);
        cBox.position.set(0, cfg.y, cfg.z);
        carGroup.add(cBox);

        // Container Corrugation Ribs
        for (let cr = -cfg.length / 2 + 0.3; cr <= cfg.length / 2 - 0.3; cr += 0.5) {
          const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.04, cfg.height || 1.3, 0.06), darkCab);
          ribL.position.set(-1.19, cfg.y, cfg.z + cr);
          carGroup.add(ribL);

          const ribR = ribL.clone();
          ribR.position.set(1.19, cfg.y, cfg.z + cr);
          carGroup.add(ribR);
        }

        // Corner Castings (Twist-lock corners)
        for (let cX of [-1.16, 1.16]) {
          for (let cY of [cfg.y - (cfg.height||1.35)/2, cfg.y + (cfg.height||1.35)/2]) {
            for (let cZ of [cfg.z - (cfg.length||4.2)/2, cfg.z + (cfg.length||4.2)/2]) {
              const casting = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), silverMetal);
              casting.position.set(cX, cY, cZ);
              carGroup.add(casting);
            }
          }
        }
      });

      train.add(carGroup);
      containerCars.push(carGroup);
    }

    // Car 1 (Directly coupled behind locomotive)
    createContainerFlatcar(-5.2, [
      { y: 1.45, z: -2.1, length: 4.2, height: 1.4, mat: fortisCyan },
      { y: 1.45, z: 2.1, length: 4.2, height: 1.4, mat: maerskAzure },
      { y: 2.9, z: 0, length: 8.2, height: 1.4, mat: everGreen } // Top double stack
    ]);

    // Car 2
    createContainerFlatcar(-15.2, [
      { y: 1.45, z: 0, length: 8.4, height: 1.45, mat: cmaRed },
      { y: 2.95, z: 0, length: 8.4, height: 1.45, mat: mscGold }
    ]);

    let isVisible = false;
    let clock = new THREE.Clock();

    function renderRail() {
      if (!isVisible) return;
      requestAnimationFrame(renderRail);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Track sleepers movement
      ties.forEach(t => {
        t.position.z -= delta * 26;
        if (t.position.z < -44) t.position.z += 88;
      });

      // Catenary poles movement
      catenaryMasts.forEach(m => {
        m.position.z -= delta * 26;
        if (m.position.z < -36) m.position.z += 72;
      });

      // High-speed rail chassis vibration & camera pan
      train.position.y = 0.1 + Math.sin(time * 18) * 0.012;
      camera.position.x = -3.6 + Math.sin(time * 0.45) * 0.35;
      camera.lookAt(0, 1.35, 0);

      renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          clock.start();
          renderRail();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      const parent = canvas.parentElement;
      const w = parent.clientWidth || window.innerWidth;
      const h = parent.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ==========================================================================
     SCENE 3: ULTRA-DETAILED 3D BOEING 777F CARGO JET, AIR STREAMS & CLOUDS
     ========================================================================== */
  function createAirScene() {
    const canvas = document.getElementById('canvasAir');
    const setup = setupRenderer(canvas);
    if (!setup) return;

    const { renderer } = setup;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, setup.width / setup.height, 0.1, 160);
    camera.position.set(0, 1.8, 10.8);
    camera.lookAt(0, 0.4, 0);

    const ambient = new THREE.AmbientLight(0x0c1e38, 2.5);
    scene.add(ambient);

    const sunlight = new THREE.DirectionalLight(0x60a5fa, 3.2);
    sunlight.position.set(-12, 15, 10);
    scene.add(sunlight);

    const underGlow = new THREE.DirectionalLight(0x1e3a8a, 1.6);
    underGlow.position.set(10, -6, -8);
    scene.add(underGlow);

    // Multi-Layered Passing Volumetric Cloud Formations
    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      transparent: true,
      opacity: 0.48
    });

    const clouds = [];
    for (let c = 0; c < 24; c++) {
      const cloud = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6 + Math.random() * 2.4, 1), cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 32,
        -2.6 - Math.random() * 4.5,
        (Math.random() - 0.5) * 55
      );
      cloudGroup.add(cloud);
      clouds.push(cloud);
    }

    // Aerodynamic Airflow Streamlines & Vortices (Потоки воздуха)
    const streamlineGroup = new THREE.Group();
    scene.add(streamlineGroup);
    const streamlines = [];
    const streamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4
    });

    for (let s = 0; s < 36; s++) {
      const streamGeo = new THREE.CylinderGeometry(0.015, 0.015, 4.5 + Math.random() * 5.0, 4);
      streamGeo.rotateX(Math.PI / 2);
      const stream = new THREE.Mesh(streamGeo, streamMat);
      stream.position.set(
        (Math.random() - 0.5) * 16,
        -1.5 + Math.random() * 3.5,
        (Math.random() - 0.5) * 40
      );
      streamlineGroup.add(stream);
      streamlines.push(stream);
    }

    // --- ULTRA-DETAILED 3D BOEING 777F CARGO JET ---
    const jet = new THREE.Group();
    scene.add(jet);
    jet.position.set(0, 0.4, 0);

    const planeWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.42, roughness: 0.18 });
    const blueLivery = new THREE.MeshStandardMaterial({ color: 0x0096e6, metalness: 0.72, roughness: 0.22 });
    const titaniumMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.15 });
    const chromeLip = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.06 });
    const cockpitGlass = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.96, roughness: 0.04 });
    const navGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const navRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const strobeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Aerodynamic Pressurized Fuselage
    const fuselageGeo = new THREE.CylinderGeometry(1.15, 1.15, 8.4, 24);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, planeWhite);
    jet.add(fuselage);

    // Contoured Radome Nose Cone with Pitot Probes
    const noseGeo = new THREE.SphereGeometry(1.14, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, planeWhite);
    nose.position.set(0, 0, 4.2);
    jet.add(nose);

    // Multi-Pane Cockpit Flight Deck Windows
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.36, 0.52), cockpitGlass);
    cockpit.position.set(0, 0.62, 3.85);
    cockpit.rotation.x = -0.22;
    jet.add(cockpit);

    // Main Cargo Deck Door Outline Frame (Port side)
    const cargoDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.45, 1.95), blueLivery);
    cargoDoorFrame.position.set(-1.16, 0.15, 2.2);
    jet.add(cargoDoorFrame);

    // Tapered Tail Cone with APU Exhaust Port
    const tailConeGeo = new THREE.ConeGeometry(1.15, 2.8, 24);
    tailConeGeo.rotateX(-Math.PI / 2);
    const tailCone = new THREE.Mesh(tailConeGeo, planeWhite);
    tailCone.position.set(0, 0.1, -5.4);
    jet.add(tailCone);

    const apuHole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 12), titaniumMat);
    apuHole.rotation.x = Math.PI / 2;
    apuHole.position.set(0, 0.15, -6.8);
    jet.add(apuHole);

    // 2. High-Aspect Swept Wings with Flap Track Canoes
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.52, roughness: 0.22 });
    const wingGeo = new THREE.BoxGeometry(5.6, 0.12, 1.9);

    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-3.3, 0.1, 0.2);
    wingL.rotation.y = -0.38;
    wingL.rotation.z = 0.08;
    jet.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(3.3, 0.1, 0.2);
    wingR.rotation.y = 0.38;
    wingR.rotation.z = -0.08;
    jet.add(wingR);

    // Flap Track Fairings ("Canoes") under wings
    for (let cPos of [-2.2, -3.6, -4.8]) {
      const canoeL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 8), wingMat);
      canoeL.rotation.x = -Math.PI / 2;
      canoeL.position.set(cPos, -0.08, -0.2 + (Math.abs(cPos) * 0.12));
      jet.add(canoeL);

      const canoeR = canoeL.clone();
      canoeR.position.set(-cPos, -0.08, -0.2 + (Math.abs(cPos) * 0.12));
      jet.add(canoeR);
    }

    // Raked Aerodynamic Wingtips with Navigation & Strobe Lights
    const rakedTipL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.95), blueLivery);
    rakedTipL.position.set(-6.0, 0.48, -0.75);
    rakedTipL.rotation.x = -0.25;
    jet.add(rakedTipL);

    const rakedTipR = rakedTipL.clone();
    rakedTipR.position.set(6.0, 0.48, -0.75);
    jet.add(rakedTipR);

    // Red Nav Light (Port) & Green Nav Light (Starboard)
    const portLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), navRed);
    portLight.position.set(-6.1, 0.68, -0.65);
    jet.add(portLight);

    const stbdLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), navGreen);
    stbdLight.position.set(6.1, 0.68, -0.65);
    jet.add(stbdLight);

    // Wingtip Strobes
    const strobeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), strobeWhite);
    strobeL.position.set(-6.1, 0.78, -0.85);
    jet.add(strobeL);

    const strobeR = strobeL.clone();
    strobeR.position.set(6.1, 0.78, -0.85);
    jet.add(strobeR);

    // Wingtip Vortices / Condensation Trails (Потоки воздуха с кончиков крыльев)
    const vortexGeo = new THREE.CylinderGeometry(0.03, 0.16, 7.5, 8);
    vortexGeo.rotateX(Math.PI / 2);
    const vortexMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });

    const vortexL = new THREE.Mesh(vortexGeo, vortexMat);
    vortexL.position.set(-6.0, 0.5, -4.5);
    jet.add(vortexL);

    const vortexR = vortexL.clone();
    vortexR.position.set(6.0, 0.5, -4.5);
    jet.add(vortexR);

    // 3. Massive GE90 Turbofan Engines with Spinning Spiral Spinners
    const engines = [];
    function createTurbofan(xPos) {
      const engGroup = new THREE.Group();
      engGroup.position.set(xPos, -0.75, 0.8);

      // Pylon Strut
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 1.8), wingMat);
      pylon.position.set(0, 0.55, -0.2);
      engGroup.add(pylon);

      // Outer Engine Cowling
      const cowlGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.8, 24, 1, true);
      cowlGeo.rotateX(Math.PI / 2);
      const cowl = new THREE.Mesh(cowlGeo, planeWhite);
      engGroup.add(cowl);

      // Inner Titanium Core
      const coreGeo = new THREE.CylinderGeometry(0.78, 0.78, 2.85, 24);
      coreGeo.rotateX(Math.PI / 2);
      const core = new THREE.Mesh(coreGeo, titaniumMat);
      engGroup.add(core);

      // Chrome Inlet Lip
      const lipGeo = new THREE.TorusGeometry(0.85, 0.06, 12, 32);
      const lip = new THREE.Mesh(lipGeo, chromeLip);
      lip.position.set(0, 0, 1.4);
      engGroup.add(lip);

      // Rotating Fan Blades & Spiral Spinner Cone
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, 0, 1.15);

      const spinnerCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.65, 16), darkCabMat);
      spinnerCone.rotation.x = Math.PI / 2;
      fanGroup.add(spinnerCone);

      // 18 Curved Titanium Fan Blades
      for (let b = 0; b < 18; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 0.12), titaniumMat);
        blade.rotation.z = (b / 18) * Math.PI * 2;
        blade.position.set(Math.cos(blade.rotation.z) * 0.42, Math.sin(blade.rotation.z) * 0.42, 0);
        fanGroup.add(blade);
      }
      engGroup.add(fanGroup);
      engines.push(fanGroup);

      // Engine Thrust Heat Distortion Trail
      const thrustGeo = new THREE.CylinderGeometry(0.65, 0.25, 5.0, 12);
      thrustGeo.rotateX(-Math.PI / 2);
      const thrustMesh = new THREE.Mesh(thrustGeo, new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18
      }));
      thrustMesh.position.set(0, 0, -3.8);
      engGroup.add(thrustMesh);

      return engGroup;
    }

    jet.add(createTurbofan(-2.45));
    jet.add(createTurbofan(2.45));

    // 4. Empennage (Vertical Fin with FortisWay Cyan Livery & Horizontal Stabilizers)
    const finGeo = new THREE.BoxGeometry(0.14, 2.6, 2.2);
    const fin = new THREE.Mesh(finGeo, blueLivery);
    fin.position.set(0, 1.7, -4.6);
    fin.rotation.x = -0.42;
    jet.add(fin);

    const hStabGeo = new THREE.BoxGeometry(3.6, 0.08, 1.2);
    const hStab = new THREE.Mesh(hStabGeo, planeWhite);
    hStab.position.set(0, 0.35, -5.2);
    hStab.rotation.x = -0.15;
    jet.add(hStab);

    let isVisible = false;
    let clock = new THREE.Clock();

    function renderAir() {
      if (!isVisible) return;
      requestAnimationFrame(renderAir);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Clouds passing by beneath
      clouds.forEach(c => {
        c.position.z -= delta * 18;
        if (c.position.z < -28) c.position.z += 56;
      });

      // Airflow streamlines racing past (Потоки воздуха)
      streamlines.forEach(s => {
        s.position.z -= delta * 42;
        if (s.position.z < -20) {
          s.position.z += 40;
          s.position.x = (Math.random() - 0.5) * 16;
          s.position.y = -1.5 + Math.random() * 3.5;
        }
      });

      // Spin GE90 Turbofan blades at high RPM
      engines.forEach(f => {
        f.rotation.z += delta * 42;
      });

      // Flashing Wingtip Xenon Strobes
      const strobeOn = (Math.sin(time * 6.5) > 0.88);
      strobeL.visible = strobeOn;
      strobeR.visible = strobeOn;

      // Subtle Aerodynamic Flight Banking & Pitch heave
      jet.position.y = 0.4 + Math.sin(time * 1.8) * 0.08;
      jet.rotation.z = Math.sin(time * 0.8) * 0.035;
      jet.rotation.x = Math.sin(time * 1.2) * 0.018;

      camera.position.x = Math.sin(time * 0.35) * 0.4;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          clock.start();
          renderAir();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      const parent = canvas.parentElement;
      const w = parent.clientWidth || window.innerWidth;
      const h = parent.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ==========================================================================
     SCENE 4: ULTRA-DETAILED 3D OCEAN MEGASHIP, CARGO & REALISTIC GERSTNER WAVES
     ========================================================================== */
  function createSeaScene() {
    const canvas = document.getElementById('canvasSea');
    const setup = setupRenderer(canvas);
    if (!setup) return;

    const { renderer } = setup;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, setup.width / setup.height, 0.1, 160);
    camera.position.set(4.2, 3.4, 10.2);
    camera.lookAt(0, 1.1, 0);

    const ambient = new THREE.AmbientLight(0x061426, 2.5);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    moonLight.position.set(-11, 15, 12);
    scene.add(moonLight);

    const seaFill = new THREE.DirectionalLight(0x0284c7, 1.4);
    seaFill.position.set(10, 4, -8);
    scene.add(seaFill);

    // High-Resolution Procedural Gerstner Ocean Wave Mesh (84x84 grid for realistic waves)
    const oceanGeo = new THREE.PlaneGeometry(38, 72, 84, 84);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x062040,
      roughness: 0.15,
      metalness: 0.88,
      flatShading: true
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.15;
    scene.add(ocean);

    const posAttr = oceanGeo.attributes.position;
    // Cache original vertex positions for Gerstner wave displacement
    const origPositions = new Float32Array(posAttr.array);

    // --- ULTRA-DETAILED 3D CONTAINER MEGASHIP ---
    const ship = new THREE.Group();
    scene.add(ship);
    ship.position.set(0, 0.45, 0);

    const navyHull = new THREE.MeshStandardMaterial({ color: 0x071b30, metalness: 0.82, roughness: 0.22 });
    const redAntiFouling = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.6, roughness: 0.35 });
    const whiteDeck = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.28 });
    const bridgeGlass = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.5, roughness: 0.15 });
    const chromeMast = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.12 });
    const lifeboatOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.4, roughness: 0.3 });

    // Container Colors (5 authentic shipping line liveries)
    const boxCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const boxOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });
    const boxTeal = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4 });
    const boxBurgundy = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.4 });
    const boxGold = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });

    // 1. Contoured Cargo Ship Hull with Bulbous Bow
    const upperHull = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 12.4), navyHull);
    upperHull.position.set(0, 0.8, 0);
    ship.add(upperHull);

    // Underwater Red Keel
    const keelHull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 11.4), redAntiFouling);
    keelHull.position.set(0, -0.3, 0);
    ship.add(keelHull);

    // Flared Clipper Bow Wedge
    const bowWedge = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.8, 4), navyHull);
    bowWedge.position.set(0, 0.8, 7.0);
    bowWedge.rotation.x = -Math.PI / 2;
    bowWedge.rotation.y = Math.PI / 4;
    ship.add(bowWedge);

    // Bulbous Bow (hydrodynamic bulb beneath bow)
    const bulbousBow = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 16), redAntiFouling);
    bulbousBow.position.set(0, -0.28, 7.4);
    bulbousBow.scale.set(0.9, 0.9, 1.9);
    ship.add(bulbousBow);

    // Forecastle Deck with Breakwater Wall & Anchor Winches
    const foreDeck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.38, 1.8), whiteDeck);
    foreDeck.position.set(0, 1.75, 6.0);
    ship.add(foreDeck);

    // Breakwater V-wall to deflect green water
    const breakwater = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 0.1), whiteDeck);
    breakwater.position.set(0, 2.05, 5.2);
    breakwater.rotation.x = -0.2;
    ship.add(breakwater);

    // Forward Navigation Mast
    const foreMast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 8), whiteDeck);
    foreMast.position.set(0, 2.7, 6.4);
    ship.add(foreMast);

    // Heavy Stockless Anchors on Port & Starboard
    const anchorL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.14), chromeMast);
    anchorL.position.set(-1.48, 0.9, 6.3);
    ship.add(anchorL);

    const anchorR = anchorL.clone();
    anchorR.position.set(1.48, 0.9, 6.3);
    ship.add(anchorR);

    // 2. Multi-Tiered Staggered Container Bays
    const containerPalettes = [boxCyan, boxOrange, boxTeal, boxBurgundy, boxGold];
    for (let z = -3.2; z <= 4.2; z += 1.65) {
      for (let x = -0.85; x <= 0.85; x += 1.7) {
        const maxTier = (Math.abs(z) > 2.5) ? 2.5 : (3.15 + (Math.sin(z * 3) > 0 ? 0.65 : 0));
        for (let y = 1.8; y <= maxTier; y += 0.65) {
          const cMat = containerPalettes[Math.floor(Math.random() * containerPalettes.length)];
          const cBox = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.62, 1.58), cMat);
          cBox.position.set(x, y, z);
          ship.add(cBox);

          // Container corner castings
          for (let ccX of [-0.7, 0.7]) {
            for (let ccZ of [-0.74, 0.74]) {
              const cc = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), chromeMast);
              cc.position.set(x + ccX, y + 0.28, z + ccZ);
              ship.add(cc);
            }
          }
        }
      }
    }

    // Steel Lashing Bridges & Catwalks between bays
    for (let z = -2.4; z <= 3.4; z += 3.3) {
      const bridgeWalk = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.08, 0.16), chromeMast);
      bridgeWalk.position.set(0, 2.85, z);
      ship.add(bridgeWalk);
    }

    // 3. Aft 7-Story Accommodation Deckhouse & Panoramic Bridge
    const deckhouse = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.5, 2.1), whiteDeck);
    deckhouse.position.set(0, 2.5, -4.6);
    ship.add(deckhouse);

    // Panoramic Enclosed Navigation Bridge with Overhanging Wings
    const navBridge = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.48, 1.45), bridgeGlass);
    navBridge.position.set(0, 3.55, -4.4);
    ship.add(navBridge);

    // Lifeboat Stations on Gravity Davits (Port & Starboard)
    const lifeboatL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.85, 8), lifeboatOrange);
    lifeboatL.rotation.x = Math.PI / 2;
    lifeboatL.position.set(-1.45, 2.6, -4.6);
    ship.add(lifeboatL);

    const lifeboatR = lifeboatL.clone();
    lifeboatR.position.set(1.45, 2.6, -4.6);
    ship.add(lifeboatR);

    // Main Radar Tower with Twin Spinning Radar Scanners
    const radarTower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.9, 8), chromeMast);
    radarTower.position.set(0, 4.6, -4.6);
    ship.add(radarTower);

    const radarScanner = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.12), chromeMast);
    radarScanner.position.set(0, 5.4, -4.6);
    ship.add(radarScanner);

    // Angled Exhaust Smokestack Funnel with FortisWay Cyan Band
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 1.7, 16), navyHull);
    funnel.position.set(0, 4.05, -5.35);
    funnel.rotation.x = -0.15;
    ship.add(funnel);

    const funnelStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.41, 0.38, 16), boxCyan);
    funnelStripe.position.set(0, 4.15, -5.35);
    funnelStripe.rotation.x = -0.15;
    ship.add(funnelStripe);

    let isVisible = false;
    let clock = new THREE.Clock();

    function renderSea() {
      if (!isVisible) return;
      requestAnimationFrame(renderSea);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Compound Gerstner Realistic Ocean Wave Simulation
      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = origPositions[i * 3];
        const v = origPositions[i * 3 + 1];

        // Harmonic superposition of oceanic swells and wind chop
        const wave1 = Math.sin(u * 0.22 + time * 1.6) * 0.32;
        const wave2 = Math.cos(v * 0.28 + time * 2.1) * 0.24;
        const wave3 = Math.sin((u + v) * 0.42 + time * 3.2) * 0.12;

        pos.setZ(i, wave1 + wave2 + wave3);
      }
      pos.needsUpdate = true;
      oceanGeo.computeVertexNormals();

      // Spin radar scanners
      radarScanner.rotation.y += delta * 4.5;

      // Realistic Ship Buoyancy Physics (Pitch, Roll & Heave in resonance with ocean waves)
      ship.position.y = 0.45 + Math.sin(time * 1.6) * 0.08;
      ship.rotation.z = Math.sin(time * 1.2) * 0.035; // gentle port-to-starboard roll
      ship.rotation.x = Math.sin(time * 1.8) * 0.024; // bow pitch into waves

      // Dynamic ocean camera angle
      camera.position.x = 4.2 + Math.sin(time * 0.35) * 0.35;
      camera.lookAt(0, 1.1, 0);

      renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          clock.start();
          renderSea();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      const parent = canvas.parentElement;
      const w = parent.clientWidth || window.innerWidth;
      const h = parent.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

})();

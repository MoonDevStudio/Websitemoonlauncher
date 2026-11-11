import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const stage = document.querySelector(".world-stage");
const canvas = document.querySelector(".world-canvas");

if (stage && canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70);
    camera.position.set(0, 4.1, 12.5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xb9c2ff, 0x17142f, 2.1));
    const keyLight = new THREE.DirectionalLight(0xe9e0ff, 3.1);
    keyLight.position.set(-5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x7365ff, 20, 22, 2);
    rimLight.position.set(5, 3, -4);
    scene.add(rimLight);

    const world = new THREE.Group();
    scene.add(world);
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x6a68ad, roughness: 0.78, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: 0x3c477e, roughness: 0.86, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: 0x252d59, roughness: 0.92, metalness: 0.01 })
    ];
    const cells = [[], [], []];

    const islandBase = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.72, 7.1),
      new THREE.MeshStandardMaterial({ color: 0x272d63, emissive: 0x11163e, emissiveIntensity: 0.35, roughness: 0.74, metalness: 0.08 })
    );
    islandBase.position.set(0, -1.72, -0.55);
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    world.add(islandBase);

    for (let z = -5; z <= 3; z++) {
      for (let x = -7; x <= 7; x++) {
        const distance = Math.sqrt((x * x) / 70 + ((z + 1) * (z + 1)) / 28);
        if (distance > 1.28) continue;
        const ripple = Math.sin(x * 0.72) * 0.48 + Math.cos(z * 0.91) * 0.45 + Math.sin((x + z) * 0.39) * 0.35;
        const height = Math.max(0, Math.floor(1.05 + ripple - distance * 0.5));
        for (let y = -2; y <= height; y++) {
          const type = y === height ? 0 : y > -1 ? 1 : 2;
          cells[type].push({ x: x * 0.68, y: y * 0.65, z: z * 0.68, shade: 0.88 + ((x * 13 + z * 7 + y * 3) & 7) * 0.025 });
        }
      }
    }

    const dummy = new THREE.Object3D();
    cells.forEach((blocks, type) => {
      if (!blocks.length) return;
      const mesh = new THREE.InstancedMesh(blockGeometry, materials[type], blocks.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      blocks.forEach((block, index) => {
        dummy.position.set(block.x, block.y, block.z);
        dummy.scale.setScalar(0.68);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        mesh.setColorAt(index, new THREE.Color().setScalar(block.shade));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      world.add(mesh);
    });

    const floatingMaterial = new THREE.MeshStandardMaterial({
      color: 0xa39aff,
      emissive: 0x3b2b9c,
      emissiveIntensity: 0.7,
      roughness: 0.32,
      metalness: 0.24
    });
    const floatingBlocks = [];
    [[-4.1, 2.4, -1.6, 0.72], [3.8, 2.8, -2.2, 0.56], [2.4, 1.8, 1.2, 0.36], [-2.7, 3.1, 0.2, 0.31]].forEach(([x, y, z, size], index) => {
      const cube = new THREE.Mesh(blockGeometry, floatingMaterial.clone());
      cube.position.set(x, y, z);
      cube.scale.setScalar(size);
      cube.rotation.set(index * 0.2, index * 0.4, index * 0.12);
      cube.castShadow = true;
      cube.userData.baseY = y;
      cube.userData.floatOffset = index * 1.17;
      floatingBlocks.push(cube);
      world.add(cube);
    });

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.64, 28, 20),
      new THREE.MeshStandardMaterial({ color: 0xd7d3ff, emissive: 0x7867df, emissiveIntensity: 1.6, roughness: 0.42 })
    );
    moon.position.set(3.9, 3.15, -4.1);
    world.add(moon);
    const lunarOrbit = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.012, 8, 72),
      new THREE.MeshBasicMaterial({ color: 0xc3b4ff, transparent: true, opacity: 0.58 })
    );
    lunarOrbit.position.copy(moon.position);
    lunarOrbit.rotation.set(0.55, -0.42, 0.24);
    lunarOrbit.scale.set(1.35, 0.82, 1);
    world.add(lunarOrbit);

    const starPositions = new Float32Array(150 * 3);
    for (let index = 0; index < 150; index++) {
      starPositions[index * 3] = (Math.random() - 0.5) * 15;
      starPositions[index * 3 + 1] = Math.random() * 7 - 0.2;
      starPositions[index * 3 + 2] = -4 - Math.random() * 5;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xd9d3ff, size: 0.035, transparent: true, opacity: 0.76, sizeAttenuation: true })));

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    let animationId = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopAnimation = () => {
      if (!animationId) return;
      window.cancelAnimationFrame(animationId);
      animationId = 0;
    };

    function resize() {
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    function animate() {
      animationId = 0;
      if (document.hidden || reducedMotion.matches) return;
      frame += 0.008;
      world.rotation.y += ((pointerX * 0.11) - world.rotation.y) * 0.035;
      world.rotation.x += ((pointerY * -0.035) - world.rotation.x) * 0.035;
      floatingBlocks.forEach(cube => {
        cube.position.y = cube.userData.baseY + Math.sin(frame + cube.userData.floatOffset) * 0.12;
        cube.rotation.y += 0.0016;
      });
      moon.position.y = 3.15 + Math.sin(frame * 0.6) * 0.08;
      lunarOrbit.position.y = moon.position.y;
      lunarOrbit.rotation.z += 0.0007;
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    }

    stage.addEventListener("pointermove", event => {
      const bounds = stage.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      if (!animationId) animationId = window.requestAnimationFrame(animate);
    }, { passive: true });
    stage.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAnimation();
      else if (!reducedMotion.matches && !animationId) animationId = window.requestAnimationFrame(animate);
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) stopAnimation();
      else if (!document.hidden && !animationId) animationId = window.requestAnimationFrame(animate);
    });

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    stage.classList.add("webgl-ready");
    if (!reducedMotion.matches) animationId = window.requestAnimationFrame(animate);
  } catch (error) {
    console.warn("Moon voxel scene unavailable; using static fallback.", error);
  }
}
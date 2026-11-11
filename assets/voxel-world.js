import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const stage = document.querySelector(".world-stage");
const canvas = document.querySelector(".world-canvas");

if (stage && canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x151736, 17, 34);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 70);
    camera.position.set(0, 3.05, 11.8);
    camera.lookAt(0, 0.05, 0);

    scene.add(new THREE.HemisphereLight(0xb9c2ff, 0x17142f, 2.1));
    const keyLight = new THREE.DirectionalLight(0xe9e0ff, 3.1);
    keyLight.position.set(-5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -8;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x7365ff, 34, 24, 2);
    rimLight.position.set(5, 4, -4);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(0x7caaff, 18, 19, 2);
    warmLight.position.set(-5, 1, 1);
    scene.add(warmLight);

    const world = new THREE.Group();
    scene.add(world);
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x7cb99a, roughness: 0.8, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: 0x526998, roughness: 0.84, metalness: 0.03 }),
      new THREE.MeshStandardMaterial({ color: 0x30395f, roughness: 0.91, metalness: 0.02 })
    ];
    const cells = [[], [], []];

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
      blocks.forEach((block, index) => {
        dummy.position.set(block.x, block.y, block.z);
        dummy.scale.setScalar(0.68);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        mesh.setColorAt(index, new THREE.Color().setScalar(block.shade));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      world.add(mesh);
    });

    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x68bb9b, roughness: 0.9 });
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x9b7c77, roughness: 0.9 });
    const treePositions = [[-3.1, -0.7], [1.35, 0.9], [2.4, 1.05]];
    treePositions.forEach(([x, z], treeIndex) => {
      const ix = Math.round(x / 0.68);
      const iz = Math.round(z / 0.68);
      const distance = Math.sqrt((ix * ix) / 70 + ((iz + 1) * (iz + 1)) / 28);
      if (distance > 1.28) return;
      const ripple = Math.sin(ix * 0.72) * 0.48 + Math.cos(iz * 0.91) * 0.45 + Math.sin((ix + iz) * 0.39) * 0.35;
      const top = Math.floor(1.05 + ripple - distance * 0.5) * 0.65 + 0.34;
      const trunkHeight = 1 + (treeIndex % 2);
      for (let segment = 0; segment < trunkHeight; segment++) {
        const trunk = new THREE.Mesh(blockGeometry, trunkMaterial);
        trunk.position.set(x, top + 0.34 + segment * 0.62, z);
        trunk.scale.set(0.28, 0.62, 0.28);
        trunk.castShadow = true;
        world.add(trunk);
      }
      const canopyY = top + 0.34 + trunkHeight * 0.62;
      [[0, 0, 0], [0.35, 0, 0], [-0.35, 0, 0], [0, 0.3, 0.3], [0, 0.3, -0.3], [0, -0.28, 0.3], [0, -0.28, -0.3]].forEach(([dx, dy, dz], leafIndex) => {
        const leaf = new THREE.Mesh(blockGeometry, leafMaterial);
        leaf.position.set(x + dx, canopyY + dy, z + dz);
        leaf.scale.setScalar(leafIndex === 0 ? 0.62 : 0.46);
        leaf.castShadow = true;
        world.add(leaf);
      });
    });

    const shardMaterial = new THREE.MeshStandardMaterial({ color: 0x5265a8, roughness: 0.86, metalness: 0.06 });
    [[-4.1, -2.6, -0.6, 0.8], [-2.4, -3.4, 0.8, 0.55], [2.9, -2.7, -1.1, 0.72], [4, -2, 0.9, 0.46]].forEach(([x, y, z, size], index) => {
      const shard = new THREE.Mesh(blockGeometry, shardMaterial);
      shard.position.set(x, y, z);
      shard.scale.set(size * 1.5, size * 2.1, size * 1.35);
      shard.rotation.z = index % 2 ? -0.18 : 0.18;
      shard.castShadow = true;
      world.add(shard);
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
      cube.userData.baseY = y;
      cube.userData.floatOffset = index * 1.17;
      floatingBlocks.push(cube);
      world.add(cube);
    });

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.64, 28, 20),
      new THREE.MeshStandardMaterial({ color: 0xd7d3ff, emissive: 0x7867df, emissiveIntensity: 1.6, roughness: 0.42 })
    );
    moon.position.set(3.9, 2.8, -4.1);
    world.add(moon);
    const moonHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.018, 6, 80),
      new THREE.MeshBasicMaterial({ color: 0x9d8aff, transparent: true, opacity: 0.68 })
    );
    moonHalo.position.copy(moon.position);
    moonHalo.rotation.set(0.85, 0.24, -0.28);
    world.add(moonHalo);

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
      moon.position.y = 2.8 + Math.sin(frame * 0.6) * 0.08;
      moonHalo.position.y = moon.position.y;
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
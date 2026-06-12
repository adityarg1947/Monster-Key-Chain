import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * KeychainContainer class
 * Organizes the 3D keychain model parts into structural can components:
 * RingGroup, ChainGroup, RopeGroup, TopLid, CanBody, and BottomLid.
 * Accepts a brandType parameter (0: Monster, 1: Coke, 2: Pepsi, 3: Red Bull, 4: Sprite, 5: Fanta, 6: Custom).
 * Handles procedural compile or GLTF node separation.
 */
export class KeychainContainer {
  constructor(renderer, parentNode, materialsInstance, brandType = 0) {
    this.renderer = renderer;
    this.parentNode = parentNode;
    this.materials = materialsInstance;
    this.brandType = brandType;
    
    // Main Container Group (animated by GSAP timelines)
    this.group = new THREE.Group();
    this.parentNode.add(this.group);
    
    // Content Group (animated by mouse parallax)
    this.contentGroup = new THREE.Group();
    this.group.add(this.contentGroup);
    
    // Pre-allocate the required layout groups inside contentGroup
    this.ringGroup = new THREE.Group();
    this.chainGroup = new THREE.Group();
    this.ropeGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    this.contentGroup.add(this.ringGroup);
    this.contentGroup.add(this.chainGroup);
    this.contentGroup.add(this.ropeGroup);
    this.contentGroup.add(this.bodyGroup);
    
    this.explodedFactor = 0;
    this.disableAutoRotate = false;
  }

  /**
   * Initializes assembly. Loads GLB or fires procedural compile on error.
   */
  async init(glbPath = '/models/keychain.glb') {
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          glbPath,
          (data) => resolve(data),
          null,
          (err) => reject(err)
        );
      });
      
      this.assembleFromGLB(gltf.scene);
      console.log(`Object Loaded: Brand ${this.brandType} GLB Keychain.`);
      
    } catch (error) {
      console.warn(`Missing Object: Brand ${this.brandType} GLB. Error: ${error.message}. Loading procedural fallback...`);
      this.assembleProceduralFallback();
      console.log(`Object Loaded: Brand ${this.brandType} Procedural Fallback Keychain.`);
    }
  }

  /**
   * Sorts loaded GLB elements into appropriate architectural groups.
   */
  assembleFromGLB(glbScene) {
    const children = [...glbScene.children];
    const mats = this.materials.materials;
    const canMat = mats.canBodyMaterials[this.brandType] || mats.canBodyMaterial;
    
    children.forEach((child) => {
      const name = child.name.toLowerCase();
      
      if (name.includes('ring') || name.includes('loop')) {
        this.ringGroup.add(child);
        child.material = mats.brushedSteel;
      } 
      else if (name.includes('chain') || name.includes('link')) {
        this.chainGroup.add(child);
        child.material = mats.blackChrome;
      } 
      else if (name.includes('rope') || name.includes('cord') || name.includes('strap')) {
        this.ropeGroup.add(child);
        child.material = mats.greenNylon;
      } 
      else if (name.includes('lid') || name.includes('cap') || name.includes('tab')) {
        this.bodyGroup.add(child);
        child.material = mats.blackChrome;
        
        if (name.includes('top')) {
          this.topLid = child;
        } else if (name.includes('bottom') || name.includes('base')) {
          this.bottomLid = child;
        }
      } 
      else if (name.includes('can') || name.includes('body') || name.includes('label')) {
        this.bodyGroup.add(child);
        child.material = canMat;
        this.canBody = child;
      } 
      else {
        this.bodyGroup.add(child);
        child.material = mats.matteBlackTitanium;
      }
      
      child.castShadow = true;
      child.receiveShadow = true;
    });

    // Accent light inside can (subtle green glow for Monster, custom for others)
    const brandGlowColors = [0x00ff44, 0xffffff, 0xffffff, 0xff0000, 0xffff00, 0xffffff, 0x00ffff];
    this.coreLight = new THREE.PointLight(brandGlowColors[this.brandType], 1.2, 6);
    this.coreLight.decay = 2.0;
    this.bodyGroup.add(this.coreLight);
  }

  /**
   * Compiles the high-fidelity procedural fallback structure.
   */
  assembleProceduralFallback() {
    const mats = this.materials.materials;
    const canMat = mats.canBodyMaterials[this.brandType] || mats.canBodyMaterial;

    // A. Key Ring (Torus Keyring)
    const ringGeo = new THREE.TorusGeometry(0.5, 0.07, 16, 64);
    ringGeo.computeTangents(); // Compute tangents for anisotropic brushed steel reflections
    const ringMesh = new THREE.Mesh(ringGeo, mats.brushedSteel);
    ringMesh.position.y = 2.4;
    ringMesh.castShadow = true;
    this.ringGroup.add(ringMesh);

    // B. Chain (Elongated interlocking capsule links)
    const linkGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 24);
    
    // Link 1 (vertical orientation)
    const link1 = new THREE.Mesh(linkGeo, mats.blackChrome);
    link1.position.y = 2.05;
    link1.rotation.y = Math.PI / 2;
    link1.scale.set(1.0, 1.4, 1.0);
    link1.castShadow = true;
    this.chainGroup.add(link1);

    // Link 2 (horizontal orientation)
    const link2 = new THREE.Mesh(linkGeo, mats.blackChrome);
    link2.position.y = 1.77;
    link2.scale.set(1.0, 1.4, 1.0);
    link2.castShadow = true;
    this.chainGroup.add(link2);

    // Link 3 (vertical orientation)
    const link3 = new THREE.Mesh(linkGeo, mats.blackChrome);
    link3.position.y = 1.49;
    link3.rotation.y = Math.PI / 2;
    link3.scale.set(1.0, 1.4, 1.0);
    link3.castShadow = true;
    this.chainGroup.add(link3);

    // C. Rope Loop (Braided cord)
    const ropeGeo = new THREE.TorusGeometry(0.18, 0.05, 12, 32);
    const ropeMesh = new THREE.Mesh(ropeGeo, mats.greenNylon);
    ropeMesh.position.set(0, 1.25, 0);
    ropeMesh.rotation.x = Math.PI / 2;
    ropeMesh.castShadow = true;
    this.ropeGroup.add(ropeMesh);

    // D. High-Fidelity Lathe-based Can Casing
    // 1. Can Body (Detailed profile with tapered shoulder and neck)
    const canPoints = [
      new THREE.Vector2(0.40, -0.55),
      new THREE.Vector2(0.44, -0.51),
      new THREE.Vector2(0.44, 0.44),
      new THREE.Vector2(0.40, 0.52)
    ];
    const canGeo = new THREE.LatheGeometry(canPoints, 64);
    canGeo.computeTangents(); // Required for MeshPhysicalMaterial anisotropy

    // Flip UVs horizontally to prevent mirrored labels on LatheGeometry
    const uvAttribute = canGeo.attributes.uv;
    for (let i = 0; i < uvAttribute.count; i++) {
      let u = uvAttribute.getX(i);
      uvAttribute.setX(i, 1.0 - u); // Flip horizontally!
    }
    uvAttribute.needsUpdate = true;

    this.canBody = new THREE.Mesh(canGeo, canMat);
    this.canBody.frustumCulled = false; // Prevent culling during vertical split translation
    this.canBody.position.y = 0.0;
    this.canBody.rotation.y = -Math.PI / 2; // Center the front logo facing the camera at 0° rotation
    this.canBody.castShadow = true;
    this.canBody.receiveShadow = true;
    this.bodyGroup.add(this.canBody);

    // 2. Top Lid & Rim (Detailed profile centered around y=0, positioned at y=0.60)
    const topPoints = [
      new THREE.Vector2(0.40, -0.08),
      new THREE.Vector2(0.415, -0.01),
      new THREE.Vector2(0.415, 0.02),
      new THREE.Vector2(0.37, 0.02),
      new THREE.Vector2(0.36, 0.0),
      new THREE.Vector2(0, 0.0)
    ];
    const topLidGeo = new THREE.LatheGeometry(topPoints, 64);
    this.topLid = new THREE.Mesh(topLidGeo, mats.blackChrome);
    this.topLid.position.y = 0.60;
    this.topLid.castShadow = true;
    this.bodyGroup.add(this.topLid);

    // Pull Tab details on Top Lid
    const tabGeo = new THREE.BoxGeometry(0.08, 0.02, 0.22);
    const tabMesh = new THREE.Mesh(tabGeo, mats.matteBlackTitanium);
    tabMesh.position.set(0, 0.61, 0.12);
    tabMesh.rotation.x = 0.05;
    this.bodyGroup.add(tabMesh);
    this.pullTab = tabMesh; 

    // 3. Bottom Lid & Recessed Base Cup (Detailed profile centered around y=0, positioned at y=-0.55)
    const bottomPoints = [
      new THREE.Vector2(0, -0.07),
      new THREE.Vector2(0.28, -0.07),
      new THREE.Vector2(0.35, -0.10),
      new THREE.Vector2(0.40, 0.0)
    ];
    const bottomLidGeo = new THREE.LatheGeometry(bottomPoints, 64);
    this.bottomLid = new THREE.Mesh(bottomLidGeo, mats.blackChrome);
    this.bottomLid.position.y = -0.55;
    this.bottomLid.castShadow = true;
    this.bodyGroup.add(this.bottomLid);

    // 4. Accent Light (Glowing green pointlight inside the can body)
    const brandGlowColors = [0x00ff44, 0xffffff, 0xffffff, 0xff0000, 0xffff00, 0xffffff, 0x00ffff];
    this.coreLight = new THREE.PointLight(brandGlowColors[this.brandType], 1.2, 6);
    this.coreLight.decay = 2.0;
    this.coreLight.position.set(0, 0, 0);
    this.bodyGroup.add(this.coreLight);
  }

  /**
   * Separates can elements on scroll based on explodedFactor (0 to 1).
   */
  setExplodedView(factor) {
    this.explodedFactor = factor;

    // 1. Move Key Ring upward
    this.ringGroup.position.y = factor * 1.8;

    // 2. Separate Chain links along Y
    if (this.chainGroup.children.length === 3) {
      this.chainGroup.children[0].position.y = 2.05 + factor * 1.2;
      this.chainGroup.children[1].position.y = 1.77 + factor * 0.8;
      this.chainGroup.children[2].position.y = 1.49 + factor * 0.4;
    }

    // 3. Move Rope Loop slightly left and up
    this.ropeGroup.position.x = -factor * 0.65;
    this.ropeGroup.position.y = factor * 0.25;

    // 4. Move Top Lid and pull tab upward
    if (this.topLid) {
      this.topLid.position.y = 0.60 + factor * 0.75;
    }
    if (this.pullTab) {
      this.pullTab.position.y = 0.61 + factor * 0.75;
    }

    // 5. Float Can Body forward (Z-axis offset)
    if (this.canBody) {
      this.canBody.position.z = factor * 1.1;
    }

    // 6. Move Bottom Lid downward
    if (this.bottomLid) {
      this.bottomLid.position.y = -0.55 - factor * 0.75;
    }
  }

  /**
   * Frame updates.
   */
  update(time, camera = null) {
    // Tick materials and shaders
    const mats = this.materials.materials;
    const canMat = mats.canBodyMaterials[this.brandType] || mats.canBodyMaterial;
    if (canMat && canMat.userData.uniforms) {
      canMat.userData.uniforms.uTime.value = time;
    }

    // Slow ambient rotation when idle and not disabled
    if (this.group && !this.disableAutoRotate) {
      if (this.isHovered) {
        this.group.rotation.y += 0.035; // Spin faster on hover
      } else {
        this.group.rotation.y += 0.0025; // Slow ambient rotation
      }
    }

    // Pulse core light
    const pulseFactor = this.materials.uniforms.uPulseIntensity.value;
    if (this.coreLight) {
      this.coreLight.intensity = 1.2 * pulseFactor;
    }
  }
}

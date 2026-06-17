import * as THREE from 'three';


export class KeychainModel {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Track references to individual sub-meshes for animation control
    this.parts = {};
    
    // Animatable properties
    this.explodedFactor = 0; // 0 = assembled, 1 = exploded
    
    // Shaders Uniforms
    this.shaderUniforms = {
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color('#00ff55') }
    };
    
    this.scene.add(this.group);
    
    // Default position and scaling
    this.group.position.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
  }

  /**
   * Initializes the model. Tries to load from GLB, falls back to procedural model.
   */
  async init() {
    // Directly use procedural fallback as GLB model is unavailable
    this.assembleProceduralFallback();
    console.log(`Object Loaded: Brand ${this.brandType} Procedural Fallback Keychain.`);
  }

  /**
   * Identifies components in the loaded GLB scene and populates the parts map.
   */
  parseModelParts(glbScene) {
    glbScene.traverse((child) => {
      if (child.isMesh) {
        // Map meshes by name
        const name = child.name.toLowerCase();
        if (name.includes('ring') || name.includes('loop')) {
          this.parts.ring = child;
        } else if (name.includes('cage') || name.includes('claw') || name.includes('frame')) {
          this.parts.cage = this.parts.cage || [];
          this.parts.cage.push(child);
        } else if (name.includes('glass') || name.includes('capsule')) {
          this.parts.glassCapsule = child;
        } else if (name.includes('core') || name.includes('plasma') || name.includes('liquid')) {
          this.parts.plasmaCore = child;
        } else {
          // General mapping
          this.parts[child.name] = child;
        }
      }
    });
  }

  /**
   * Applies custom luxury materials to the loaded GLB mesh.
   */
  applyPremiumMaterials() {
    const carbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111612,
      metalness: 0.9,
      roughness: 0.35,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x99aaa0,
      metalness: 1.0,
      roughness: 0.05
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      transmission: 1.0,
      thickness: 0.4,
      ior: 1.5
    });

    const plasmaShaderMaterial = new THREE.ShaderMaterial({
      vertexShader: this.getPlasmaVertexShader(),
      fragmentShader: this.getPlasmaFragmentShader(),
      uniforms: this.shaderUniforms,
      transparent: false
    });

    // Traverse and assign materials
    if (this.parts.ring) this.parts.ring.material = chromeMaterial;
    if (this.parts.glassCapsule) this.parts.glassCapsule.material = glassMaterial;
    if (this.parts.plasmaCore) this.parts.plasmaCore.material = plasmaShaderMaterial;
    if (this.parts.cage) {
      this.parts.cage.forEach(m => m.material = carbonMaterial);
    }
  }

  /**
   * Generates a detailed procedural fallback model in case GLB file is not available.
   */
  createFallbackModel() {
    // Materials
    const carbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111612,
      metalness: 0.9,
      roughness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x99aaa0,
      metalness: 1.0,
      roughness: 0.05
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      transmission: 1.0,
      thickness: 0.5,
      ior: 1.5,
      side: THREE.DoubleSide
    });

    const plasmaShaderMaterial = new THREE.ShaderMaterial({
      vertexShader: this.getPlasmaVertexShader(),
      fragmentShader: this.getPlasmaFragmentShader(),
      uniforms: this.shaderUniforms
    });

    // 1. Hanger Ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.07, 16, 64);
    const ring = new THREE.Mesh(ringGeo, chromeMaterial);
    ring.position.y = 2.0;
    ring.castShadow = true;
    this.group.add(ring);
    this.parts.ring = ring;

    // 2. Connector links
    const connectorGroup = new THREE.Group();
    const linkGeo1 = new THREE.TorusGeometry(0.15, 0.04, 8, 24);
    const link1 = new THREE.Mesh(linkGeo1, chromeMaterial);
    link1.position.y = 1.45;
    link1.rotation.y = Math.PI / 2;
    connectorGroup.add(link1);

    const linkGeo2 = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16);
    const link2 = new THREE.Mesh(linkGeo2, carbonMaterial);
    link2.position.y = 1.25;
    connectorGroup.add(link2);
    
    this.group.add(connectorGroup);
    this.parts.connector = connectorGroup;

    // 3. Central Energy Capsule (Glass)
    const glassGeo = new THREE.CapsuleGeometry(0.4, 1.0, 16, 32);
    const glassCapsule = new THREE.Mesh(glassGeo, glassMaterial);
    glassCapsule.position.y = 0;
    this.group.add(glassCapsule);
    this.parts.glassCapsule = glassCapsule;

    // 4. Glowing Plasma Core (Inside Capsule)
    const plasmaGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 16, 32);
    const plasmaCore = new THREE.Mesh(plasmaGeo, plasmaShaderMaterial);
    plasmaCore.position.y = 0;
    this.group.add(plasmaCore);
    this.parts.plasmaCore = plasmaCore;

    // 5. Outer Casing (Claw Cage)
    const cageGroup = new THREE.Group();
    
    // Top Metal Cap
    const capGeoTop = new THREE.CylinderGeometry(0.45, 0.45, 0.15, 32);
    const capTop = new THREE.Mesh(capGeoTop, carbonMaterial);
    capTop.position.y = 0.65;
    cageGroup.add(capTop);
    this.parts.cageTop = capTop;

    // Bottom Metal Cap
    const capGeoBot = new THREE.CylinderGeometry(0.45, 0.3, 0.2, 32);
    const capBot = new THREE.Mesh(capGeoBot, carbonMaterial);
    capBot.position.y = -0.65;
    cageGroup.add(capBot);
    this.parts.cageBottom = capBot;

    // Outer claw arms surrounding the glass capsule
    const clawGroup = new THREE.Group();
    const numClaws = 3;
    const clawArms = [];
    
    for (let i = 0; i < numClaws; i++) {
      const angle = (i / numClaws) * Math.PI * 2;
      const clawArmGroup = new THREE.Group();
      clawArmGroup.rotation.y = angle;
      
      const armGeo = new THREE.BoxGeometry(0.08, 1.2, 0.15);
      const arm = new THREE.Mesh(armGeo, carbonMaterial);
      // Offset outwards and rotate inward slightly for claw shape
      arm.position.set(0, 0, 0.5);
      arm.rotation.x = 0.05;
      arm.castShadow = true;
      
      // Neon green energy canal on claws
      const stripeGeo = new THREE.BoxGeometry(0.02, 1.0, 0.02);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00ff55 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0, 0.585);
      stripe.rotation.x = 0.05;
      
      clawArmGroup.add(arm);
      clawArmGroup.add(stripe);
      clawGroup.add(clawArmGroup);
      clawArms.push(clawArmGroup);
    }
    
    cageGroup.add(clawGroup);
    this.parts.clawArms = clawGroup;
    this.parts.clawsList = clawArms; // array of individual claws for exploded views
    
    this.group.add(cageGroup);
    this.parts.cage = cageGroup;
  }

  /**
   * Separates components along their relative axes based on explodeFactor (0 to 1).
   */
  setExplodedView(factor) {
    this.explodedFactor = factor;
    
    if (this.parts.ring) {
      // Ring moves up
      this.parts.ring.position.y = 2.0 + factor * 1.5;
    }
    if (this.parts.connector) {
      // Connector moves up slightly less
      this.parts.connector.position.y = factor * 0.9;
    }
    if (this.parts.cageTop) {
      // Top cap moves up
      this.parts.cageTop.position.y = 0.65 + factor * 0.6;
    }
    if (this.parts.cageBottom) {
      // Bottom cap moves down
      this.parts.cageBottom.position.y = -0.65 - factor * 0.6;
    }
    if (this.parts.clawsList) {
      // Claw arms push outwards radially
      this.parts.clawsList.forEach((clawGroup) => {
        // Move v3 children radially outward
        clawGroup.children.forEach((child) => {
          child.position.z = 0.5 + factor * 0.7;
        });
      });
    }
    if (this.parts.glassCapsule) {
      // Glass capsule scales up slightly to create visual spacing
      this.parts.glassCapsule.position.y = 0;
      this.parts.glassCapsule.scale.set(1, 1 + factor * 0.15, 1);
    }
    if (this.parts.plasmaCore) {
      // Core stays in place but glows brighter
      this.parts.plasmaCore.scale.set(1 + factor * 0.1, 1, 1 + factor * 0.1);
    }
  }

  /**
   * Updates animations and shader uniforms.
   */
  update(time) {
    this.shaderUniforms.uTime.value = time;
    
    // Slow ambient rotation when not overridden
    if (this.group) {
      this.group.rotation.y += 0.005;
    }
  }

  /* CUSTOM SHADERS */

  getPlasmaVertexShader() {
    return `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  getPlasmaFragmentShader() {
    return `
      uniform float uTime;
      uniform vec3 uGlowColor;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      // Pseudo-random noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // 2D Value Noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), vUv.y), u.y);
      }

      void main() {
        // Double-scrolling noise textures for gas/plasma effect
        float n1 = noise(vUv * 6.0 + vec2(0.0, -uTime * 1.5));
        float n2 = noise(vUv * 10.0 + vec2(uTime * 0.5, -uTime * 2.5));
        
        float finalNoise = mix(n1, n2, 0.5);
        
        vec3 neonGreen = uGlowColor;
        vec3 brightLime = vec3(0.75, 1.0, 0.1);
        vec3 darkBackground = vec3(0.005, 0.03, 0.01);
        
        // Base plasma coloring
        vec3 color = mix(darkBackground, neonGreen, finalNoise);
        color = mix(color, brightLime, n2 * n1 * 0.4);
        
        // Compute Fresnel rim glow (based on normal relative to view direction)
        vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
        
        color += neonGreen * fresnel * 1.5;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }
}

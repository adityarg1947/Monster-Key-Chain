import * as THREE from 'three';

/**
 * KeychainMaterials class
 * Coordinates PBR MeshPhysicalMaterial configurations for the luxury showcase.
 * Sets up custom procedural shader injections for 7 different beverage brands,
 * anisotropic brushed reflections, water droplets, condensation mist haze,
 * and beveled logo etching highlights.
 */
export class KeychainMaterials {
  constructor(renderer = null, envMap = null) {
    this.renderer = renderer;
    this.envMap = envMap;
    this.materials = {};
    
    // Core shader uniforms
    this.uniforms = {
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color('#00ff44') },
      uPulseIntensity: { value: 1.0 }
    };

    this.textureLoader = new THREE.TextureLoader();
    this.initMaterials();
  }

  /**
   * Instantiates all standard and custom materials.
   */
  initMaterials() {
    // 1. Matte Black Titanium (casing caps, pull-tabs)
    this.materials.matteBlackTitanium = new THREE.MeshPhysicalMaterial({
      color: 0x0a0c0a,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      envMap: this.envMap,
      envMapIntensity: 1.5
    });

    // 2. Brushed Steel (For keyrings, giving solid metallic steel reflections)
    this.materials.brushedSteel = new THREE.MeshPhysicalMaterial({
      color: 0x909a95,
      metalness: 0.98,
      roughness: 0.22,
      anisotropy: 0.65,
      anisotropyRotation: Math.PI / 2, // wrap reflection around ring
      envMap: this.envMap,
      envMapIntensity: 2.2
    });

    // 3. Black Chrome (Highly reflective mirror chrome for connector chain links and lids)
    this.materials.blackChrome = new THREE.MeshPhysicalMaterial({
      color: 0x0a0c0b,
      metalness: 1.0,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      envMap: this.envMap,
      envMapIntensity: 3.5
    });

    // 4. Matte Braided Green Nylon Rope (woven cord portion with cloth-like sheen)
    this.materials.greenNylon = new THREE.MeshPhysicalMaterial({
      color: 0x00c034,
      roughness: 0.8,
      metalness: 0.15,
      sheen: 0.85,
      sheenColor: 0x00ff44,
      sheenRoughness: 0.6,
      envMap: this.envMap,
      envMapIntensity: 0.3
    });


    // Pre-create the can body materials for the 7 brands
    this.materials.canBodyMaterials = [];
    for (let i = 0; i < 7; i++) {
      this.materials.canBodyMaterials[i] = this.createCanBodyMaterial(i);
    }
    
    // Set default can body material to Monster (brand 0)
    this.materials.canBodyMaterial = this.materials.canBodyMaterials[0];
  }

  /**
   * Creates a dedicated can body material for a specific brand index.
   */
  createCanBodyMaterial(brandType) {
    const brandColors = [
      '#00ff44', // 0: Monster (green)
      '#ffffff', // 1: Coca-Cola (white)
      '#ffffff', // 2: Pepsi (white)
      '#ff0000', // 3: Red Bull (red)
      '#00ff66', // 4: Sprite (green)
      '#ffffff', // 5: Diet Coke (white)
      '#00ff66'  // 6: Sprite fallback (green)
    ];

    const brandUniforms = {
      uTime: this.uniforms.uTime,
      uPulseIntensity: this.uniforms.uPulseIntensity,
      uGlowColor: { value: new THREE.Color(brandColors[brandType]) },
      uBrandType: { value: parseFloat(brandType) }
    };

    let brandTex;
    const paths = [
      '/src/assets/textures/monster.png',
      '/src/assets/textures/coca.png',
      '/src/assets/textures/pespsi.png',
      '/src/assets/textures/redbul.png',
      '/src/assets/textures/sprite.png',
      '/src/assets/textures/coca.png',   // Fallback 5
      '/src/assets/textures/sprite.png' // Fallback 6
    ];

    brandTex = this.textureLoader.load(paths[brandType] || paths[0]);
    brandTex.colorSpace = THREE.SRGBColorSpace;
    brandTex.wrapS = THREE.ClampToEdgeWrapping;
    brandTex.wrapT = THREE.ClampToEdgeWrapping;
    
    // Enable mipmaps and maximum anisotropy for pixel-perfect detail scans
    brandTex.generateMipmaps = true;
    brandTex.minFilter = THREE.LinearMipmapLinearFilter;
    brandTex.magFilter = THREE.LinearFilter;
    
    if (this.renderer) {
      brandTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    } else {
      brandTex.anisotropy = 8;
    }

    // Since we will flip the UV coordinates on the lathe geometry itself,
    // we keep the repeat and offset at neutral defaults to avoid clamping artifacts.
    brandTex.repeat.set(1, 1);
    brandTex.offset.set(0, 0);

    // Create aligned droplet normal and roughness maps
    const dropletNormals = createDropletsNormalMap();
    const dropletRoughness = createDropletsRoughnessMap();

    const mat = new THREE.MeshPhysicalMaterial({
      map: brandTex,
      normalMap: dropletNormals,
      normalScale: new THREE.Vector2(0.22, 0.22),
      roughnessMap: dropletRoughness,
      roughness: 1.0, // Multiplier for roughnessMap
      metalness: 0.85,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      envMap: this.envMap,
      envMapIntensity: 2.5
    });

    mat.userData.uniforms = brandUniforms;

    return mat;
  }

  /**
   * Set environmental reflection map dynamically.
   */
  setEnvMap(envMap) {
    this.envMap = envMap;
    Object.values(this.materials).forEach((mat) => {
      if (mat instanceof THREE.Material) {
        mat.envMap = envMap;
        mat.needsUpdate = true;
      }
    });

    if (this.materials.canBodyMaterials) {
      this.materials.canBodyMaterials.forEach((mat) => {
        mat.envMap = envMap;
        mat.needsUpdate = true;
      });
    }
  }

  /**
   * Frame update. Feeds timer steps to uniforms.
   */
  update(time, camera = null) {
    this.uniforms.uTime.value = time;
    this.uniforms.uPulseIntensity.value = 1.0 + Math.sin(time * 3.0) * 0.08;
  }
}

/* ----------------------------------------------------
   PROCEDURAL CANVAS TEXTURE & DROPLET GENERATORS
   ---------------------------------------------------- */

// Pre-generate droplet specifications for perfect alignment between NormalMap and RoughnessMap
const dropletSpecs = [];
for (let i = 0; i < 150; i++) {
  dropletSpecs.push({
    x: Math.random() * 512,
    y: Math.random() * 512,
    r: 2.5 + Math.random() * 7.5
  });
}

function createBrandTexture(brandType) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fill background
  if (brandType === 0) { // Monster
    ctx.fillStyle = '#0a0c0a';
    ctx.fillRect(0, 0, 512, 512);

    // Draw Monster green claw marks
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(220, 120); ctx.quadraticCurveTo(200, 250, 210, 380);
    ctx.moveTo(256, 100);  ctx.quadraticCurveTo(250, 250, 260, 410);
    ctx.moveTo(292, 130); ctx.quadraticCurveTo(290, 250, 280, 370);
    ctx.stroke();
    
    ctx.fillStyle = '#00ff44';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MONSTER', 256, 445);
  }
  else if (brandType === 1) { // Coca-Cola
    ctx.fillStyle = '#cc0510';
    ctx.fillRect(0, 0, 512, 512);

    // Draw White Wave
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.bezierCurveTo(150, 220, 350, 360, 512, 250);
    ctx.lineTo(512, 280);
    ctx.bezierCurveTo(350, 390, 150, 250, 0, 330);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 28px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Coca-Cola', 256, 180);
  }
  else if (brandType === 2) { // Pepsi
    ctx.fillStyle = '#052aab';
    ctx.fillRect(0, 0, 512, 512);

    // Draw Globe Circle
    const cx = 256, cy = 256, r = 100;
    ctx.fillStyle = '#e60012';
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.9, Math.PI * 1.9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#005ea6';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.1, Math.PI * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + 10);
    ctx.bezierCurveTo(cx - 50, cy - 60, cx + 50, cy + 60, cx + r, cy - 20);
    ctx.lineTo(cx + r, cy + 20);
    ctx.bezierCurveTo(cx + 50, cy + 80, cx - 50, cy - 40, cx - r, cy + 50);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PEPSI', 256, 400);
  }
  else if (brandType === 3) { // Red Bull
    ctx.fillStyle = '#001a66';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#d9d9d9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(256, 0);
    ctx.lineTo(0, 256);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(512, 256);
    ctx.lineTo(512, 512);
    ctx.lineTo(256, 512);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(256, 256, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cc0015';
    ctx.beginPath();
    ctx.moveTo(190, 256); ctx.lineTo(150, 240); ctx.lineTo(170, 270); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(322, 256); ctx.lineTo(362, 240); ctx.lineTo(342, 270); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Red Bull', 256, 360);
  }
  else if (brandType === 4) { // Thunder
    ctx.fillStyle = '#3a0066';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.moveTo(270, 100);
    ctx.lineTo(210, 280);
    ctx.lineTo(260, 280);
    ctx.lineTo(240, 420);
    ctx.lineTo(310, 240);
    ctx.lineTo(260, 240);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THUNDER', 256, 460);
  }
  else if (brandType === 5) { // Diet Coke
    ctx.fillStyle = '#b3b3b3';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#cc0510';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.bezierCurveTo(150, 220, 350, 360, 512, 250);
    ctx.lineTo(512, 280);
    ctx.bezierCurveTo(350, 390, 150, 250, 0, 330);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#cc0510';
    ctx.font = 'italic bold 28px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DIET COKE', 256, 180);
  }
  else if (brandType === 6) { // Sprite
    ctx.fillStyle = '#008037';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.ellipse(256, 256, 80, 50, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(256, 256, 60, 35, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#008037';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sprite', 256, 264);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createDropletsNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, 512, 512);

  dropletSpecs.forEach((spec) => {
    const x = spec.x;
    const y = spec.y;
    const r = spec.r;

    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
    grad.addColorStop(0, '#9898ff');
    grad.addColorStop(0.5, '#8080ff');
    grad.addColorStop(0.95, '#6868ff');
    grad.addColorStop(1, '#8080ff');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

function createDropletsRoughnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgb(90, 90, 90)';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#000000';
  dropletSpecs.forEach((spec) => {
    ctx.beginPath();
    ctx.arc(spec.x, spec.y, spec.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

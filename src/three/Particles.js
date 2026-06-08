import * as THREE from 'three';

/**
 * Particles class
 * Simulates high-end cinematic camera bokeh. Instead of a swarm of glowing dots,
 * it renders a sparse field of 45 large, soft, out-of-focus floating green circles
 * in the background. This adds depth of field without distracting from the product.
 */
export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.count = 45; // Sparse, high-end camera bokeh
    
    this.initGeometry();
    this.initMaterial();
    this.initMesh();
  }

  /**
   * Initialize geometry buffers.
   */
  initGeometry() {
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.count * 3);
    const randoms = new Float32Array(this.count * 3);
    
    for (let i = 0; i < this.count; i++) {
      // Float particles inside a wider background cylinder volume
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 5.0 + 1.5; // push away from the center to not clip the can
      
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8.0;
      positions[i * 3 + 2] = -Math.random() * 6.0 - 2.0; // Place behind the product

      // randoms.x = size scale
      // randoms.y = horizontal drift phase
      // randoms.z = speed factor
      randoms[i * 3] = 0.5 + Math.random() * 1.5;
      randoms[i * 3 + 1] = Math.random() * Math.PI * 2;
      randoms[i * 3 + 2] = 0.05 + Math.random() * 0.1;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aRandoms', new THREE.BufferAttribute(randoms, 3));
  }

  /**
   * Set up GPU ShaderMaterial uniforms.
   */
  initMaterial() {
    this.uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00ff55') }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Bind points mesh to active scene.
   */
  initMesh() {
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  /**
   * Frame update.
   */
  update(time, scrollProgress) {
    if (this.material) {
      this.uniforms.uTime.value = time;
    }
  }

  /**
   * Clean up WebGL resources.
   */
  destroy() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.points) this.scene.remove(this.points);
  }

  /* GPU VERTEX SHADER */
  getVertexShader() {
    return `
      uniform float uTime;
      attribute vec3 aRandoms;
      varying float vDistance;

      void main() {
        vec3 basePos = position;
        
        // Soft drift in space
        basePos.x += sin(uTime * aRandoms.z + aRandoms.y) * 0.3;
        basePos.y += cos(uTime * aRandoms.z * 0.8 + aRandoms.y) * 0.3;
        
        vec4 mvPosition = modelViewMatrix * vec4(basePos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Large scale for out-of-focus camera lens blur
        float cameraDistance = -mvPosition.z;
        float baseSize = 400.0;
        gl_PointSize = baseSize * aRandoms.x * (1.0 / cameraDistance);
        
        vDistance = cameraDistance;
      }
    `;
  }

  /* GPU FRAGMENT SHADER */
  getFragmentShader() {
    return `
      uniform vec3 uColor;
      varying float vDistance;

      void main() {
        // Convert to circular point
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if (dist > 0.5) {
          discard;
        }
        
        // Extremely soft radial falloff (mimics aperture defocus blur)
        float alpha = smoothstep(0.5, 0.0, dist);
        
        // Very low opacity to keep particles in the supporting 5% hierarchy
        gl_FragColor = vec4(uColor, alpha * 0.04);
      }
    `;
  }
}

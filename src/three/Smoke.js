import * as THREE from 'three';

/**
 * Smoke class
 * Creates a volumetric background smoke/mist system using layered transparent planes
 * running a custom GLSL scrolling noise shader. This adds depth, mood, and the
 * signature Monster Energy atmospheric glow.
 */
export class Smoke {
  constructor(parentGroup) {
    this.parentGroup = parentGroup;
    this.group = new THREE.Group();
    this.parentGroup.add(this.group);

    this.planes = [];
    this.initSmokePlanes();
  }

  initSmokePlanes() {
    const smokeGeo = new THREE.PlaneGeometry(16, 16);

    // Custom Shader Material for realistic volumetric noise smoke
    this.smokeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00ff55') },
        uOpacity: { value: 0.22 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Create 3 layers of smoke at different depths and rotations to create a parallax volumetric effect
    const layers = [
      { z: -5.0, scale: 1.2, speed: 0.04, rotSpeed: 0.015, opacity: 0.08 },
      { z: -3.5, scale: 1.0, speed: -0.06, rotSpeed: -0.01, opacity: 0.05 },
      { z: -2.0, scale: 0.8, speed: 0.08, rotSpeed: 0.02, opacity: 0.03 }
    ];

    layers.forEach((layer) => {
      const mat = this.smokeMaterial.clone();
      mat.uniforms.uOpacity.value = layer.opacity;

      const mesh = new THREE.Mesh(smokeGeo, mat);
      mesh.position.set(0, 0, layer.z);
      mesh.scale.set(layer.scale, layer.scale, 1.0);
      mesh.rotation.z = Math.random() * Math.PI * 2;

      this.group.add(mesh);

      this.planes.push({
        mesh: mesh,
        material: mat,
        speed: layer.speed,
        rotSpeed: layer.rotSpeed,
        baseRotation: mesh.rotation.z
      });
    });
  }

  update(time) {
    this.planes.forEach((plane) => {
      // Feed elapsed time to uniform
      plane.material.uniforms.uTime.value = time;

      // Slow drift rotation
      plane.mesh.rotation.z = plane.baseRotation + time * plane.rotSpeed;

      // Subtle position breathing
      plane.mesh.position.x = Math.sin(time * 0.2 + plane.mesh.position.z) * 0.15;
      plane.mesh.position.y = Math.cos(time * 0.15 + plane.mesh.position.z) * 0.15;
    });
  }

  destroy() {
    this.planes.forEach((plane) => {
      plane.mesh.geometry.dispose();
      plane.material.dispose();
      this.group.remove(plane.mesh);
    });
    this.parentGroup.remove(this.group);
  }

  getVertexShader() {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  getFragmentShader() {
    return `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;

      // Pseudo-random hash
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // 2D Value Noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      // Fractal Brownian Motion for layered organic cloud detail
      float fbm(vec2 p) {
        float val = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          val += amp * noise(p);
          p *= 2.01;
          amp *= 0.5;
        }
        return val;
      }

      void main() {
        // Shift uv over time to create rising smoke look
        vec2 flowUv1 = vUv * 2.5 + vec2(0.0, -uTime * 0.06);
        vec2 flowUv2 = vUv * 4.0 + vec2(uTime * 0.03, -uTime * 0.1);

        float n1 = fbm(flowUv1);
        float n2 = fbm(flowUv2);

        // Mix the noise layers
        float smoke = mix(n1, n2, 0.5);

        // Radial gradient mask to fade smoke at plane borders
        float centerDist = length(vUv - vec2(0.5));
        float borderFade = smoothstep(0.5, 0.15, centerDist);

        // Soft vertical density gradient (smoke denser near bottom, fading upward)
        float verticalFade = smoothstep(0.0, 0.8, vUv.y);

        // Combine maps
        float finalAlpha = smoke * borderFade * verticalFade * uOpacity;

        // Smoke base colors: deep dark green to subtle green highlights
        vec3 darkGreen = vec3(0.002, 0.008, 0.004);
        vec3 brightGreen = uColor * 0.35;

        vec3 smokeColor = mix(darkGreen, brightGreen, smoke * 1.0);

        gl_FragColor = vec4(smokeColor, finalAlpha);
      }
    `;
  }
}

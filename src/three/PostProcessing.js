import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * PostProcessing class
 * Sets up the Three.js postprocessing pipeline (composer, bloom glow, vignette, output correction).
 * Controls cinematic exposure and provides APIs to modify look at runtime.
 */
export class PostProcessing {
  constructor(renderer, scene, camera, width, height) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    // 1. Initialize the central EffectComposer
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(width, height);
    
    // 2. Base Render Pass (renders the primary 3D scene)
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // 3. Unreal Bloom Pass (creates the glowing neon energy effect)
    // Parameters: resolution, strength, radius, threshold
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.24,  // reduced glow intensity (70% reduction)
      0.55,  // glow scatter radius
      0.15   // luminance threshold (only elements brighter than this will glow)
    );
    this.composer.addPass(this.bloomPass);

    // 4. Cinematic Vignette & Noise Pass (draws eyes to center and mimics physical film)
    this.vignettePass = this.createVignettePass();
    this.composer.addPass(this.vignettePass);

    // 5. Output Pass (performs SRGB output conversion and applies renderer tone mapping)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  /**
   * Adjust resolution of composer and passes on window resizing.
   */
  resize(width, height) {
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  /**
   * Keep composer camera synchronized with CameraSystem during transitions.
   */
  updateCamera(camera) {
    this.camera = camera;
    this.composer.passes.forEach((pass) => {
      if (pass instanceof RenderPass) {
        pass.camera = camera;
      }
    });
  }

  /**
   * Set the tone mapping exposure of the renderer dynamically.
   * Useful for flash effects (e.g., product reveal burst).
   */
  setExposure(val) {
    this.renderer.toneMappingExposure = val;
  }

  /**
   * Retrieve the current exposure value.
   */
  getExposure() {
    return this.renderer.toneMappingExposure;
  }

  /**
   * Set bloom parameters dynamically.
   */
  setBloom(strength, radius, threshold) {
    if (strength !== undefined) this.bloomPass.strength = strength;
    if (radius !== undefined) this.bloomPass.radius = radius;
    if (threshold !== undefined) this.bloomPass.threshold = threshold;
  }

  /**
   * Render the composer queue. Called every frame in the SceneManager.
   */
  render() {
    this.composer.render();
  }

  /**
   * Creates a custom GLSL vignette pass. Darkens edges based on radial coordinates.
   */
  createVignettePass() {
    const VignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        uDarkness: { value: 1.25 }, // Darkness scaling
        uOffset: { value: 0.92 }    // Vignette boundary offset
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uDarkness;
        uniform float uOffset;
        varying vec2 vUv;
        
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          
          // Center UV coordinates (shifts coordinates to [-0.5, 0.5])
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          
          // Smooth interpolation for dark luxury vignette borders
          float vignette = smoothstep(uOffset, uOffset - uDarkness, dist);
          
          // Multiply color channels by vignette scale, maintaining transparency
          gl_FragColor = vec4(texel.rgb * vignette, texel.a);
        }
      `
    };
    return new ShaderPass(VignetteShader);
  }
}

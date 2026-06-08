import * as THREE from 'three';

/**
 * Generates an in-memory studio reflection environment map.
 * Simulates professional luxury product photography lighting using vertical strip softboxes.
 * We set the color values greater than 1.0 to generate a high-dynamic-range (HDR) reflection map,
 * yielding bright, defined specular reflections on brushed metal and polished chrome.
 */
export function createProceduralEnvironment(renderer) {
  const scene = new THREE.Scene();
  
  // 1. High-intensity White Key Strip Softbox (Left-Front side)
  const keyStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 14, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(10.0, 10.0, 10.0) })
  );
  keyStrip.position.set(4, 2, 4);
  keyStrip.lookAt(0, 0, 0);
  scene.add(keyStrip);
  
  // 2. White Fill Strip Softbox (Right-Front side)
  const fillStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 14, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(4.0, 4.0, 4.0) })
  );
  fillStrip.position.set(-4, 2, 4);
  fillStrip.lookAt(0, 0, 0);
  scene.add(fillStrip);
 
  // 3. Neon Green Accent Strip Softbox (Back-Left side for green rim reflection)
  const greenRimStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 16, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.0, 15.0, 3.0) })
  );
  greenRimStrip.position.set(-3.5, 3, -4.5);
  greenRimStrip.lookAt(0, 0, 0);
  scene.add(greenRimStrip);
 
  // 4. Neon Green Accent Strip Softbox (Back-Right side for balanced rim highlight)
  const greenRimStrip2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 16, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.0, 15.0, 3.0) })
  );
  greenRimStrip2.position.set(3.5, 3, -4.5);
  greenRimStrip2.lookAt(0, 0, 0);
  scene.add(greenRimStrip2);
 
  // 5. Overhead Softbox Panel
  const overheadSoftbox = new THREE.Mesh(
    new THREE.BoxGeometry(6, 6, 0.5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.2, 0.4, 0.25) })
  );
  overheadSoftbox.position.set(0, 8, 0);
  overheadSoftbox.lookAt(0, 0, 0);
  scene.add(overheadSoftbox);
 
  // Capture into PMREM environment
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });
  
  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
  cubeCamera.update(renderer, scene);
  
  const envMap = pmremGenerator.fromCubemap(cubeRenderTarget.texture).texture;
  
  // Clean up resources
  cubeRenderTarget.dispose();
  pmremGenerator.dispose();
  keyStrip.geometry.dispose();
  keyStrip.material.dispose();
  fillStrip.geometry.dispose();
  fillStrip.material.dispose();
  greenRimStrip.geometry.dispose();
  greenRimStrip.material.dispose();
  greenRimStrip2.geometry.dispose();
  greenRimStrip2.material.dispose();
  overheadSoftbox.geometry.dispose();
  overheadSoftbox.material.dispose();
  
  return envMap;
}

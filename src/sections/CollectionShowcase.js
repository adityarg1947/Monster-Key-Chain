import gsap from 'gsap';
import * as THREE from 'three';

/**
 * CollectionShowcase class
 * Manages the interactive luxury semi-circle product selector.
 */
export class CollectionShowcase {
  constructor(sceneManager, scrollAnimation) {
    this.sceneManager = sceneManager;
    this.scrollAnimation = scrollAnimation;
    this.isActive = false;
    this.activeIndex = 2; // Default active card: Monster Energy (Index 2 in our layout array)

    // Layout configuration order: Red Bull, Coca Cola, Monster, Pepsi, Sprite
    this.products = [
      { brandType: 3, name: "RED BULL", desc: "Tactical energy can keychain, compact and high contrast.", material: "Titanium + Matte Finish" },
      { brandType: 1, name: "COCA COLA", desc: "Classic miniature soda can keychain with timeless branding.", material: "Polished Chrome + Alloy" },
      { brandType: 0, name: "MONSTER ENERGY", desc: "Premium collectible miniature energy can keychain.", material: "Black Chrome + Aluminum" },
      { brandType: 2, name: "PEPSI", desc: "Dynamic globe mini-can keychain with high-gloss finish.", material: "Brushed Steel + Enamel" },
      { brandType: 4, name: "SPRITE", desc: "Crisp lemon-lime miniature soda can keychain.", material: "Anodized Zinc + Neon" }
    ];

    // Card slots angles (from left to right in degrees)
    this.angles = [180, 135, 90, 45, 0];

    // Mouse coordinates for card parallax
    this.mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
    };

    this.initDOMReferences();
    this.setupEvents();
    this.setupScrollTrigger();
    
    // Register self in sceneManager tick loop
    this.sceneManager.collectionShowcase = this;
  }

  /**
   * Selects DOM elements.
   */
  initDOMReferences() {
    this.wrapper = document.querySelector('.cards-orbit-wrapper');
    this.cards = Array.from(document.querySelectorAll('.showcase-card')).map(el => {
      const brandType = parseInt(el.getAttribute('data-brand'), 10);
      const productIndex = this.products.findIndex(p => p.brandType === brandType);
      return { el, brandType, productIndex };
    });
  }

  /**
   * Binds click and hover listeners.
   */
  setupEvents() {
    // Card clicks and hovers
    this.cards.forEach(card => {
      card.el.addEventListener('click', () => {
        this.selectProduct(card.productIndex);
      });

      card.el.addEventListener('mouseenter', () => {
        const model = this.sceneManager.collectionModels[card.brandType];
        if (model) {
          model.isHovered = true;
        }
      });

      card.el.addEventListener('mouseleave', () => {
        const model = this.sceneManager.collectionModels[card.brandType];
        if (model) {
          model.isHovered = false;
        }
      });
    });

    // Track mouse coordinates over the wrapper
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Trigger initial layout coordinate generation
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Connects to GSAP ScrollTrigger to coordinate camera control authority.
   */
  setupScrollTrigger() {
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.timeline({
      scrollTrigger: {
        trigger: '#collection-showcase',
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this.setActive(true),
        onEnterBack: () => this.setActive(true),
        onLeave: () => this.setActive(false),
        onLeaveBack: () => this.setActive(false),
      }
    });
  }

  /**
   * Activates/deactivates the showcase interaction mode.
   */
  setActive(active) {
    this.isActive = active;
    this.sceneManager.collectionShowcaseActive = active;

    if (active) {
      console.log('Entering Collection Showcase. Locking camera control.');
      this.focusActiveCan(true); // Snap or transition smoothly on section enter
    } else {
      console.log('Exiting Collection Showcase.');
      // Stop any fast-rotation hover tags
      this.sceneManager.collectionModels.forEach(m => {
        if (m) m.isHovered = false;
      });
    }
  }

  /**
   * Recalculates semi-circle coordinate dimensions.
   */
  handleResize() {
    if (!this.wrapper) return;
    this.cx = this.wrapper.offsetWidth / 2;
    this.cy = this.wrapper.offsetHeight * 0.95;
    this.radius = Math.min(this.wrapper.offsetWidth * 0.38, 480);

    // Apply immediate layout update
    this.updateLayout(true);
  }

  /**
   * Selects a product, moving its card to top-center slot and focusing the 3D camera.
   */
  selectProduct(productIndex) {
    if (this.activeIndex === productIndex) return;

    this.activeIndex = productIndex;
    this.updateLayout(false);
    this.focusActiveCan(false);
  }

  /**
   * Transitions cards to their correct slot positions.
   */
  updateLayout(immediate = false) {
    if (!this.wrapper || !this.cards.length) return;

    this.cards.forEach(card => {
      // Slot index: (i - activeIndex + 2 + 5) % 5
      const slotIndex = (card.productIndex - this.activeIndex + 2 + 5) % 5;
      const angleDeg = this.angles[slotIndex];
      const angleRad = (angleDeg * Math.PI) / 180;

      // Active card pulls slightly inward towards the center of the arc
      const isTargetActive = (card.productIndex === this.activeIndex);
      const currentRadius = isTargetActive ? this.radius * 0.8 : this.radius;

      const x = this.cx + currentRadius * Math.cos(angleRad);
      const y = this.cy - currentRadius * Math.sin(angleRad);

      if (isTargetActive) {
        card.el.classList.add('active');
      } else {
        card.el.classList.remove('active');
      }

      card.el.style.zIndex = [10, 12, 15, 12, 10][slotIndex];

      gsap.killTweensOf(card.el);
      gsap.to(card.el, {
        left: `${x}px`,
        top: `${y}px`,
        scale: isTargetActive ? 1.05 : 0.85,
        opacity: isTargetActive ? 1.0 : 0.6,
        duration: immediate ? 0 : 1.2,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  }

  /**
   * Smoothly pans the camera to focus on the active beverage can.
   */
  focusActiveCan(snap = false) {
    const activeProduct = this.products[this.activeIndex];
    const brandType = activeProduct.brandType;
    const canPos = this.sceneManager.collectionPositions[brandType];
    
    if (!canPos) return;

    const targetPos = new THREE.Vector3().copy(canPos).add(new THREE.Vector3(0, 0.15, 0.0));
    const cameraOffset = new THREE.Vector3(0, 0.25, 2.3);
    const cameraPos = new THREE.Vector3().copy(canPos).add(cameraOffset);

    // Stop active camera target/position tweens
    gsap.killTweensOf(this.sceneManager.showcaseCamera.currentPos);
    gsap.killTweensOf(this.sceneManager.showcaseCamera.currentTarget);

    if (snap) {
      this.sceneManager.showcaseCamera.currentPos.copy(cameraPos);
      this.sceneManager.showcaseCamera.currentTarget.copy(targetPos);
    } else {
      gsap.to(this.sceneManager.showcaseCamera.currentPos, {
        x: cameraPos.x,
        y: cameraPos.y,
        z: cameraPos.z,
        duration: 1.5,
        ease: 'power3.out'
      });
      
      gsap.to(this.sceneManager.showcaseCamera.currentTarget, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'power3.out'
      });
    }
  }

  /**
   * Animation tick called inside SceneManager.
   */
  update(time) {
    if (!this.isActive) return;

    // Damp/lerp mouse target for smooth card parallax
    this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, this.mouse.targetX, 0.05);
    this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, this.mouse.targetY, 0.05);

    const depthFactors = [0.4, 0.8, 1.2, 0.8, 0.4];

    this.cards.forEach(card => {
      const slotIndex = (card.productIndex - this.activeIndex + 2 + 5) % 5;
      const depth = depthFactors[slotIndex];

      const px = this.mouse.x * depth * 20;
      const py = this.mouse.y * depth * 12;

      card.el.style.setProperty('--parallax-x', `${px}px`);
      card.el.style.setProperty('--parallax-y', `${py}px`);
    });
  }
}

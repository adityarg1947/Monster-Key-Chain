import gsap from 'gsap';

export class Loader {
  constructor(callback) {
    this.onComplete = callback;
    
    // Select DOM nodes
    this.overlay = document.getElementById('loader');
    this.bar = this.overlay.querySelector('.loader-bar');
    this.percentText = this.overlay.querySelector('.status-percent');
    this.statusText = this.overlay.querySelector('.status-text');
    
    // Array of premium product-centric technical statuses for atmosphere
    this.statuses = [
      'LOADING METALLIC FINISHES...',
      'GENERATING WATER DROP CONDENSATION...',
      'POLISHING BLACK CHROME KEYRING...',
      'WEAVING GREEN NYLON ROPE...',
      'TUNING CINEMATIC LIGHTING...',
      'PRODUCT READY'
    ];
    
    this.progress = 0;
    this.startLoading();
  }

  startLoading() {
    document.body.classList.add('loading');

    // Simulate charging progress over 2.2 seconds
    const duration = 2.2;
    const progressObj = { value: 0 };
    
    gsap.to(progressObj, {
      value: 100,
      duration: duration,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.progress = Math.floor(progressObj.value);
        this.updateProgress(this.progress);
      },
      onComplete: () => {
        this.finishLoading();
      }
    });
  }

  updateProgress(percent) {
    // Update progress bar width
    if (this.bar) this.bar.style.width = `${percent}%`;
    
    // Update percentage label
    if (this.percentText) this.percentText.innerText = `${percent}%`;
    
    // Update status text dynamically based on percentage range
    const statusIndex = Math.min(
      Math.floor((percent / 100) * this.statuses.length),
      this.statuses.length - 1
    );
    if (this.statusText && this.statusText.innerText !== this.statuses[statusIndex]) {
      this.statusText.innerText = this.statuses[statusIndex];
      
      // Flash glow on status shift
      gsap.fromTo(this.statusText, 
        { opacity: 0.3, textShadow: '0 0 10px #00ff55' },
        { opacity: 1, textShadow: '0 0 2px #00ff55', duration: 0.3 }
      );
    }
  }

  finishLoading() {
    // Rapidly flash green to build hype
    const timeline = gsap.timeline({
      onComplete: () => {
        if (this.overlay) {
          this.overlay.classList.add('fade-out');
        }
        document.body.classList.remove('loading');
        
        // Execute callback to trigger page entrance timeline
        if (this.onComplete) this.onComplete();
      }
    });

    timeline.to(this.bar, {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 20px #ffffff',
      duration: 0.15,
      yoyo: true,
      repeat: 3
    });

    timeline.to(this.overlay, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', // split-up wipe transition
      duration: 0.85,
      ease: 'power4.inOut'
    }, '+=0.2');
  }
}

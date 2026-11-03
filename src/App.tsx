import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const C = {
  bg: 0x0a1628,
  bgDark: 0x050a14,
  orange: 0xff6a00,
  orangeL: 0xff8c00,
  green: 0x00ff41,
  red: 0xff0033,
  white: 0xffffff,
  darkBlue: 0x0d1f3c,
  midBlue: 0x1a3a5c,
  panel: 0x0a0a0a,
  screen: 0x001a0a,
  desk: 0x1a2a3a,
  floor: 0x0d1520,
  skin: 0x8B6914,
  shirt: 0x2244aa,
  hoodie: 0x1a1a1a,
  money: 0x2a6a2a,
};

class Engine {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  ren: THREE.WebGLRenderer;
  el: HTMLDivElement;
  objs: THREE.Object3D[] = [];
  raf = 0;
  clock = new THREE.Clock();

  constructor(el: HTMLDivElement) {
    this.el = el;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.bg);
    this.scene.fog = new THREE.FogExp2(C.bg, 0.02);
    this.cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
    this.cam.position.set(8, 6, 8);
    this.cam.lookAt(0, 1, 0);
    this.ren = new THREE.WebGLRenderer({ antialias: true });
    this.ren.setSize(innerWidth, innerHeight);
    this.ren.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.ren.shadowMap.enabled = true;
    el.appendChild(this.ren.domElement);
    this.lights();
    addEventListener('resize', this.resize);
  }

  lights() {
    this.scene.add(new THREE.AmbientLight(0x334466, 0.7));
    const d = new THREE.DirectionalLight(0xffffff, 0.6);
    d.position.set(5, 10, 7);
    d.castShadow = true;
    this.scene.add(d);
    const p = new THREE.PointLight(C.orange, 0.4, 25);
    p.position.set(-3, 5, -3);
    this.scene.add(p);
  }

  resize = () => {
    this.cam.aspect = innerWidth / innerHeight;
    this.cam.updateProjectionMatrix();
    this.ren.setSize(innerWidth, innerHeight);
  };

  clear() {
    this.objs.forEach(o => {
      this.scene.remove(o);
      if ((o as any).geometry) (o as any).geometry.dispose();
      if ((o as any).material) {
        const m = (o as any).material;
        if (Array.isArray(m)) m.forEach((x: any) => x.dispose());
        else m.dispose();
      }
    });
    this.objs = [];
  }

  box(x: number, y: number, z: number, w: number, h: number, d: number, col: number, opts?: { emissive?: number; wireframe?: boolean; transparent?: boolean; opacity?: number }) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.MeshLambertMaterial({
      color: col,
      flatShading: true,
      emissive: opts?.emissive ?? 0x000000,
      wireframe: opts?.wireframe ?? false,
      transparent: opts?.transparent ?? false,
      opacity: opts?.opacity ?? 1,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.objs.push(mesh);
    return mesh;
  }

  cyl(x: number, y: number, z: number, r: number, h: number, col: number, seg = 8) {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    const m = new THREE.MeshLambertMaterial({ color: col, flatShading: true });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.objs.push(mesh);
    return mesh;
  }

  sphere(x: number, y: number, z: number, r: number, col: number, opts?: { wireframe?: boolean; transparent?: boolean; opacity?: number; segments?: number }) {
    const g = new THREE.SphereGeometry(r, opts?.segments ?? 12, opts?.segments ?? 8);
    const m = new THREE.MeshBasicMaterial({
      color: col,
      wireframe: opts?.wireframe ?? false,
      transparent: opts?.transparent ?? false,
      opacity: opts?.opacity ?? 1,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.objs.push(mesh);
    return mesh;
  }

  points(positions: Float32Array, col: number, size = 0.05) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({ color: col, size });
    const p = new THREE.Points(g, m);
    this.scene.add(p);
    this.objs.push(p);
    return p;
  }

  line(p1: THREE.Vector3, p2: THREE.Vector3, col: number, opacity = 0.3) {
    const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const m = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity });
    const l = new THREE.Line(g, m);
    this.scene.add(l);
    this.objs.push(l);
    return l;
  }

  ring(x: number, y: number, z: number, r1: number, r2: number, col: number) {
    const g = new THREE.RingGeometry(r1, r2, 24);
    const m = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.objs.push(mesh);
    return mesh;
  }

  camTo(x: number, y: number, z: number, lx = 0, ly = 1, lz = 0, dur = 1) {
    gsap.to(this.cam.position, { x, y, z, duration: dur, ease: 'power2.inOut' });
    gsap.to(this.cam, { duration: dur, ease: 'power2.inOut', onUpdate: () => this.cam.lookAt(lx, ly, lz) });
  }

  start() {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const t = this.clock.getElapsedTime();
      this.objs.forEach(o => {
        if (o.userData.type === 'rotate') o.rotation.y = t * 0.3;
        if (o.userData.type === 'float') o.position.y += Math.sin(t * 2) * 0.001;
        if (o.userData.type === 'pulse') {
          const s = 1 + Math.sin(t * 3) * 0.1;
          o.scale.set(s, s, s);
        }
        if (o.userData.type === 'signal') {
          o.rotation.z += 0.005;
          o.rotation.x += 0.003;
        }
      });
      this.ren.render(this.scene, this.cam);
    };
    loop();
  }

  stop() { cancelAnimationFrame(this.raf); }

  dispose() {
    this.stop();
    removeEventListener('resize', this.resize);
    this.ren.dispose();
    if (this.ren.domElement.parentNode) this.el.removeChild(this.ren.domElement);
  }
}

// ============ SCENE BUILDERS ============
const builders: Record<number, (e: Engine) => void> = {
  // Scene 1: Hacker at monitors
  1: (e) => {
    e.cam.position.set(10, 5, 10);
    e.cam.lookAt(0, 1.5, 0);
    e.box(0, -0.1, 0, 14, 0.2, 12, C.bgDark);
    // Desk
    e.box(0, 1, -2, 7, 0.15, 2.5, C.desk);
    e.box(-3, 0, -2, 0.2, 2, 0.2, C.floor);
    e.box(3, 0, -2, 0.2, 2, 0.2, C.floor);
    // 3 Monitors
    for (let i = -1; i <= 1; i++) {
      e.box(i * 2.2, 2.3, -2.8, 1.8, 1.3, 0.08, C.panel);
      const scr = e.box(i * 2.2, 2.3, -2.75, 1.6, 1.1, 0.02, C.screen, { emissive: 0x001a0a });
      scr.userData.type = 'pulse';
      // Monitor stand
      e.box(i * 2.2, 1.3, -2.5, 0.15, 0.6, 0.15, 0x333333);
    }
    // Progress bar on center
    e.box(0, 1.9, -2.73, 1.3, 0.08, 0.01, 0x003300);
    e.box(0, 1.9, -2.72, 1.1, 0.06, 0.01, C.green, { emissive: C.green });
    // Keyboard
    e.box(0, 1.1, -1.2, 2, 0.08, 0.6, 0x222222);
    // Hacker (back view)
    e.box(0, 2, 0.5, 0.9, 1.4, 0.6, C.hoodie);
    e.box(0, 3.1, 0.5, 0.55, 0.55, 0.55, C.hoodie);
    // Hoodie detail
    e.box(0, 3.35, 0.78, 0.45, 0.15, 0.05, 0x333333);
    // Terminal right
    e.box(4.5, 2.5, -1, 1.5, 2.2, 0.08, C.panel);
    e.box(4.5, 2.5, -0.95, 1.3, 2.0, 0.02, 0x001a0a, { emissive: 0x002a0a });
    // Coffee mug
    e.cyl(2.5, 1.2, -1, 0.12, 0.25, 0x666666, 8);
  },

  // Scene 2: Flip clock
  2: (e) => {
    e.cam.position.set(0, 2, 6);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 10, 0.2, 6, C.bgDark);
    // Clock body
    for (let i = 0; i < 4; i++) {
      const x = -1.8 + i * 1.2;
      e.box(x, 2, 0, 1, 1.6, 0.3, 0x1a1a1a);
      e.box(x, 2, 0.16, 0.9, 1.5, 0.02, C.orange, { emissive: C.orange });
      // Separator line
      e.box(x, 2, 0.17, 0.9, 0.02, 0.01, 0x000000);
    }
    // Colon
    e.sphere(0, 2.3, 0.2, 0.08, C.orange, { segments: 6 });
    e.sphere(0, 1.7, 0.2, 0.08, C.orange, { segments: 6 });
  },

  // Scene 3: Progress bar
  3: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 8, 0.2, 4, C.bgDark);
    // Monitor frame
    e.box(0, 2.5, 0, 6, 3.5, 0.2, C.panel);
    // Screen
    e.box(0, 2.5, 0.11, 5.6, 3.1, 0.02, 0x001a0a, { emissive: 0x000a00 });
    // Progress bar background
    e.box(0, 2, 0.13, 4.5, 0.3, 0.01, 0x002200);
    // Progress bar fill (will animate)
    const bar = e.box(-0.5, 2, 0.14, 3, 0.25, 0.01, C.green, { emissive: C.green });
    bar.userData.type = 'progressBar';
    // Stand
    e.box(0, 0.5, 0, 0.3, 1, 0.3, 0x333333);
    e.box(0, 0, 0, 1.5, 0.1, 0.8, 0x333333);
  },

  // Scene 4: Globe
  4: (e) => {
    e.cam.position.set(0, 0, 9);
    e.cam.lookAt(0, 0, 0);
    // Wireframe globe
    const globe = e.sphere(0, 0, 0, 3, C.midBlue, { wireframe: true, segments: 24 });
    globe.userData.type = 'rotate';
    // Points on globe
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = 3.02 * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 3.02 * Math.cos(phi);
      pos[i * 3 + 2] = 3.02 * Math.sin(phi) * Math.sin(theta);
    }
    const pts = e.points(pos, 0x1a3a5c, 0.03);
    pts.userData.type = 'rotate';
    // Highlighted bank points
    for (let i = 0; i < 30; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const dot = e.sphere(
        3.1 * Math.sin(phi) * Math.cos(theta),
        3.1 * Math.cos(phi),
        3.1 * Math.sin(phi) * Math.sin(theta),
        0.07, C.orange
      );
      dot.userData.type = 'pulse';
    }
  },

  // Scene 5: Calendar
  5: (e) => {
    e.cam.position.set(0, 3, 6);
    e.cam.lookAt(0, 1.5, 0);
    // Calendar body
    e.box(0, 1.5, 0, 4, 3.5, 0.15, 0x1a2a3a);
    // Header
    e.box(0, 3, 0.08, 4, 0.7, 0.05, C.orange, { emissive: C.orange });
    // Grid
    for (let i = 0; i < 7; i++) e.box(-1.5 + i * 0.5, 1.5, 0.08, 0.01, 2.2, 0.01, 0x2a4a6a);
    for (let i = 0; i < 5; i++) e.box(0, 0.6 + i * 0.5, 0.08, 3.6, 0.01, 0.01, 0x2a4a6a);
    // Tearing sheet
    const sheet = e.box(0, -0.1, 0.2, 4, 0.6, 0.08, 0x2a3a4a);
    sheet.userData.type = 'float';
    // Binding rings
    e.cyl(-1.2, 3.3, 0.1, 0.08, 0.3, 0x666666);
    e.cyl(1.2, 3.3, 0.1, 0.08, 0.3, 0x666666);
  },

  // Scene 6: Hacker mask
  6: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    // Mask
    const maskGeo = new THREE.SphereGeometry(1.5, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const maskMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, flatShading: true });
    const mask = new THREE.Mesh(maskGeo, maskMat);
    mask.position.set(0, 2, 0);
    e.scene.add(mask);
    e.objs.push(mask);
    mask.userData.type = 'float';
    // Eye slits
    e.box(-0.4, 2.3, 1.15, 0.35, 0.12, 0.08, C.orange, { emissive: C.orange });
    e.box(0.4, 2.3, 1.15, 0.35, 0.12, 0.08, C.orange, { emissive: C.orange });
    // Mouth slit
    e.box(0, 1.7, 1.2, 0.5, 0.05, 0.05, 0x333333);
    // Particles
    const pos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const pts = e.points(pos, C.orange, 0.03);
    pts.userData.type = 'rotate';
  },

  // Scene 7: Email window (mostly HTML overlay)
  7: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 8: Envelope over city
  8: (e) => {
    e.cam.position.set(0, 10, 12);
    e.cam.lookAt(0, 0, 0);
    // City
    for (let x = -6; x <= 6; x += 1.5) {
      for (let z = -6; z <= 6; z += 1.5) {
        const h = Math.random() * 4 + 0.5;
        const col = Math.random() > 0.5 ? C.darkBlue : C.midBlue;
        e.box(x, h / 2, z, 0.9, h, 0.9, col);
        // Windows
        if (h > 2) {
          for (let wy = 1; wy < h - 0.5; wy += 0.8) {
            if (Math.random() > 0.5) {
              e.box(x, wy, z + 0.46, 0.15, 0.15, 0.01, 0xffcc00, { emissive: 0x443300 });
            }
          }
        }
      }
    }
    // Envelope
    const env = e.box(0, 7, 0, 1.5, 1, 0.1, 0xeeeeee);
    env.userData.type = 'float';
    // Red priority dot
    e.sphere(0, 7.4, 0.06, 0.1, C.red);
    // Attachment line
    e.line(new THREE.Vector3(0, 6.5, 0), new THREE.Vector3(0, 5, 0), C.orange, 0.5);
  },

  // Scene 9: Clerk office
  9: (e) => {
    e.cam.position.set(7, 4, 7);
    e.cam.lookAt(0, 1.5, 0);
    e.box(0, -0.1, 0, 12, 0.2, 10, 0x1a1a2a);
    // Desk
    e.box(0, 1, -1, 3.5, 0.12, 1.8, 0x2a3a4a);
    e.box(-1.5, 0, -1, 0.15, 2, 0.15, C.floor);
    e.box(1.5, 0, -1, 0.15, 2, 0.15, C.floor);
    // Clerk body
    e.box(0, 2, 0.8, 0.7, 1.2, 0.45, C.shirt);
    // Tie
    e.box(0, 1.7, 1.03, 0.08, 0.7, 0.04, C.red);
    // Head
    e.box(0, 3, 0.8, 0.45, 0.45, 0.45, C.skin);
    // Hair
    e.box(0, 3.25, 0.8, 0.47, 0.15, 0.47, 0x3a2a1a);
    // Monitor
    e.box(0, 2.2, -1.8, 1.4, 1, 0.08, C.panel);
    e.box(0, 2.2, -1.75, 1.2, 0.85, 0.02, 0x001a2a, { emissive: 0x000a15 });
    e.box(0, 1.3, -1.5, 0.12, 0.5, 0.12, 0x333333);
    // Window with blinds
    e.box(-5, 2.5, -4, 0.08, 3.5, 3.5, 0x1a2a3a);
    for (let i = 0; i < 8; i++) {
      e.box(-4.95, 1.2 + i * 0.4, -4, 0.02, 0.04, 3.2, 0x3a4a5a);
    }
    // Plant
    e.cyl(3, 0.3, -2, 0.2, 0.6, 0x4a3a2a, 6);
    e.sphere(3, 0.8, -2, 0.35, 0x2a6a2a, { segments: 6 });
  },

  // Scene 10: Mouse click (HTML overlay)
  10: (e) => {
    e.cam.position.set(0, 3, 4);
    e.cam.lookAt(0, 1, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
    // Mouse
    const mouseGeo = new THREE.CapsuleGeometry(0.3, 0.5, 4, 8);
    const mouseMat = new THREE.MeshLambertMaterial({ color: 0x111111, flatShading: true });
    const mouse = new THREE.Mesh(mouseGeo, mouseMat);
    mouse.position.set(0, 0.4, 0);
    mouse.rotation.x = Math.PI / 2;
    e.scene.add(mouse);
    e.objs.push(mouse);
    // Hand silhouette
    e.box(0.3, 1.2, -0.5, 0.6, 0.3, 1.2, 0x8B6914);
    e.box(0.3, 1.0, 0.3, 0.5, 0.15, 0.3, 0x8B6914);
    // Desk surface
    e.box(0, 0.1, 0, 4, 0.15, 3, 0x2a3a4a);
  },

  // Scene 11: Network of cubes
  11: (e) => {
    e.cam.position.set(8, 8, 8);
    e.cam.lookAt(0, 0, 0);
    for (let x = -3.6; x <= 3.6; x += 1.2) {
      for (let z = -3.6; z <= 3.6; z += 1.2) {
        const isGreen = Math.random() > 0.5;
        const isInfected = x === 0 && z === 0;
        const col = isInfected ? C.orange : isGreen ? 0x00aa33 : 0x0a2a1a;
        const cube = e.box(x, 0.3, z, 0.8, 0.6, 0.8, col, isInfected ? { emissive: C.orange } : undefined);
        if (isInfected) cube.userData.type = 'pulse';
      }
    }
    // Connection lines
    for (let i = 0; i < 15; i++) {
      e.line(
        new THREE.Vector3((Math.random() - 0.5) * 7, 0.6, (Math.random() - 0.5) * 7),
        new THREE.Vector3((Math.random() - 0.5) * 7, 0.6, (Math.random() - 0.5) * 7),
        C.green, 0.2
      );
    }
  },

  // Scene 12: Matrix code (mostly HTML overlay)
  12: (e) => {
    e.cam.position.set(0, 2, 6);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 8, 0.2, 6, C.bgDark);
    // Skull outline made of boxes
    const skullPoints = [
      [-0.8, 3.5], [-0.5, 3.8], [0, 3.9], [0.5, 3.8], [0.8, 3.5],
      [0.9, 3], [0.8, 2.5], [0.5, 2.2], [-0.5, 2.2], [-0.8, 2.5], [-0.9, 3],
    ];
    skullPoints.forEach(([x, y]) => {
      e.box(x, y, 0, 0.15, 0.15, 0.15, C.green, { emissive: C.green });
    });
    // Eyes
    e.box(-0.3, 3.2, 0.1, 0.2, 0.2, 0.1, 0x000000);
    e.box(0.3, 3.2, 0.1, 0.2, 0.2, 0.1, 0x000000);
    // Nose
    e.box(0, 2.8, 0.1, 0.1, 0.15, 0.1, 0x000000);
    // Teeth
    for (let i = -2; i <= 2; i++) {
      e.box(i * 0.15, 2.3, 0.1, 0.1, 0.1, 0.1, C.green, { emissive: C.green });
    }
  },

  // Scene 13: Hacker at 6 monitors
  13: (e) => {
    e.cam.position.set(7, 4, 9);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 16, 0.2, 12, C.bgDark);
    // Desk
    e.box(0, 0.8, -1, 10, 0.12, 2.5, C.desk);
    // 6 Monitors (2 rows x 3 cols)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = -2.5 + col * 2.5;
        const y = 2 + row * 1.6;
        e.box(x, y, -3, 2, 1.3, 0.08, C.panel);
        const scr = e.box(x, y, -2.95, 1.8, 1.1, 0.02, C.screen, { emissive: 0x001a0a });
        scr.userData.type = 'pulse';
      }
    }
    // Hacker in hoodie
    e.box(0, 2, 1.5, 1, 1.6, 0.6, C.hoodie);
    e.box(0, 3.2, 1.5, 0.6, 0.6, 0.6, C.hoodie);
    // Glasses
    e.box(0, 3.2, 1.81, 0.5, 0.12, 0.04, 0x444444);
    // Window (night sky)
    e.box(0, 5, -6, 12, 4, 0.1, 0x050a14);
    // Stars
    for (let i = 0; i < 15; i++) {
      e.box(-4 + Math.random() * 8, 4 + Math.random() * 3, -5.9, 0.04, 0.04, 0.01, 0xffffff);
    }
    // Moon
    e.sphere(3, 5.5, -5.8, 0.4, 0xccccaa);
  },

  // Scene 14: Money under dome
  14: (e) => {
    e.cam.position.set(0, 4, 7);
    e.cam.lookAt(0, 1.5, 0);
    e.box(0, -0.1, 0, 8, 0.2, 6, C.bgDark);
    // Glass dome
    const domeGeo = new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshPhongMaterial({
      color: 0x88aacc, transparent: true, opacity: 0.12, flatShading: true, side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 0, 0);
    e.scene.add(dome);
    e.objs.push(dome);
    // Base pedestal
    e.cyl(0, -0.1, 0, 2.8, 0.4, 0x1a2a3a, 12);
    // Money stacks
    for (let i = 0; i < 7; i++) {
      const x = -1.5 + i * 0.5;
      for (let j = 0; j < 4; j++) {
        e.box(x, 0.2 + j * 0.12, 0, 0.35, 0.08, 0.2, C.money);
      }
    }
    // $100 label
    e.box(0, 1, 0.13, 0.6, 0.25, 0.01, C.orange, { emissive: C.orange });
    // Spotlight
    const spot = new THREE.SpotLight(C.orange, 0.5, 10, Math.PI / 6);
    spot.position.set(0, 5, 0);
    spot.target.position.set(0, 0, 0);
    e.scene.add(spot);
    e.scene.add(spot.target);
  },

  // Scene 15: Monitor wall
  15: (e) => {
    e.cam.position.set(0, 2.5, 10);
    e.cam.lookAt(0, 2.5, 0);
    e.box(0, -0.1, 0, 12, 0.2, 6, C.bgDark);
    // 3x3 monitor wall
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = -3 + col * 3;
        const y = 0.5 + row * 2.5;
        e.box(x, y, 0, 2.5, 2, 0.15, C.panel);
        e.box(x, y, 0.08, 2.3, 1.8, 0.02, 0x001a2a, { emissive: 0x000a15 });
        // REC indicator
        if (Math.random() > 0.4) {
          const rec = e.box(x + 1, y + 0.8, 0.1, 0.12, 0.12, 0.01, C.red, { emissive: C.red });
          rec.userData.type = 'pulse';
        }
      }
    }
  },

  // Scene 16: Bank interior (HTML overlay)
  16: (e) => {
    e.cam.position.set(7, 4, 7);
    e.cam.lookAt(0, 1.5, 0);
    e.box(0, -0.1, 0, 12, 0.2, 10, 0x1a1a2a);
    // Two desks
    for (let i = -1; i <= 1; i += 2) {
      e.box(i * 2.5, 1, 0, 2.5, 0.12, 1.5, C.desk);
      // Employee
      e.box(i * 2.5, 2, 1, 0.6, 1.1, 0.4, 0x334455);
      e.box(i * 2.5, 2.9, 1, 0.4, 0.4, 0.4, C.skin);
      // Monitor
      e.box(i * 2.5, 2, -0.8, 1.2, 0.9, 0.08, C.panel);
      e.box(i * 2.5, 2, -0.75, 1, 0.7, 0.02, 0x001a2a, { emissive: 0x000a15 });
    }
  },

  // Scene 17: Screen recording (HTML overlay)
  17: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 18: Timeline (HTML overlay)
  18: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 19: ABS buttons (HTML overlay)
  19: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 20: Payment order (HTML overlay)
  20: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 21: Regulations (HTML overlay)
  21: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 22: Bank architecture
  22: (e) => {
    e.cam.position.set(8, 6, 8);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 12, 0.2, 10, C.bgDark);
    // Pyramid layers
    // Base (4 blocks)
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        e.box(x * 0.9, 0.5, z * 0.9, 1.4, 1, 1.4, C.midBlue);
      }
    }
    // Middle (2 blocks)
    for (let x = -0.5; x <= 0.5; x += 1) {
      for (let z = -0.5; z <= 0.5; z += 1) {
        e.box(x * 0.9, 1.5, z * 0.9, 1.4, 1, 1.4, 0x2a5a8a);
      }
    }
    // Top
    e.box(0, 2.5, 0, 1.4, 1, 1.4, 0x3a7aba);
    // Side blocks
    e.box(3.5, 0.5, 0, 1.2, 1, 1.2, C.darkBlue); // КАССА
    e.box(-3.5, 0.5, 0, 1.2, 1, 1.2, C.darkBlue); // SWIFT
    // Weak point ring
    const ring = e.ring(1.8, 0.5, 1.8, 0.6, 0.8, C.orange);
    ring.rotation.x = -Math.PI / 2;
    ring.userData.type = 'pulse';
    // Entry ring
    const ring2 = e.ring(-1.8, 0.5, -1.8, 0.6, 0.8, C.orange);
    ring2.rotation.x = -Math.PI / 2;
    ring2.userData.type = 'pulse';
    // Connection lines
    e.line(new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(3.5, 0.5, 0), C.orange, 0.4);
    e.line(new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(-3.5, 0.5, 0), C.orange, 0.4);
  },

  // Scene 23: Timer (HTML overlay)
  23: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 24: Login (HTML overlay)
  24: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 25: Security system (HTML overlay)
  25: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
    // Eye/camera
    const eyeGeo = new THREE.SphereGeometry(0.8, 8, 6);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 3, 0);
    e.scene.add(eye);
    e.objs.push(eye);
    // Iris
    e.sphere(0, 3, 0.75, 0.3, C.orange, { segments: 8 });
    // Pupil
    e.sphere(0, 3, 0.8, 0.12, 0x000000, { segments: 6 });
    // Scan lines
    e.line(new THREE.Vector3(-2, 3, 0.5), new THREE.Vector3(2, 3, 0.5), C.orange, 0.3);
    e.line(new THREE.Vector3(-1.5, 3.5, 0.5), new THREE.Vector3(1.5, 2.5, 0.5), C.orange, 0.2);
  },

  // Scene 26: ATM counter
  26: (e) => {
    e.cam.position.set(0, 0, 10);
    e.cam.lookAt(0, 0, 0);
    const globe = e.sphere(0, 0, 0, 3, C.midBlue, { wireframe: true, segments: 24 });
    globe.userData.type = 'rotate';
    // ATM points
    const pos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = 3.05 * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 3.05 * Math.cos(phi);
      pos[i * 3 + 2] = 3.05 * Math.sin(phi) * Math.sin(theta);
    }
    const pts = e.points(pos, C.orange, 0.05);
    pts.userData.type = 'rotate';
  },

  // Scene 27: ATM grid (HTML overlay)
  27: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 28: Cities (HTML overlay)
  28: (e) => {
    e.cam.position.set(0, 3, 8);
    e.cam.lookAt(0, 1, 0);
    e.box(0, -0.1, 0, 14, 0.2, 8, C.bgDark);
    // City silhouettes
    const cities = [
      { x: -4, heights: [2, 3.5, 2.5, 4, 1.5, 3] },
      { x: 0, heights: [1.5, 2, 3, 2.5, 1.8] },
      { x: 4, heights: [3, 4.5, 2, 3.5, 5, 2.5] },
    ];
    cities.forEach(city => {
      city.heights.forEach((h, i) => {
        e.box(city.x - 1 + i * 0.5, h / 2, 0, 0.4, h, 0.4, C.darkBlue);
        // ATM marker
        if (Math.random() > 0.5) {
          e.sphere(city.x - 1 + i * 0.5, h + 0.2, 0.21, 0.08, C.orange);
        }
      });
    });
  },

  // Scene 29: Control panel (HTML overlay)
  29: (e) => {
    e.cam.position.set(0, 2, 5);
    e.cam.lookAt(0, 2, 0);
    e.box(0, -0.1, 0, 6, 0.2, 4, C.bgDark);
  },

  // Scene 30: Final - globe with signals
  30: (e) => {
    e.cam.position.set(0, 0, 10);
    e.cam.lookAt(0, 0, 0);
    const globe = e.sphere(0, 0, 0, 3, C.midBlue, { wireframe: true, segments: 24 });
    globe.userData.type = 'rotate';
    // Signal arcs
    for (let i = 0; i < 6; i++) {
      const torusGeo = new THREE.TorusGeometry(3.5 + i * 0.4, 0.02, 8, 32, Math.PI);
      const torusMat = new THREE.MeshBasicMaterial({
        color: C.orange, transparent: true, opacity: 0.5 - i * 0.06
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      torus.userData.type = 'signal';
      e.scene.add(torus);
      e.objs.push(torus);
    }
    // Launch points
    for (let i = 0; i < 8; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const dot = e.sphere(
        3.1 * Math.sin(phi) * Math.cos(theta),
        3.1 * Math.cos(phi),
        3.1 * Math.sin(phi) * Math.sin(theta),
        0.1, C.orange
      );
      dot.userData.type = 'pulse';
    }
  },
};

// ============ SCENES DATA ============
const SCENES = [
  { id: 1, text: 'ТРИ ЧАСА НОЧИ', sub: 'TRANSFER // 100 NODES 97%', dur: 4 },
  { id: 2, text: 'В ПОЛУМРАКЕ НОЧИ', sub: '', dur: 3, bigNum: '02:59' },
  { id: 3, text: 'МЕДЛЕННО ПОЛЗЁТ ПОЛОСА ЗАГРУЗКИ', sub: '10% → 97%', dur: 3 },
  { id: 4, text: 'В ЭТОТ САМЫЙ МОМЕНТ ТЫ', sub: 'УПРАВЛЯЕШЬ СОТНЕЙ БАНКОВ', dur: 4 },
  { id: 5, text: 'ВСЁ НАЧАЛОСЬ', sub: 'ОКТЯБРЬ 2024 · -1 ГОД', dur: 3 },
  { id: 6, text: 'НИКАКИХ МАСОК', sub: '', dur: 3 },
  { id: 7, text: 'ТВОЁ ГЛАВНОЕ ОРУЖИЕ', sub: 'КОМУ: k.ivanov@bank.ru', dur: 4, overlay: 'email' },
  { id: 8, text: 'ОБЫЧНОЕ ФИШИНГОВОЕ ПИСЬМО', sub: '📎 Отчёт_Q3.doc', dur: 3 },
  { id: 9, text: 'ОТПРАВЛЕННОЕ РЯДОВОМУ КЛЕРКУ', sub: '', dur: 3 },
  { id: 10, text: 'ОН КЛИКНУЛ', sub: '', dur: 2 },
  { id: 11, text: 'ВИРУС ПРОНИК', sub: 'В СЕТЬ', dur: 3 },
  { id: 12, text: 'ТЫ СТАЛ', sub: 'ПРИЗРАКОМ СИСТЕМЫ', dur: 3 },
  { id: 13, text: 'МЕСЯЦАМИ СЕБЯ НЕ ПРОЯВЛЯЛ', sub: '', dur: 4 },
  { id: 14, text: 'ДЕНЬГИ', sub: '$100 × ∞', dur: 3 },
  { id: 15, text: 'ТЫ ПРОСТО СИДЕЛ\nСМОТРЕЛ И СЛУШАЛ', sub: 'ОПЕРЗАЛ #3 · REC', dur: 4, rec: true },
  { id: 16, text: 'ПРОГРАММЫ КАЖДЫЙ ДЕНЬ', sub: 'ЗАПИСЬ ЭКРАНОВ ОПЕРАЦИОНИСТОВ', dur: 3, rec: true },
  { id: 17, text: 'СОХРАНЕНО: 2338 ЧАСОВ', sub: 'ЗАПИСЬ #0412 · ОПЕРАЦИОНИСТ 2', dur: 3, rec: true },
  { id: 18, text: 'ТЫ ИЗУЧИЛ ИХ РАСПОРЯДОК', sub: '09:00 → 18:00', dur: 3, overlay: 'timeline' },
  { id: 19, text: 'УЗНАЛ КАКИЕ КНОПКИ ОНИ НАЖИМАЮТ', sub: 'ПРИНЯТЬ → ПРОВЕРИТЬ → ПОДПИСЬ → ПРОВЕСТИ → ПЕЧАТЬ', dur: 4, overlay: 'buttons' },
  { id: 20, text: 'КАК ПРОХОДЯТ ПЕРЕВОДЫ', sub: 'ПЛАТЕЛЬЩИК → ПОЛУЧАТЕЛЬ → СУММА', dur: 3, overlay: 'payment' },
  { id: 21, text: 'И ВНУТРЕННИЕ РЕГЛАМЕНТЫ', sub: '✓ ДВОЙНОЙ КОНТРОЛЬ · ✓ ЛИМИТЫ · ✓ ЖУРНАЛ', dur: 4, overlay: 'checklist' },
  { id: 22, text: 'ТЫ УЗНАЛ БАНКОВСКИЕ МЕХАНИЗМЫ\nЛУЧШЕ, ЧЕМ ТЕ, КТО ИХ СОЗДАВАЛ', sub: 'ЯДРО → РЕЕСТР → ЛЕДЖЕР · ИЗУЧЕНО 100%', dur: 4 },
  { id: 23, text: '', sub: '', dur: 2, bigNum: '03:45' },
  { id: 24, text: 'ТЫ ЗАХОДИШЬ ВО ВНУТРЕННЮЮ СЕТЬ', sub: 'CORP-NET · admin_ops', dur: 3, overlay: 'login' },
  { id: 25, text: 'СИСТЕМА ВИДИТ В ТЕБЕ НЕ ХАКЕРА', sub: 'ADM-0420 · ДОСТУП: ПОЛНЫЙ', dur: 4, overlay: 'security' },
  { id: 26, text: '2417 БАНКОМАТОВ В СЕТИ', sub: '', dur: 3 },
  { id: 27, text: 'ТЫ ВЫБИРАЕШЬ ДЕСЯТКУ', sub: 'ВЫБРАНО: 09/10 · ATM-100...ATM-261', dur: 3, overlay: 'atmgrid' },
  { id: 28, text: 'В МОСКВЕ, ПРАГЕ, НЬЮ-ЙОРКЕ', sub: '', dur: 3 },
  { id: 29, text: 'НАЖИМАЕШЬ ENTER', sub: 'ВЫДАТЬ ВСЮ НАЛИЧНОСТЬ', dur: 4, overlay: 'control' },
  { id: 30, text: 'NATRIA VPN', sub: 'СВОБОДА В СЕТИ', dur: 5 },
];

// ============ MAIN COMPONENT ============
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [scene, setScene] = useState(0);
  const [showStart, setShowStart] = useState(true);
  const engRef = useRef<Engine | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const matrixRef = useRef<number>(0);

  const initScene = useCallback((id: number) => {
    const e = engRef.current;
    if (!e) return;
    e.clear();
    e.scene.background = new THREE.Color(C.bg);
    const fn = builders[id];
    if (fn) fn(e);
  }, []);

  const start = useCallback(() => {
    setShowStart(false);
    setPlaying(true);

    const tl = gsap.timeline({
      onUpdate: () => {
        const p = tl.progress();
        const idx = Math.min(Math.floor(p * SCENES.length), SCENES.length - 1);
        setScene(idx);
      }
    });

    SCENES.forEach((s) => {
      tl.call(() => {
        initScene(s.id);
      });
      tl.to({}, { duration: s.dur });
    });

    tl.call(() => {
      setPlaying(false);
      setShowStart(true);
    });

    tlRef.current = tl;
  }, [initScene]);

  useEffect(() => {
    if (!containerRef.current) return;
    const e = new Engine(containerRef.current);
    engRef.current = e;
    e.start();
    initScene(1);
    return () => e.dispose();
  }, [initScene]);

  // Matrix rain canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = innerWidth;
    cv.height = innerHeight;

    const cols = Math.floor(cv.width / 14);
    const drops = Array(cols).fill(1);
    const chars = 'アイウエオカキクケコサシスセソ0123456789ABCDEF{}[]<>/\\|';

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 10, 20, 0.04)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#00ff4122';
      ctx.font = '11px monospace';
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 14, drops[i] * 14);
        if (drops[i] * 14 > cv.height && Math.random() > 0.98) drops[i] = 0;
        drops[i]++;
      }
      matrixRef.current = requestAnimationFrame(draw);
    };

    if (playing) {
      draw();
    }

    return () => cancelAnimationFrame(matrixRef.current);
  }, [playing]);

  const onResize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = innerWidth;
      canvasRef.current.height = innerHeight;
    }
  }, []);

  useEffect(() => {
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, [onResize]);

  const s = SCENES[scene];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050a14] select-none">
      {/* Three.js */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Matrix rain */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none opacity-20" />

      {/* Grain */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px',
          animation: 'grain 0.3s steps(6) infinite',
        }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 z-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,10,20,0.6) 100%)' }}
      />

      {/* REC indicator */}
      {playing && s?.rec && (
        <div className="absolute top-5 right-5 z-40 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-red-500 font-mono text-xs font-bold tracking-wider">REC</span>
        </div>
      )}

      {/* Scene counter */}
      {playing && (
        <div className="absolute top-5 left-5 z-40">
          <span className="text-gray-600 font-mono text-[10px] tracking-widest">
            SCENE {scene + 1}/{SCENES.length}
          </span>
        </div>
      )}

      {/* Main text overlay */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-16 pointer-events-none">
        {playing && s && (
          <div key={scene} className="text-center px-6 animate-fadeIn">
            {s.text && (
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2 whitespace-pre-line"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  textShadow: '0 0 30px rgba(255,106,0,0.2), 0 2px 10px rgba(0,0,0,0.5)',
                }}>
                {s.text}
              </h1>
            )}
            {s.sub && (
              <p className="text-sm sm:text-base md:text-lg text-orange-400/80 font-mono tracking-wider mt-2">
                {s.sub}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Big number overlay (flip clock style) */}
      {playing && s?.bigNum && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono"
              style={{
                color: '#ff6a00',
                textShadow: '0 0 40px rgba(255,106,0,0.4), 0 0 80px rgba(255,106,0,0.2)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
              {s.bigNum}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[2px] bg-black/50" />
            </div>
          </div>
        </div>
      )}

      {/* Email overlay (Scene 7) */}
      {playing && s?.overlay === 'email' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-[#0a1628]/95 border border-[#1a3a5c] rounded-lg p-5 max-w-sm w-full mx-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1a3a5c]">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-500 text-[10px] font-mono ml-2">НОВОЕ ПИСЬМО</span>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="text-gray-500 text-xs font-mono w-12">КОМУ:</span>
                <span className="text-white text-xs font-mono">k.ivanov@bank.ru</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 text-xs font-mono w-12">ТЕМА:</span>
                <span className="text-white text-xs font-mono">Отчёт Q3 — срочно</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 text-xs font-mono w-12">📎</span>
                <span className="text-orange-400 text-xs font-mono underline">Отчёт_Q3.doc (2.4 MB)</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="bg-[#ff6a00] text-white px-5 py-1.5 rounded text-xs font-bold font-mono shadow-lg shadow-orange-600/20">
                ОТПРАВИТЬ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline overlay (Scene 18) */}
      {playing && s?.overlay === 'timeline' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="w-[80%] max-w-xl">
            <div className="relative h-1 bg-[#1a3a5c] rounded-full">
              <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" />
              {['09:00', '11:00', '13:00', '15:00', '16:00', '18:00'].map((t, i) => (
                <div key={t} className="absolute -top-1" style={{ left: `${i * 20}%` }}>
                  <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-300" />
                  <div className="text-[9px] text-gray-400 font-mono mt-2 -translate-x-1/2">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABS Buttons overlay (Scene 19) */}
      {playing && s?.overlay === 'buttons' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="flex flex-wrap gap-3 justify-center px-4">
            {['ПРИНЯТЬ', 'ПРОВЕРИТЬ', 'ПОДПИСЬ', 'ПРОВЕСТИ', 'ПЕЧАТЬ', 'ЗАКРЫТЬ'].map((btn, i) => (
              <div key={btn} className="relative group">
                <div className={`px-4 py-2.5 rounded-lg border-2 text-xs font-bold font-mono transition-all ${
                  i < 5
                    ? 'border-orange-500 text-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                    : 'border-gray-700 text-gray-500 bg-gray-800/30'
                }`}>
                  <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-orange-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  {btn}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment overlay (Scene 20) */}
      {playing && s?.overlay === 'payment' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-[#0a1628]/95 border border-[#1a3a5c] rounded-lg p-5 max-w-md w-full mx-4 backdrop-blur-sm">
            <div className="text-center text-orange-400 font-bold mb-3 font-mono text-xs tracking-wider">
              ПЛАТЁЖНОЕ ПОРУЧЕНИЕ №0412
            </div>
            {[
              ['ПЛАТЕЛЬЩИК', 'ООО "РОМШКА"'],
              ['ПОЛУЧАТЕЛЬ', '••••••••••••'],
              ['СУММА', '•••••••• ₽'],
              ['НАЗНАЧЕНИЕ', 'Оплата по договору №77'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-[#0d1f3c]">
                <span className="text-gray-500 text-[10px] font-mono">{l}</span>
                <span className="text-white text-[10px] font-mono">{v}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-0.5 border border-green-600 text-green-400 text-[9px] font-mono rounded">ПОДПИСЬ 1/2 ✓</span>
              <span className="px-2 py-0.5 border border-green-600 text-green-400 text-[9px] font-mono rounded">ПОДПИСЬ 2/2 ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* Checklist overlay (Scene 21) */}
      {playing && s?.overlay === 'checklist' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-[#0a1628]/95 border border-[#1a3a5c] rounded-lg p-5 max-w-sm w-full mx-4 backdrop-blur-sm">
            <div className="text-center text-orange-400 font-bold mb-3 font-mono text-xs tracking-wider">
              ВНУТРЕННИЙ РЕГЛАМЕНТ
            </div>
            {[
              'ДВОЙНОЙ КОНТРОЛЬ',
              'ЛИМИТЫ ПО ВРЕМЕНИ',
              'ЖУРНАЛ ДЕЙСТВИЙ',
              'СВЕРКА В 16:00',
              'ИНКАССАЦИЯ ATM',
              'ДОСТУП АДМИНОВ',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 py-1.5 border-b border-[#0d1f3c]">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-gray-300 text-[10px] font-mono">{item}</span>
              </div>
            ))}
            <div className="mt-3 text-center">
              <span className="inline-block px-3 py-1 border-2 border-orange-500 text-orange-400 font-bold font-mono text-[10px] -rotate-2 opacity-80">
                ИЗУЧЕНО
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Login overlay (Scene 24) */}
      {playing && s?.overlay === 'login' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-[#0a1628]/95 border border-[#1a3a5c] rounded-lg p-6 max-w-xs w-full mx-4 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-5">
              <div className="text-orange-400 font-bold font-mono text-xs tracking-widest">CORP-NET</div>
              <div className="text-gray-500 font-mono text-[10px] mt-1">ВХОД В СИСТЕМУ</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-[9px] font-mono block mb-1">ЛОГИН</label>
                <div className="bg-[#050a14] border border-[#1a3a5c] rounded px-3 py-1.5 text-white text-xs font-mono">
                  admin_ops
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-[9px] font-mono block mb-1">ПАРОЛЬ</label>
                <div className="bg-[#050a14] border border-[#1a3a5c] rounded px-3 py-1.5 text-white text-xs font-mono tracking-widest">
                  ••••••••
                </div>
              </div>
            </div>
            <div className="mt-4 bg-green-900/30 border border-green-600/50 rounded px-3 py-2 text-center">
              <span className="text-green-400 font-mono text-xs font-bold">✓ ДОСТУП РАЗРЕШЁН</span>
            </div>
          </div>
        </div>
      )}

      {/* Security overlay (Scene 25) */}
      {playing && s?.overlay === 'security' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-pulse">👁️</div>
            <div className="text-lg text-white font-bold font-mono mb-1">ХАКЕР?</div>
            <div className="text-xs text-orange-400 font-mono mb-4">А ЛЕГИТИМНОГО АДМИНИСТРАТОРА</div>
            <div className="inline-block bg-[#0a1628]/90 border border-orange-500/50 rounded-lg px-4 py-2 backdrop-blur-sm">
              <div className="text-orange-400 font-mono text-[10px]">ID: ADM-0420</div>
              <div className="text-green-400 font-mono text-[10px] mt-0.5">ДОСТУП: ПОЛНЫЙ</div>
            </div>
          </div>
        </div>
      )}

      {/* ATM Grid overlay (Scene 27) */}
      {playing && s?.overlay === 'atmgrid' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="grid grid-cols-5 gap-1.5 p-3">
            {Array.from({ length: 25 }, (_, i) => {
              const active = [2, 5, 7, 11, 13, 16, 18, 21, 23].includes(i);
              return (
                <div key={i} className={`w-10 h-10 sm:w-12 sm:h-12 rounded flex flex-col items-center justify-center text-[8px] font-mono border ${
                  active
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                    : 'border-[#1a3a5c]/50 text-gray-600 bg-[#0a1628]/50'
                }`}>
                  {active ? (
                    <>
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-[7px]">ATM-{100 + i}</span>
                    </>
                  ) : (
                    <span>ATM-{100 + i}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Control panel overlay (Scene 29) */}
      {playing && s?.overlay === 'control' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="flex gap-3 mb-6">
            {['МОСКВА', 'ПРАГА', 'НЬЮ-ЙОРК'].map(city => (
              <div key={city} className="bg-[#0a1628]/90 border border-[#1a3a5c] rounded-lg p-3 text-center backdrop-blur-sm min-w-[80px]">
                <div className="text-orange-400 font-mono text-[10px] font-bold">{city}</div>
                <div className="text-gray-500 text-[9px] font-mono mt-1">🏧 ×{3 + Math.floor(Math.random() * 3)}</div>
              </div>
            ))}
          </div>
          <div className="bg-orange-600 text-white px-10 py-3 rounded-lg font-black text-lg font-mono animate-pulse shadow-xl shadow-orange-600/30">
            ▶ ENTER
          </div>
        </div>
      )}

      {/* Progress bar bottom */}
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 z-40 h-0.5 bg-[#0a1628]">
          <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500 ease-out"
            style={{ width: `${((scene + 1) / SCENES.length) * 100}%` }} />
        </div>
      )}

      {/* Start screen */}
      {showStart && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050a14]">
          <div className="text-center px-4">
            {/* Logo */}
            <div className="mb-2">
              <div className="inline-block w-16 h-16 border-2 border-orange-500 rounded-lg flex items-center justify-center mb-4 relative">
                <span className="text-orange-500 text-2xl font-bold font-mono">BH</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-3"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 0 60px rgba(255,106,0,0.2), 0 0 120px rgba(255,106,0,0.1)',
              }}>
              BANK HEIST
            </h1>
            <p className="text-orange-400/60 font-mono text-xs sm:text-sm tracking-[0.3em] mb-8">
              CYBERPUNK ANIMATION
            </p>
            <button
              onClick={start}
              className="group relative px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-orange-600/20 hover:shadow-orange-500/40 hover:scale-105 active:scale-95"
              style={{ fontFamily: 'Montserrat' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-xl">▶</span> PLAY
              </span>
            </button>
            <div className="mt-6 space-y-1">
              <p className="text-gray-600 text-[10px] font-mono">30 СЦЕН · THREE.JS · GSAP</p>
              <p className="text-gray-700 text-[9px] font-mono">~90 СЕКУНД АНИМАЦИИ</p>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

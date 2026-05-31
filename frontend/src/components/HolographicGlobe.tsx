import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { feature } from "topojson-client";

// Draw an equirectangular continent/country outline texture onto a canvas.
function buildEarthTexture(topo: any): THREE.CanvasTexture {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Ocean background tinted dark teal so the cyan grid still reads on top
  ctx.fillStyle = "#072a3a";
  ctx.fillRect(0, 0, W, H);

  const project = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];

  const tracePath = (ring: number[][]) => {
    ctx.beginPath();
    ring.forEach((pt, i) => {
      const [x, y] = project(pt[0], pt[1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  const drawGeom = (geom: any, fill: boolean, stroke: boolean) => {
    const rings: number[][][] =
      geom.type === "Polygon"
        ? geom.coordinates
        : geom.type === "MultiPolygon"
          ? geom.coordinates.flat()
          : [];
    rings.forEach((ring) => {
      tracePath(ring);
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    });
  };

  const countries = feature(topo, topo.objects.countries) as any;
  const features = countries.features as any[];

  // Land fill — bright lime green
  ctx.fillStyle = "#4ade80";
  features.forEach((f) => drawGeom(f.geometry, true, false));

  // Country borders — white, thin
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  features.forEach((f) => drawGeom(f.geometry, false, true));

  // Coastline accent — bright yellow, thicker
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 2.4;
  features.forEach((f) => drawGeom(f.geometry, false, true));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

type Lang = { name: string; flag: string; lat: number; lon: number };

// 30+ well-known languages with approximate country coordinates
const LANGS: Lang[] = [
  { name: "English", flag: "🇬🇧", lat: 54.0, lon: -2.0 },
  { name: "Spanish", flag: "🇪🇸", lat: 40.4, lon: -3.7 },
  { name: "French", flag: "🇫🇷", lat: 46.2, lon: 2.2 },
  { name: "German", flag: "🇩🇪", lat: 51.1, lon: 10.4 },
  { name: "Italian", flag: "🇮🇹", lat: 41.9, lon: 12.5 },
  { name: "Portuguese", flag: "🇧🇷", lat: -14.2, lon: -51.9 },
  { name: "Dutch", flag: "🇳🇱", lat: 52.1, lon: 5.3 },
  { name: "Russian", flag: "🇷🇺", lat: 61.5, lon: 80.0 },
  { name: "Polish", flag: "🇵🇱", lat: 51.9, lon: 19.1 },
  { name: "Greek", flag: "🇬🇷", lat: 39.0, lon: 22.0 },
  { name: "Turkish", flag: "🇹🇷", lat: 39.0, lon: 35.2 },
  { name: "Swedish", flag: "🇸🇪", lat: 60.1, lon: 18.6 },
  { name: "Norwegian", flag: "🇳🇴", lat: 60.5, lon: 8.5 },
  { name: "Finnish", flag: "🇫🇮", lat: 61.9, lon: 25.7 },
  { name: "Czech", flag: "🇨🇿", lat: 49.8, lon: 15.5 },
  { name: "Arabic", flag: "🇸🇦", lat: 23.9, lon: 45.1 },
  { name: "Hebrew", flag: "🇮🇱", lat: 31.0, lon: 34.9 },
  { name: "Persian", flag: "🇮🇷", lat: 32.4, lon: 53.7 },
  { name: "Hindi", flag: "🇮🇳", lat: 22.0, lon: 79.0 },
  { name: "Bengali", flag: "🇧🇩", lat: 23.7, lon: 90.4 },
  { name: "Tamil", flag: "🇱🇰", lat: 11.0, lon: 78.8 },
  { name: "Urdu", flag: "🇵🇰", lat: 30.4, lon: 69.3 },
  { name: "Mandarin", flag: "🇨🇳", lat: 35.0, lon: 104.2 },
  { name: "Japanese", flag: "🇯🇵", lat: 36.2, lon: 138.3 },
  { name: "Korean", flag: "🇰🇷", lat: 36.0, lon: 127.8 },
  { name: "Vietnamese", flag: "🇻🇳", lat: 14.1, lon: 108.3 },
  { name: "Thai", flag: "🇹🇭", lat: 15.9, lon: 100.9 },
  { name: "Indonesian", flag: "🇮🇩", lat: -2.5, lon: 118.0 },
  { name: "Filipino", flag: "🇵🇭", lat: 12.9, lon: 121.8 },
  { name: "Swahili", flag: "🇰🇪", lat: -1.3, lon: 36.8 },
  { name: "Zulu", flag: "🇿🇦", lat: -29.0, lon: 28.0 },
  { name: "Amharic", flag: "🇪🇹", lat: 9.1, lon: 40.5 },
  { name: "Yoruba", flag: "🇳🇬", lat: 9.1, lon: 8.7 },
  { name: "Quechua", flag: "🇵🇪", lat: -13.5, lon: -71.9 },
];

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function HolographicGlobe({ size = 420 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.left = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    const RADIUS = 2.2;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Earth sphere — texture painted with country outlines & coastlines
    const earthGeo = new THREE.SphereGeometry(RADIUS * 0.998, 64, 48);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x0a2438,
      emissiveIntensity: 0.35,
      shininess: 12,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    let cancelled = false;
    fetch("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const tex = buildEarthTexture(topo);
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      })
      .catch(() => {});

    // Cyan wireframe overlay — slightly above land so grid stays visible
    const wireGeo = new THREE.SphereGeometry(RADIUS * 1.008, 36, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

    // Atmosphere glow
    const glowGeo = new THREE.SphereGeometry(RADIUS * 1.18, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Stars/particles
    const pCount = 1500;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = RADIUS * (1.5 + Math.random() * 1.2);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // Equator ring
    const ringGeo = new THREE.TorusGeometry(RADIUS * 1.35, 0.01, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x00ffcc, 0.8, 20);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    // Pin markers + labels
    type LabelEntry = {
      pinMesh: THREE.Mesh;
      labelEl: HTMLDivElement;
      pos: THREE.Vector3;
    };
    const pinGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const labelEntries: LabelEntry[] = LANGS.map((l) => {
      const pos = latLonToVec3(l.lat, l.lon, RADIUS * 1.01);

      // Pin marker
      const pin = new THREE.Mesh(pinGeo, pinMat.clone());
      pin.position.copy(pos);
      globeGroup.add(pin);

      // Label
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;transform:translateY(-4px);transition:opacity .4s ease;opacity:0;pointer-events:none">
          <div style="width:1px;height:12px;background:linear-gradient(to bottom, transparent, #00e5ff);"></div>
          <div style="background:rgba(255,255,255,0.96);color:#0f6e56;border:1px solid #0f6e56;padding:2px 7px;border-radius:999px;font:600 9px Inter,sans-serif;box-shadow:0 4px 12px rgba(0,229,255,0.3);white-space:nowrap;backdrop-filter:blur(4px)">
            ${l.flag} ${l.name}
          </div>
        </div>`;
      const obj = new CSS2DObject(el);
      obj.position.copy(pos);
      globeGroup.add(obj);
      return { pinMesh: pin, labelEl: el.firstElementChild as HTMLDivElement, pos };
    });

    let rafId = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      globeGroup.rotation.y += (e.clientX - lastX) * 0.005;
      globeGroup.rotation.x += (e.clientY - lastY) * 0.005;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => { dragging = false; };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    let t = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;
      if (!dragging) {
        globeGroup.rotation.y += 0.0025;
        globeGroup.rotation.x = Math.sin(t * 0.3) * 0.08;
      }
      ring.rotation.z -= 0.003;

      // Fade pins + labels based on world-space z (only show front-facing)
      const m = globeGroup.matrixWorld;
      labelEntries.forEach(({ labelEl, pinMesh, pos }) => {
        const world = pos.clone().applyMatrix4(m);
        const visible = world.z > 0.3;
        labelEl.style.opacity = visible ? "1" : "0";
        (pinMesh.material as THREE.MeshBasicMaterial).opacity = visible ? 1 : 0.15;
        (pinMesh.material as THREE.MeshBasicMaterial).transparent = true;
        // pulse
        const scale = 1 + Math.sin(t * 3 + pos.x) * 0.25;
        pinMesh.scale.setScalar(visible ? scale : 0.6);
      });

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(labelRenderer.domElement)) mount.removeChild(labelRenderer.domElement);
      earthGeo.dispose(); earthMat.dispose();
      wireGeo.dispose(); wireMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      pGeo.dispose(); pMat.dispose();
      pinGeo.dispose(); pinMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,229,255,0.18) 0%, rgba(0,229,255,0.04) 40%, transparent 70%)",
          boxShadow: "0 0 120px rgba(0,229,255,0.25)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full border border-dashed"
        style={{
          borderColor: "rgba(0,229,255,0.25)",
          transform: "rotateX(70deg)",
          animation: "spin 22s linear infinite",
        }}
      />
      <div className="absolute inset-0" style={{ animation: "spin 9s linear infinite" }}>
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
          style={{ width: 6, height: 6, background: "#00e5ff", boxShadow: "0 0 12px #00e5ff" }}
        />
      </div>
      <div className="absolute inset-0" style={{ animation: "spin-reverse 14s linear infinite" }}>
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 5, height: 5, background: "#00e5ff", boxShadow: "0 0 10px #00e5ff" }}
        />
      </div>
      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{ animation: "float 4s ease-in-out infinite" }}
      />
    </div>
  );
}

export default HolographicGlobe;

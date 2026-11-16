"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface PointCloudProps {
  className?: string;
  /** Smaller, calmer version used while an analysis runs. */
  compact?: boolean;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScan;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aSeed;
  attribute float aComplaint;
  varying float vGlow;
  varying float vComplaint;
  varying float vDepth;
  void main() {
    vec3 p = position * (1.0 + 0.015 * sin(uTime * 0.8 + aSeed * 6.2831));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vGlow = smoothstep(0.5, 0.0, abs(p.y - uScan));
    vComplaint = aComplaint;
    vDepth = clamp((-mv.z - 3.8) / 4.0, 0.0, 1.0);
    float size = uSize * (1.0 + vGlow * 1.6 + aComplaint * 1.1);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform vec3 uCavity;
  uniform float uOpacity;
  varying float vGlow;
  varying float vComplaint;
  varying float vDepth;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.12, r);
    vec3 col = mix(uBase, uAccent, vGlow);
    col = mix(col, uCavity, vComplaint * (0.4 + 0.6 * vGlow));
    float strength = mix(0.28, 1.0, clamp(vGlow + vComplaint * 0.55, 0.0, 1.0));
    gl_FragColor = vec4(col, soft * strength * (1.0 - vDepth * 0.65) * uOpacity);
  }
`;

function themeColor(name: string, fallback: string): THREE.Color {
  const host = document.querySelector(".site") ?? document.documentElement;
  const value = getComputedStyle(host).getPropertyValue(name).trim() || fallback;
  // Linear space keeps the exact CSS colour: the shader writes straight to the framebuffer.
  return new THREE.Color().setStyle(value, THREE.LinearSRGBColorSpace);
}

/**
 * A sphere of points standing in for customer reviews. A scan plane sweeps
 * through it and lights up the points it passes; a few orange points are the
 * complaints. Reads its colours from the active theme.
 */
export default function PointCloud({ className, compact = false }: PointCloudProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return; // WebGL unavailable: the page works without the scene.
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.z = compact ? 6.6 : 6.9;

    const RADIUS = 2;
    const count = compact ? 1500 : small ? 1900 : 3400;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const complaints = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ring = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const r = RADIUS * (0.97 + Math.random() * 0.06);
      positions[i * 3] = Math.cos(theta) * ring * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = Math.sin(theta) * ring * r;
      seeds[i] = Math.random();
      complaints[i] = Math.random() < 0.028 ? 1 : 0;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aComplaint", new THREE.BufferAttribute(complaints, 1));

    const uniforms = {
      uTime: { value: 0 },
      uScan: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uSize: { value: compact ? 2.4 : 2.1 },
      uBase: { value: new THREE.Color() },
      uAccent: { value: new THREE.Color() },
      uCavity: { value: new THREE.Color() },
      uOpacity: { value: 1 },
    };
    const applyTheme = () => {
      uniforms.uBase.value.copy(themeColor("--muted", "#888888"));
      uniforms.uAccent.value.copy(themeColor("--accent", "#0a55ff"));
      uniforms.uCavity.value.copy(themeColor("--cavity", "#d9480f"));
    };
    applyTheme();

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));

    const ringMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85 });
    const ringGeometry = new THREE.TorusGeometry(RADIUS * 1.03, 0.007, 8, 160);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    scene.add(group);
    const syncRingColor = () => ringMaterial.color.copy(uniforms.uAccent.value);
    syncRingColor();

    const setSize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(host);

    const themeObserver = new MutationObserver(() => {
      applyTheme();
      syncRingColor();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduced && !compact) window.addEventListener("pointermove", onPointer, { passive: true });

    const place = (time: number, tiltX: number, tiltY: number) => {
      const scan = Math.sin(time * 0.7) * RADIUS * 0.96;
      uniforms.uTime.value = time;
      uniforms.uScan.value = scan;
      const s = Math.sqrt(Math.max(0, 1 - (scan / RADIUS) ** 2));
      ring.position.y = scan;
      ring.scale.set(Math.max(s, 0.02), Math.max(s, 0.02), 1);
      group.rotation.y = time * 0.12 + tiltX;
      group.rotation.x = tiltY;
      renderer.render(scene, camera);
    };

    let frame = 0;
    let visible = true;
    const startedAt = performance.now();
    let tiltX = 0;
    let tiltY = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      tiltX += (pointer.x * 0.35 - tiltX) * 0.04;
      tiltY += (pointer.y * 0.18 - tiltY) * 0.04;
      place((performance.now() - startedAt) / 1000, tiltX, tiltY);
    };

    let io: IntersectionObserver | undefined;
    if (reduced) {
      place(1.2, 0.3, 0.1); // a single still frame
    } else {
      loop();
      io = new IntersectionObserver(([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visible) loop();
        if (!nowVisible && visible) cancelAnimationFrame(frame);
        visible = nowVisible;
      });
      io.observe(host);
    }

    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [compact]);

  return <div ref={hostRef} className={className} aria-hidden />;
}

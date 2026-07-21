"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

function MobileMenuButton({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (s: boolean | ((s: boolean) => boolean)) => void; }) {
  return (
    <button
      onClick={() => setMobileOpen((s: boolean) => !s)}
      aria-expanded={mobileOpen}
      aria-label="Toggle menu"
      className="inline-flex items-center justify-center p-2 rounded-md text-[#cbd5e1] hover:bg-white/5"
    >
      {mobileOpen ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </button>
  );
}

function MobileNav({ mobileOpen, setMobileOpen, scrolled }: { mobileOpen: boolean; setMobileOpen: (s: boolean | ((s: boolean) => boolean)) => void; scrolled: boolean; }) {
  if (!mobileOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="fixed top-[68px] left-0 right-0 z-40 bg-[#050508] border-t border-white/6 shadow-lg md:hidden"
      style={{ backdropFilter: scrolled ? "blur(18px)" : undefined }}
    >
      <div className="px-4 py-4 space-y-3">
        <a href="#features" onClick={() => setMobileOpen(false)} className="block text-lg text-[#cbd5e1]">Features</a>
        <a href="#about" onClick={() => setMobileOpen(false)} className="block text-lg text-[#cbd5e1]">About Us</a>
        <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-lg text-[#cbd5e1]">Sign In</Link>
        <Link href="/signup" onClick={() => setMobileOpen(false)} className="block">
          <span className="inline-block bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white px-4 py-2 rounded-lg font-semibold">Sign Up Free</span>
        </Link>
      </div>
    </motion.div>
  );
}


export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const [mobileOpen, setMobileOpen] = useState(false);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 3;

    // Globe
    const globeGeo = new THREE.BufferGeometry();
    const count = 4000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = Math.cos(phi);
    }
    globeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const globe = new THREE.Points(globeGeo, new THREE.PointsMaterial({ color: 0x8b5cf6, size: 0.012, transparent: true, opacity: 0.9 }));
    scene.add(globe);

    // Rings
    [
      { r: 1.5, color: 0x8b5cf6, opacity: 0.4, rx: Math.PI / 3 },
      { r: 1.8, color: 0x3b82f6, opacity: 0.2, rx: Math.PI / 5 },
      { r: 2.1, color: 0x6366f1, opacity: 0.15, rx: Math.PI / 7 },
    ].forEach(({ r, color, opacity, rx }) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.003, 16, 200),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
      );
      ring.rotation.x = rx;
      scene.add(ring);
    });

    // BG particles
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(800 * 3);
    for (let i = 0; i < 800 * 3; i++) bgPos[i] = (Math.random() - 0.5) * 25;
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgParticles = new THREE.Points(bgGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.015, transparent: true, opacity: 0.15 }));
    scene.add(bgParticles);

    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    });

    let frameId: number;
    const rings: THREE.Mesh[] = [];
    scene.children.forEach((c) => {
      if (c instanceof THREE.Mesh) rings.push(c);
    });


    const animate = () => {
      frameId = requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      globe.rotation.x += mouseY * 0.01;
      globe.rotation.y += mouseX * 0.01;
      rings.forEach((r, i) => { r.rotation.z += 0.002 * (i % 2 === 0 ? 1 : -1); });
      bgParticles.rotation.y += 0.0001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener("resize", handleResize); renderer.dispose(); };
  }, []);

  const features = [
    {
      title: "Vulnerabilities",
      desc: "Find the real reasons products fail (negative points, friction, and weak claims) before you sell them.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 30, height: 30 }}>
          <path d="M12 6.5c-3.31 0-6 2.69-6 6v2c0 3.31 2.69 6 6 6s6-2.69 6-6v-2c0-3.31-2.69-6-6-6Z" />
          <path d="M8.5 11.5h7" strokeLinecap="round" />
          <path d="M12 9v5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Ad Angles",
      desc: (
        <>
          <span>Supplier‑ready specs, prioritized for quick fixes.</span>
          <br />
          <span>Fix issues fast — launch with confidence.</span>
        </>
      ),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 30, height: 30 }}>
          <path d="M7 17l10-10" strokeLinecap="round" />
          <path d="M7 7h6" strokeLinecap="round" />
          <path d="M17 17v-6" strokeLinecap="round" />
          <path d="M15 5h4v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Ad Hooks",
      desc: "Turn vulnerabilities into high‑intent creative angles that increase conversion from day one.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 30, height: 30 }}>
          <path d="M7 12c0-2.76 2.24-5 5-5s5 2.24 5 5v3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12h6" strokeLinecap="round" />
          <path d="M14 19.5v-3.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Scripts",
      desc: "Build high-converting ad scripts and outreach sequences that turn competitor weaknesses into winning copy.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 30, height: 30 }}>
          <path d="M5 5h14v14H5z" />
          <path d="M8.5 8.5h7" strokeLinecap="round" />
          <path d="M8.5 11.5h7" strokeLinecap="round" />
          <path d="M8.5 14.5h4" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-[#050508] min-h-screen text-white overflow-x-hidden px-4 sm:px-8 lg:px-16">
      <canvas ref={canvasRef} className="hidden sm:block fixed top-0 left-0 z-0" />

      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-10" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-16"
        style={{ height: 68, background: scrolled ? "rgba(5,5,8,0.85)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "all 0.3s ease" }}
      >
        <div className="max-w-7xl mx-auto h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ cursor: "pointer" }}>
            <Image src="/logo.png" alt="Caviti Logo" width={20} height={20} className="rounded-full" />
            <span className="text-white font-bold text-xl" style={{ fontSize: 20 }}>caviti</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-[#64748b] hover:text-white transition-colors">Features</a>
            <a href="#about" className="text-[#64748b] hover:text-white transition-colors">About Us</a>
            <Link href="/login" className="text-[#94a3b8] hover:text-white">Sign In</Link>
            <Link href="/signup" className="inline-flex items-center bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white px-4 py-2 rounded-lg font-semibold shadow-md">Sign Up Free</Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <MobileMenuButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          </div>
        </div>
      </nav>

      {/* Mobile nav drawer (rendered at top of page) */}
      <MobileNav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} scrolled={scrolled} />

      {/* Hero */}
      <motion.div style={{ y: heroY }} className="relative z-20 min-h-[65vh] sm:min-h-[75vh] flex flex-col items-center justify-center text-center py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "100px", padding: "6px 18px", marginBottom: "28px", backdropFilter: "blur(10px)" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#93c5fd", fontSize: "13px", fontWeight: 500 }}>AI-Powered Market Intelligence</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontSize: "clamp(32px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-1px", marginBottom: "24px", textTransform: "uppercase" }}>
          FIND WHAT YOUR COMPETITORS’ CUSTOMERS HATE<br />
          <span style={{ display: "inline-block", marginTop: "-4px", background: "linear-gradient(135deg, #60a5fa, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AND TURN IT INTO YOUR NEXT WINNING ANGLE.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="text-[#cbd5e1] text-base sm:text-lg max-w-xl leading-relaxed mb-12">
          Caviti analyzes thousands of customer reviews to uncover hidden product flaws, market opportunities, and ad ideas your competitors are missing.
        </motion.p>

        {/* Hero CTA (single button only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 flex-wrap justify-center mb-14"
        >
          <Link
            href="/signup"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white",
              padding: "18px 44px",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow:
                "0 0 60px rgba(59,130,246,0.35), 0 0 0 1px rgba(59,130,246,0.2)",
              letterSpacing: "-0.2px",
            }}
          >
            Get Started Free →
          </Link>
        </motion.div>
      </motion.div>

      {/* Features */}
      <div id="features" className="relative z-20 max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-white mb-4">
            TURN CUSTOMER PAIN INTO CLEARER GROWTH
          </h2>
          <p className="text-[#cbd5e1] text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            We turn customer frustration into clear next steps: sharper product fixes, stronger positioning, and ad angles that feel relevant from the first impression.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  background: "rgba(15,23,42,0.92)",
                  border: "1px solid rgba(148,163,184,0.24)",
                  borderRadius: "24px",
                  padding: "36px",
                  minHeight: "220px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 24px 80px rgba(15,23,42,0.28)",
                  color: "#f8fafc",
                }}
              >
                <div style={{ width: "56px", height: "56px", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "18px", background: "rgba(255,255,255,0.14)", color: "#2563eb", boxShadow: "0 0 0 1px rgba(59,130,246,0.08), inset 0 0 20px rgba(59,130,246,0.12)" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "10px", letterSpacing: "0.02em", color: "#f8fafc" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.8 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* About Us */}
      <div id="about" style={{ position: "relative", zIndex: 10, maxWidth: "1160px", margin: "0 auto", padding: "0 0 120px" }}>
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.1))",
            border: "1px solid rgba(129,140,248,0.28)",
            borderRadius: "24px",
            padding: "42px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 10px 34px rgba(0,0,0,0.24)",
          }}
        >
          <p style={{ fontSize: "12px", letterSpacing: "0.24em", textTransform: "uppercase", color: "#93c5fd", fontWeight: 800, marginBottom: "12px" }}>
            About Us
          </p>
          <h2 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-1px", marginBottom: "16px" }}>
            We help brands turn customer frustration into clear growth opportunities.
          </h2>
          <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: 1.8, maxWidth: "860px" }}>
            Caviti brings together review intelligence, market signals, and messaging strategy so teams can spot what is breaking trust, refine their story, and launch with sharper hooks that actually resonate.
          </p>
        </motion.div>
      </div>

      {/* Footer (responsive) */}
      <footer className="relative z-10 border-t border-white/6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:justify-between gap-3 py-6 px-4 sm:px-16">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Caviti Logo"
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-white font-bold text-xl" style={{ fontSize: 20 }}>
              caviti
            </span>
          </div>
          <p className="text-sm text-[#94a3b8] text-center">© {new Date().getFullYear()} Caviti.io. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
}

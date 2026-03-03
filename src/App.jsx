import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Component, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import profile from "../data/profile.json";
import projects from "../data/projects.json";

const panelColors = {
  skillsync: "#163b77",
  supetama: "#0f766e",
  activecommunity: "#6b2f89",
  quickstrip: "#8a4f0a",
};

function CameraRig({ selectedProject }) {
  const { camera, pointer, clock } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 1, -2.5));

  useFrame(() => {
    const t = clock.getElapsedTime();
    const basePos = new THREE.Vector3(
      Math.sin(t * 0.2) * 0.14 + pointer.x * 0.15,
      1.3 + Math.cos(t * 0.16) * 0.06 + pointer.y * 0.1,
      4.8
    );

    const selectedPos = selectedProject
      ? new THREE.Vector3(
          selectedProject.scene.position[0] * 0.12,
          selectedProject.scene.position[1] + 0.04,
          selectedProject.scene.position[2] + 2.05
        )
      : basePos;

    const targetLook = selectedProject
      ? new THREE.Vector3(...selectedProject.scene.position)
      : new THREE.Vector3(0, 1, -2.5);

    camera.position.lerp(selectedPos, 0.06);
    lookAt.current.lerp(targetLook, 0.08);
    camera.lookAt(lookAt.current);
  });

  return null;
}

function ProjectPanel({ project, selected, onSelect }) {
  const meshRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [x, y, z] = project.scene.position;
  const [rx, ry, rz] = project.scene.rotation;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const lift = Math.sin(clock.getElapsedTime() * 1.1 + x) * 0.04;
    meshRef.current.position.y = lift;
    const target = hovered || selected ? project.scene.scale * 1.08 : project.scene.scale;
    const current = meshRef.current.scale.x;
    const next = THREE.MathUtils.lerp(current, target, 0.12);
    meshRef.current.scale.set(next, next, next);
  });

  return (
    <group position={[x, y, z]} rotation={[rx, ry, rz]}>
      <mesh
        ref={meshRef}
        onClick={() => onSelect(project.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.6, 1, 0.12]} />
        <meshStandardMaterial
          color={panelColors[project.id] || "#1f3d7a"}
          metalness={0.3}
          roughness={0.5}
          emissive={hovered || selected ? panelColors[project.id] || "#1f3d7a" : "#03060d"}
          emissiveIntensity={hovered || selected ? 0.3 : 0.05}
        />
      </mesh>
    </group>
  );
}

function Scene({ selectedId, onSelect }) {
  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 50 }}
      dpr={[1, 1.8]}
      style={{ width: "100vw", height: "100vh", display: "block" }}
      fallback={<div className="webgl-fallback">3D view unavailable on this device.</div>}
    >
      <color attach="background" args={["#040508"]} />
      <fog attach="fog" args={["#040508", 4, 11]} />
      <ambientLight intensity={0.46} />
      <directionalLight intensity={1.1} position={[2.8, 4.2, 2]} color="#f3f7ff" />
      <pointLight intensity={0.45} position={[-3, 2, 0]} color="#7dd3fc" />
      <pointLight intensity={0.32} position={[3, 1.5, -1]} color="#fca5a5" />

      <mesh position={[0, -1.1, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial color="#070b14" roughness={0.95} metalness={0.08} />
      </mesh>

      {projects.map((project) => (
        <ProjectPanel
          key={project.id}
          project={project}
          selected={selectedId === project.id}
          onSelect={onSelect}
        />
      ))}

      <CameraRig selectedProject={selectedProject} />
    </Canvas>
  );
}

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return <div className="webgl-fallback">3D scene failed to load. UI is still available below.</div>;
    }

    return this.props.children;
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export default function App() {
  const [selectedId, setSelectedId] = useState("supetama");
  const selected = projects.find((project) => project.id === selectedId) || projects[0];
  const experiencePoints = profile?.experience?.points || [];
  const volunteeringPoints = profile?.volunteering?.points || [];
  const phoneHref = (profile?.phone || "").replace(/\s+/g, "");
  const modulePreview = profile?.education?.modules || [];
  const webglEnabled = useMemo(() => supportsWebGL(), []);
  const experienceHeading = [profile?.experience?.title, profile?.experience?.org].filter(Boolean).join(" - ");
  const volunteeringHeading = [profile?.volunteering?.title, profile?.volunteering?.org].filter(Boolean).join(" - ");
  const educationHeading = [profile?.education?.degree, profile?.education?.institution].filter(Boolean).join(" - ");
  const selectedDetails = selected?.highlights || selected?.bullets || [];

  return (
    <main className="app-shell">
      <div className="canvas-container">
        {webglEnabled ? (
          <SceneErrorBoundary>
            <Scene selectedId={selectedId} onSelect={setSelectedId} />
          </SceneErrorBoundary>
        ) : (
          <div className="webgl-fallback">WebGL is disabled. Showing portfolio content without 3D canvas.</div>
        )}
      </div>
      <div className="bg-vignette" aria-hidden="true" />

      <div className="ui-layer">
        <header className="top-bar">
          <div className="content-wrap top-bar-inner">
            <div className="identity">
              <strong>{profile.name}</strong>
              <span>{profile.headline}</span>
            </div>

            <nav className="nav-links">
              <a href="#projects">Projects</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </header>

        <section className="hero-section" id="home">
          <div className="content-wrap">
            <div className="hero-card">
              <p className="eyebrow">Portfolio</p>
              <h1>{profile.name}</h1>
              <p className="hero-subhead">{profile.headline}</p>
              <p className="hero-intro">{profile.intro}</p>
              <div className="hero-actions">
                <a href="#projects" className="btn btn-primary">
                  {profile.cta.primary}
                </a>
                <a href="/Sami_Ibna_Zia_CV.docx" className="btn btn-secondary" download>
                  {profile.cta.secondary}
                </a>
                <a href={profile.links.github} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  GitHub
                </a>
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block" id="projects">
          <div className="content-wrap">
            <h2 className="section-title">Projects</h2>
            <div className="glass-card selected-project-card">
              <p className="eyebrow">Selected Project</p>
              <h3 className="project-title">{selected?.title || "Project"}</h3>
              <p className="project-desc">{selected?.description || ""}</p>
              <div className="chips">
                {(selected?.tech || []).map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
              {!!selectedDetails.length && (
                <ul className="plain-list">
                  {selectedDetails.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="projects-grid">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`glass-card project-card ${selectedId === project.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(project.id)}
                >
                  <p className="eyebrow">{project.tagline}</p>
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-desc">{project.description}</p>
                  <div className="chips">
                    {project.tech.map((tech) => (
                      <span key={`${project.id}-${tech}`}>{tech}</span>
                    ))}
                  </div>
                  {(project.links?.github || project.links?.live) && (
                    <p className="meta">
                      {project.links?.github ? "GitHub available" : ""}
                      {project.links?.github && project.links?.live ? " | " : ""}
                      {project.links?.live ? "Live demo available" : ""}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block" id="about">
          <div className="content-wrap">
            <h2 className="section-title">About</h2>
            <div className="glass-card">
              <p>{profile.profileSummary}</p>
              <p className="meta">{profile.availability}</p>
              <p className="meta">{profile.sponsorshipNote}</p>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="content-wrap">
            <h2 className="section-title">Experience</h2>
            <div className="glass-card">
              <h3>
                {experienceHeading}
              </h3>
              <p className="meta">{profile?.experience?.dates}</p>
              <ul className="plain-list">
                {experiencePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="content-wrap">
            <h2 className="section-title">Volunteering</h2>
            <div className="glass-card">
              <h3>
                {volunteeringHeading}
              </h3>
              <p className="meta">{profile?.volunteering?.dates}</p>
              <ul className="plain-list">
                {volunteeringPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="content-wrap section-grid">
            <div className="glass-card">
              <h2 className="section-title">Education</h2>
              <h3>
                {educationHeading}
              </h3>
              <p className="meta">{profile?.education?.dates}</p>
              <p className="meta">Modules: {modulePreview.join(", ")}</p>
            </div>

            <div className="glass-card">
              <h2 className="section-title">Training & Languages</h2>
              <div className="two-col">
                <div>
                  <p className="label">Training</p>
                  <ul className="list">
                    {(profile?.training || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="label">Languages</p>
                  <ul className="list">
                    {(profile?.languages || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block" id="contact">
          <div className="content-wrap">
            <h2 className="section-title">Contact</h2>
            <div className="glass-card contact-card">
              <a href={`tel:${phoneHref}`}>{profile.phone}</a>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <a href={profile.links.github} target="_blank" rel="noreferrer">
                github.com/SamiIbna
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
                linkedin.com/in/sami-zia-9b18b22b9/
              </a>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-inner">
            <span>
              &copy; {new Date().getFullYear()} {profile.name}
            </span>
            <div className="footer-links">
              <a href={`mailto:${profile.email}`}>Email</a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href={profile.links.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="/Sami_Ibna_Zia_CV.docx" download>
                CV
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

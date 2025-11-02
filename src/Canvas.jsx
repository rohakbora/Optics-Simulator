import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, MessageSquare, Send } from 'lucide-react';

// ============================================================================
// COMPONENT CONFIGURATIONS
// ============================================================================

const componentsConfig = {
  laser: {
    name: "Laser Source",
    type: "source",
    color: "#ff4444",
    defaultProps: {
      wavelength: 650,
      intensity: 1.0,
      angle: 0,
    },
    adjustable: ["wavelength", "intensity", "angle"],
    ports: [{ id: "output", position: "right", type: "output" }],
  },

  mirror: {
    name: "Plane Mirror",
    type: "mirror",
    color: "#c0c0c0",
    defaultProps: {
      reflectivity: 0.95,
      angle: 45,
      length: 100,
    },
    adjustable: ["reflectivity", "angle", "length"],
    ports: [
      { id: "input", position: "left", type: "input" },
      { id: "output", position: "right", type: "output" }
    ],
  },

  beam_splitter: {
    name: "Beam Splitter",
    type: "beam_splitter",
    color: "#8b5cf6",
    defaultProps: {
      reflectivity: 0.5,
      angle: 0,
    },
    adjustable: ["reflectivity", "angle"],
    ports: [
      { id: "input_left", position: "left", type: "input" },
      { id: "input_bottom", position: "bottom", type: "input" },
      { id: "output_right", position: "right", type: "output" },
      { id: "output_top", position: "top", type: "output" }
    ],
  },

  convex_lens: {
    name: "Convex Lens",
    type: "lens",
    color: "#4a9eff",
    defaultProps: {
      focalLength: 200,
      transparency: 0.95,
      angle: 0,
      diameter: 80,
    },
    adjustable: ["focalLength", "transparency", "angle", "diameter"],
    ports: [],
  },

  concave_lens: {
    name: "Concave Lens",
    type: "lens",
    color: "#ff9a4a",
    defaultProps: {
      focalLength: -200,
      transparency: 0.95,
      angle: 0,
      diameter: 80,
    },
    adjustable: ["focalLength", "transparency", "angle", "diameter"],
    ports: [],
  },

  detector: {
    name: "Light Detector",
    type: "detector",
    color: "#00cc66",
    defaultProps: {
      sensitivity: 1.0,
      size: 40,
    },
    adjustable: ["sensitivity", "size"],
    ports: [],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function wavelengthToColor(wl) {
  if (wl < 450) return "#8b00ff";
  if (wl < 495) return "#0000ff";
  if (wl < 570) return "#00ff00";
  if (wl < 590) return "#ffff00";
  if (wl < 620) return "#ff7f00";
  return "#ff0000";
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

// Vector math
const Vec = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (a, s) => ({ x: a.x * s, y: a.y * s }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  len: (a) => Math.hypot(a.x, a.y),
  normalize: (a) => {
    const l = Vec.len(a) || 1e-9;
    return { x: a.x / l, y: a.y / l };
  },
  rotate: (v, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  },
  perp: (a) => ({ x: -a.y, y: a.x }),
};

// ============================================================================
// INTERSECTION FUNCTIONS
// ============================================================================

function intersectSegment(rayStart, rayDir, segA, segB) {
  const segDir = Vec.sub(segB, segA);
  const segLen = Vec.len(segDir);
  const segNorm = Vec.normalize(segDir);
  
  const toStart = Vec.sub(rayStart, segA);
  const perpDir = Vec.perp(rayDir);
  
  const denom = Vec.dot(segNorm, perpDir);
  if (Math.abs(denom) < 1e-6) return null;
  
  const u = Vec.dot(toStart, perpDir) / denom;
  const perpSeg = Vec.perp(segNorm);
  const t = -Vec.dot(toStart, perpSeg) / Vec.dot(rayDir, perpSeg);
  
  if (t >= 0.1 && u >= 0 && u <= segLen) {
    return {
      dist: t,
      point: Vec.add(rayStart, Vec.mul(rayDir, t)),
      u: u / segLen,
    };
  }
  
  return null;
}

function intersectCircle(rayStart, rayDir, center, radius) {
  const toCenter = Vec.sub(center, rayStart);
  const proj = Vec.dot(toCenter, rayDir);
  
  if (proj < 0) return null;
  
  const closestPoint = Vec.add(rayStart, Vec.mul(rayDir, proj));
  const distToCenter = Vec.len(Vec.sub(center, closestPoint));
  
  if (distToCenter > radius) return null;
  
  const offset = Math.sqrt(radius * radius - distToCenter * distToCenter);
  const dist = proj - offset;
  
  if (dist < 0.1) return null;
  
  return {
    dist,
    point: Vec.add(rayStart, Vec.mul(rayDir, dist)),
  };
}

// ============================================================================
// RAY TRACING ENGINE
// ============================================================================

function traceRays(components, spaceMode, activeConnections, width, height) {
  const rays = [];
  const detectorHits = {};
  
  const sources = components.filter(c => c.type === "source");
  
  sources.forEach(source => {
    const angle = degToRad(source.properties.angle);
    const direction = Vec.normalize({ x: Math.cos(angle), y: Math.sin(angle) });
    const wavelength = source.properties.wavelength;
    const intensity = source.properties.intensity;
    const color = wavelengthToColor(wavelength);
    
    const ray = {
      segments: [],
      color,
      wavelength,
      intensity,
    };
    
    traceRayPath(
      { x: source.x, y: source.y },
      direction,
      intensity,
      wavelength,
      color,
      components.filter(c => c.id !== source.id),
      spaceMode,
      activeConnections,
      ray,
      detectorHits,
      0,
      width,
      height
    );
    
    if (ray.segments.length > 0) {
      rays.push(ray);
    }
  });
  
  return { rays, detectorHits };
}

function traceRayPath(start, direction, intensity, wavelength, color, components, spaceMode, activeConnections, ray, detectorHits, depth, width, height) {
  if (depth > 50 || intensity < 0.01) return;
  
  const maxDist = Math.max(width, height) * 3;
  let closest = { dist: maxDist, component: null, point: null, hitData: null };
  
  // Find closest intersection with any component
  for (const comp of components) {
    let hit = null;
    
    if (comp.type === "mirror") {
      const angle = degToRad(comp.properties.angle);
      const mirrorDir = { x: Math.cos(angle), y: Math.sin(angle) };
      const length = comp.properties.length;
      const halfLen = length / 2;
      
      const A = Vec.add({ x: comp.x, y: comp.y }, Vec.mul(mirrorDir, -halfLen));
      const B = Vec.add({ x: comp.x, y: comp.y }, Vec.mul(mirrorDir, halfLen));
      
      hit = intersectSegment(start, direction, A, B);
      if (hit) {
        const normal = Vec.normalize(Vec.perp(mirrorDir));
        if (Vec.dot(normal, direction) > 0) {
          hit.normal = Vec.mul(normal, -1);
        } else {
          hit.normal = normal;
        }
        hit.type = "mirror";
        hit.component = comp;
      }
    }
    else if (comp.type === "beam_splitter") {
      const angle = degToRad(comp.properties.angle);
      const size = 50;
      const halfSize = size / 2;
      
      const corners = [
        { x: -halfSize, y: -halfSize },
        { x: halfSize, y: -halfSize },
        { x: halfSize, y: halfSize },
        { x: -halfSize, y: halfSize },
      ].map(p => {
        const rotated = Vec.rotate(p, angle);
        return Vec.add(rotated, { x: comp.x, y: comp.y });
      });
      
      const diagHit = intersectSegment(start, direction, corners[1], corners[3]);
      if (diagHit) {
        const diagDir = Vec.normalize(Vec.sub(corners[3], corners[1]));
        const normal = Vec.normalize(Vec.perp(diagDir));
        if (Vec.dot(normal, direction) > 0) {
          diagHit.normal = Vec.mul(normal, -1);
        } else {
          diagHit.normal = normal;
        }
        hit = diagHit;
        hit.type = "beam_splitter";
        hit.component = comp;
      }
    }
    else if (comp.type === "lens") {
      const diameter = comp.properties.diameter;
      const angle = degToRad(comp.properties.angle);
      const lensDir = Vec.rotate({ x: 0, y: 1 }, angle);
      const radius = diameter / 2;
      
      const A = Vec.add({ x: comp.x, y: comp.y }, Vec.mul(lensDir, -radius));
      const B = Vec.add({ x: comp.x, y: comp.y }, Vec.mul(lensDir, radius));
      
      hit = intersectSegment(start, direction, A, B);
      if (hit) {
        hit.type = "lens";
        hit.component = comp;
        hit.lensDir = lensDir;
        hit.lensNormal = Vec.normalize(Vec.rotate({ x: 1, y: 0 }, angle));
      }
    }
    else if (comp.type === "detector") {
      const radius = comp.properties.size / 2;
      hit = intersectCircle(start, direction, { x: comp.x, y: comp.y }, radius);
      if (hit) {
        hit.type = "detector";
        hit.component = comp;
      }
    }
    
    if (hit && hit.dist < closest.dist) {
      closest = { dist: hit.dist, component: comp, point: hit.point, hitData: hit };
    }
  }
  
  const endPoint = closest.component ? closest.point : Vec.add(start, Vec.mul(direction, maxDist));
  
  ray.segments.push({
    x1: start.x,
    y1: start.y,
    x2: endPoint.x,
    y2: endPoint.y,
    intensity,
  });
  
  if (!closest.component) return;
  
  const comp = closest.component;
  const hitData = closest.hitData;
  
  if (hitData.type === "detector") {
    const id = comp.id;
    if (!detectorHits[id] || intensity > detectorHits[id].intensity) {
      detectorHits[id] = {
        intensity: intensity * comp.properties.sensitivity,
        wavelength,
        color,
        x: hitData.point.x,
        y: hitData.point.y,
      };
    }
    return;
  }
  
  if (hitData.type === "mirror") {
    if (spaceMode) {
      const portKey = `${comp.id}-output`;
      if (!activeConnections[portKey]) return;
    }
    
    const normal = hitData.normal;
    const reflected = Vec.sub(direction, Vec.mul(normal, 2 * Vec.dot(direction, normal)));
    const newDir = Vec.normalize(reflected);
    const newIntensity = intensity * comp.properties.reflectivity;
    
    const offset = Vec.add(hitData.point, Vec.mul(newDir, 1));
    traceRayPath(offset, newDir, newIntensity, wavelength, color, components, spaceMode, activeConnections, ray, detectorHits, depth + 1, width, height);
    return;
  }
  
  if (hitData.type === "beam_splitter") {
    const reflectivity = comp.properties.reflectivity;
    const normal = hitData.normal;
    
    const shouldReflect = !spaceMode || activeConnections[`${comp.id}-output_top`];
    if (shouldReflect) {
      const reflected = Vec.sub(direction, Vec.mul(normal, 2 * Vec.dot(direction, normal)));
      const reflDir = Vec.normalize(reflected);
      const reflIntensity = intensity * reflectivity;
      
      const offset = Vec.add(hitData.point, Vec.mul(reflDir, 1));
      traceRayPath(offset, reflDir, reflIntensity, wavelength, color, components, spaceMode, activeConnections, ray, detectorHits, depth + 1, width, height);
    }
    
    const shouldTransmit = !spaceMode || activeConnections[`${comp.id}-output_right`];
    if (shouldTransmit) {
      const transIntensity = intensity * (1 - reflectivity);
      const offset = Vec.add(hitData.point, Vec.mul(direction, 1));
      traceRayPath(offset, direction, transIntensity, wavelength, color, components, spaceMode, activeConnections, ray, detectorHits, depth + 1, width, height);
    }
    return;
  }
  
  if (hitData.type === "lens") {
    const focalLength = comp.properties.focalLength;
    const transparency = comp.properties.transparency;
    
    const toLens = Vec.sub(hitData.point, { x: comp.x, y: comp.y });
    const perpDist = Vec.dot(toLens, hitData.lensDir);
    
    const deflectionAmount = -perpDist / focalLength;
    const deflectionVector = Vec.mul(hitData.lensDir, deflectionAmount);
    
    const newDir = Vec.normalize(Vec.add(direction, deflectionVector));
    const newIntensity = intensity * transparency;
    
    const offset = Vec.add(hitData.point, Vec.mul(newDir, 1));
    traceRayPath(offset, newDir, newIntensity, wavelength, color, components, spaceMode, activeConnections, ray, detectorHits, depth + 1, width, height);
    return;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OpticalDesigner() {
  const [components, setComponents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draggingType, setDraggingType] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [rays, setRays] = useState([]);
  const [detectorHits, setDetectorHits] = useState({});
  
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1000, h: 700 });
  
  const GRID_SIZE = 40;
  
  const [llmInput, setLlmInput] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [showLlmChat, setShowLlmChat] = useState(false);
  
  useEffect(() => {
    function updateSize() {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  
  useEffect(() => {
    const result = traceRays(components, false, {}, canvasSize.w, canvasSize.h);
    setRays(result.rays);
    setDetectorHits(result.detectorHits);
  }, [components, canvasSize]);
  
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggingType) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);
    
    const cfg = componentsConfig[draggingType];
    if (!cfg) return;
    
    setComponents(prev => [
      ...prev,
      {
        id: Date.now(),
        componentType: draggingType,
        type: cfg.type,
        x,
        y,
        properties: { ...cfg.defaultProps },
      },
    ]);
    setDraggingType(null);
  };
  
  const handleComponentLibraryClick = (key) => {
    const cfg = componentsConfig[key];
    if (!cfg) return;
    
    // Spawn component at a default position (center of canvas)
    const x = snapToGrid(canvasSize.w / 2);
    const y = snapToGrid(canvasSize.h / 2);
    
    setComponents(prev => [
      ...prev,
      {
        id: Date.now(),
        componentType: key,
        type: cfg.type,
        x,
        y,
        properties: { ...cfg.defaultProps },
      },
    ]);
  };
  
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const comp = components.find(c => c.id === id);
    setDragItem({
      id,
      offsetX: e.clientX - (rect.left + comp.x),
      offsetY: e.clientY - (rect.top + comp.y),
    });
    setSelectedId(id);
  };
  
  const handleMouseMove = (e) => {
    if (!dragItem) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragItem.offsetX;
    const newY = e.clientY - rect.top - dragItem.offsetY;
    setComponents(prev =>
      prev.map(c => (c.id === dragItem.id ? { ...c, x: newX, y: newY } : c))
    );
  };
  
  const handleMouseUp = () => setDragItem(null);
  
  const updateProperty = (prop, value) => {
    setComponents(prev =>
      prev.map(c =>
        c.id === selectedId
          ? { ...c, properties: { ...c.properties, [prop]: parseFloat(value) } }
          : c
      )
    );
  };
  
  const deleteSelected = () => {
    setComponents(prev => prev.filter(c => c.id !== selectedId));
    setSelectedId(null);
  };
  
  const exportJSON = () => {
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      components: components.map(c => ({
        id: c.id,
        type: c.componentType,
        position: { x: Math.round(c.x), y: Math.round(c.y) },
        properties: c.properties,
      })),
      detectorReadings: Object.entries(detectorHits).map(([id, data]) => ({
        detectorId: parseInt(id),
        intensity: data.intensity,
        wavelength: data.wavelength,
      })),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optical-setup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const clearAll = () => {
    setComponents([]);
    setSelectedId(null);
    setRays([]);
    setDetectorHits({});
  };
  
  const handleLlmRequest = async () => {
    if (!llmInput.trim()) return;
    
    setLlmLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://optics-simulator-bice.vercel.app:5000";
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: llmInput }),
      });
      
      const data = await response.json();
      
      if (data.components) {
        // Clear existing components and load new ones from LLM
        setComponents(data.components.map(comp => ({
          id: comp.id,
          componentType: comp.type,
          type: componentsConfig[comp.type]?.type || comp.type,
          x: comp.position.x,
          y: comp.position.y,
          properties: comp.properties,
        })));
      }
    } catch (error) {
      console.error("LLM request failed:", error);
      alert("Failed to connect to backend. Make sure the Python server is running.");
    } finally {
      setLlmLoading(false);
    }
  };
  
  const renderComponent = (comp) => {
    const cfg = componentsConfig[comp.componentType];
    const isSelected = comp.id === selectedId;
    const isDetectorActive = !!detectorHits[comp.id];
    
    if (comp.type === "mirror") {
      const length = comp.properties.length;
      const angle = comp.properties.angle;
      return (
        <div key={comp.id}>
          <div
            onMouseDown={(e) => handleMouseDown(e, comp.id)}
            style={{
              position: "absolute",
              left: comp.x,
              top: comp.y,
              width: length,
              height: 8,
              backgroundColor: cfg.color,
              border: isSelected ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.1)",
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: "center",
              cursor: "grab",
              zIndex: 5,
            }}
          />
        </div>
      );
    }
    
    if (comp.type === "beam_splitter") {
      const angle = comp.properties.angle;
      return (
        <div key={comp.id}>
          <div
            onMouseDown={(e) => handleMouseDown(e, comp.id)}
            style={{
              position: "absolute",
              left: comp.x - 25,
              top: comp.y - 25,
              width: 50,
              height: 50,
              backgroundColor: cfg.color,
              border: isSelected ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.1)",
              transform: `rotate(${angle}deg)`,
              cursor: "grab",
              zIndex: 5,
              opacity: 0.7,
            }}
          />
        </div>
      );
    }
    
    if (comp.type === "lens") {
      const diameter = comp.properties.diameter;
      const focalLength = comp.properties.focalLength;
      const angle = comp.properties.angle;
      const isConvex = focalLength > 0;
      
      return (
        <div key={comp.id}>
          <svg
            onMouseDown={(e) => handleMouseDown(e, comp.id)}
            style={{
              position: "absolute",
              left: comp.x - diameter / 2,
              top: comp.y - diameter / 2,
              width: diameter,
              height: diameter,
              cursor: "grab",
              zIndex: 5,
              transform: `rotate(${angle}deg)`,
            }}
          >
            {isConvex ? (
              <path
                d={`M ${diameter * 0.2} 0 Q ${diameter * 0.1} ${diameter * 0.5} ${diameter * 0.2} ${diameter} L ${diameter * 0.8} ${diameter} Q ${diameter * 0.9} ${diameter * 0.5} ${diameter * 0.8} 0 Z`}
                fill={cfg.color}
                fillOpacity={0.3}
                stroke={isSelected ? "#3b82f6" : cfg.color}
                strokeWidth={isSelected ? 3 : 2}
              />
            ) : (
              <path
                d={`M ${diameter * 0.2} 0 Q ${diameter * 0.3} ${diameter * 0.5} ${diameter * 0.2} ${diameter} L ${diameter * 0.8} ${diameter} Q ${diameter * 0.7} ${diameter * 0.5} ${diameter * 0.8} 0 Z`}
                fill={cfg.color}
                fillOpacity={0.3}
                stroke={isSelected ? "#3b82f6" : cfg.color}
                strokeWidth={isSelected ? 3 : 2}
              />
            )}
          </svg>
        </div>
      );
    }
    
    return (
      <div key={comp.id}>
        <div
          onMouseDown={(e) => handleMouseDown(e, comp.id)}
          style={{
            position: "absolute",
            left: comp.x - 25,
            top: comp.y - 25,
            width: 50,
            height: 50,
            backgroundColor: isDetectorActive ? detectorHits[comp.id].color : cfg.color,
            border: isSelected ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            cursor: "grab",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: comp.type === "source" ? `rotate(${comp.properties.angle || 0}deg)` : undefined,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: "700", color: "white", textAlign: "center" }}>
            {comp.componentType.split("_").map(s => s[0].toUpperCase()).join("")}
          </div>
        </div>
      </div>
    );
  };
  
  const selectedComponent = components.find(c => c.id === selectedId);
  const selectedConfig = selectedComponent ? componentsConfig[selectedComponent.componentType] : null;
  
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <div className="w-72 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Component Library</h2>
        <div className="text-xs text-gray-400 mb-3">Click to spawn or drag to place precisely</div>
        <div className="space-y-3">
          {Object.entries(componentsConfig).map(([key, cfg]) => (
            <div
              key={key}
              draggable
              onDragStart={() => setDraggingType(key)}
              onClick={() => handleComponentLibraryClick(key)}
              className="bg-gray-700 p-3 rounded cursor-grab hover:bg-gray-600 transition active:cursor-grabbing"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: cfg.color }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{cfg.name}</div>
                  <div className="text-xs text-gray-400">{cfg.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-2">
          <button
            onClick={() => setShowLlmChat(!showLlmChat)}
            className="w-full bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded font-semibold flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} />
            AI Assistant
          </button>
          
          {showLlmChat && (
            <div className="bg-gray-700 p-3 rounded space-y-2">
              <textarea
                value={llmInput}
                onChange={(e) => setLlmInput(e.target.value)}
                placeholder="Describe the optical setup you want..."
                className="w-full bg-gray-800 text-white p-2 rounded text-sm resize-none"
                rows={4}
                disabled={llmLoading}
              />
              <button
                onClick={handleLlmRequest}
                disabled={llmLoading || !llmInput.trim()}
                className="w-full bg-green-600 hover:bg-green-700 py-2 px-3 rounded font-semibold flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
              >
                <Send size={14} />
                {llmLoading ? "Generating..." : "Generate Setup"}
              </button>
            </div>
          )}
          
          <button
            onClick={exportJSON}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded font-semibold flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Export JSON
          </button>
          
          <button
            onClick={clearAll}
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded font-semibold flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
        
        {Object.keys(detectorHits).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-bold mb-2">Detector Readings</h3>
            {Object.entries(detectorHits).map(([id, data]) => (
              <div key={id} className="text-xs bg-gray-700 p-2 rounded mb-2">
                <div className="font-semibold">Detector #{String(id).slice(-4)}</div>
                <div className="text-green-400">
                  Intensity: {(data.intensity * 100).toFixed(1)}%
                </div>
                <div>Wavelength: {data.wavelength} nm</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-20 bg-gray-800 px-4 py-2 rounded shadow-lg">
          <div className="text-sm">
            <div>Components: {components.length}</div>
            <div>Active Rays: {rays.length}</div>
            <div className="text-green-400">
              Detectors: {Object.keys(detectorHits).length} active
            </div>
          </div>
        </div>
        
        <div
          ref={canvasRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            if (e.target === canvasRef.current || e.target.tagName === 'svg') {
              setSelectedId(null);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full relative"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, #374151 1px, transparent 1px), linear-gradient(to bottom, #374151 1px, transparent 1px)",
            cursor: dragItem ? "grabbing" : "default",
          }}
        >
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ zIndex: 1 }}
          >
            {rays.map((ray, ri) => (
              <g key={ri}>
                {ray.segments.map((seg, si) => (
                  <line
                    key={si}
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke={ray.color}
                    strokeWidth={2}
                    opacity={Math.max(0.4, seg.intensity)}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            ))}
            
            {Object.values(detectorHits).map((hit, i) => (
              <circle
                key={i}
                cx={hit.x}
                cy={hit.y}
                r={8}
                fill={hit.color}
                opacity={0.9}
              >
                <animate
                  attributeName="r"
                  values="6;10;6"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>
          
          {components.map(comp => renderComponent(comp))}
        </div>
      </div>
      
      {selectedId && selectedComponent && selectedConfig && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{selectedConfig.name}</h2>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-2">
              Type: {selectedConfig.type}
            </div>
            
            {selectedConfig.adjustable.map(prop => (
              <div key={prop} className="bg-gray-700 p-3 rounded">
                <label className="block">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold capitalize">
                      {prop.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-sm text-blue-400">
                      {selectedComponent.properties[prop]}
                      {prop === "wavelength" && " nm"}
                      {prop === "angle" && "°"}
                      {prop === "focalLength" && " px"}
                      {prop === "length" && " px"}
                      {prop === "diameter" && " px"}
                      {prop === "size" && " px"}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min={
                      prop === "angle"
                        ? 0
                        : prop === "wavelength"
                        ? 380
                        : prop === "focalLength"
                        ? -500
                        : prop === "length" || prop === "diameter" || prop === "size"
                        ? 20
                        : 0
                    }
                    max={
                      prop === "angle"
                        ? 360
                        : prop === "wavelength"
                        ? 750
                        : prop === "focalLength"
                        ? 500
                        : prop === "length"
                        ? 200
                        : prop === "diameter" || prop === "size"
                        ? 150
                        : prop === "reflectivity" ||
                          prop === "intensity" ||
                          prop === "transparency" ||
                          prop === "sensitivity"
                        ? 1
                        : 100
                    }
                    step={
                      prop === "angle"
                        ? 1
                        : prop === "wavelength"
                        ? 5
                        : prop === "reflectivity" ||
                          prop === "intensity" ||
                          prop === "transparency" ||
                          prop === "sensitivity"
                        ? 0.01
                        : prop === "focalLength"
                        ? 10
                        : 1
                    }
                    value={selectedComponent.properties[prop] ?? 0}
                    onChange={(e) => updateProperty(prop, e.target.value)}
                    className="w-full"
                  />
                </label>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-700 text-sm">
              <div className="font-semibold mb-2">Position</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-xs text-gray-400">X</div>
                  <div>{Math.round(selectedComponent.x)} px</div>
                </div>
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-xs text-gray-400">Y</div>
                  <div>{Math.round(selectedComponent.y)} px</div>
                </div>
              </div>
            </div>
            
            {detectorHits[selectedId] && (
              <div className="pt-4 border-t border-gray-700 bg-green-900 p-3 rounded">
                <div className="text-sm font-bold text-green-300 mb-2">
                  ✓ LIGHT DETECTED
                </div>
                <div className="text-xs">
                  <div>
                    Intensity: {(detectorHits[selectedId].intensity * 100).toFixed(1)}%
                  </div>
                  <div>Wavelength: {detectorHits[selectedId].wavelength} nm</div>
                </div>
              </div>
            )}
            
            <button
              onClick={deleteSelected}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 py-2 px-4 rounded font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Component
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
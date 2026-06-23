import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Video, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Layers, 
  Film, 
  Camera, 
  Check, 
  Image, 
  Cpu, 
  Tv, 
  Zap, 
  Activity,
  Sun,
  Moon,
  Trash2,
  AlertCircle,
  Undo,
  Redo
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { BrandKit, GenerationResult } from '../types';

interface CgiStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: any) => void;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
  isLocked?: boolean;
}

interface CgiPreset {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  prompt: string;
  lighting: string;
  camera: string;
  particles: string;
}

const CGI_PRESETS: CgiPreset[] = [
  {
    id: 'molten_gold',
    name: 'Molten Gold Vortex',
    emoji: '✨',
    desc: 'Swirling liquid gold flows that dynamically wrap around the product in zero gravity.',
    prompt: 'Fluid molten liquid gold vortex, swirling streams of mercury glass, high-end liquid metallics simulating zero gravity, extremely smooth reflective fluid dynamics, dark polished marble environment, rays of directional golden light.',
    lighting: 'Warm Golden Hour (3200K)',
    camera: 'Slow Orbital Dolly',
    particles: 'High Density (800k)'
  },
  {
    id: 'cyber_mesh',
    name: 'Holographic Cyber-Mesh',
    emoji: '🌐',
    desc: 'Luminous wireframe grids and cyan glowing nodes mapping the product surfaces.',
    prompt: 'Luminous holographic blue-green grid lines, scanning laser pass, cybernetic particle constellations forming a futuristic outer shell product mask, dark reflective obsidian pedestal, glowing light lines tracing the edges.',
    lighting: 'Cold Neon Blue (12000K)',
    camera: 'Macro Zoom & Reveal',
    particles: 'Extreme Grid (1.5M)'
  },
  {
    id: 'kinetic_shards',
    name: 'Floating Gravity Shards',
    emoji: '💎',
    desc: 'Shattered obsidian glass and floating crystalline fragments rotating in orbit.',
    prompt: 'Hovering dark obsidian diamond shards, emerald crystalline floating rocks, slow cosmic rotation, zero-gravity levitation, dramatic subsurface scattering, rich ambient dust motes backlit by volumetric spotlight beams.',
    lighting: 'Moody Chiaroscuro Noir',
    camera: 'Cinematic 3-Axis Pan',
    particles: 'Medium Debris (400k)'
  },
  {
    id: 'ink_splash',
    name: 'Fluid Ink Symphony',
    emoji: '🎨',
    desc: 'Ethereal ribbons of colored silk smoke and fluid dark ink plumes blooming.',
    prompt: 'Slo-motion ink-in-water bloom, plumes of emerald green and pure white velvet paint ribbons colliding, gaseous velvet dust plumes, ethereal cloud formations surrounding the core under beautiful studio photography key lit background.',
    lighting: 'Diffused Softbox (5600K)',
    camera: 'Ultra Slo-Mo Roll',
    particles: 'Volumetric Mist (1.2M)'
  },
  {
    id: 'chrono_speed',
    name: 'Hyper-Speed Chrono Trails',
    emoji: '⚡',
    desc: 'Long exposure neon kinetic light streaks wrapping around the rotating product.',
    prompt: 'Vibrant luminescent laser trace lines, neon copper and gold kinetic light streaks, hyper-speed anamorphic lens flares, rotating high-fashion stage, volumetric light beams slicing through heavy premium atmosphere.',
    lighting: 'Hyper-Real Anamorphic',
    camera: 'Fast Spiral Tracking',
    particles: 'Streak Lines (500k)'
  }
];

export interface CgiHistoryState {
  reflectivity: number;
  roughness: number;
  metallic: number;
  transparency: number;
  refractionIndex: number;
  subsurfaceScattering: number;
  materialPreset: string;
  cameraMotion: string;
  lightingPreset: string;
  lightAngle: number;
}

export const CgiStudio: React.FC<CgiStudioProps> = ({
  brandKit,
  addToHistory,
  userCredits,
  onInsufficientCredits,
  onError,
  isLocked = false
}) => {
  // Inputs
  const [cgiIdea, setCgiIdea] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('molten_gold');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Simulation Engines Settings
  const [raytraceTier, setRaytraceTier] = useState<'path_traced' | 'hybrid' | 'raster'>('path_traced');
  const [particleDensity, setParticleDensity] = useState<'low' | 'medium' | 'extreme'>('medium');
  const [atmosphere, setAtmosphere] = useState<'none' | 'mist' | 'dust' | 'neon'>('mist');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [cameraMotion, setCameraMotion] = useState<string>('Slow Orbital Dolly');
  const [lightingPreset, setLightingPreset] = useState<string>('Warm Golden Hour (3200K)');
  const [filmGrain, setFilmGrain] = useState<number>(15); // %
  const [bloomIntensity, setBloomIntensity] = useState<number>(40); // %

  // Material Physics Shader States
  const [reflectivity, setReflectivity] = useState<number>(85);
  const [roughness, setRoughness] = useState<number>(12);
  const [metallic, setMetallic] = useState<number>(90);
  const [transparency, setTransparency] = useState<number>(0);
  const [refractionIndex, setRefractionIndex] = useState<number>(1.5);
  const [subsurfaceScattering, setSubsurfaceScattering] = useState<number>(10);
  const [materialPreset, setMaterialPreset] = useState<string>('gold_foil');
  const [showMaterialOverlay, setShowMaterialOverlay] = useState<boolean>(false);

  // Generation status states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);

  const [isQuickTracing, setIsQuickTracing] = useState<boolean>(false);
  const [lightAngle, setLightAngle] = useState<number>(45);

  // Playback control states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [selectedStage, setSelectedStage] = useState<'preview' | 'previs' | 'render'>('preview');

  // History Manager states
  const [historyStack, setHistoryStack] = useState<CgiHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [historyActionNames, setHistoryActionNames] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  // Initialize history on mount with default settings
  useEffect(() => {
    if (isInitialMount.current) {
      const initialState: CgiHistoryState = {
        reflectivity: 85,
        roughness: 12,
        metallic: 90,
        transparency: 0,
        refractionIndex: 1.5,
        subsurfaceScattering: 10,
        materialPreset: 'gold_foil',
        cameraMotion: 'Slow Orbital Dolly',
        lightingPreset: 'Warm Golden Hour (3200K)',
        lightAngle: 45
      };
      setHistoryStack([initialState]);
      setHistoryIndex(0);
      setHistoryActionNames(['Initial Scene Setup']);
      isInitialMount.current = false;
    }
  }, []);

  const recordAction = (
    actionName: string, 
    customState?: Partial<CgiHistoryState>
  ) => {
    const newState: CgiHistoryState = {
      reflectivity: customState && 'reflectivity' in customState ? customState.reflectivity! : reflectivity,
      roughness: customState && 'roughness' in customState ? customState.roughness! : roughness,
      metallic: customState && 'metallic' in customState ? customState.metallic! : metallic,
      transparency: customState && 'transparency' in customState ? customState.transparency! : transparency,
      refractionIndex: customState && 'refractionIndex' in customState ? customState.refractionIndex! : refractionIndex,
      subsurfaceScattering: customState && 'subsurfaceScattering' in customState ? customState.subsurfaceScattering! : subsurfaceScattering,
      materialPreset: customState && 'materialPreset' in customState ? customState.materialPreset! : materialPreset,
      cameraMotion: customState && 'cameraMotion' in customState ? customState.cameraMotion! : cameraMotion,
      lightingPreset: customState && 'lightingPreset' in customState ? customState.lightingPreset! : lightingPreset,
      lightAngle: customState && 'lightAngle' in customState ? customState.lightAngle! : lightAngle,
    };

    const trimmedStack = historyStack.slice(0, historyIndex + 1);
    const trimmedNames = historyActionNames.slice(0, historyIndex + 1);

    // Prevent identical states from bloating timeline
    const lastState = trimmedStack[trimmedStack.length - 1];
    if (lastState) {
      const isIdentical = 
        lastState.reflectivity === newState.reflectivity &&
        lastState.roughness === newState.roughness &&
        lastState.metallic === newState.metallic &&
        lastState.transparency === newState.transparency &&
        lastState.refractionIndex === newState.refractionIndex &&
        lastState.subsurfaceScattering === newState.subsurfaceScattering &&
        lastState.materialPreset === newState.materialPreset &&
        lastState.cameraMotion === newState.cameraMotion &&
        lastState.lightingPreset === newState.lightingPreset &&
        lastState.lightAngle === newState.lightAngle;
      
      if (isIdentical) return;
    }

    setHistoryStack([...trimmedStack, newState]);
    setHistoryActionNames([...trimmedNames, actionName]);
    setHistoryIndex(trimmedStack.length);
    addSimulatedLog(`[History] Action recorded: ${actionName}`);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetState = historyStack[prevIndex];
      setHistoryIndex(prevIndex);
      
      setReflectivity(targetState.reflectivity);
      setRoughness(targetState.roughness);
      setMetallic(targetState.metallic);
      setTransparency(targetState.transparency);
      setRefractionIndex(targetState.refractionIndex);
      setSubsurfaceScattering(targetState.subsurfaceScattering);
      setMaterialPreset(targetState.materialPreset);
      setCameraMotion(targetState.cameraMotion);
      setLightingPreset(targetState.lightingPreset);
      setLightAngle(targetState.lightAngle);

      addSimulatedLog(`[History] UNDO: ${historyActionNames[historyIndex]}`);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = historyStack[nextIndex];
      setHistoryIndex(nextIndex);

      setReflectivity(targetState.reflectivity);
      setRoughness(targetState.roughness);
      setMetallic(targetState.metallic);
      setTransparency(targetState.transparency);
      setRefractionIndex(targetState.refractionIndex);
      setSubsurfaceScattering(targetState.subsurfaceScattering);
      setMaterialPreset(targetState.materialPreset);
      setCameraMotion(targetState.cameraMotion);
      setLightingPreset(targetState.lightingPreset);
      setLightAngle(targetState.lightAngle);

      addSimulatedLog(`[History] REDO: ${historyActionNames[nextIndex]}`);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulatedLogs]);

  // Synchronise selected preset
  useEffect(() => {
    const preset = CGI_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      setCgiIdea(preset.prompt);
      setCameraMotion(preset.camera);
      setLightingPreset(preset.lighting);
    }
  }, [selectedPresetId]);

  // Playback time counter simulation
  useEffect(() => {
    let timer: any;
    if (isPlaying && outputVideoUrl) {
      timer = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= 12) return 0;
          return +(prev + 0.1).toFixed(1);
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, outputVideoUrl]);

  const handleApplyPreset = (preset: CgiPreset) => {
    setSelectedPresetId(preset.id);
    setCgiIdea(preset.prompt);
    setCameraMotion(preset.camera);
    setLightingPreset(preset.lighting);
    recordAction(`Applied Scene Preset: ${preset.name}`, {
      cameraMotion: preset.camera,
      lightingPreset: preset.lighting
    });
  };

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setUploadedVideo(url);
      setUploadedImage(null);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedImage(e.target.result as string);
          setUploadedVideo(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const enhancePromptWithAI = async () => {
    if (!cgiIdea.trim()) return;
    setIsGenerating(true);
    setStatusMsg("Orchestrating professional CGI technical terms...");
    
    try {
      const response = await fetch('/api/health'); // Just to see if backend is up
      // Enhance prompts via general creative patterns
      const enhancementDirectives = [
        "Unbiased volumetric path tracing",
        "Subsurface photon light scattering",
        "8K hyper-detailed texture maps",
        "Cinematic filmic raw grade",
        "Filmed on Arri Alexa LF 35mm lens",
        "Ultra-realistic fluid simulation meshes"
      ];
      
      const enrichedText = `${cgiIdea.trim()}, engineered in ${raytraceTier === 'path_traced' ? 'Unbiased path-traced GI' : 'Hybrid real-time raytracing'}, with ${atmosphere !== 'none' ? `${atmosphere} volumetric scattering` : 'clear air bloom'}, rendering cinematic high-fidelity textures. ${enhancementDirectives.join(', ')}.`;
      
      setCgiIdea(enrichedText);
      addSimulatedLog("✨ AI Enhanced prompt into professional CGI blueprint specifications!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addSimulatedLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulatedLogs(prev => [...prev, `[${timestamp}] ${text}`]);
  };

  const runQuickRenderPreview = async () => {
    if (isGenerating || isQuickTracing) return;
    setIsQuickTracing(true);
    setSelectedStage('preview');
    addSimulatedLog("⚡ [QUICK-TRACE] Initializing rapid shader pre-render pass...");
    addSimulatedLog(`⚡ [QUICK-TRACE] Tracing specular light bouncing (Reflectivity: ${reflectivity}%, Roughness: ${roughness}%)`);
    addSimulatedLog(`⚡ [QUICK-TRACE] Projecting dual key light sources & approximating Screen Space Reflections (SSR)...`);
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    addSimulatedLog(`⚡ [QUICK-TRACE] Raster specular microfacet maps calculated (Metalness: ${metallic}%).`);
    addSimulatedLog("✅ [QUICK-TRACE] Real-time material specular preview compiled successfully inside monitor.");
    setIsQuickTracing(false);
  };

  const dispatchCgiRender = async () => {
    if (isLocked) {
      onInsufficientCredits();
      return;
    }

    setIsGenerating(true);
    setOutputVideoUrl(null);
    setPlaybackTime(0);
    setIsPlaying(false);
    setSimulatedLogs([]);

    addSimulatedLog("🎥 Initiating CGI Raytracing Architecture...");
    addSimulatedLog(`📈 Resolving fluid/physics boundary meshes (Particle Density: ${particleDensity.toUpperCase()})...`);
    addSimulatedLog(`🎨 Applying PBR Shaders: Specular Reflectivity: ${reflectivity}%, Microfacet Roughness: ${roughness}%, Metallic Factor: ${metallic}%, Transparency: ${transparency}%, IoR: ${refractionIndex}, SSS Gain: ${subsurfaceScattering}%`);
    addSimulatedLog(`💡 Tuning professional light preset: ${lightingPreset}...`);
    addSimulatedLog(`🎬 Setting camera trajectory: ${cameraMotion}...`);

    let statusInterval: any;
    try {
      // Setup dynamic logs
      let logIndex = 0;
      const progressLogs = [
        "Binding base meshes onto reference skeleton...",
        "Tracing sub-surface light scattering models (Sub-polygon displacement)...",
        `Configuring PBR BSDF node structure (Metallic: ${metallic/100}, Roughness: ${roughness/100})...`,
        "Calculating fluid boundary equations (solving Navier-Stokes equations)...",
        "Emitting over 1,500,000 volumetric photorealistic dust/spark particles...",
        "Evaluating multi-pass reflection refraction indices...",
        "Applying cinematic bloom and bokeh lens factors...",
        "Neural video compiler synthesizing frames..."
      ];

      statusInterval = setInterval(() => {
        if (logIndex < progressLogs.length) {
          addSimulatedLog(progressLogs[logIndex]);
          logIndex++;
        }
      }, 4000);

      // Craft the ultimate prompt
      const finalCgiPrompt = `
        High-fidelity CGI professional studio grade commercial render. 
        Core setup: ${cgiIdea}. 
        Product material properties: physically based rendering (PBR) shader. specular reflectivity limit ${reflectivity}%, microfacet surface roughness ${roughness}%, metallic metalness factor ${metallic}%, glass transmission transparency ${transparency}%, refract index index ${refractionIndex}, subsurface translucent scattering gain ${subsurfaceScattering}%. Look: ${materialPreset !== 'custom' ? `${materialPreset} material coating` : 'highly realistic custom finish'}.
        Aspect ratio: ${aspectRatio}. 
        Camera Motion style: ${cameraMotion}. 
        Lighting Atmosphere: ${lightingPreset}. 
        Atmospheric density: ${atmosphere !== 'none' ? atmosphere : 'none-clear'}. 
        Raytracing setup: ${raytraceTier === 'path_traced' ? 'Path-traced global illumination' : 'Raytraced reflections'}. 
        Post processing effects: film grain ${filmGrain}%, bloom level ${bloomIntensity}%.
        Absolutely beautiful photorealistic render, flawless materials, premium e-commerce video.
      `;

      setStatusMsg("Simulating physics meshes & tracing light paths...");
      
      const b64Source = uploadedImage || null;
      const videoResultUrl = await GeminiService.generateCgiVideo(
        b64Source,
        finalCgiPrompt,
        aspectRatio,
        resolution,
        (status) => {
          setStatusMsg(status);
          addSimulatedLog(`[Gemini SDK] ${status}`);
        }
      );

      clearInterval(statusInterval);
      setOutputVideoUrl(videoResultUrl);
      addSimulatedLog("✅ CGI Raytracing and mastering complete!");
      addSimulatedLog("⚡ High-quality stream compiled & available at Maison Film Vault.");
      setIsPlaying(true);
      
      // Save item to history
      addToHistory({
        id: "cgi-" + Math.random().toString(36).substr(2, 9),
        type: "video",
        url: videoResultUrl,
        prompt: finalCgiPrompt,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      clearInterval(statusInterval);
      addSimulatedLog("❌ ERROR compiling raytracing render.");
      addSimulatedLog(`Reason: ${err.message || 'Interrupted'}`);
      onError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearUploads = () => {
    setUploadedImage(null);
    setUploadedVideo(null);
    addSimulatedLog("Cleared product and environment reference media.");
  };

  return (
    <div id="cgi-studio-suite" className="space-y-12">
      {/* Editorial Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gold"></span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gold">Cine-Simulation Workspace</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-emerald-950 tracking-tight font-medium">
          Professional Studio-Grade <span className="italic block mt-1 text-gold">CGI Video Suite</span>
        </h2>
        <p className="text-xs md:text-sm text-emerald-950/60 leading-relaxed font-sans">
          Orchestrate epic gravity-defying materials, gorgeous fluid simulations, volumetric light scattering arrays, and 3-axis cinema robotics. Powered by advanced neural rendering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN: Controls & Prompting (Col-Span-5) */}
        <div className="lg:col-span-5 space-y-8 bg-zinc-50 border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
          
          {/* Global Scene History Tool */}
          <div className="bg-white border border-gray-100 p-4.5 rounded-3xl space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-emerald-950 uppercase tracking-wider block leading-tight">
                    Global Scene History
                  </span>
                  <span className="text-[7.5px] font-mono text-gray-400 block leading-none">
                    State {historyIndex + 1} of {historyStack.length}
                  </span>
                </div>
              </div>

              {/* Undo & Redo Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={historyIndex <= 0}
                  onClick={handleUndo}
                  title="Undo last action"
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    historyIndex <= 0
                      ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                      : 'bg-white border-gray-200 text-emerald-950 hover:bg-amber-50 hover:border-amber-200 active:scale-95 shadow-sm'
                  }`}
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={historyIndex >= historyStack.length - 1}
                  onClick={handleRedo}
                  title="Redo next action"
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    historyIndex >= historyStack.length - 1
                      ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                      : 'bg-white border-gray-200 text-emerald-950 hover:bg-amber-50 hover:border-amber-200 active:scale-95 shadow-sm'
                  }`}
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Micro timeline list of actions */}
            {historyStack.length > 0 && (
              <div className="bg-gray-50/50 rounded-2xl p-2 max-h-24 overflow-y-auto space-y-1 border border-gray-100/50 relative z-10 scrollbar-thin">
                {historyActionNames.map((action, idx) => {
                  const isActive = idx === historyIndex;
                  const isPast = idx < historyIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setHistoryIndex(idx);
                        const targetState = historyStack[idx];
                        setReflectivity(targetState.reflectivity);
                        setRoughness(targetState.roughness);
                        setMetallic(targetState.metallic);
                        setTransparency(targetState.transparency);
                        setRefractionIndex(targetState.refractionIndex);
                        setSubsurfaceScattering(targetState.subsurfaceScattering);
                        setMaterialPreset(targetState.materialPreset);
                        setCameraMotion(targetState.cameraMotion);
                        setLightingPreset(targetState.lightingPreset);
                        setLightAngle(targetState.lightAngle);
                        addSimulatedLog(`[History] Restored state to: ${action}`);
                      }}
                      className={`w-full flex items-center justify-between text-left px-2 py-1 text-[8.5px] rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950 text-white font-bold shadow-sm'
                          : isPast
                          ? 'text-gray-600 hover:bg-gray-100/50'
                          : 'text-gray-300 hover:bg-gray-100/30'
                      }`}
                    >
                      <span className="truncate pr-2">
                        {idx === 0 ? '📍 ' : ''}{action}
                      </span>
                      <span className={`font-mono text-[7px] shrink-0 ${isActive ? 'text-gold' : 'text-gray-400'}`}>
                        #{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Reference Material Upload */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] block">
                Reference Model & Product
              </span>
              {(uploadedImage || uploadedVideo) && (
                <button 
                  onClick={clearUploads}
                  className="text-red-600 hover:text-red-700 transition items-center flex gap-1 text-[8px] font-bold uppercase tracking-wider"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 h-44 group ${
                dragActive 
                  ? 'border-gold bg-gold/5' 
                  : 'border-black/10 hover:border-gold/50 bg-white'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden" 
                accept="image/*,video/*"
              />

              {uploadedImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
                  <img src={uploadedImage} alt="Product Source" className="h-full object-contain pointer-events-none rounded-lg" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white text-[9px] font-bold uppercase tracking-widest">
                    Replace Image
                  </div>
                </div>
              ) : uploadedVideo ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
                  <video src={uploadedVideo} className="h-full object-contain rounded-lg" loop muted autoPlay playsInline />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white text-[9px] font-bold uppercase tracking-widest">
                    Replace Video
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-900 flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-950">
                      Upload Product / Scene Reference
                    </p>
                    <p className="text-[8px] text-emerald-950/40 mt-1 font-sans">
                      Drag-and-drop video or photo to lock CGI physics around it
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Material Shading Engine Trigger */}
            <div className="flex justify-between items-center gap-2 mt-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-950/10 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <div>
                  <span className="text-[8.5px] font-bold text-emerald-950 uppercase tracking-wider block">
                    Material Shaders
                  </span>
                  <span className="text-[7px] text-emerald-950/40 block leading-none font-mono">
                    {materialPreset === 'custom' ? `Custom: ${metallic}% Met` : `${materialPreset.replace('_', ' ').toUpperCase()}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialOverlay(true)}
                className="bg-emerald-950 hover:bg-emerald-900 text-white transition-all px-3 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm"
              >
                <Sliders className="w-3 h-3 text-gold" /> Specs & Shaders
              </button>
            </div>
          </div>

          {/* CGI Blueprint Presets */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] block">
              CGI Materialization Presets
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CGI_PRESETS.map((p) => {
                const isActive = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3.5 rounded-2xl flex flex-col items-start gap-1 text-left transition-all border ${
                      isActive 
                        ? 'bg-emerald-950 border-emerald-950 text-white shadow-md' 
                        : 'bg-white border-gray-100 text-black/60 hover:bg-gray-50 hover:border-gold/30'
                    }`}
                  >
                    <span className="text-[15px]">{p.emoji}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider block mt-1">{p.name}</span>
                    <span className={`text-[7.5px] block font-serif leading-tight ${isActive ? 'text-white/60' : 'text-black/30'}`}>
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em]">
                CGI Atmosphere & Prompt Description
              </span>
              <button 
                onClick={enhancePromptWithAI}
                disabled={isGenerating || !cgiIdea.trim()}
                className="text-gold hover:text-emerald-950 transition text-[8.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" /> Enhance Idea with AI
              </button>
            </div>
            
            <textarea
              value={cgiIdea}
              onChange={(e) => setCgiIdea(e.target.value)}
              placeholder="Describe what swirling elements, volumetric fog, lights, or gravity physics patterns should happen..."
              className="w-full bg-white border border-gray-100 rounded-3xl p-5 text-xs outline-none focus:border-gold/40 h-32 leading-relaxed resize-none font-sans text-emerald-950 placeholder-black/20"
            />
          </div>

          {/* Engine Parameters Slider Accordion */}
          <div className="border-t border-gray-100 pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold" />
              <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-[0.3em] block">
                Raytracing & Volume Parameters
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Raytrace Tier */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-mono text-black/40 uppercase block">Raytracing Profile</label>
                <select 
                  value={raytraceTier} 
                  onChange={(e) => setRaytraceTier(e.target.value as any)} 
                  className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest outline-none"
                >
                  <option value="path_traced">💎 Unbiased Path Tracing (High Filmic)</option>
                  <option value="hybrid">💡 Hybrid Raytraced Refraction</option>
                  <option value="raster">⚡ Rasterized Dynamic Shadowing</option>
                </select>
              </div>

              {/* Particle Density */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-mono text-black/40 uppercase block">Material Mesh Density</label>
                <select 
                  value={particleDensity} 
                  onChange={(e) => setParticleDensity(e.target.value as any)} 
                  className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest outline-none"
                >
                  <option value="low">400k Polygons</option>
                  <option value="medium">1.2 Million Polygons</option>
                  <option value="extreme">3.5 Million Polygons (4K Output)</option>
                </select>
              </div>

              {/* Camera Trail Motion */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-mono text-black/40 uppercase block">Camera Path Robotics</label>
                <select 
                  value={cameraMotion} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setCameraMotion(val);
                    recordAction(`Set Camera Path: ${val}`, { cameraMotion: val });
                  }} 
                  className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest outline-none"
                >
                  <option value="Slow Orbital Dolly">Slow Orbital Dolly</option>
                  <option value="Macro Zoom & Reveal">Macro Zoom & Reveal</option>
                  <option value="Ultra Slo-Mo Roll">Ultra Slo-Mo Roll</option>
                  <option value="Cinematic 3-Axis Pan">Cinematic 3-Axis Pan</option>
                  <option value="Fast Spiral Tracking">Fast Spiral Tracking</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-mono text-black/40 uppercase block">Reel Aspect Ratio</label>
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value as any)} 
                  className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest outline-none"
                >
                  <option value="16:9">🎥 Cinema TVC (16:9)</option>
                  <option value="9:16">📱 Vertical Reel (9:16)</option>
                  <option value="1:1">⬜ Feed Square (1:1)</option>
                </select>
              </div>
            </div>

            {/* Atmosphere Sliders */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-mono text-black/40 uppercase">
                  <span>Filmic Lens Grain</span>
                  <span className="text-gold">{filmGrain}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={filmGrain}
                  onChange={(e) => setFilmGrain(Number(e.target.value))}
                  className="w-full accent-gold h-1 bg-white border border-gray-100 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-mono text-black/40 uppercase">
                  <span>Volumetric Glow Bloom</span>
                  <span className="text-gold">{bloomIntensity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={bloomIntensity}
                  onChange={(e) => setBloomIntensity(Number(e.target.value))}
                  className="w-full accent-gold h-1 bg-white border border-gray-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Dual Render Engine Options */}
          <div className="space-y-3 pt-2">
            
            {/* Compile CGI Trigger Trigger btn */}
            <button
              type="button"
              disabled={isGenerating || !cgiIdea.trim()}
              onClick={dispatchCgiRender}
              className={`w-full py-4.5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg transition-all flex items-center justify-center gap-2 ${
                isGenerating || !cgiIdea.trim()
                  ? 'bg-gray-150 text-black/20 cursor-not-allowed shadow-none'
                  : 'bg-emerald-950 text-white hover:bg-emerald-900 hover:scale-[1.01]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-gold" />
                  <span>Simulating Fluid & Rendering...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-gold fill-gold" />
                  <span>Render High-Fidelity CGI Reel</span>
                </>
              )}
            </button>

            {/* Quick Speculative Draft Action */}
            <button
              type="button"
              disabled={isGenerating || isQuickTracing}
              onClick={runQuickRenderPreview}
              className={`w-full py-3 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-none transition-all flex items-center justify-center gap-2 border ${
                isGenerating || isQuickTracing
                  ? 'bg-gray-50 border-gray-150 text-black/20 cursor-not-allowed'
                  : 'bg-white border-gold/40 text-emerald-950 hover:bg-gold/5 hover:border-gold hover:scale-[1.005]'
              }`}
            >
              {isQuickTracing ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-pulse text-gold" />
                  <span>Raster Specular Sweep...</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5 text-gold" />
                  <span>⚡ Quick-Render Spec Preview</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* RIGHT COLUMN: Interactive High-Mastering Monitor & Logs (Col-Span-7) */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Main Visualizer Monitor Plate */}
          <div className="bg-emerald-950 text-white rounded-[2.5rem] p-8 shadow-2xl border border-gold/15 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full filter blur-[100px] pointer-events-none" />

            {/* Monitor Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold">Maison Master Monitor</h3>
                  <p className="text-[7.5px] font-mono text-white/40 uppercase">Aperture Lock F/1.8 • Rec. 7k Frame Stream</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedStage('previs')}
                  className={`text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded transition cursor-pointer ${
                    selectedStage === 'previs' ? 'bg-gold text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Pre-Vis Wire
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStage('preview')}
                  className={`text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded transition cursor-pointer ${
                    selectedStage === 'preview' ? 'bg-gold text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Quick Draft
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStage('render')}
                  className={`text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded transition cursor-pointer ${
                    selectedStage === 'render' ? 'bg-gold text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Final Raytraced
                </button>
              </div>
            </div>

            {/* Simulated Stage Visualizers */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black flex items-center justify-center border border-white/5">
              
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/90 z-20">
                  <Cpu className="w-10 h-10 text-gold animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Raytracing Matrix Orchestration</p>
                    <p className="text-[8px] text-white/50 font-sans">{statusMsg || 'Synthesizing fluid vector meshes...'}</p>
                  </div>
                  <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gold animate-progress-bar rounded-full" />
                  </div>
                </div>
              ) : null}

              {selectedStage === 'preview' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-5 bg-zinc-950 z-10 relative select-none w-full h-full">
                  
                  {/* Subtle technical background details */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                  
                  {/* Sweep-scanner vertical bar overlay when tracing */}
                  {isQuickTracing && (
                    <div className="absolute inset-x-0 h-0.5 bg-gold/80 shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-bounce z-30 pointer-events-none" />
                  )}

                  {/* Shading Engine Status Watermark label */}
                  <div className="w-full flex justify-between items-center relative z-20">
                    <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 text-[7px] font-mono border border-white/5 uppercase rounded flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isQuickTracing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                      <span>{isQuickTracing ? 'RASTER-TRACING SWEEP' : 'ACTIVE REAL-TIME SHADER'}</span>
                    </div>
                    <div className="text-[7px] font-mono text-white/50 uppercase">
                      Passes: 32/32 • Hybrid Path Diffuse
                    </div>
                  </div>

                  {/* Centered Product preview shape with dynamic filters */}
                  <div className="relative w-36 h-36 flex items-center justify-center my-1 z-10">
                    
                    {/* Subsurface scattering (glow underlay) */}
                    <div 
                      className="absolute rounded-full w-32 h-32 blur-2xl transition-all duration-300"
                      style={{
                        background: `rgba(239, 68, 68, ${subsurfaceScattering / 180})`,
                        boxShadow: `0 0 ${subsurfaceScattering * 1.2}px rgba(244, 63, 94, ${subsurfaceScattering / 100})`,
                        transform: 'scale(1.1)'
                      }}
                    />

                    {/* Outer glow aura for Glass refraction */}
                    {transparency > 10 && (
                      <div 
                        className="absolute inset-1.5 rounded-full border border-white/30 backdrop-blur-[3px] pointer-events-none z-10 transition-all duration-300"
                        style={{
                          transform: `scale(${1 + (refractionIndex - 1.5) * 0.15})`
                        }}
                      />
                    )}

                    {/* Main Core Shader mesh container */}
                    <div 
                      className="w-28 h-28 rounded-full relative overflow-hidden transition-all duration-300 shadow-2xl flex items-center justify-center"
                      style={{
                        background: materialPreset === 'gold_foil'
                          ? 'radial-gradient(circle at 35% 35%, #FFFDF5 10%, #D4AF37 38%, #937115 70%, #352600 100%)'
                          : materialPreset === 'liquid_chrome'
                          ? 'radial-gradient(circle at 35% 35%, #FFFFFF 15%, #E5E5E5 40%, #838383 75%, #252525 100%)'
                          : materialPreset === 'frosted_glass'
                          ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.92) 5%, rgba(200,225,245,0.45) 40%, rgba(100,130,155,0.2) 75%, rgba(25,45,60,0.5) 100%)'
                          : materialPreset === 'matte_obsidian'
                          ? 'radial-gradient(circle at 35% 35%, #3F3F46 10%, #18181B 45%, #09090B 85%, #000 100%)'
                          : materialPreset === 'red_ceramic'
                          ? 'radial-gradient(circle at 35% 35%, #FFEBEB 8%, #EF4444 35%, #991B1B 72%, #450A0A 100%)'
                          : materialPreset === 'silicon_velvet'
                          ? 'radial-gradient(circle at 35% 35%, #FDF2F8 5%, #EC4899 42%, #9D174D 78%, #500724 100%)'
                          : `radial-gradient(circle at 35% 35%, #FFF 10%, ${metallic > 50 ? '#d4af37' : '#52525b'} 40%, #18181b 95%)`,
                        
                        opacity: `${1 - (transparency * 0.70) / 100}`,
                        filter: `blur(${roughness / 35}px)`
                      }}
                    >
                      {/* If reference product is uploaded, overlay a translucent silhouette of it */}
                      {uploadedImage && (
                        <img 
                          src={uploadedImage}
                          alt="Product Silhouette Ref"
                          className="absolute inset-0 w-full h-full object-contain p-2 mix-blend-overlay transition-all duration-300 pointer-events-none"
                          style={{
                            filter: `contrast(${100 + metallic / 3}%) brightness(${100 + (reflectivity - roughness) / 4}%)`
                          }}
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Directional shine sweep bar */}
                      <div 
                        className="absolute inset-x-[-100%] h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none select-none"
                        style={{
                          transform: `rotate(${lightAngle}deg) translateY(${-20 + (lightAngle < 90 ? (lightAngle - 45) : (45 - lightAngle)) * 0.5}px)`,
                          opacity: `${(metallic + reflectivity) / 200}`
                        }}
                      />
                    </div>

                    {/* Main Specular Highlight source overlaying the sphere. Responds directly to roughness and lightAngle! */}
                    <div 
                      className="absolute rounded-full bg-white/60 pointer-events-none mix-blend-screen transition-all duration-300"
                      style={{
                        width: `${50 - roughness / 3}px`,
                        height: `${50 - roughness / 3}px`,
                        filter: `blur(${3 + roughness / 8}px)`,
                        opacity: `${reflectivity / 100}`,
                        top: `${42 + Math.sin((lightAngle * Math.PI) / 180) * 16}px`,
                        left: `${42 + Math.cos((lightAngle * Math.PI) / 180) * 16}px`
                      }}
                    />

                  </div>

                  {/* Real-Time Directional Specular Angle Sweep HUD */}
                  <div className="w-full relative z-20">
                    <div className="w-full flex items-center justify-between gap-3 bg-black/45 px-3 py-1.5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-gold" style={{ transform: `rotate(${lightAngle}deg)` }} />
                        <span className="text-[7.5px] font-mono text-white/50 uppercase tracking-wider font-bold">Direct Path Angle</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="180"
                        value={lightAngle}
                        onChange={(e) => setLightAngle(Number(e.target.value))}
                        onMouseUp={() => recordAction('Adjusted Specular Light Angle')}
                        onTouchEnd={() => recordAction('Adjusted Specular Light Angle')}
                        className="w-1/2 accent-gold h-1 bg-white/10 rounded-lg cursor-pointer"
                      />
                      <span className="text-[7.5px] font-mono text-gold leading-none w-10 text-right w-12">{lightAngle}° Sweep</span>
                    </div>
                  </div>

                </div>
              ) : outputVideoUrl ? (
                selectedStage === 'previs' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 relative z-10 w-full h-full">
                    {/* Wireframe previsualization simulation */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="w-full h-full flex flex-col p-8 justify-between relative z-10">
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] font-mono text-gold">[PRE-VIS MODE ACTIVE]</span>
                        <span className="text-[8px] font-mono text-emerald-400">VERTICES: 1,424,902</span>
                      </div>
                      
                      {/* Generant visual placeholder model inside simulation wires */}
                      <div className="w-44 h-44 rounded-full border border-dashed border-gold/40 animate-spin mx-auto flex items-center justify-center opacity-70">
                        <div className="w-24 h-24 rounded-full border border-double border-emerald-400 animate-pulse flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-gold animate-bounce" />
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <span className="text-[8px] font-mono text-white/30">RIG TYPE: KINETIC CAMERA R-80</span>
                        <span className="text-[8px] font-mono text-white/30">STAGE CODE: FLUIDS_L12</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video 
                    ref={videoRef}
                    key={outputVideoUrl}
                    src={outputVideoUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    autoPlay
                    playsInline
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gold border border-white/10">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white">Renderer Standby</h4>
                    <p className="text-[8.5px] text-white/40 font-mono mt-1">Configure physical presets & press Render to synthesize</p>
                  </div>
                </div>
              )}

              {/* Floating watermark specifications overlay */}
              {outputVideoUrl && (
                <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[7px] font-mono text-gold uppercase tracking-wider space-y-0.5">
                  <p>VEO 3.1 • {resolution.toUpperCase()}</p>
                  <p className="text-white/60">FPS: 60FPS • PATH-TRACED</p>
                </div>
              )}
            </div>

            {/* Playback Controls & Timeline Metre */}
            {outputVideoUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-gold text-emerald-950 flex items-center justify-center hover:scale-105 active:scale-95 transition"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-emerald-950" /> : <Play className="w-4 h-4 fill-emerald-950" />}
                  </button>

                  <div className="flex-grow space-y-1">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gold transition-all duration-100 rounded-full"
                        style={{ width: `${(playbackTime / 12) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[7.5px] font-mono text-white/40">
                      <span>{playbackTime}s</span>
                      <span>12.0s Sequence Master</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPlaybackTime(0);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                    }}
                    className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 flex items-center justify-center text-white/60 hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* REAL TIME CONSOLE SYSTEM LOGS */}
          <div className="bg-black text-emerald-400 p-6 rounded-3xl border border-white/10 font-mono text-[9px] shadow-lg space-y-3 max-h-56 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 text-white/50 text-[8px] font-bold tracking-widest uppercase">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> CGI Physic Compile log</span>
              <span>LIVE CORE STATS</span>
            </div>
            
            <div className="space-y-1.5 select-all">
              {simulatedLogs.length === 0 ? (
                <p className="text-white/20 italic">No operations active. Standby loop initialized...</p>
              ) : (
                simulatedLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      </div>

      {/* Material Physics Shader Editor Overlay */}
      {showMaterialOverlay && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-fade-in">
          <div className="bg-white text-emerald-950 w-full max-w-4xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full filter blur-[80px] pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-5 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-gold" />
                  <h3 className="text-xl font-serif font-bold text-emerald-950 tracking-tight">Atelier Material Shader Editor</h3>
                </div>
                <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Specular BSDF Shading & Molecular Material Maps</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMaterialOverlay(false)}
                className="w-8 h-8 rounded-full bg-gray-50 text-emerald-950/60 hover:text-emerald-950 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Main Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch flex-grow">
              
              {/* Left Column: Shading Parameters (Col-Span-7) */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Micro Material Presets Selection */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Material Preset Presets</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gold_foil', name: '✨ Polished Gold', refl: 95, rough: 10, met: 100, trans: 0, refr: 1.8, sss: 5 },
                      { id: 'liquid_chrome', name: '💧 Liquid Chrome', refl: 98, rough: 4, met: 95, trans: 0, refr: 2.1, sss: 0 },
                      { id: 'frosted_glass', name: '🥛 Frosted Glass', refl: 30, rough: 45, met: 10, trans: 85, refr: 1.5, sss: 70 },
                      { id: 'matte_obsidian', name: '🖤 Volcanic Obsidian', refl: 80, rough: 12, met: 15, trans: 5, refr: 1.6, sss: 15 },
                      { id: 'red_ceramic', name: '🍎 Ruby Ceramic', refl: 90, rough: 8, met: 75, trans: 10, refr: 1.7, sss: 40 },
                      { id: 'silicon_velvet', name: '🌸 Velvet Petal', refl: 5, rough: 95, met: 0, trans: 0, refr: 1.3, sss: 30 }
                    ].map((m) => {
                      const isSel = materialPreset === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMaterialPreset(m.id);
                            setReflectivity(m.refl);
                            setRoughness(m.rough);
                            setMetallic(m.met);
                            setTransparency(m.trans);
                            setRefractionIndex(m.refr);
                            setSubsurfaceScattering(m.sss);
                            addSimulatedLog(`[PBR Preset] Applied micro shader template: ${m.name}`);
                            recordAction(`Applied Material Preset: ${m.name.replace(/[^a-zA-Z0-9 ]/g, '').trim()}`, {
                              materialPreset: m.id,
                              reflectivity: m.refl,
                              roughness: m.rough,
                              metallic: m.met,
                              transparency: m.trans,
                              refractionIndex: m.refr,
                              subsurfaceScattering: m.sss
                            });
                          }}
                          className={`px-3 py-2.5 rounded-xl border transition-all text-left text-[9px] font-bold uppercase tracking-wider relative cursor-pointer ${
                            isSel 
                              ? 'bg-emerald-950 text-white border-emerald-950 shadow-md' 
                              : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {m.name}
                          {isSel && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fine Parameters Form */}
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                  
                  {/* Specular Reflectivity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-emerald-950">Specular Reflectivity</span>
                      <span className="font-mono text-gold">{reflectivity}%</span>
                    </div>
                    <p className="text-[7.5px] text-gray-400 mt-[-2px] leading-tight font-sans">
                      Drives the mirror bounce factor of directional light paths.
                    </p>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={reflectivity}
                      onChange={(e) => {
                        setReflectivity(Number(e.target.value));
                        setMaterialPreset('custom');
                      }}
                      onMouseUp={() => recordAction('Adjusted Specular Reflectivity')}
                      onTouchEnd={() => recordAction('Adjusted Specular Reflectivity')}
                      className="w-full accent-gold h-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Microfacet Roughness */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-emerald-950">Microfacet Roughness</span>
                      <span className="font-mono text-gold">{roughness}%</span>
                    </div>
                    <p className="text-[7.5px] text-gray-400 mt-[-2px] leading-tight font-sans">
                      Controls micro surface granularity, blurring highlights into satin finishes.
                    </p>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={roughness}
                      onChange={(e) => {
                        setRoughness(Number(e.target.value));
                        setMaterialPreset('custom');
                      }}
                      onMouseUp={() => recordAction('Adjusted Microfacet Roughness')}
                      onTouchEnd={() => recordAction('Adjusted Microfacet Roughness')}
                      className="w-full accent-gold h-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Metallic Metalness Factor */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-emerald-950">Metallic Metalness</span>
                      <span className="font-mono text-gold">{metallic}%</span>
                    </div>
                    <p className="text-[7.5px] text-gray-400 mt-[-2px] leading-tight font-sans">
                      Interpolates conductive (metals) vs dielectric (plastics/silicon) models.
                    </p>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={metallic}
                      onChange={(e) => {
                        setMetallic(Number(e.target.value));
                        setMaterialPreset('custom');
                      }}
                      onMouseUp={() => recordAction('Adjusted Metallic Metalness')}
                      onTouchEnd={() => recordAction('Adjusted Metallic Metalness')}
                      className="w-full accent-gold h-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Transparency */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-emerald-950">Transmission (Transparency)</span>
                      <span className="font-mono text-gold">{transparency}%</span>
                    </div>
                    <p className="text-[7.5px] text-gray-400 mt-[-2px] leading-tight font-sans">
                      Allows raytraced light vectors to pass through the material mesh bounds.
                    </p>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={transparency}
                      onChange={(e) => {
                        setTransparency(Number(e.target.value));
                        setMaterialPreset('custom');
                      }}
                      onMouseUp={() => recordAction('Adjusted Transmission (Transparency)')}
                      onTouchEnd={() => recordAction('Adjusted Transmission (Transparency)')}
                      className="w-full accent-gold h-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* IoR and SSS in row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Index of Refraction */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-emerald-950">Refraction Index (IoR)</span>
                        <span className="font-mono text-gold">{refractionIndex}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="2.5" 
                        step="0.05"
                        value={refractionIndex}
                        onChange={(e) => {
                          setRefractionIndex(Number(e.target.value));
                          setMaterialPreset('custom');
                        }}
                        onMouseUp={() => recordAction('Adjusted Refraction Index (IoR)')}
                        onTouchEnd={() => recordAction('Adjusted Refraction Index (IoR)')}
                        className="w-full accent-gold h-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Subsurface Scattering */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-emerald-950">Subsurface Scattering</span>
                        <span className="font-mono text-gold">{subsurfaceScattering}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={subsurfaceScattering}
                        onChange={(e) => {
                          setSubsurfaceScattering(Number(e.target.value));
                          setMaterialPreset('custom');
                        }}
                        onMouseUp={() => recordAction('Adjusted Subsurface Scattering')}
                        onTouchEnd={() => recordAction('Adjusted Subsurface Scattering')}
                        className="w-full accent-gold h-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Column: Live Simulated Materializer Dome (Col-Span-5) */}
              <div className="md:col-span-5 bg-zinc-950 text-white rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[350px]">
                {/* Science background grid */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(212,175,55,0.05)_1px,transparent_1px)] [background-size:12px_12px] opacity-60 pointer-events-none" />
                <div className="absolute left-[50%] top-0 bottom-0 border-r border-dashed border-white/5 pointer-events-none" />
                <div className="absolute top-[50%] left-0 right-0 border-b border-dashed border-white/5 pointer-events-none" />
                
                <div className="w-full text-left relative z-10">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] font-bold uppercase tracking-widest rounded">
                    REAL-TIME SHADER CALCULATOR
                  </span>
                  <p className="text-[7.5px] text-white/40 font-mono uppercase mt-1">Ray Depth: 12 Bounces • BSDF Shader Node</p>
                </div>

                {/* Animated Interactive Material Sphere */}
                <div className="relative w-44 h-44 my-4 flex items-center justify-center">
                  
                  {/* Dynamic Subsurface glow backing */}
                  <div 
                    className="absolute rounded-full w-40 h-40 blur-2xl transition-all duration-300"
                    style={{
                      background: `rgba(239, 68, 68, ${subsurfaceScattering / 190})`,
                      boxShadow: `0 0 ${subsurfaceScattering / 1.5}px rgba(244, 63, 94, ${subsurfaceScattering / 100})`
                    }}
                  />

                  {/* Main PBR Sphere */}
                  <div 
                    className="w-36 h-36 rounded-full relative shadow-inner overflow-hidden transition-all duration-300 flex items-center justify-center animate-pulse"
                    style={{
                      // Mix gradients dynamically based on presets or variables
                      background: materialPreset === 'gold_foil' 
                        ? 'radial-gradient(circle at 35% 35%, #FFFBF0, #D4AF37 30%, #9F7E1E 65%, #4C3C00)'
                        : materialPreset === 'liquid_chrome'
                        ? 'radial-gradient(circle at 35% 35%, #FFF, #ECECEC 25%, #999 55%, #333 85%)'
                        : materialPreset === 'frosted_glass'
                        ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(220,235,245,0.4) 25%, rgba(120,150,170,0.15) 60%, rgba(40,60,70,0.3))`
                        : materialPreset === 'matte_obsidian'
                        ? 'radial-gradient(circle at 35% 35%, #444, #1B1B1D 35%, #000 80%)'
                        : materialPreset === 'red_ceramic'
                        ? 'radial-gradient(circle at 35% 35%, #FFAAAA, #FF3333 30%, #990000 70%, #3a0000)'
                        : materialPreset === 'silicon_velvet'
                        ? 'radial-gradient(circle at 35% 35%, #FBCFE8, #EC4899 35%, #9D174D 75%, #4C0519)'
                        : `radial-gradient(circle at 35% 35%, #FFF, ${metallic > 50 ? '#d4af37' : '#52525b'} 35%, #18181b 85%)`,
                      
                      opacity: `${(100 - (transparency * 0.75)) / 100}`,
                      filter: `blur(${roughness / 30}px)`
                    }}
                  >
                    {/* Glass sheen overlay */}
                    {transparency > 20 && (
                      <div className="absolute inset-2 border border-white/20 rounded-full backdrop-blur-[4px] pointer-events-none" />
                    )}

                    {/* Specular Spotlight highlight */}
                    <div 
                      className="absolute top-4 left-4 w-12 h-12 bg-white/50 rounded-full filter blur-[4px] transition-all duration-300" 
                      style={{
                        opacity: `${reflectivity / 100}`,
                        transform: `scale(${1 - (roughness / 160)})`
                      }}
                    />

                    {/* Dynamic metallic shimmer bar */}
                    {metallic > 30 && (
                      <div 
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 transform select-none pointer-events-none transition-all duration-300 animate-pulse"
                        style={{
                          opacity: `${metallic / 100}`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Simulated telemetry info */}
                <div className="w-full text-center space-y-1.5 relative z-10 border-t border-white/5 pt-4">
                  <div className="flex justify-between text-[7px] font-mono text-white/40 uppercase">
                    <span>IoR Spec Vector</span>
                    <span className="text-gold">REFRESH_PBR_MAPPED</span>
                  </div>
                  <p className="text-[8px] text-white/60 font-sans leading-tight">
                    Shaders will render beautiful, customized {materialPreset.replace('_', ' ')} physical lighting interactions onto your uploaded item.
                  </p>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 mt-6">
              <button
                type="button"
                onClick={() => {
                  const defaultMaterial = {
                    reflectivity: 85,
                    roughness: 12,
                    metallic: 90,
                    transparency: 0,
                    refractionIndex: 1.5,
                    subsurfaceScattering: 10,
                    materialPreset: 'gold_foil'
                  };
                  setReflectivity(defaultMaterial.reflectivity);
                  setRoughness(defaultMaterial.roughness);
                  setMetallic(defaultMaterial.metallic);
                  setTransparency(defaultMaterial.transparency);
                  setRefractionIndex(defaultMaterial.refractionIndex);
                  setSubsurfaceScattering(defaultMaterial.subsurfaceScattering);
                  setMaterialPreset(defaultMaterial.materialPreset);
                  addSimulatedLog("Restored default physical PBR settings.");
                  recordAction("Restored Default Materials", defaultMaterial);
                }}
                className="px-6 py-2.5 rounded-full border border-gray-200 text-[10px] font-bold text-gray-400 hover:text-emerald-950 uppercase tracking-widest hover:bg-gray-50 transition cursor-pointer"
              >
                Restore Default
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMaterialOverlay(false);
                  addSimulatedLog("Applied custom molecular physics shader parameters to scene pipeline.");
                }}
                className="px-8 py-2.5 rounded-full bg-emerald-950 text-white hover:bg-emerald-900 border border-emerald-950 hover:scale-[1.01] text-[10px] font-bold uppercase tracking-widest transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-gold" /> Save & Lock Materials
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


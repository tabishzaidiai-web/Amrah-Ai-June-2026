import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, 
  ProductAnalysis, 
  BrandKit, 
  GenerationResult, 
  ProductDetails, 
  ProductCategory, 
  ProductType, 
  CameraAngle, 
  ModelPersona, 
  ProductPlacement, 
  CameraMotion 
} from '../types';
import { GeminiService } from '../services/geminiService';
import ModelShowcase from './ModelShowcase';
import MediaAsset from './MediaAsset';
import { modelData } from '../data/models';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Film, 
  Sliders, 
  Download, 
  Upload, 
  Video, 
  Layers, 
  Eye, 
  Volume2, 
  VolumeX,
  Music, 
  Palette, 
  Check, 
  Settings, 
  ChevronDown, 
  Plus,
  Trash2,
  Scissors,
  ArrowRight,
  Shuffle
} from 'lucide-react';

interface VideoStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
  isLocked?: boolean;
}

interface AmbientTrack {
  id: string;
  name: string;
  vibe: string;
  url: string;
}

const ambientMusicPresets: AmbientTrack[] = [
  {
    id: 'symphony',
    name: 'Maison Grand Symphony',
    vibe: 'Classical cinematic strings & grand piano (Suite No. 1)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'atelier',
    name: 'Parisian Atelier Suite',
    vibe: 'Warm acoustic guitars with soft synthesizer pad notes',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'desert',
    name: 'Desert Majesty Oud',
    vibe: 'Acoustic resonance of traditional oud playing softly',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'lofi',
    name: 'Metropolitan Lofi Beats',
    vibe: 'Chilled deep atmospheric space with minimal lofi drums',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  }
];

const LIGHTING_PRESETS_MAP: Record<string, string> = {
  'Golden Hour': 'Warm golden hour sunset glow, dramatic long shadows, rich amber illumination',
  'Studio High-Key': 'Professional standard white softbox studio illumination, clear diffused light, minimal soft shadows',
  'Moody Noir': 'Sultry mysterious high-contrast noir lighting, chiaroscuro chiaroscuro atmosphere, deep shadows, bright rim lit highlights',
  'Hyper-Real Bright': 'Vibrant ultra-crisp clear daylight, realistic solar rays, brilliant highlights and high clarity'
};

interface ShotConfig {
  text: string;
  motion: string;
  angle: CameraAngle;
  placement: 'Top-Center' | 'Center-Left' | 'Bottom-Center' | 'Right-Sidebar';
  animationStyle?: 'Fade-Slide' | 'Reveal-Zoom' | 'Slow-Blur' | 'Classic-Fade' | 'Dramatic-Bounce';
  fontStyle?: 'primary' | 'secondary' | 'accent' | 'mono';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontWeight?: string;
  textColor?: string;
  selectedModelIds?: string[];
  choreographyDirections?: string;
}

interface StoryboardTemplate {
  id: string;
  name: string;
  desc: string;
  shot1: ShotConfig;
  shot2: ShotConfig;
  shot3: ShotConfig;
}

const STORYBOARD_TEMPLATES: StoryboardTemplate[] = [
  {
    id: 'unboxing',
    name: '🎁 Unboxing Reveal',
    desc: 'Showcase pristine product arrivals, unfolding materials, and meticulous initial reveals.',
    shot1: {
      text: 'UNVEILING PREMIUM CRAFT',
      motion: 'Zoom In',
      angle: 'Close-up',
      placement: 'Top-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'The pristine packaging box is slowly slid open under ambient soft light, revealing the wrapped product.'
    },
    shot2: {
      text: 'MADE FOR SPECTACLE',
      motion: 'Orbit',
      angle: 'Standard',
      placement: 'Center-Left',
      selectedModelIds: ['AMRAH-SIG-01', 'AMRAH-ED-02'],
      choreographyDirections: 'A pair of hands lifts the luxury item, peeling back tissue layers to highlight premium fabric or fine custom detail work.'
    },
    shot3: {
      text: 'EXPERIENCE MAISON APEX',
      motion: 'Zoom Out',
      angle: 'Low Angle',
      placement: 'Bottom-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'The fully unboxed product is set on a highly reflective glass surface, capturing high-status structural details under key lighting.'
    }
  },
  {
    id: 'flash_sale',
    name: '⚡ Flash Sale Teaser',
    desc: 'High-energy, fast camera motion, and action choreography for premium urgent drop-offs.',
    shot1: {
      text: 'THE EXCLUSIVE DROPS NOW',
      motion: 'Pan Left',
      angle: 'High Angle',
      placement: 'Center-Left',
      selectedModelIds: ['AMRAH-ED-02'],
      choreographyDirections: 'Model walks energetically toward the camera wearing the showcase outfit with structured, high-contrast dynamic shadows.'
    },
    shot2: {
      text: 'EXTREME PRECISION AT 40% OFF',
      motion: 'Zoom In',
      angle: 'Close-up',
      placement: 'Top-Center',
      selectedModelIds: ['AMRAH-SIG-01', 'AMRAH-ED-02'],
      choreographyDirections: 'An extreme close-up pan highlighting textured stitching pattern, solid gold zipper pullers, and micro tailoring lines.'
    },
    shot3: {
      text: 'LIMITED ATELIER UNITS REMAIN',
      motion: 'Zoom Out',
      angle: 'Standard',
      placement: 'Bottom-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'Model does an elegant, fast-paced pivot under high-contrast spotlighting, casting a commanding glance before walking out of frame.'
    }
  },
  {
    id: 'deep_dive',
    name: '🔍 Product Deep-Dive',
    desc: 'Cinematic slow tilts and tight orbital focal paths highlighting absolute materials and craftsmanship.',
    shot1: {
      text: 'BUILT TO OUTLAST THE SEASONS',
      motion: 'Tilt Down',
      angle: 'High Angle',
      placement: 'Top-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'A beautiful overview of the luxury piece resting in a marble garden courtyard, camera tilting down slowly to frame.'
    },
    shot2: {
      text: 'ENGINEERED LUXURY DETAILS',
      motion: 'Orbit',
      angle: 'Close-up',
      placement: 'Center-Left',
      selectedModelIds: ['AMRAH-SIG-01', 'AMRAH-ED-02'],
      choreographyDirections: 'Camera orbits close to the seams and buttons, highlighting natural luster of the luxury fabric and handworked details.'
    },
    shot3: {
      text: 'SECURE YOUR SIGNATURE PIECE',
      motion: 'Zoom Out',
      angle: 'Standard',
      placement: 'Bottom-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'Model confidently strikes elegant poses, showing premium real-world drape, movement elegance, and high-status stature.'
    }
  },
  {
    id: 'classic',
    name: '🏛️ Maison Classic',
    desc: 'Curated standard luxury layouts, balanced panning offsets, and premium typographic overlays.',
    shot1: {
      text: 'A NEW ERA OF COUTURE',
      motion: 'Zoom In',
      angle: 'Standard',
      placement: 'Top-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'Model walks slowly down the elegant marble runway, trailing her beautiful dress, and glances back at the camera.'
    },
    shot2: {
      text: 'UNCOMPROMISING PRECISION AND TEXTURE',
      motion: 'Orbit',
      angle: 'Close-up',
      placement: 'Center-Left',
      selectedModelIds: ['AMRAH-SIG-01', 'AMRAH-ED-02'],
      choreographyDirections: 'Focus on the gorgeous garment details while she does an elegant spin on the runway.'
    },
    shot3: {
      text: 'DISCOVER THE MAISON MAJESTY',
      motion: 'Zoom Out',
      angle: 'Low Angle',
      placement: 'Bottom-Center',
      selectedModelIds: ['AMRAH-SIG-01'],
      choreographyDirections: 'Both models walk side-by-side down the stairs together, posing majestically to close the showcase.'
    }
  }
];

const VideoStudio: React.FC<VideoStudioProps> = ({ 
  brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits, onError,
  selectedModel, setSelectedModel, isLocked = false
}) => {
  // Mode selection: 'promo' is the new professional promotional video feature; 'veo' is the original raw clip mode
  const [videoMode, setVideoMode] = useState<'promo' | 'veo'>('promo');
  
  // Video playback simulation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0); // 0 to 12s
  const [loadingMsg, setLoadingMsg] = useState('');

  const [state, setState] = useState<AppState>(AppState.READY);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);

  // Elite Multiple Source Assets Registry (Up to 6 assets)
  const [sourceAssets, setSourceAssets] = useState<{ id: string; url: string; type: 'image' | 'video'; name: string }[]>([]);

  // Agent Planner & Creative Director Workspace States
  const [isPlannerLoading, setIsPlannerLoading] = useState(false);
  const [campaignType, setCampaignType] = useState<'reel' | 'tvc'>('reel');
  const [additionalPlannerNotes, setAdditionalPlannerNotes] = useState('');
  const [plannerBrief, setPlannerBrief] = useState<{
    agentPlanner: {
      shootSchedule: string[];
      locationRecommendation: string;
      equipmentSpec: string;
      budgetTips: string;
    };
    creativeDirector: {
      treatment: string;
      lightingVibe: string;
      stylingCostume: string;
      musicVibe: string;
    };
    storyboardApplied: {
      s1Text: string;
      s1Motion: string;
      s1Brief: string;
      s2Text: string;
      s2Motion: string;
      s2Brief: string;
      s3Text: string;
      s3Motion: string;
      s3Brief: string;
    };
  } | null>(null);
  const [activePlannerTab, setActivePlannerTab] = useState<'planner' | 'creative' | 'storyboard'>('planner');
  
  // States for Veo single clip model
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoOutput, setVeoOutput] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [veoDetails, setVeoDetails] = useState<ProductDetails>({
    category: initialCategory || 'jewelry',
    type: 'Jewelry',
    approxSize: 'Standard',
    placement: 'On table',
    addLogo: false,
    logoPlacement: 'Chest',
    cameraAngle: 'Standard',
    cameraMotion: 'Orbit',
    renderMode: 'product-only', 
    videoResolution: '720p',
    videoAspectRatio: '16:9',
    lightingPreset: 'Golden Hour'
  });

  // States for AI Promotional Video Builder
  const [productName, setProductName] = useState('');
  const [vibeTheme, setVibeTheme] = useState('Classic Opulence');
  const [musicVibeSuggestion, setMusicVibeSuggestion] = useState('Ambient neoromantic Oud with digital atmospheric clicks');
  const [vibeColorScheme, setVibeColorScheme] = useState('Royal Gold & Emerald Slate');
  const [aiStoryboardLoading, setAiStoryboardLoading] = useState(false);

  // Cinematic Soundscapes & Ambient Audio Branding state variables
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<string>('symphony');
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [customMusicName, setCustomMusicName] = useState<string>('');
  const [musicVolume, setMusicVolume] = useState<number>(0.5);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeMusicUrl = selectedMusicTrack === 'custom' && customMusicUrl 
    ? customMusicUrl 
    : (ambientMusicPresets.find(t => t.id === selectedMusicTrack)?.url || '');

  const activeTrackObj = ambientMusicPresets.find(t => t.id === selectedMusicTrack);
  const chosenTrackName = selectedMusicTrack === 'custom' ? (customMusicName || 'Custom Upload') : (activeTrackObj?.name || 'Default Ambient');
  const chosenTrackVibe = selectedMusicTrack === 'custom' ? 'Custom uploaded soundtrack' : (activeTrackObj?.vibe || 'Ambient Atmospheric soundscape');

  // Synchronise audio volume and mute status
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMusicMuted ? 0 : musicVolume;
    }
  }, [musicVolume, isMusicMuted]);

  // Synchronise play/pause status with the previewer
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && activeMusicUrl) {
        audioRef.current.play().catch(err => {
          console.log("Audio presentation postponed until user interaction gesture", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeMusicUrl]);

  // Sync audio seek time on rewind / loops
  useEffect(() => {
    if (playbackTime === 0 && audioRef.current && isPlaying) {
      audioRef.current.currentTime = 0;
    }
  }, [playbackTime, isPlaying]);
  
  const [transition1, setTransition1] = useState<'Cross-dissolve' | 'Zoom Blur' | 'Whip Pan' | 'Fade to Slate' | 'Instant Cut' | 'Camera Pan' | 'Zoom In'>('Zoom Blur');
  const [transition2, setTransition2] = useState<'Cross-dissolve' | 'Zoom Blur' | 'Whip Pan' | 'Fade to Slate' | 'Instant Cut' | 'Camera Pan' | 'Zoom In'>('Cross-dissolve');
  
  const [promoOutput, setPromoOutput] = useState<string | null>(null);
  const [showHudOverlay, setShowHudOverlay] = useState(true);
  const [exportAspectRatio, setExportAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('16:9');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4k'>('1080p');

  // Drag-and-drop narrative storyboard editor states
  interface LibraryClip {
    id: string;
    name: string;
    duration: number;
    vibe: string;
    motion: string;
    colorTheme: string;
    imageUrl?: string;
    subtitle: string;
  }

  interface StoryboardClip extends LibraryClip {
    uniqueInstanceId: string;
    transition: 'Cross-dissolve' | 'Whip Pan' | 'Fade to Slate' | 'Fade to Black' | 'Instant Cut';
  }

  const initialLibraryClips: LibraryClip[] = [
    {
      id: 'lib_reveal',
      name: 'Atelier Golden Reveal',
      duration: 6,
      vibe: 'Warm orchestral, slow camera rise with shimmering golden particles',
      motion: 'Zoom In',
      colorTheme: 'from-amber-900/80 to-amber-950/95',
      subtitle: 'PRESENTING THE MAJESTY'
    },
    {
      id: 'lib_macro',
      name: 'Prism Diamond Macro Spec',
      duration: 6,
      vibe: 'Pristine acoustic bells, rotational focal lens zoom',
      motion: 'Orbit',
      colorTheme: 'from-slate-800/90 to-emerald-950/95',
      subtitle: 'CRAFTED BEYOND PERFECTION'
    },
    {
      id: 'lib_royal',
      name: 'Royal Emerald Pan Shot',
      duration: 6,
      vibe: 'Atmospheric strings crescendo, slow right pan tracking reflections',
      motion: 'Pan Right',
      colorTheme: 'from-emerald-900/80 to-stone-900/95',
      subtitle: 'EXPERIENCE OPULENCE NOW'
    },
    {
      id: 'lib_outro',
      name: 'Symphonic Slate Outro',
      duration: 6,
      vibe: 'Deep room acoustics, slow camera pull-out into soft vignette',
      motion: 'Zoom Out',
      colorTheme: 'from-gray-950 via-slate-900 to-black',
      subtitle: 'EXCLUSIVE IN BOUTIQUES'
    }
  ];

  const [libraryClips, setLibraryClips] = useState<LibraryClip[]>(initialLibraryClips);
  const [storyboardSequence, setStoryboardSequence] = useState<StoryboardClip[]>([
    {
      id: 'lib_reveal',
      uniqueInstanceId: 'inst_1',
      name: 'Atelier Golden Reveal',
      duration: 6,
      vibe: 'Warm orchestral, slow camera rise',
      motion: 'Zoom In',
      colorTheme: 'from-amber-900/80 to-amber-950/95',
      subtitle: 'PRESENTING THE MAJESTY',
      transition: 'Cross-dissolve'
    },
    {
      id: 'lib_macro',
      uniqueInstanceId: 'inst_2',
      name: 'Prism Diamond Macro Spec',
      duration: 6,
      vibe: 'Pristine acoustic bells, rotational focal lens zoom',
      motion: 'Orbit',
      colorTheme: 'from-slate-800/90 to-emerald-950/95',
      subtitle: 'CRAFTED BEYOND PERFECTION',
      transition: 'Whip Pan'
    }
  ]);

  const [activeDraggedLibraryId, setActiveDraggedLibraryId] = useState<string | null>(null);
  const [activeDraggedTimelineIndex, setActiveDraggedTimelineIndex] = useState<number | null>(null);
  
  const [isStoryboardPlaying, setIsStoryboardPlaying] = useState(false);
  const [storyboardPlaybackTime, setStoryboardPlaybackTime] = useState(0);
  const [storyboardFeedback, setStoryboardFeedback] = useState<string | null>(null);

  const showStoryboardStatus = (text: string) => {
    setStoryboardFeedback(text);
    setTimeout(() => {
      setStoryboardFeedback(null);
    }, 3000);
  };

  // Automatically append newly generated/simulated outputs into the library vault
  const addGeneratedClipToLibrary = (url: string, type: 'promo' | 'veo') => {
    const newLibClip: LibraryClip = {
      id: `gen_${Date.now()}`,
      name: type === 'promo' ? `${productName || 'Maison'} Commercial` : `Veo Raw Master`,
      duration: type === 'promo' ? 12 : 6,
      vibe: type === 'promo' ? (chosenTrackVibe || 'Ambient Atmospheric soundscape') : 'Raw cinematic synthesis pipeline',
      motion: type === 'promo' ? `${shot1.motion} → ${shot2.motion}` : veoDetails.cameraMotion,
      colorTheme: 'from-emerald-950/90 via-gold/10 to-amber-950/90',
      imageUrl: url,
      subtitle: type === 'promo' ? (shot1.text || 'NEW LUXURY ARRIVALS') : (veoPrompt || 'Veo Camera Reveal')
    };
    setLibraryClips(prev => [newLibClip, ...prev]);
    showStoryboardStatus(`Added "${newLibClip.name}" as an active clip asset!`);
  };

  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTimelineDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");

    if (data.startsWith("timeline:")) {
      const sourceIdx = parseInt(data.replace("timeline:", ""), 10);
      if (isNaN(sourceIdx) || sourceIdx === targetIdx) return;
      
      setStoryboardSequence(prev => {
        const updated = [...prev];
        const [moved] = updated.splice(sourceIdx, 1);
        updated.splice(targetIdx, 0, moved);
        return updated;
      });
      showStoryboardStatus("Repositioned clip narrative node.");
    } else {
      const libraryClipId = data;
      const originalClip = libraryClips.find(c => c.id === libraryClipId);
      if (originalClip) {
        const instClip: StoryboardClip = {
          ...originalClip,
          uniqueInstanceId: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          transition: 'Cross-dissolve'
        };
        setStoryboardSequence(prev => {
          const updated = [...prev];
          updated.splice(targetIdx, 0, instClip);
          return updated;
        });
        showStoryboardStatus(`Inserted "${originalClip.name}" into storyboard index!`);
      }
    }
  };

  const handleTimelineEndDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");

    if (data.startsWith("timeline:")) {
      const sourceIdx = parseInt(data.replace("timeline:", ""), 10);
      if (isNaN(sourceIdx)) return;
      
      setStoryboardSequence(prev => {
        const updated = [...prev];
        const [moved] = updated.splice(sourceIdx, 1);
        updated.push(moved);
        return updated;
      });
      showStoryboardStatus("Moved scene to the end of the timeline.");
    } else {
      const libraryClipId = data;
      const originalClip = libraryClips.find(c => c.id === libraryClipId);
      if (originalClip) {
        const instClip: StoryboardClip = {
          ...originalClip,
          uniqueInstanceId: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          transition: 'Cross-dissolve'
        };
        setStoryboardSequence(prev => [...prev, instClip]);
        showStoryboardStatus(`Appended "${originalClip.name}" onto timeline!`);
      }
    }
  };

  const removeStoryboardClip = (idx: number) => {
    setStoryboardSequence(prev => prev.filter((_, i) => i !== idx));
    showStoryboardStatus("Removed clip node from sequencer.");
  };

  const handleTransitionChange = (idx: number, transition: string) => {
    setStoryboardSequence(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], transition: transition as any };
      return updated;
    });
    showStoryboardStatus(`Transition for Scene 0${idx+1} updated!`);
  };

  // Synchronise play timers for Storyboard Master Movie Player
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const updateStoryboardTime = () => {
      if (isStoryboardPlaying) {
        const now = Date.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        setStoryboardPlaybackTime(prev => {
          const totalDur = storyboardSequence.reduce((acc, c) => acc + c.duration, 0);
          if (totalDur === 0) return 0;
          const nextVal = prev + delta;
          if (nextVal >= totalDur) {
            return 0; // seamless Loop
          }
          return nextVal;
        });
      } else {
        lastTime = Date.now();
      }
      animationFrameId = requestAnimationFrame(updateStoryboardTime);
    };

    updateStoryboardTime();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isStoryboardPlaying, storyboardSequence]);
  
  // 3-Scene configurations (4 seconds each, 12 seconds total)
  const [shot1, setShot1] = useState<ShotConfig>({
    text: 'A NEW ERA OF COUTURE',
    motion: 'Zoom In',
    angle: 'Standard',
    placement: 'Top-Center',
    selectedModelIds: ['AMRAH-SIG-01'],
    choreographyDirections: 'Model walks slowly down the elegant marble runway, trailing her beautiful dress, and glances back at the camera.'
  });
  
  const [shot2, setShot2] = useState<ShotConfig>({
    text: 'UNCOMPROMISING PRECISION AND TEXTURE',
    motion: 'Orbit',
    angle: 'Close-up',
    placement: 'Center-Left',
    selectedModelIds: ['AMRAH-SIG-01', 'AMRAH-ED-02'],
    choreographyDirections: 'Focus on the gorgeous garment details while she does an elegant spin on the runway.'
  });
  
  const [shot3, setShot3] = useState<ShotConfig>({
    text: 'DISCOVER THE MAISON MAJESTY',
    motion: 'Zoom Out',
    angle: 'Low Angle',
    placement: 'Bottom-Center',
    selectedModelIds: ['AMRAH-SIG-01'],
    choreographyDirections: 'Both models walk side-by-side down the stairs together, posing majestically to close the showcase.'
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic');

  const handleApplyTemplate = (templateId: string) => {
    const template = STORYBOARD_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    setShot1({ ...template.shot1 });
    setShot2({ ...template.shot2 });
    setShot3({ ...template.shot3 });
    setSelectedTemplateId(templateId);
    showStoryboardStatus(`Applied '${template.name}' storyboard structures!`);
  };

  // Expanded editor states
  const [expandedShot, setExpandedShot] = useState<1 | 2 | 3 | null>(1);
  
  const motionPresets: CameraMotion[] = ['Static', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Zoom In', 'Zoom Out', 'Orbit'];
  const cameraAngles: CameraAngle[] = ['Standard', 'Low Angle', 'High Angle', 'Bird\'s Eye', 'Side', 'Close-up'];

  const steps = [
    { id: 1, label: 'Asset DNA', active: !!sourceImage },
    { id: 2, label: 'Vision Vibe', active: videoMode === 'promo' ? !!productName : !!veoPrompt },
    { id: 3, label: 'Choreography', active: videoMode === 'promo' ? isPlaying || playbackTime > 0 : !!veoPrompt },
    { id: 4, label: 'Maison Film Vault', active: videoMode === 'promo' ? !!promoOutput : !!veoOutput }
  ];

  // Video player loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const updatePlayTime = () => {
      if (isPlaying) {
        const now = Date.now();
        const delta = (now - lastTime) / 1000; // in seconds
        lastTime = now;
        
        setPlaybackTime(prev => {
          const nextVal = prev + delta;
          if (nextVal >= 12) {
            return 0; // Loop playback
          }
          return nextVal;
        });
        
        animationFrameId = requestAnimationFrame(updatePlayTime);
      }
    };

    if (isPlaying) {
      lastTime = Date.now();
      animationFrameId = requestAnimationFrame(updatePlayTime);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (sourceAssets.length + files.length > 6) {
      alert("Maison Atelier workspace is configured for up to 6 concurrent source assets.");
    }

    const filesToLoad = files.slice(0, 6 - sourceAssets.length);
    let firstLoaded = false;
    
    for (const file of filesToLoad) {
      const reader = new FileReader();
      const loadPromise = new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      const result = await loadPromise;
      const fileType: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
      
      const newAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url: result,
        type: fileType,
        name: file.name
      };

      setSourceAssets(prev => {
        const updated = [...prev, newAsset];
        // Mirror the first asset to sourceImage as the primary preview
        if (!sourceImage && prev.length === 0) {
          setSourceImage(result);
        }
        return updated;
      });

      if (!sourceImage && !firstLoaded) {
        firstLoaded = true;
        setSourceImage(result);
        setState(AppState.ANALYZING);
        setLoadingMsg(`Analyzing DNA of ${file.name}...`);
        try {
          const base64 = result.split(',')[1];
          const res = await GeminiService.analyzeProduct(base64, file.type, brandKit);
          setAnalysis(res);
          if (res?.brand) {
            setProductName(res.brand + " " + res.type);
          }
        } catch (err) {
          setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
        } finally {
          setState(AppState.READY);
        }
      }
    }
  };

  const handleSelectActiveAsset = async (asset: { url: string; type: 'image' | 'video'; name: string }) => {
    setSourceImage(asset.url);
    setState(AppState.ANALYZING);
    setLoadingMsg(`Analyzing DNA of selected active asset...`);
    try {
      const base64 = asset.url.split(',')[1];
      const mimeType = asset.type === 'video' ? 'video/mp4' : 'image/png';
      const res = await GeminiService.analyzeProduct(base64, mimeType, brandKit);
      setAnalysis(res);
      if (res?.brand) {
        setProductName(res.brand + " " + res.type);
      }
    } catch (err) {
      setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
    } finally {
      setState(AppState.READY);
    }
  };

  const handleRemoveAsset = (id: string) => {
    setSourceAssets(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (filtered.length > 0) {
        const activeUrl = sourceImage;
        const removedWasActive = prev.find(a => a.id === id)?.url === activeUrl;
        if (removedWasActive) {
          const firstLeft = filtered[0];
          setTimeout(() => handleSelectActiveAsset(firstLeft), 50);
        }
      } else {
        setSourceImage(null);
        setAnalysis(null);
      }
      return filtered;
    });
  };

  const handleGenerateProductionBrief = async () => {
    setIsPlannerLoading(true);
    try {
      const assignedModels = [
        ...Array.from(new Set([
          ...(shot1.selectedModelIds || []),
          ...(shot2.selectedModelIds || []),
          ...(shot3.selectedModelIds || [])
        ]))
      ].map(id => {
        const found = modelData.find(m => m.id === id);
        return found ? found.name : id;
      });

      const res = await GeminiService.generateProductionBrief(
        productName || "Luxury Maison Ad Piece",
        brandKit,
        campaignType,
        assignedModels,
        additionalPlannerNotes
      );

      if (res) {
        setPlannerBrief(res);
        setActivePlannerTab('planner');
        showStoryboardStatus(`AI Assistant Board synthesized! Planner and Director synchronized.`);
      }
    } catch (e) {
      console.error(e);
      alert("Creative Director consulting timed out. Please enter more explicit keywords and try again.");
    } finally {
      setIsPlannerLoading(false);
    }
  };

  const handleApplyPlannerStoryboard = () => {
    if (!plannerBrief) return;
    const { storyboardApplied } = plannerBrief;
    
    setShot1(prev => ({
      ...prev,
      text: storyboardApplied.s1Text.toUpperCase(),
      motion: storyboardApplied.s1Motion as any,
      choreographyDirections: storyboardApplied.s1Brief
    }));
    
    setShot2(prev => ({
      ...prev,
      text: storyboardApplied.s2Text.toUpperCase(),
      motion: storyboardApplied.s2Motion as any,
      choreographyDirections: storyboardApplied.s2Brief
    }));
    
    setShot3(prev => ({
      ...prev,
      text: storyboardApplied.s3Text.toUpperCase(),
      motion: storyboardApplied.s3Motion as any,
      choreographyDirections: storyboardApplied.s3Brief
    }));
    
    showStoryboardStatus("Storyboard and walk guidelines successfully synced from Creative Board!");
  };

  // AI-powered storyboard and copywriting engine
  const handleGenerateAiStoryboard = async () => {
    if (!sourceImage) {
      alert("Please upload a product asset first.");
      return;
    }
    setAiStoryboardLoading(true);
    try {
      const base64 = sourceImage.split(',')[1];
      const result = await GeminiService.generatePromotionalStoryboard(base64, productName, brandKit);
      
      if (result) {
        if (result.productName) setProductName(result.productName);
        if (result.vibe) setVibeTheme(result.vibe);
        if (result.musicVibe) setMusicVibeSuggestion(result.musicVibe);
        if (result.colorScheme) setVibeColorScheme(result.colorScheme);
        
        if (result.scenes && result.scenes.length >= 3) {
          const sc1 = result.scenes[0];
          setShot1({
            text: sc1.textOverlay.toUpperCase(),
            motion: sc1.cameraMotion,
            angle: sc1.cameraAngle as CameraAngle,
            placement: sc1.overlayPlacement as any || 'Top-Center'
          });
          
          const sc2 = result.scenes[1];
          setShot2({
            text: sc2.textOverlay.toUpperCase(),
            motion: sc2.cameraMotion,
            angle: sc2.cameraAngle as CameraAngle,
            placement: sc2.overlayPlacement as any || 'Center-Left'
          });
          
          const sc3 = result.scenes[2];
          setShot3({
            text: sc3.textOverlay.toUpperCase(),
            motion: sc3.cameraMotion,
            angle: sc3.cameraAngle as CameraAngle,
            placement: sc3.overlayPlacement as any || 'Bottom-Center'
          });
          
          setPlaybackTime(0);
          setIsPlaying(true);
        }
      }
    } catch (e) {
      alert("AI Brief generation completed. Manual orchestration of scenes is available below.");
    } finally {
      setAiStoryboardLoading(false);
    }
  };

  const generateBrandKitCaptions = (overrideTone?: string) => {
    const tone = overrideTone || brandKit.tone || 'Minimal';
    const name = productName || 'Maison Luxury Piece';
    
    let activeCaptions = {
      s1: 'A NEW ERA OF COUTURE',
      s2: 'UNCOMPROMISING PRECISION AND TEXTURE',
      s3: 'DISCOVER THE MAISON MAJESTY'
    };
    
    switch (tone) {
      case 'Minimal':
        activeCaptions = {
          s1: `INTRODUCING ${name.toUpperCase()}`,
          s2: 'PURE SILHOUETTE, STARK DETAIL',
          s3: 'ESSENTIALS FOR THE MODERN MIND'
        };
        break;
      case 'Opulent':
        activeCaptions = {
          s1: `ROYAL PRESENCE: THE ${name.toUpperCase()}`,
          s2: 'MAGNIFICENT SHINE & GOLD TRIMS',
          s3: 'ACQUIRE UNMATCHED MAJESTY'
        };
        break;
      case 'Street':
        activeCaptions = {
          s1: `THE ${name.toUpperCase()} HAS LANDED`,
          s2: 'FORGED IN NEON & METAL DUST',
          s3: 'RULE THE CONCRETE PAVEMENT'
        };
        break;
      case 'Classic':
        activeCaptions = {
          s1: `HERITAGE UNVEILED: ${name.toUpperCase()}`,
          s2: 'CRAFTED WITH CENTURY-OLD ARTISTRY',
          s3: 'INVEST IN TIMELESS ELEGANCE'
        };
        break;
      case 'Editorial':
        activeCaptions = {
          s1: `CHAPTER I: ${name.toUpperCase()}`,
          s2: 'AN EXAMINATION OF FORM & SPACE',
          s3: 'DISCOVER THE CURATED ESSENCE'
        };
        break;
    }
    
    setShot1(prev => ({ ...prev, text: activeCaptions.s1 }));
    setShot2(prev => ({ ...prev, text: activeCaptions.s2 }));
    setShot3(prev => ({ ...prev, text: activeCaptions.s3 }));
    
    showStoryboardStatus(`Auto-generated captions matching "${tone}" tone!`);
  };

  const applyGlobalCaptionStyle = (params: {
    animationStyle?: 'Fade-Slide' | 'Reveal-Zoom' | 'Slow-Blur' | 'Classic-Fade' | 'Dramatic-Bounce';
    fontStyle?: 'primary' | 'secondary' | 'accent' | 'mono';
    fontSize?: 'sm' | 'md' | 'lg' | 'xl';
    textColor?: string;
  }) => {
    if (params.animationStyle !== undefined) {
      setShot1(prev => ({ ...prev, animationStyle: params.animationStyle }));
      setShot2(prev => ({ ...prev, animationStyle: params.animationStyle }));
      setShot3(prev => ({ ...prev, animationStyle: params.animationStyle }));
    }
    if (params.fontStyle !== undefined) {
      setShot1(prev => ({ ...prev, fontStyle: params.fontStyle }));
      setShot2(prev => ({ ...prev, fontStyle: params.fontStyle }));
      setShot3(prev => ({ ...prev, fontStyle: params.fontStyle }));
    }
    if (params.fontSize !== undefined) {
      setShot1(prev => ({ ...prev, fontSize: params.fontSize }));
      setShot2(prev => ({ ...prev, fontSize: params.fontSize }));
      setShot3(prev => ({ ...prev, fontSize: params.fontSize }));
    }
    if (params.textColor !== undefined) {
      setShot1(prev => ({ ...prev, textColor: params.textColor }));
      setShot2(prev => ({ ...prev, textColor: params.textColor }));
      setShot3(prev => ({ ...prev, textColor: params.textColor }));
    }
    showStoryboardStatus("Applied custom narrative text styling globally!");
  };

  const handleGenerateVeoClip = async () => {
    if (isLocked) {
      onInsufficientCredits();
      return;
    }
    if (!sourceImage || !veoPrompt) return;
    if (userCredits.videos !== -1 && userCredits.videos <= 0 && !isLocked) return onInsufficientCredits();
    
    setState(AppState.GENERATING);
    setLoadingMsg("Initializing Veo Synthesis...");
    try {
      const base64 = sourceImage.split(',')[1];
      const identityLock = selectedModel && veoDetails.renderMode === 'on-model' ? `Model Identity: ${selectedModel.name}, ${selectedModel.nationality}. Features: ${selectedModel.features}. ` : "";
      const lightingText = veoDetails.lightingPreset ? ` Lighting preset environment: ${LIGHTING_PRESETS_MAP[veoDetails.lightingPreset] || veoDetails.lightingPreset}.` : "";
      const finalPrompt = `${identityLock}${veoPrompt}. Camera Angle: ${veoDetails.cameraAngle}. Camera Motion: ${veoDetails.cameraMotion}.${lightingText} High-fidelity textures.`;
      
      let url = await GeminiService.generateProductVideo(base64, analysis!, finalPrompt, brandKit, veoDetails, setLoadingMsg);
      setVeoOutput(url);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: 'video', url: url, prompt: finalPrompt, timestamp: Date.now() });
    } catch (err: any) { 
      onError(err); 
    } finally { 
      setState(AppState.READY); 
    }
  };

  const handleExportPromoVideo = async () => {
    if (isLocked) {
      onInsufficientCredits();
      return;
    }
    if (!sourceImage) return;
    if (userCredits.videos !== -1 && userCredits.videos <= 0 && !isLocked) return onInsufficientCredits();
    
    setState(AppState.GENERATING);
    setLoadingMsg("Compositing commercial, transitions & typography overlays...");
    
    try {
      // Create a rich prompt describing the 12-second commercial
      const base64 = sourceImage.split(',')[1];
      
      const lightingText = veoDetails.lightingPreset ? ` Lighting environment: ${LIGHTING_PRESETS_MAP[veoDetails.lightingPreset] || veoDetails.lightingPreset}.` : "";
      const complexPromoBlueprint = `12-second commercial storyboard for product Name: ${productName}. Style Theme: ${vibeTheme}. Color Scheme: ${vibeColorScheme}.${lightingText} 
      Shot 1 (0-4s): ${shot1.angle}, camera motion ${shot1.motion}. Text Overlay: ${shot1.text}.
      Shot 2 (4-8s): ${shot2.angle}, camera motion ${shot2.motion}. Text Overlay: ${shot2.text}.
      Shot 3 (8-12s): ${shot3.angle}, camera motion ${shot3.motion}. Text Overlay: ${shot3.text}.
      Dynamic cuts transitions: ${transition1} and ${transition2}. Soundtrack Track: ${chosenTrackName} with atmospheric vibe: ${chosenTrackVibe || musicVibeSuggestion}. Produced in aspect ratio: ${exportAspectRatio} at resolution ${exportResolution}.`;
      
      // Request generation from Veo for the background stream
      const simulatedDetails: ProductDetails = {
        category: initialCategory || 'jewelry',
        type: 'Jewelry',
        addLogo: true,
        logoPlacement: 'Background watermark',
        videoResolution: exportResolution,
        videoAspectRatio: exportAspectRatio,
        lightingPreset: veoDetails.lightingPreset
      };

      let url = await GeminiService.generateProductVideo(base64, analysis!, complexPromoBlueprint, brandKit, simulatedDetails, setLoadingMsg);
      setPromoOutput(url);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: 'video', url: url, prompt: complexPromoBlueprint, timestamp: Date.now() });
    } catch (err: any) {
      onError(err);
    } finally {
      setState(AppState.READY);
    }
  };

  // Inline styling formula for simulating gorgeous continuous camera pan/zoom/tilt physics!
  const getSceneStyle = (sceneNum: number) => {
    const start = (sceneNum - 1) * 4;
    const end = sceneNum * 4;
    
    let opacity = 0;
    let transform = "scale(1)";
    let filter = "none";
    let pointerEvents: 'auto' | 'none' = 'none';
    
    if (playbackTime >= start && playbackTime < end) {
      opacity = 1;
      pointerEvents = 'auto';
      const progress = (playbackTime - start) / 4; // 0 to 1 progress within the active shot
      
      const motion = sceneNum === 1 ? shot1.motion : sceneNum === 2 ? shot2.motion : shot3.motion;
      
      // Map panning/zooming movements with CSS
      if (motion === 'Zoom In') {
        transform = `scale(${1.0 + progress * 0.20})`;
      } else if (motion === 'Zoom Out') {
        transform = `scale(${1.20 - progress * 0.20})`;
      } else if (motion === 'Pan Left') {
        transform = `scale(1.2) translateX(${progress * -40 + 20}px)`;
      } else if (motion === 'Pan Right') {
        transform = `scale(1.2) translateX(${progress * 40 - 20}px)`;
      } else if (motion === 'Tilt Up') {
        transform = `scale(1.2) translateY(${progress * -30 + 15}px)`;
      } else if (motion === 'Tilt Down') {
        transform = `scale(1.2) translateY(${progress * 30 - 15}px)`;
      } else if (motion === 'Orbit') {
        transform = `scale(1.15) rotate(${(progress - 0.5) * 8}deg)`;
      } else {
        transform = "scale(1.05)";
      }
    }
    
    // Smooth Transition Overlay calculations (400ms duration at scene boundaries)
    const tDuration = 0.4;
    
    // Boundary 1: Scene 1 to Scene 2 Around 4.0s
    if (sceneNum === 1 && playbackTime >= 4 - tDuration && playbackTime <= 4) {
      const tProgress = (playbackTime - (4 - tDuration)) / tDuration; // 0 to 1
      if (transition1 === 'Cross-dissolve' || transition1 === 'Zoom Blur' || transition1 === 'Fade to Slate' || transition1 === 'Zoom In') {
        opacity = 1 - tProgress;
      }
      if (transition1 === 'Camera Pan' || transition1 === 'Whip Pan') {
        opacity = 1;
        transform = `${transform} translateX(${-tProgress * 100}%)`;
      }
      if (transition1 === 'Zoom In') {
        transform = `${transform} scale(${1 + tProgress * 0.4})`;
      }
    } else if (sceneNum === 2 && playbackTime >= 4 && playbackTime <= 4 + tDuration) {
      const tProgress = (playbackTime - 4) / tDuration; // 0 to 1
      if (transition1 === 'Cross-dissolve' || transition1 === 'Zoom Blur' || transition1 === 'Fade to Slate' || transition1 === 'Zoom In') {
        opacity = tProgress;
      }
      if (transition1 === 'Camera Pan' || transition1 === 'Whip Pan') {
        opacity = 1;
        transform = `${transform} translateX(${(1 - tProgress) * 100}%)`;
      }
      if (transition1 === 'Zoom In') {
        transform = `${transform} scale(${0.7 + tProgress * 0.3})`;
      }
    }
    
    // Boundary 2: Scene 2 to Scene 3 Around 8.0s
    if (sceneNum === 2 && playbackTime >= 8 - tDuration && playbackTime <= 8) {
      const tProgress = (playbackTime - (8 - tDuration)) / tDuration; // 0 to 1
      if (transition2 === 'Cross-dissolve' || transition2 === 'Zoom Blur' || transition2 === 'Fade to Slate' || transition2 === 'Zoom In') {
        opacity = 1 - tProgress;
      }
      if (transition2 === 'Camera Pan' || transition2 === 'Whip Pan') {
        opacity = 1;
        transform = `${transform} translateX(${-tProgress * 100}%)`;
      }
      if (transition2 === 'Zoom In') {
        transform = `${transform} scale(${1 + tProgress * 0.4})`;
      }
    } else if (sceneNum === 3 && playbackTime >= 8 && playbackTime <= 8 + tDuration) {
      const tProgress = (playbackTime - 8) / tDuration; // 0 to 1
      if (transition2 === 'Cross-dissolve' || transition2 === 'Zoom Blur' || transition2 === 'Fade to Slate' || transition2 === 'Zoom In') {
        opacity = tProgress;
      }
      if (transition2 === 'Camera Pan' || transition2 === 'Whip Pan') {
        opacity = 1;
        transform = `${transform} translateX(${(1 - tProgress) * 100}%)`;
      }
      if (transition2 === 'Zoom In') {
        transform = `${transform} scale(${0.7 + tProgress * 0.3})`;
      }
    }
    
    // Applying zoom-blur camera filter
    if (transition1 === 'Zoom Blur' && playbackTime >= 3.8 && playbackTime <= 4.2) {
      const dist = 1 - Math.abs(playbackTime - 4) / 0.2; // 0 to 1 peak
      filter = `blur(${dist * 12}px)`;
    }
    if (transition2 === 'Zoom Blur' && playbackTime >= 7.8 && playbackTime <= 8.2) {
      const dist = 1 - Math.abs(playbackTime - 8) / 0.2; // 0 to 1 peak
      filter = `blur(${dist * 12}px)`;
    }
    
    return {
      opacity,
      transition: opacity === 1 ? 'none' : 'opacity 150ms ease-out',
      transform,
      filter,
      pointerEvents,
    };
  };

  // Helper to determine fine responsive font size classes
  const getFontSizeClass = (size?: 'sm' | 'md' | 'lg' | 'xl') => {
    switch (size) {
      case 'sm':
        return 'text-xs md:text-sm lg:text-base';
      case 'md':
        return 'text-sm md:text-lg lg:text-xl';
      case 'xl':
        return 'text-xl md:text-3.5xl lg:text-4.5xl';
      case 'lg':
      default:
        return 'text-base md:text-2.5xl lg:text-3.5xl';
    }
  };

  // Helper to place text overlays relative to canvas with precise responsive offset
  const getOverlayPlacementClass = (placement: string) => {
    switch (placement) {
      case 'Top-Center':
        return 'absolute top-12 left-6 right-6 text-center';
      case 'Center-Left':
        return 'absolute top-1/2 left-12 right-1/2 -translate-y-1/2 text-left';
      case 'Bottom-Center':
        return 'absolute bottom-16 left-6 right-6 text-center';
      case 'Right-Sidebar':
        return 'absolute top-1/2 left-1/2 right-12 -translate-y-1/2 text-right';
      default:
        return 'absolute bottom-16 left-6 right-6 text-center';
    }
  };

  // Helper to determine active text overlay visibility and enter/exit slide-up motion
  const getTextOverlayStyle = (sceneNum: number) => {
    const start = (sceneNum - 1) * 4;
    const progress = playbackTime - start;
    
    // Only show during active scene range and avoid blink on cut
    if (playbackTime >= start && playbackTime < start + 4) {
      let opacity = 1;
      let translateValue = 'translateY(0px)';
      let scaleValue = 'scale(1)';
      let filterValue = 'blur(0px)';
      
      const shot = sceneNum === 1 ? shot1 : sceneNum === 2 ? shot2 : shot3;
      const animStyle = shot.animationStyle || 'Fade-Slide';
      
      // Elegant fade-in transition based on selected animation preset during first 600ms
      if (progress < 0.6) {
        const factor = progress / 0.6;
        opacity = factor;
        
        switch (animStyle) {
          case 'Fade-Slide':
            translateValue = `translateY(${(1 - factor) * 20}px)`;
            break;
          case 'Reveal-Zoom':
            scaleValue = `scale(${0.85 + factor * 0.15})`;
            break;
          case 'Slow-Blur':
            filterValue = `blur(${(1 - factor) * 12}px)`;
            break;
          case 'Classic-Fade':
            break;
          case 'Dramatic-Bounce':
            // Custom spring-like bounce emulation
            const overshoot = Math.sin(factor * Math.PI * 1.2) * 5;
            translateValue = `translateY(${(1 - factor) * -35 + overshoot}px)`;
            break;
        }
      }
      
      // Elegant fade-out slide-up during final 400ms
      if (progress > 3.6) {
        const factor = (4 - progress) / 0.4;
        opacity = factor;
        
        switch (animStyle) {
          case 'Fade-Slide':
            translateValue = `translateY(${(factor - 1) * 15}px)`;
            break;
          case 'Reveal-Zoom':
            scaleValue = `scale(${1 + (1 - factor) * 0.08})`;
            break;
          case 'Slow-Blur':
            filterValue = `blur(${(1 - factor) * 6}px)`;
            break;
          case 'Classic-Fade':
            break;
          case 'Dramatic-Bounce':
            translateValue = `translateY(${(factor - 1) * 15}px)`;
            break;
        }
      }
      
      // Dynamic typography & color mappings directly using or complementing brandKit
      const isSecondaryFont = shot.fontStyle === 'secondary';
      const isAccentFont = shot.fontStyle === 'accent';
      const isMonoFont = shot.fontStyle === 'mono';
      
      let finalFontFamily = brandKit.primaryFont || 'Playfair Display';
      if (isSecondaryFont) {
        finalFontFamily = brandKit.secondaryFont || 'Inter';
      } else if (isAccentFont) {
        finalFontFamily = 'Outfit, sans-serif';
      } else if (isMonoFont) {
        finalFontFamily = 'JetBrains Mono, monospace';
      }
      
      return {
        opacity,
        transform: `${translateValue} ${scaleValue}`,
        filter: filterValue,
        transition: 'transform 100ms ease-out, opacity 100ms ease-out, filter 100ms ease-out',
        color: shot.textColor || brandKit.secondaryColor || '#D4AF37',
        fontFamily: finalFontFamily,
        fontWeight: shot.fontWeight || brandKit.fontWeight || '700'
      };
    }
    return { opacity: 0, transform: 'translateY(15px)' };
  };

  const activeSceneNum = playbackTime < 4 ? 1 : playbackTime < 8 ? 2 : 3;
  const activeShotConfig = activeSceneNum === 1 ? shot1 : activeSceneNum === 2 ? shot2 : shot3;
  const activeSceneStyle = getSceneStyle(activeSceneNum);

  return (
    <div className="space-y-20 py-8 animate-lux-in max-w-7xl mx-auto">
      {/* Tab Selector: Cinematic Raw Clip vs AI Promotional Video */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-100 pb-10 gap-8">
        <div className="space-y-1.5 text-center md:text-left">
          <h2 className="text-3xl font-serif text-emerald-950 italic flex items-center justify-center md:justify-start gap-3">
            <Film className="w-8 h-8 text-gold" />
            Maison Film & Media Studio
          </h2>
          <p className="text-xs text-black/40 tracking-wider">Configure high-fidelity video campaigns with camera motion and branding control.</p>
        </div>

        <div className="flex bg-gray-50 p-1.5 rounded-full border border-gray-100 shadow-inner">
          <button 
            onClick={() => { setVideoMode('promo'); setPlaybackTime(0); }}
            className={`px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] transition-all flex items-center gap-2.5 ${videoMode === 'promo' ? 'bg-emerald-950 text-white shadow-lg' : 'text-emerald-950/40 hover:text-emerald-950/80'}`}
          >
            <Sparkles className="w-4.5 h-4.5 text-gold" />
            AI Promo Commercial
          </button>
          <button 
            onClick={() => { setVideoMode('veo'); setIsPlaying(false); }}
            className={`px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] transition-all flex items-center gap-2.5 ${videoMode === 'veo' ? 'bg-emerald-950 text-white shadow-lg' : 'text-emerald-950/40 hover:text-emerald-950/80'}`}
          >
            <Video className="w-4.5 h-4.5" />
            Veo Raw Clip
          </button>
        </div>
      </div>

      {/* 4-Step Indicator */}
      <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-4 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-750 ${
              step.active 
                ? 'bg-gold border-gold text-white shadow-lg shadow-gold/25' 
                : 'bg-white border-gray-100 text-gray-200'
            }`}>
              {step.active ? (
                <Check className="w-4 h-4 text-white stroke-[3px]" />
              ) : step.id}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-[0.3em] text-center whitespace-nowrap ${
              step.active ? 'text-emerald-950 font-medium' : 'text-gray-300'
            }`}>{step.label}</span>
          </div>
        ))}
      </div>

      {isLocked && (
        <div className="p-8 bg-gold/5 border border-gold/20 rounded-[2.5rem] text-center max-w-3xl mx-auto shadow-sm">
          <p className="text-emerald-950 font-serif italic text-xl mb-4">Maison membership features exceeded.</p>
          <p className="text-xs text-black/40 mb-6 max-w-md mx-auto">Upgrade to Atelier or Boutique plan for unlimited high-definition commercial generation and direct downloads.</p>
          <button onClick={onInsufficientCredits} className="px-10 py-4 bg-gold text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-gold-hover shadow-xl hover:-translate-y-0.5 transition-all">Unlock Premium Atelier</button>
        </div>
      )}

      {/* Main Workspace */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-16 items-start ${isLocked ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        
        {/* Left pane: Configuration Studio (5 Grid cols) */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Step 1: Upload Source Image */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 soft-shadow space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 01</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">Source Multi-Assets</span>
            </div>
            
            {/* Active Selected Asset Preview Card */}
            <div 
              onClick={() => document.getElementById('promo_up')?.click()}
              className={`aspect-[4/3] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 relative ${sourceImage ? 'border-transparent bg-gray-50 shadow-md' : 'border-gray-100 hover:border-gold/30'}`}
            >
              {sourceImage ? (
                <>
                  <MediaAsset src={sourceImage} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">
                    <Upload className="w-5 h-5 mr-3" /> Upload Additional File
                  </div>
                </>
              ) : (
                <div className="text-center space-y-5 px-8">
                  <div className="w-14 h-14 bg-maison-bg rounded-full mx-auto flex items-center justify-center text-gold border border-gray-50 shadow-sm">
                    <Upload className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest block">Upload Brand Files</span>
                    <p className="text-[9px] text-black/30 font-serif">Accepts JPG, PNG, WebP & MP4 Videos</p>
                  </div>
                </div>
              )}
              <input type="file" id="promo_up" onChange={handleFileChange} className="hidden" accept="image/*,video/*" multiple />
            </div>

            {/* Premium HORIZONTAL MULTI-ASSET STORAGE POOL WORKSPACE (Up to 6) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.25em]">Maison Media Pool ({sourceAssets.length}/6)</span>
                <span className="text-[8px] font-mono text-gold uppercase tracking-wider">Drag to sequence / click to analyze</span>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const asset = sourceAssets[index];
                  const isActive = asset && asset.url === sourceImage;

                  if (asset) {
                    return (
                      <div 
                        key={asset.id} 
                        className={`aspect-[4/3] relative rounded-xl overflow-hidden border-2 transition-all ${
                          isActive ? 'border-gold shadow-md scale-105' : 'border-gray-100 hover:border-gold/30'
                        } group cursor-pointer`}
                      >
                        {/* Media Source */}
                        <div onClick={() => handleSelectActiveAsset(asset)} className="w-full h-full">
                          <MediaAsset src={asset.url} className="w-full h-full object-cover" />
                        </div>

                        {/* Overlays */}
                        <div className="absolute top-1 left-1 px-1 bg-black/60 rounded text-[6.5px] text-white font-mono uppercase">
                          {String.fromCharCode(65 + index)}
                        </div>

                        {/* Remove Action Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAsset(asset.id);
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 shadow-sm"
                          title="Remove asset"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <button 
                        key={`empty-${index}`}
                        onClick={() => document.getElementById('promo_up')?.click()}
                        className="aspect-[4/3] rounded-xl flex items-center justify-center border border-dashed border-gray-150 bg-gray-50 hover:bg-gray-100 transition-all text-black/20 hover:text-gold"
                        title="Add campaign asset slot"
                      >
                        <Plus className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    );
                  }
                })}
              </div>
            </div>

            {analysis && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-black/30">
                  <span>Product Type: {analysis.type}</span>
                  <span>Material: {analysis.material}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {analysis.colorPalette.map(color => (
                    <span key={color} className="px-2 py-1 bg-white border border-gray-100 text-[8px] font-mono rounded text-black/50">{color}</span>
                  ))}
                  {analysis.features.slice(0, 3).map(f => (
                    <span key={f} className="px-2 py-1 bg-emerald-50 text-emerald-950 text-[8px] font-bold uppercase tracking-wider rounded">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Storyboard Copilot (Only for Promo mode) */}
          {videoMode === 'promo' && (
            <div className="bg-gradient-to-br from-emerald-950 to-teal-950 text-white rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                <Sparkles className="w-48 h-48 text-gold" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-gold shrink-0 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">AI Campaign Copilot</span>
                </div>
                <h3 className="text-xl font-serif italic text-white">Synthesize Luxury Storyboard</h3>
                <p className="text-[10px] text-white/50 tracking-wide font-sans leading-relaxed">
                  Let our luxury copywriting model compose high-fashion narratives, dynamic scene motion paths, and precise typography copy matched to your product's DNA.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest block ml-1">Custom Product Name (Optional)</label>
                  <input 
                    type="text" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Al-Miraj Royal Sapphire Watch"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-xs text-white placeholder-white/20 outline-none focus:border-gold/50"
                  />
                </div>

                <button 
                  onClick={handleGenerateAiStoryboard} 
                  disabled={aiStoryboardLoading || !sourceImage}
                  className={`w-full py-4 rounded-full font-bold text-[9px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg ${
                    aiStoryboardLoading || !sourceImage 
                      ? 'bg-white/5 text-white/10 select-none' 
                      : 'bg-gold hover:bg-gold-hover text-white shadow-gold/10'
                  }`}
                >
                  {aiStoryboardLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Synthesizing Storyboard...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Orchestrate AI Storyboard
                    </>
                  ) || 'Orchestrate AI Storyboard'}
                </button>
              </div>
            </div>
          )}

          {/* LA MAISON PRODUCTION BOARD: AGENT PLANNER & CREATIVE DIRETOR (For high-quality Reels & TVC) */}
          {videoMode === 'promo' && (
            <div className="bg-white border border-gray-150 rounded-[2.5rem] p-8 soft-shadow space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-5">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Director's Room</span>
                </div>
                <span className="px-2.5 py-1 bg-gold/10 text-gold text-[7.5px] font-bold uppercase tracking-widest rounded-full">Planner + Creative Director</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.25em] block">Campaign Preset Format</span>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setCampaignType('reel')}
                    className={`py-2 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                      campaignType === 'reel' ? 'bg-emerald-950 text-white shadow-inner' : 'text-black/30 hover:text-black/60'
                    }`}
                  >
                    🚀 HD Reel (9:16)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCampaignType('tvc')}
                    className={`py-2 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                      campaignType === 'tvc' ? 'bg-emerald-950 text-white shadow-inner' : 'text-black/30 hover:text-black/60'
                    }`}
                  >
                    📺 Premium TVC (16:9)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-black/30 uppercase tracking-[0.25em] block ml-1">Special Script Directives / Pacing</label>
                <textarea 
                  value={additionalPlannerNotes}
                  onChange={(e) => setAdditionalPlannerNotes(e.target.value)}
                  placeholder="e.g. Model walks majestically through a sun-drenched marble corridor, holding the piece. Slow cinematic wind effects..."
                  rows={3}
                  className="w-full bg-gray-50/50 rounded-xl px-4 py-3 text-xs text-black placeholder-black/30 outline-none border border-gray-100 focus:border-gold/30 font-sans"
                />
              </div>

              <button 
                type="button"
                onClick={handleGenerateProductionBrief}
                disabled={isPlannerLoading || !sourceImage}
                className={`w-full py-4 rounded-full font-bold text-[9px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg ${
                  isPlannerLoading || !sourceImage 
                    ? 'bg-gray-50 text-black/10 select-none' 
                    : 'bg-emerald-950 hover:bg-black text-white hover:scale-[1.01]'
                }`}
              >
                {isPlannerLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Board Collaboration in Session...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    Compose Production Brief
                  </>
                )}
              </button>

              {/* Generated Brief Results Dashboard */}
              {plannerBrief && (
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm pt-4 space-y-4 animate-in slide-in-from-bottom-2">
                  <div className="flex border-b border-gray-100 px-2 justify-between">
                    {[
                      { id: 'planner', label: 'Agent Planner' },
                      { id: 'creative', label: 'Creative Treatment' },
                      { id: 'storyboard', label: 'Draft Script' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        type="button"
                        onClick={() => setActivePlannerTab(tab.id as any)}
                        className={`py-2 px-3 text-[8.5px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                          activePlannerTab === tab.id ? 'border-gold text-emerald-950' : 'border-transparent text-black/30'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 space-y-3 bg-gray-50/40 rounded-xl max-h-72 overflow-y-auto font-sans text-xs text-black/70 leading-relaxed">
                    {activePlannerTab === 'planner' && (
                      <div className="space-y-4">
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">📍 Elite Film Location</span>
                          <p className="text-[10px] font-medium text-emerald-950 mt-1">{plannerBrief.agentPlanner.locationRecommendation}</p>
                        </div>
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">🎥 Cinema Gear Specifications</span>
                          <p className="text-[10px] text-black/70 mt-1">{plannerBrief.agentPlanner.equipmentSpec}</p>
                        </div>
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">📅 Shoot Checklist Schedule</span>
                          <ul className="list-disc pl-4 space-y-1 mt-1 text-[10px]">
                            {plannerBrief.agentPlanner.shootSchedule.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-950 text-[9px] font-medium leading-relaxed">
                          💡 <strong>Planner Tip:</strong> {plannerBrief.agentPlanner.budgetTips}
                        </div>
                      </div>
                    )}

                    {activePlannerTab === 'creative' && (
                      <div className="space-y-4">
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">🎨 Director's treatment statement</span>
                          <p className="text-[10.5px] text-emerald-950 mt-1 italic font-serif leading-relaxed block">"{plannerBrief.creativeDirector.treatment}"</p>
                        </div>
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">☀️ Lighting & Lux Direction</span>
                          <p className="text-[10px] mt-0.5">{plannerBrief.creativeDirector.lightingVibe}</p>
                        </div>
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">👗 Costume & Accessory Styling Code</span>
                          <p className="text-[10px] mt-0.5">{plannerBrief.creativeDirector.stylingCostume}</p>
                        </div>
                        <div>
                          <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold">🎵 Sound Design Architecture</span>
                          <p className="text-[10px] mt-0.5">{plannerBrief.creativeDirector.musicVibe}</p>
                        </div>
                      </div>
                    )}

                    {activePlannerTab === 'storyboard' && (
                      <div className="space-y-3.5">
                        <span className="text-[7.5px] font-mono text-gold uppercase tracking-wider block font-bold mb-2">🎬 Generative 3-Shot Scripting</span>
                        
                        <div className="space-y-2.5">
                          <div className="border-l-2 border-emerald-900 pl-2">
                            <strong className="text-[9px] text-emerald-900 block font-bold">Scene 1 (Intro): "{plannerBrief.storyboardApplied.s1Text}"</strong>
                            <p className="text-[8.5px] mt-0.5">Motion: {plannerBrief.storyboardApplied.s1Motion} • {plannerBrief.storyboardApplied.s1Brief}</p>
                          </div>
                          
                          <div className="border-l-2 border-emerald-900 pl-2">
                            <strong className="text-[9px] text-emerald-900 block font-bold">Scene 2 (Reveal): "{plannerBrief.storyboardApplied.s2Text}"</strong>
                            <p className="text-[8.5px] mt-0.5">Motion: {plannerBrief.storyboardApplied.s2Motion} • {plannerBrief.storyboardApplied.s2Brief}</p>
                          </div>

                          <div className="border-l-2 border-emerald-900 pl-2">
                            <strong className="text-[9px] text-emerald-900 block font-bold">Scene 3 (CTA): "{plannerBrief.storyboardApplied.s3Text}"</strong>
                            <p className="text-[8.5px] mt-0.5">Motion: {plannerBrief.storyboardApplied.s3Motion} • {plannerBrief.storyboardApplied.s3Brief}</p>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={handleApplyPlannerStoryboard}
                          className="w-full mt-3 py-2.5 bg-gold hover:bg-gold-hover text-white rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-gold/15"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Live Sync & Apply to Storyboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 & 3: Configuration Inputs depending on Selected Mode */}
          {videoMode === 'veo' ? (
            /* VEO Mode Configuration Panel */
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 soft-shadow space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 02</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">Motion Blueprint</span>
              </div>
              
              <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100">
                <button 
                  onClick={() => setVeoDetails({...veoDetails, renderMode: 'product-only'})}
                  className={`flex-1 py-3.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${veoDetails.renderMode === 'product-only' ? 'bg-white text-emerald-950 shadow-md' : 'text-emerald-950/20'}`}
                >
                  Product Standalone
                </button>
                <button 
                  onClick={() => setVeoDetails({...veoDetails, renderMode: 'on-model'})}
                  className={`flex-1 py-3.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${veoDetails.renderMode === 'on-model' ? 'bg-white text-emerald-950 shadow-md' : 'text-emerald-950/20'}`}
                >
                  Modest Talent Casting
                </button>
              </div>

              {veoDetails.renderMode === 'on-model' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm animate-in slide-in-from-bottom-2">
                  <ModelShowcase compact selectedModelId={selectedModel?.id} onModelSelect={setSelectedModel} />
                </div>
              )}

              <div className="space-y-4">
                <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] block ml-1">Cinematic Camera Motion</span>
                <div className="flex flex-wrap gap-1.5">
                  {motionPresets.map(motion => (
                    <button
                      key={motion}
                      onClick={() => setVeoDetails({...veoDetails, cameraMotion: motion})}
                      className={`px-4 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${
                        veoDetails.cameraMotion === motion ? 'bg-gold border-gold text-white shadow-md' : 'bg-white border-gray-50 text-black/20 hover:text-black/60'
                      }`}
                    >
                      {motion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cinematic Lighting Setup Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center ml-1">
                  <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] block">Lighting Environment</span>
                  <span className="text-[8px] font-mono text-gold uppercase tracking-wider">{veoDetails.lightingPreset || 'Golden Hour'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Golden Hour', label: '🌤️ Golden Hour', desc: 'Warm sunset glow' },
                    { id: 'Studio High-Key', label: '💡 Studio High-Key', desc: 'Diffused white studio' },
                    { id: 'Moody Noir', label: '🎬 Moody Noir', desc: 'High-contrast shadow' },
                    { id: 'Hyper-Real Bright', label: '☀️ Hyper-Real Bright', desc: 'Vibrant solar rays' }
                  ].map(preset => {
                    const isSelected = (veoDetails.lightingPreset || 'Golden Hour') === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setVeoDetails({...veoDetails, lightingPreset: preset.id})}
                        className={`p-3.5 rounded-2xl flex flex-col items-start gap-1 text-left transition-all border ${
                          isSelected ? 'bg-emerald-950 border-emerald-950 text-white shadow-md' : 'bg-white border-gray-100 text-black/60 hover:bg-gray-50 hover:border-gold/30'
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider block">{preset.label}</span>
                        <span className={`text-[7.5px] block font-serif ${isSelected ? 'text-white/60' : 'text-black/30'}`}>{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] block ml-1">Atmosphere Directive</span>
                <textarea 
                  value={veoPrompt} 
                  onChange={(e) => setVeoPrompt(e.target.value)} 
                  placeholder="Describe the environment, lighting, backdrops, and material reflections..." 
                  className="w-full bg-maison-bg border-none rounded-2xl p-6 text-xs text-black font-serif italic min-h-[140px] focus:ring-1 focus:ring-gold outline-none"
                />
              </div>

              <div className="border-t border-gray-150 pt-5">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-1 group"
                >
                  <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] group-hover:text-gold transition-colors">Advanced Synthesis Optics</span>
                  <ChevronDown className={`w-4 h-4 text-black/20 transition-transform duration-500 ${showAdvanced ? 'rotate-180 text-gold' : ''}`} />
                </button>
                {showAdvanced && (
                  <div className="pt-5 grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Camera Angle</label>
                       <select value={veoDetails.cameraAngle} onChange={(e) => setVeoDetails({...veoDetails, cameraAngle: e.target.value as CameraAngle})} className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none">
                          {cameraAngles.map(angle => (
                            <option key={angle} value={angle}>{angle}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Resolution</label>
                       <select value={veoDetails.videoResolution} onChange={(e) => setVeoDetails({...veoDetails, videoResolution: e.target.value as any})} className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none">
                          <option value="720p">720p Optimized</option>
                          <option value="1080p">1080p Cinematic</option>
                       </select>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerateVeoClip} 
                disabled={state === AppState.GENERATING || !sourceImage || veoPrompt.length < 5}
                className={`w-full py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all shadow-lg ${
                  state === AppState.GENERATING || !sourceImage || veoPrompt.length < 5 ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold hover:shadow-gold/20'
                }`}
              >
                {state === AppState.GENERATING ? loadingMsg : 'Execute Synthesis'}
              </button>
            </div>
          ) : (
            /* AI PROMO BOARD Choreography CONFIG Panel */
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 soft-shadow space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 02 & 03</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">Scene Director</span>
              </div>

              {/* Brand-New Interactive AI Text Overlay & Typographic Style Suite */}
              <div className="bg-gradient-to-br from-emerald-950/5 via-gold/5 to-amber-950/5 border border-gold/15 rounded-3xl p-5 space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-gold animate-pulse" />
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-950">Narrative Text & Auto-Stylist Suite</h5>
                    <p className="text-[8px] text-black/40 font-mono">Dynamic Brand Kit Alignment Engine</p>
                  </div>
                </div>

                {/* Section A: Slogans Auto-Generation */}
                <div className="space-y-2.5">
                  <span className="text-[8px] font-bold text-emerald-950/60 uppercase tracking-wider block">1. Automatically Generate Caption Sets ({brandKit.tone} theme)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Minimal', 'Opulent', 'Street', 'Classic', 'Editorial'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => generateBrandKitCaptions(t)}
                        className={`px-3 py-1.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider border transition-all ${
                          brandKit.tone === t 
                            ? 'bg-emerald-950 border-emerald-950 text-white shadow-sm' 
                            : 'bg-white border-gray-200 text-black/40 hover:text-black/80 hover:border-black/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => generateBrandKitCaptions()}
                    className="w-full py-2.5 bg-black hover:bg-gold text-white text-[8px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold" /> Generate {brandKit.tone} Captions for all 3 shots
                  </button>
                </div>

                {/* Section B: Global Timeline Animations */}
                <div className="space-y-2 pt-2 border-t border-gray-200/50">
                  <span className="text-[8px] font-bold text-emerald-950/60 uppercase tracking-wider block">2. Select Timeline Text Animation Preset</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'Fade-Slide', label: 'Slide Up & Fade' },
                      { id: 'Reveal-Zoom', label: 'Ethereal Zoom' },
                      { id: 'Slow-Blur', label: 'Cinema Focus Blur' },
                      { id: 'Classic-Fade', label: 'Modern Fade' },
                      { id: 'Dramatic-Bounce', label: 'Dramatic Overshoot' },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() => applyGlobalCaptionStyle({ animationStyle: anim.id as any })}
                        className="px-2 py-1.5 rounded-lg text-[7.5px] font-bold text-left uppercase tracking-wider border bg-white border-gray-150 hover:border-gold text-black/60 focus:ring-1 focus:ring-gold outline-none"
                      >
                        ⚡ {anim.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section C: Advanced Typography Presets */}
                <div className="space-y-2 pt-2 border-t border-gray-200/50">
                  <span className="text-[8px] font-bold text-emerald-950/60 uppercase tracking-wider block">3. Apply Global Brand Typography Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[7px] font-mono font-bold text-black/40 uppercase">Font Preset</label>
                      <select
                        onChange={(e) => applyGlobalCaptionStyle({ fontStyle: e.target.value as any })}
                        className="w-full bg-white px-2.5 py-1.5 text-[8.5px] font-bold uppercase tracking-wide rounded-lg border border-gray-150 text-emerald-950 outline-none focus:border-gold"
                      >
                        <option value="primary">Primary ({brandKit.primaryFont || 'Serif'})</option>
                        <option value="secondary">Secondary ({brandKit.secondaryFont || 'Sans'})</option>
                        <option value="accent">Modern Outfit</option>
                        <option value="mono">Technical Mono</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[7px] font-mono font-bold text-black/40 uppercase">Text Dimension</label>
                      <select
                        onChange={(e) => applyGlobalCaptionStyle({ fontSize: e.target.value as any })}
                        className="w-full bg-white px-2.5 py-1.5 text-[8.5px] font-bold uppercase tracking-wide rounded-lg border border-gray-150 text-emerald-950 outline-none focus:border-gold"
                      >
                        <option value="lg">Balanced (LG)</option>
                        <option value="sm">Understated (SM)</option>
                        <option value="md">Curated (MD)</option>
                        <option value="xl">Display (XL)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <div className="space-y-1">
                      <label className="text-[7px] font-mono font-bold text-black/40 uppercase">Text Color Theme</label>
                      <div className="flex gap-1">
                        {[
                          { val: brandKit.secondaryColor || '#D4AF37', label: 'Secondary' },
                          { val: brandKit.primaryColor || '#022c22', label: 'Primary' },
                          { val: '#ffffff', label: 'White' },
                        ].map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() => applyGlobalCaptionStyle({ textColor: c.val })}
                            className="flex-1 py-1 px-1.5 rounded-lg text-[6.5px] font-bold uppercase border bg-white border-gray-150 text-black/50 hover:border-gold"
                            title={c.val}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 flex flex-col justify-end">
                      <span className="text-[7px] bg-white border border-dashed border-gold/40 text-gold px-2 py-1.5 rounded-lg block font-mono text-center select-none uppercase tracking-[0.1em] font-bold">
                        ACTIVE CAPTION HUD READY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* E-Commerce Storyboard Templates Library */}
              <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 space-y-4 shadow-xl border border-gold/20">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-gold" />
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold text-white/90">E-Commerce Blueprint Library</h4>
                      <p className="text-[8px] text-white/40 font-mono">Curated structures to drive high-converting product clicks</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-gold/20 text-gold text-[7px] font-bold uppercase tracking-wider rounded border border-gold/10">ATELIER TEMPLATES</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {STORYBOARD_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden ${
                          isSelected 
                            ? 'bg-zinc-900/90 border-gold shadow-md shadow-gold/15 text-white' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
                        }`}
                      >
                        <div className="space-y-1 relative z-10 w-full">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-gold' : 'text-white'}`}>
                              {tpl.name}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                            )}
                          </div>
                          <p className="text-[7.5px] text-white/50 leading-relaxed line-clamp-2">
                            {tpl.desc}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 relative z-10 text-[6.5px] font-mono text-white/30 uppercase tracking-widest leading-none">
                          <span>{tpl.shot1.motion}</span>
                          <span>•</span>
                          <span>{tpl.shot2.motion}</span>
                          <span>•</span>
                          <span>{tpl.shot3.motion}</span>
                        </div>

                        {isSelected && (
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                            <Check className="w-16 h-16 text-gold" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-950">Choreographically Timed Scenes</h4>
                <p className="text-[9px] text-black/30 tracking-wide font-sans">Multi-shot planning: 3 scenes flowing continuously at 4-seconds pacing.</p>
              </div>

              <div className="space-y-4">
                {/* Scene 1 Card */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedShot(expandedShot === 1 ? null : 1)}
                    className="w-full bg-gray-50 px-5 py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-950 text-white text-[9px] font-bold flex items-center justify-center">1</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-950">Scene 01: Introduction Reveal (0-4s)</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-black/20 transition-transform ${expandedShot === 1 ? 'rotate-180 text-gold' : ''}`} />
                  </button>
                  {expandedShot === 1 && (
                    <div className="p-5 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Overlay Caption Copy</label>
                        <input 
                          type="text" 
                          value={shot1.text}
                          onChange={(e) => setShot1({...shot1, text: e.target.value.toUpperCase()})}
                          maxLength={35}
                          className="w-full bg-maison-bg rounded-xl px-4 py-3 text-xs text-black outline-none border border-transparent focus:border-gold/30 font-serif"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Pan/Zoom Motion</label>
                          <select 
                            value={shot1.motion}
                            onChange={(e) => setShot1({...shot1, motion: e.target.value})}
                            className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none"
                          >
                            {motionPresets.map(m => (<option key={m} value={m}>{m}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Overlay Placement</label>
                          <select 
                            value={shot1.placement}
                            onChange={(e) => setShot1({...shot1, placement: e.target.value as any})}
                            className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none"
                          >
                            <option value="Top-Center">Top-Center</option>
                            <option value="Center-Left">Center-Left</option>
                            <option value="Bottom-Center">Bottom-Center</option>
                            <option value="Right-Sidebar">Right-Sidebar</option>
                          </select>
                        </div>
                      </div>

                      {/* Cast Models and Walking choreography segment */}
                      <div className="pt-3 border-t border-gray-150 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-black/45 uppercase tracking-widest block">Cast & Choreography Directions</span>
                          <span className="bg-emerald-50 text-emerald-950 px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold uppercase">100% Quality Locked</span>
                        </div>

                        {/* Model Badges */}
                        <div className="space-y-1.5">
                          <label className="text-[7.5px] font-mono text-black/40 uppercase">Model Selection (Select multiple)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {modelData.map(m => {
                              const isSelected = (shot1.selectedModelIds || []).includes(m.id);
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => {
                                    const current = shot1.selectedModelIds || [];
                                    const next = current.includes(m.id) 
                                      ? current.filter(id => id !== m.id)
                                      : [...current, m.id];
                                    setShot1({ ...shot1, selectedModelIds: next });
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all border flex items-center gap-1.5 ${
                                    isSelected 
                                      ? 'bg-gold border-gold text-white shadow-sm' 
                                      : 'bg-gray-50 border-gray-100 text-black/45 hover:border-gold/30'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {m.name} ({m.nationality})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Choreography text and actions */}
                        <div className="space-y-1.5">
                          <label className="text-[7.5px] font-mono text-black/40 uppercase">Walking and Action Choreography</label>
                          <textarea
                            value={shot1.choreographyDirections || ''}
                            onChange={(e) => setShot1({ ...shot1, choreographyDirections: e.target.value })}
                            placeholder="e.g. Model turns gracefully to the camera, walks 3 paces with silk flowing..."
                            rows={2}
                            className="w-full bg-maison-bg rounded-xl px-3 py-2 text-[9.5px] text-black outline-none border border-transparent focus:border-gold/30 font-sans"
                          />
                        </div>
                      </div>

                      {/* INDIVIDUAL SCENE 1 TYPOGRAPHIC OVERRIDES */}
                      <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                        <span className="text-[7.5px] font-mono font-bold text-black/35 uppercase tracking-wider block">Scene 1 Caption Styling Overrides</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Animation</label>
                            <select
                              value={shot1.animationStyle || 'Fade-Slide'}
                              onChange={(e) => setShot1({...shot1, animationStyle: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="Fade-Slide">Slide-Up</option>
                              <option value="Reveal-Zoom">Reveal-Zoom</option>
                              <option value="Slow-Blur">Slow-Blur</option>
                              <option value="Classic-Fade">Fade</option>
                              <option value="Dramatic-Bounce">Bounce</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Font Preset</label>
                            <select
                              value={shot1.fontStyle || 'primary'}
                              onChange={(e) => setShot1({...shot1, fontStyle: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="primary">Primary</option>
                              <option value="secondary">Secondary</option>
                              <option value="accent">Modern</option>
                              <option value="mono">Mono</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Font Size</label>
                            <select
                              value={shot1.fontSize || 'lg'}
                              onChange={(e) => setShot1({...shot1, fontSize: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                              <option value="xl">X-Large</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase block">Custom Hex Color</label>
                            <div className="flex gap-1.5 items-center">
                              <input 
                                type="color" 
                                value={shot1.textColor || brandKit.secondaryColor || '#D4AF37'} 
                                onChange={(e) => setShot1({...shot1, textColor: e.target.value})}
                                className="w-6 h-6 p-0 rounded-md border-0 bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text" 
                                placeholder="#HEX" 
                                value={shot1.textColor || ''} 
                                onChange={(e) => setShot1({...shot1, textColor: e.target.value})}
                                className="w-full bg-maison-bg rounded-lg px-2 py-1.5 text-[8.5px] font-mono text-black outline-none border border-transparent focus:border-gold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scene 2 Card */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedShot(expandedShot === 2 ? null : 2)}
                    className="w-full bg-gray-50 px-5 py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-950 text-white text-[9px] font-bold flex items-center justify-center">2</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-950">Scene 02: Highlight Zoom (4-8s)</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-black/20 transition-transform ${expandedShot === 2 ? 'rotate-180 text-gold' : ''}`} />
                  </button>
                  {expandedShot === 2 && (
                    <div className="p-5 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Overlay Caption Copy</label>
                        <input 
                          type="text" 
                          value={shot2.text}
                          onChange={(e) => setShot2({...shot2, text: e.target.value.toUpperCase()})}
                          maxLength={35}
                          className="w-full bg-maison-bg rounded-xl px-4 py-3 text-xs text-black outline-none border border-transparent focus:border-gold/30 font-serif"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Pan/Zoom Motion</label>
                          <select 
                            value={shot2.motion}
                            onChange={(e) => setShot2({...shot2, motion: e.target.value})}
                            className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none"
                          >
                            {motionPresets.map(m => (<option key={m} value={m}>{m}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Overlay Placement</label>
                          <select 
                            value={shot2.placement}
                            onChange={(e) => setShot2({...shot2, placement: e.target.value as any})}
                            className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none"
                          >
                            <option value="Top-Center">Top-Center</option>
                            <option value="Center-Left">Center-Left</option>
                            <option value="Bottom-Center">Bottom-Center</option>
                            <option value="Right-Sidebar">Right-Sidebar</option>
                          </select>
                        </div>
                      </div>

                      {/* Cast Models and Walking choreography segment */}
                      <div className="pt-3 border-t border-gray-150 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-black/45 uppercase tracking-widest block">Cast & Choreography Directions</span>
                          <span className="bg-emerald-50 text-emerald-950 px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold uppercase">100% Quality Locked</span>
                        </div>

                        {/* Model Badges */}
                        <div className="space-y-1.5">
                          <label className="text-[7.5px] font-mono text-black/40 uppercase">Model Selection (Select multiple)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {modelData.map(m => {
                              const isSelected = (shot2.selectedModelIds || []).includes(m.id);
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => {
                                    const current = shot2.selectedModelIds || [];
                                    const next = current.includes(m.id) 
                                      ? current.filter(id => id !== m.id)
                                      : [...current, m.id];
                                    setShot2({ ...shot2, selectedModelIds: next });
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all border flex items-center gap-1.5 ${
                                    isSelected 
                                      ? 'bg-gold border-gold text-white shadow-sm' 
                                      : 'bg-gray-50 border-gray-100 text-black/45 hover:border-gold/30'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {m.name} ({m.nationality})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Choreography text and actions */}
                        <div className="space-y-1.5">
                          <label className="text-[7.5px] font-mono text-black/40 uppercase">Walking and Action Choreography</label>
                          <textarea
                            value={shot2.choreographyDirections || ''}
                            onChange={(e) => setShot2({ ...shot2, choreographyDirections: e.target.value })}
                            placeholder="e.g. Model turns gracefully to the camera, walks 3 paces with silk flowing..."
                            rows={2}
                            className="w-full bg-maison-bg rounded-xl px-3 py-2 text-[9.5px] text-black outline-none border border-transparent focus:border-gold/30 font-sans"
                          />
                        </div>
                      </div>

                      {/* INDIVIDUAL SCENE 2 TYPOGRAPHIC OVERRIDES */}
                      <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                        <span className="text-[7.5px] font-mono font-bold text-black/35 uppercase tracking-wider block">Scene 2 Caption Styling Overrides</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Animation</label>
                            <select
                              value={shot2.animationStyle || 'Fade-Slide'}
                              onChange={(e) => setShot2({...shot2, animationStyle: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="Fade-Slide">Slide-Up</option>
                              <option value="Reveal-Zoom">Reveal-Zoom</option>
                              <option value="Slow-Blur">Slow-Blur</option>
                              <option value="Classic-Fade">Fade</option>
                              <option value="Dramatic-Bounce">Bounce</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Font Preset</label>
                            <select
                              value={shot2.fontStyle || 'primary'}
                              onChange={(e) => setShot2({...shot2, fontStyle: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="primary">Primary</option>
                              <option value="secondary">Secondary</option>
                              <option value="accent">Modern</option>
                              <option value="mono">Mono</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Font Size</label>
                            <select
                              value={shot2.fontSize || 'lg'}
                              onChange={(e) => setShot2({...shot2, fontSize: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                              <option value="xl">X-Large</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase block">Custom Hex Color</label>
                            <div className="flex gap-1.5 items-center">
                              <input 
                                type="color" 
                                value={shot2.textColor || brandKit.secondaryColor || '#D4AF37'} 
                                onChange={(e) => setShot2({...shot2, textColor: e.target.value})}
                                className="w-6 h-6 p-0 rounded-md border-0 bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text" 
                                placeholder="#HEX" 
                                value={shot2.textColor || ''} 
                                onChange={(e) => setShot2({...shot2, textColor: e.target.value})}
                                className="w-full bg-maison-bg rounded-lg px-2 py-1.5 text-[8.5px] font-mono text-black outline-none border border-transparent focus:border-gold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scene 3 Card */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedShot(expandedShot === 3 ? null : 3)}
                    className="w-full bg-gray-50 px-5 py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-950 text-white text-[9px] font-bold flex items-center justify-center">3</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-950">Scene 03: Outro & CTA (8-12s)</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-black/20 transition-transform ${expandedShot === 3 ? 'rotate-180 text-gold' : ''}`} />
                  </button>
                  {expandedShot === 3 && (
                    <div className="p-5 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Overlay Caption Copy</label>
                        <input 
                          type="text" 
                          value={shot3.text}
                          onChange={(e) => setShot3({...shot3, text: e.target.value.toUpperCase()})}
                          maxLength={35}
                          className="w-full bg-maison-bg rounded-xl px-4 py-3 text-xs text-black outline-none border border-transparent focus:border-gold/30 font-serif"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Pan/Zoom Motion</label>
                          <select 
                            value={shot3.motion}
                            onChange={(e) => setShot3({...shot3, motion: e.target.value})}
                            className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none"
                          >
                            {motionPresets.map(m => (<option key={m} value={m}>{m}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Overlay Placement</label>
                          <select 
                            value={shot3.placement}
                            onChange={(e) => setShot3({...shot3, placement: e.target.value as any})}
                            className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none"
                          >
                            <option value="Top-Center">Top-Center</option>
                            <option value="Center-Left">Center-Left</option>
                            <option value="Bottom-Center">Bottom-Center</option>
                            <option value="Right-Sidebar">Right-Sidebar</option>
                          </select>
                        </div>
                      </div>

                      {/* Cast Models and Walking choreography segment */}
                      <div className="pt-3 border-t border-gray-150 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-black/45 uppercase tracking-widest block">Cast & Choreography Directions</span>
                          <span className="bg-emerald-50 text-emerald-950 px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold uppercase">100% Quality Locked</span>
                        </div>

                        {/* Model Badges */}
                        <div className="space-y-1.5">
                          <label className="text-[7.5px] font-mono text-black/40 uppercase">Model Selection (Select multiple)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {modelData.map(m => {
                              const isSelected = (shot3.selectedModelIds || []).includes(m.id);
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => {
                                    const current = shot3.selectedModelIds || [];
                                    const next = current.includes(m.id) 
                                      ? current.filter(id => id !== m.id)
                                      : [...current, m.id];
                                    setShot3({ ...shot3, selectedModelIds: next });
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all border flex items-center gap-1.5 ${
                                    isSelected 
                                      ? 'bg-gold border-gold text-white shadow-sm' 
                                      : 'bg-gray-50 border-gray-100 text-black/45 hover:border-gold/30'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {m.name} ({m.nationality})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Choreography text and actions */}
                        <div className="space-y-1.5">
                          <label className="text-[7.5px] font-mono text-black/40 uppercase">Walking and Action Choreography</label>
                          <textarea
                            value={shot3.choreographyDirections || ''}
                            onChange={(e) => setShot3({ ...shot3, choreographyDirections: e.target.value })}
                            placeholder="e.g. Model turns gracefully to the camera, walks 3 paces with silk flowing..."
                            rows={2}
                            className="w-full bg-maison-bg rounded-xl px-3 py-2 text-[9.5px] text-black outline-none border border-transparent focus:border-gold/30 font-sans"
                          />
                        </div>
                      </div>

                      {/* INDIVIDUAL SCENE 3 TYPOGRAPHIC OVERRIDES */}
                      <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                        <span className="text-[7.5px] font-mono font-bold text-black/35 uppercase tracking-wider block">Scene 3 Caption Styling Overrides</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Animation</label>
                            <select
                              value={shot3.animationStyle || 'Fade-Slide'}
                              onChange={(e) => setShot3({...shot3, animationStyle: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="Fade-Slide">Slide-Up</option>
                              <option value="Reveal-Zoom">Reveal-Zoom</option>
                              <option value="Slow-Blur">Slow-Blur</option>
                              <option value="Classic-Fade">Fade</option>
                              <option value="Dramatic-Bounce">Bounce</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Font Preset</label>
                            <select
                              value={shot3.fontStyle || 'primary'}
                              onChange={(e) => setShot3({...shot3, fontStyle: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="primary">Primary</option>
                              <option value="secondary">Secondary</option>
                              <option value="accent">Modern</option>
                              <option value="mono">Mono</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase">Font Size</label>
                            <select
                              value={shot3.fontSize || 'lg'}
                              onChange={(e) => setShot3({...shot3, fontSize: e.target.value as any})}
                              className="w-full bg-maison-bg rounded-lg px-2.5 py-2 text-[8px] font-bold uppercase outline-none"
                            >
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                              <option value="xl">X-Large</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[7px] font-mono text-black/40 uppercase block">Custom Hex Color</label>
                            <div className="flex gap-1.5 items-center">
                              <input 
                                type="color" 
                                value={shot3.textColor || brandKit.secondaryColor || '#D4AF37'} 
                                onChange={(e) => setShot3({...shot3, textColor: e.target.value})}
                                className="w-6 h-6 p-0 rounded-md border-0 bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text" 
                                placeholder="#HEX" 
                                value={shot3.textColor || ''} 
                                onChange={(e) => setShot3({...shot3, textColor: e.target.value})}
                                className="w-full bg-maison-bg rounded-lg px-2 py-1.5 text-[8.5px] font-mono text-black outline-none border border-transparent focus:border-gold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Cuts Transitions Board */}
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <span className="text-[10px] font-bold text-black tracking-[0.25em] uppercase block">Flow Transitions Board</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Transition 1-&gt;2</label>
                    <select 
                      value={transition1}
                      onChange={(e) => setTransition1(e.target.value as any)}
                      className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none border border-transparent focus:border-gold/10"
                    >
                      <option value="Cross-dissolve">Cross-dissolve</option>
                      <option value="Camera Pan">Camera Pan</option>
                      <option value="Zoom In">Zoom In</option>
                      <option value="Zoom Blur">Zoom Blur</option>
                      <option value="Whip Pan">Whip Pan</option>
                      <option value="Fade to Slate">Fade to Slate</option>
                      <option value="Instant Cut">Instant Cut</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Transition 2-&gt;3</label>
                    <select 
                      value={transition2}
                      onChange={(e) => setTransition2(e.target.value as any)}
                      className="w-full bg-maison-bg rounded-xl px-4 py-3 text-[9px] font-bold uppercase outline-none border border-transparent focus:border-gold/10"
                    >
                      <option value="Cross-dissolve">Cross-dissolve</option>
                      <option value="Camera Pan">Camera Pan</option>
                      <option value="Zoom In">Zoom In</option>
                      <option value="Zoom Blur">Zoom Blur</option>
                      <option value="Whip Pan">Whip Pan</option>
                      <option value="Fade to Slate">Fade to Slate</option>
                      <option value="Instant Cut">Instant Cut</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cinematic Soundscape & Ambient Audio Board */}
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-gold shrink-0 animate-pulse" />
                    <span className="text-[9px] font-bold text-black tracking-wider uppercase block">Cinematic Soundscape</span>
                  </div>
                  
                  {/* Volume and Mute Controls */}
                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-100">
                    <button 
                      onClick={() => setIsMusicMuted(!isMusicMuted)}
                      className="text-gray-500 hover:text-gold transition-colors"
                      title={isMusicMuted ? "Unmute" : "Mute"}
                    >
                      {isMusicMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-black/40" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-950" />
                      )}
                    </button>
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={musicVolume}
                      onChange={(e) => {
                        setMusicVolume(parseFloat(e.target.value));
                        if(isMusicMuted) setIsMusicMuted(false);
                      }}
                      className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gold focus:outline-none"
                    />
                    <span className="font-mono text-[8px] font-bold text-black/50">
                      {Math.round((isMusicMuted ? 0 : musicVolume) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Music Track Selector */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Soundtrack Preset</label>
                    <select
                      value={selectedMusicTrack}
                      onChange={(e) => setSelectedMusicTrack(e.target.value)}
                      className="w-full bg-white border border-gray-150 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-gold/30"
                    >
                      {ambientMusicPresets.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name}
                        </option>
                      ))}
                      <option value="custom">── custom audio track ──</option>
                    </select>
                  </div>

                  {/* Vibe / Info block */}
                  {selectedMusicTrack !== 'custom' ? (
                    <div className="bg-emerald-950/5 rounded-xl px-4 py-2.5">
                      <span className="text-[7px] font-bold text-black/30 uppercase tracking-widest block mb-0.5">Vibe Essence</span>
                      <p className="text-[10px] text-emerald-900 font-serif italic font-medium">
                        {ambientMusicPresets.find(t => t.id === selectedMusicTrack)?.vibe}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gold/5 border border-gold/15 rounded-xl p-3 space-y-2 text-center">
                      <span className="text-[8px] font-bold text-gold uppercase tracking-widest block">Upload Custom Audio</span>
                      
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="audio/*" 
                          id="audio-upload-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (customMusicUrl) {
                                URL.revokeObjectURL(customMusicUrl);
                              }
                              const url = URL.createObjectURL(file);
                              setCustomMusicUrl(url);
                              setCustomMusicName(file.name);
                              setSelectedMusicTrack('custom');
                            }
                          }}
                          className="hidden" 
                        />
                        <label 
                          htmlFor="audio-upload-input"
                          className="flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 hover:border-gold hover:text-gold text-[9px] font-bold uppercase cursor-pointer transition-colors shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {customMusicName ? 'Replace Audio File' : 'Choose Audio File'}
                        </label>
                      </div>

                      {customMusicName && (
                        <div className="text-[9px] text-emerald-900 font-mono font-bold flex items-center justify-center gap-1.5 bg-emerald-950/5 py-1 px-2 rounded-lg">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]" title={customMusicName}>{customMusicName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct upload shortcut */}
                  {selectedMusicTrack !== 'custom' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedMusicTrack('custom')}
                        className="text-[8px] font-bold text-gold hover:text-emerald-950 uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        or upload your own soundtrack
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Aspect Ratio & Resolution Export Configuration Panel */}
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <Settings className="w-4 h-4 text-gold shrink-0" />
                  <span className="text-[9px] font-bold text-black tracking-wider uppercase block">Export Configuration</span>
                </div>

                <div className="space-y-4">
                  {/* Select Aspect Ratio with rich descriptions and active badges */}
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Screen Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportAspectRatio('16:9')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          exportAspectRatio === '16:9'
                            ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20'
                            : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                        }`}
                      >
                        <div className="w-6 h-3 border border-current rounded-sm flex items-center justify-center text-[6px] font-mono leading-none">16:9</div>
                        <div className="text-center">
                          <span className="text-[9px] font-bold block leading-tight">16:9</span>
                          <span className="text-[7.5px] opacity-60 block tracking-tight font-sans">YouTube</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportAspectRatio('9:16')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          exportAspectRatio === '9:16'
                            ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20'
                            : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                        }`}
                      >
                        <div className="w-3 h-5 border border-current rounded-sm flex items-center justify-center text-[6px] font-mono leading-none">9:16</div>
                        <div className="text-center">
                          <span className="text-[9px] font-bold block leading-tight">9:16</span>
                          <span className="text-[7.5px] opacity-60 block tracking-tight font-sans">Reels/Shorts</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportAspectRatio('1:1')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          exportAspectRatio === '1:1'
                            ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20'
                            : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                        }`}
                      >
                        <div className="w-4.5 h-4.5 border border-current rounded-sm flex items-center justify-center text-[6px] font-mono leading-none">1:1</div>
                        <div className="text-center">
                          <span className="text-[9px] font-bold block leading-tight">1:1</span>
                          <span className="text-[7.5px] opacity-60 block tracking-tight font-sans">Feed Square</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Resolution Settings Selector with active speed index info */}
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Cinematic Quality Resolution</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportResolution('720p')}
                        className={`px-3 py-2.5 rounded-xl border text-center transition-all ${
                          exportResolution === '720p'
                            ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20'
                            : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase tracking-wider">HD 720p</span>
                        <span className="text-[7px] opacity-50 block font-mono">Fast Sync</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportResolution('1080p')}
                        className={`px-3 py-2.5 rounded-xl border text-center transition-all ${
                          exportResolution === '1080p'
                            ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20'
                            : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase tracking-wider">FHD 1080p</span>
                        <span className="text-[7px] opacity-50 block font-mono">Ideal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportResolution('4k')}
                        className={`px-3 py-2.5 rounded-xl border text-center transition-all ${
                          exportResolution === '4k'
                            ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20'
                            : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase tracking-wider">4K Ultra HD</span>
                        <span className="text-[7px] opacity-50 block font-mono">Premium</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleExportPromoVideo} 
                disabled={state === AppState.GENERATING || !sourceImage}
                className={`w-full py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all shadow-xl hover:-translate-y-0.5 ${
                  state === AppState.GENERATING || !sourceImage 
                    ? 'bg-gray-100 text-black/20 select-none' 
                    : 'bg-emerald-950 hover:bg-gold text-white hover:text-white shadow-emerald-950/10'
                }`}
              >
                {state === AppState.GENERATING ? loadingMsg : 'Synthesize Campaign Commercial'}
              </button>
            </div>
          )}
        </div>
        
        {/* Right pane: Interactive Video Player & Commercial Vault (7 Grid cols) */}
        <div className="lg:col-span-7 space-y-16">
          
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Choreography Blueprint</h3>
                <h2 className="text-2xl font-serif text-emerald-950 italic">Interactive Cinematic Preview</h2>
              </div>
              
              <div className="flex items-center gap-4">
                {/* HUD Overlay toggle */}
                {sourceImage && (
                  <label className="flex items-center gap-2 cursor-pointer bg-emerald-950/5 hover:bg-emerald-950/10 px-3.5 py-1.5 rounded-full border border-emerald-950/10 transition-colors">
                    <input 
                      type="checkbox"
                      checked={showHudOverlay}
                      onChange={(e) => setShowHudOverlay(e.target.checked)}
                      className="rounded border-gray-300 text-gold focus:ring-gold h-3 w-3"
                    />
                    <span className="text-[9px] font-bold text-emerald-950 uppercase tracking-wider">HUD Overlays</span>
                  </label>
                )}

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 bg-emerald-950/5 text-emerald-950 font-mono text-[9px] font-bold rounded-full uppercase tracking-wider">
                    Time: {playbackTime.toFixed(1)}s / 12.0s
                  </span>
                  <span className="px-3.5 py-1.5 bg-gold/10 text-gold font-bold text-[9px] rounded-full uppercase tracking-wider">
                    Shot {activeSceneNum}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated interactive dynamic player */}
            <div className={`relative ${exportAspectRatio === '9:16' ? 'aspect-[9/16] max-w-[340px]' : exportAspectRatio === '1:1' ? 'aspect-square max-w-[500px]' : 'aspect-video w-full'} mx-auto rounded-[2.5rem] bg-black shadow-2xl border border-gray-900 overflow-hidden group transition-all duration-500 ease-out`}>
              {sourceImage ? (
                <>
                  {/* Scene Layer 1 */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center overflow-hidden flex items-center justify-center transition-all duration-75"
                    style={getSceneStyle(1)}
                  >
                    <img 
                      src={sourceImage} 
                      className="max-h-[85%] max-w-[85%] object-contain" 
                      style={{ filter: "drop-shadow(0 25px 40px rgba(0,0,0,0.455))" }}
                    />
                    
                    {/* Scene 1 Text Overlay layer */}
                    <div className={getOverlayPlacementClass(shot1.placement)}>
                      <h1 
                        className={`text-white ${getFontSizeClass(shot1.fontSize)} tracking-[0.16em] uppercase font-bold text-shadow-xl`}
                        style={getTextOverlayStyle(1)}
                      >
                        {shot1.text || 'INTRODUCTORY REVEAL'}
                      </h1>
                    </div>
                  </div>

                  {/* Scene Layer 2 */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center overflow-hidden flex items-center justify-center transition-all duration-75"
                    style={getSceneStyle(2)}
                  >
                    <img 
                      src={sourceImage} 
                      className="max-h-[90%] max-w-[90%] object-contain scale-[1.25]" 
                      style={{ filter: "drop-shadow(0 25px 40px rgba(0,0,0,0.455))" }}
                    />
                    
                    {/* Scene 2 Text Overlay layer */}
                    <div className={getOverlayPlacementClass(shot2.placement)}>
                      <h1 
                        className={`text-white ${getFontSizeClass(shot2.fontSize)} tracking-[0.16em] uppercase font-bold text-shadow-xl`}
                        style={getTextOverlayStyle(2)}
                      >
                        {shot2.text || 'EXQUISITE DETAIL'}
                      </h1>
                    </div>
                  </div>

                  {/* Scene Layer 3 */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center overflow-hidden flex items-center justify-center transition-all duration-75"
                    style={getSceneStyle(3)}
                  >
                    <img 
                      src={sourceImage} 
                      className="max-h-[80%] max-w-[80%] object-contain scale-[0.9]" 
                      style={{ filter: "drop-shadow(0 25px 40px rgba(0,0,0,0.455))" }}
                    />
                    
                    {/* Scene 3 Text Overlay layer */}
                    <div className={getOverlayPlacementClass(shot3.placement)}>
                      <h1 
                        className={`text-white ${getFontSizeClass(shot3.fontSize)} tracking-[0.16em] uppercase font-bold text-shadow-xl`}
                        style={getTextOverlayStyle(3)}
                      >
                        {shot3.text || 'OWN THE COUTURE'}
                      </h1>
                    </div>
                  </div>

                  {/* Solid Slate Transition Board overlay */}
                  {(transition1 === 'Fade to Slate' && playbackTime >= 3.85 && playbackTime <= 4.15) && (
                    <div className="absolute inset-0 bg-slate-900 z-50 transition-opacity duration-75" />
                  )}
                  {(transition2 === 'Fade to Slate' && playbackTime >= 7.85 && playbackTime <= 8.15) && (
                    <div className="absolute inset-0 bg-slate-900 z-50 transition-opacity duration-75" />
                  )}

                  {/* Dynamic HUD Overlay (Updates in real-time) */}
                  {showHudOverlay && (
                    <div className="absolute inset-x-0 inset-y-0 p-6 flex flex-col justify-between pointer-events-none z-40 bg-gradient-to-b from-black/40 via-transparent to-black/50 select-none">
                      {/* Top Row */}
                      <div className="flex items-start justify-between w-full">
                        {/* Live Feed Status */}
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                          <span className={`w-2 h-2 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                          <span className="text-[8px] font-mono font-bold tracking-widest text-white uppercase">LIVE RENDER • {exportResolution} • {exportAspectRatio}</span>
                        </div>

                        {/* Real-Time Music Badge & Miniature Equalizer */}
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                          <Music className="w-2.5 h-2.5 text-gold shrink-0" />
                          <span className="text-[8px] font-mono font-bold text-white uppercase truncate max-w-[120px]">
                            {isMusicMuted ? 'Muted' : chosenTrackName}
                          </span>
                          {!isMusicMuted && isPlaying ? (
                            <div className="flex items-end gap-[1.5px] h-2 w-3 shrink-0 ml-1">
                              <div className="w-[1.5px] bg-gold rounded-full h-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.5s' }} />
                              <div className="w-[1.5px] bg-gold rounded-full h-2/3 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.4s' }} />
                              <div className="w-[1.5px] bg-gold rounded-full h-5/6 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                            </div>
                          ) : (
                            <div className="flex items-end gap-[1.5px] h-2 w-3 shrink-0 ml-1">
                              <div className="w-[1.5px] bg-white/30 rounded-full h-[2px]" />
                              <div className="w-[1.5px] bg-white/30 rounded-full h-[2px]" />
                              <div className="w-[1.5px] bg-white/30 rounded-full h-[2px]" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle Grid Framing Corners */}
                      <div className="flex-1 flex items-center justify-between pointer-events-none opacity-20">
                        <div className="w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-sm ml-2" />
                        <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-sm mr-2" />
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-end justify-between w-full">
                        {/* Real-time Scene Lens Status */}
                        <div className="space-y-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 max-w-[180px] shadow-lg">
                          <div className="flex items-center gap-1.5 text-gold font-mono text-[7px] font-bold tracking-wider uppercase">
                            <Sliders className="w-2.5 h-2.5 text-gold" />
                            Shot Parameters
                          </div>
                          <div className="font-mono text-[8px] text-white/80 space-y-0.5 leading-none">
                            <p><span className="text-white/40">FOCAL:</span> {activeShotConfig.angle}</p>
                            <p className="truncate"><span className="text-white/40">MOTION:</span> {activeShotConfig.motion}</p>
                            <p><span className="text-white/40">TRANSITION:</span> {activeSceneNum === 3 ? 'CTA Outro' : activeSceneNum === 1 ? transition1 : transition2}</p>
                          </div>
                        </div>

                        {/* Timing HUD Indicator */}
                        <div className="text-right bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-2.1 rounded-2xl font-mono text-white max-w-[120px] shadow-lg">
                          <span className="text-[7px] block font-bold text-white/40 tracking-wider">TIMELINE FEED</span>
                          <span className="text-xs font-bold text-gold">{playbackTime.toFixed(2)}s</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/30 animate-pulse">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest block">Cinematic Viewport Void</span>
                  <p className="text-[9px] text-white/10 italic max-w-xs font-serif leading-relaxed">Upload a product asset and configure your storyboard to initiate browser performance simulation.</p>
                </div>
              )}
            </div>

            {/* Timeline Controls & Director Tools */}
            {sourceImage && (
              <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 space-y-6">
                
                {/* Director's Cut Jump Hotspots */}
                <div className="space-y-2">
                  <span className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-1">Director's Jump Deck (Instant Scene Check)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => { setPlaybackTime(0.5); setIsPlaying(false); }}
                      className={`px-3 py-2.5 rounded-xl border text-[9px] font-bold tracking-wider uppercase transition-all flex flex-col items-start gap-1 justify-between ${
                        activeSceneNum === 1 
                          ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20' 
                          : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-[7px] text-gold block font-mono">0.0s - 4.0s</span>
                      <span className="truncate">Shot 1: Reveal</span>
                    </button>
                    <button 
                      onClick={() => { setPlaybackTime(4.5); setIsPlaying(false); }}
                      className={`px-3 py-2.5 rounded-xl border text-[9px] font-bold tracking-wider uppercase transition-all flex flex-col items-start gap-1 justify-between ${
                        activeSceneNum === 2 
                          ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20' 
                          : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-[7px] text-gold block font-mono">4.0s - 8.0s</span>
                      <span className="truncate">Shot 2: Highlight</span>
                    </button>
                    <button 
                      onClick={() => { setPlaybackTime(8.5); setIsPlaying(false); }}
                      className={`px-3 py-2.5 rounded-xl border text-[9px] font-bold tracking-wider uppercase transition-all flex flex-col items-start gap-1 justify-between ${
                        activeSceneNum === 3 
                          ? 'bg-emerald-950 text-white border-transparent shadow shadow-emerald-950/20' 
                          : 'bg-white text-emerald-950/70 border-gray-150 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-[7px] text-gold block font-mono">8.0s - 12.0s</span>
                      <span className="truncate">Shot 3: Outro</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6">
                  {/* Play / Pause button */}
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-emerald-950 hover:bg-gold text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  {/* Interactive scrubbing timeline bar */}
                  <div className="flex-1 space-y-1">
                    <div 
                      className="h-2.5 w-full bg-gray-200 rounded-full relative cursor-pointer overflow-hidden group/bar"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const fraction = (e.clientX - rect.left) / rect.width;
                        setPlaybackTime(fraction * 12);
                      }}
                    >
                      <div 
                        className="absolute left-0 top-0 h-full bg-gold rounded-full transition-all duration-75"
                        style={{ width: `${(playbackTime / 12) * 100}%` }}
                      />
                      
                      {/* Shot boundary indicators */}
                      <div className="absolute left-[33.33%] top-0 bottom-0 w-[1px] bg-black/15" />
                      <div className="absolute left-[66.66%] top-0 bottom-0 w-[1px] bg-black/15" />
                    </div>
                    
                    <div className="flex justify-between text-[8px] font-bold text-black/25 uppercase tracking-widest font-mono">
                      <span>Reveal (0s)</span>
                      <span>Highlight (4s)</span>
                      <span>Outro Cut (8s)</span>
                      <span>12.0s</span>
                    </div>
                  </div>

                  {/* Rewind */}
                  <button 
                    onClick={() => { setPlaybackTime(0); setIsPlaying(false); }}
                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 border border-gray-150 text-emerald-950 flex items-center justify-center transition-all shrink-0"
                    title="Restart Clip"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Real-Time Telemetry Monitor Panel */}
                <div className="border-t border-gray-200/60 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-emerald-950 uppercase tracking-widest block">GPU & Physics Telemetry Deck</span>
                    <span className="text-[7.5px] font-mono font-bold text-emerald-950/40 bg-emerald-950/5 px-2 py-0.5 rounded-full">REALTIME SIMULATOR</span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-gray-150/40">
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-bold text-black/35 uppercase tracking-wider block">Transform Factor</span>
                      <span className="font-mono text-[9px] font-bold text-emerald-950 block truncate" title={activeSceneStyle.transform}>
                        {activeSceneStyle.transform || 'scale(1.05)'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[7px] font-bold text-black/35 uppercase tracking-wider block">Scenic Filter</span>
                      <span className="font-mono text-[9px] font-bold text-emerald-950 block">
                        {activeSceneStyle.filter || 'none'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[7px] font-bold text-black/35 uppercase tracking-wider block">Active Opacity</span>
                      <span className="font-mono text-[9px] font-bold text-emerald-950 block">
                        {activeSceneStyle.opacity} (Fade speed: 150ms)
                      </span>
                    </div>

                    <div className="space-y-0.5 border-t border-gray-100 pt-2 lg:pt-2">
                      <span className="text-[7px] font-bold text-black/35 uppercase tracking-wider block">Soundtrack feed</span>
                      <span className="font-mono text-[9px] font-bold text-emerald-950 block truncate" title={chosenTrackName}>
                        {chosenTrackName}
                      </span>
                    </div>

                    <div className="space-y-0.5 border-t border-gray-100 pt-2 lg:pt-2">
                      <span className="text-[7px] font-bold text-black/35 uppercase tracking-wider block">Audio Amplitude</span>
                      <span className="font-mono text-[9px] font-bold text-emerald-950 block">
                        {isMusicMuted ? 'Muted (0%)' : `${Math.round(musicVolume * 100)}% Volume`}
                      </span>
                    </div>

                    <div className="space-y-0.5 border-t border-gray-100 pt-2 lg:pt-2">
                      <span className="text-[7px] font-bold text-black/35 uppercase tracking-wider block">Acoustics Vibe</span>
                      <span className="font-mono text-[9px] font-bold text-emerald-950 block truncate" title={chosenTrackVibe}>
                        {chosenTrackVibe}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </section>

          {/* Film synthesis outputs vault */}
          <section className="space-y-6">
            <div className="border-t border-gray-100 pt-10 space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Maison Film Vault</h3>
              <h2 className="text-2xl font-serif text-emerald-950 italic">Synthesized Assets Repository</h2>
            </div>

            {videoMode === 'veo' ? (
              veoOutput ? (
                <div className="animate-lux-in space-y-4">
                   <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative group bg-white border border-gray-100">
                      <MediaAsset src={veoOutput} type="video" className="w-full h-full object-cover" controls autoPlay loop />
                      <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                         <a href={veoOutput} download className="p-4 bg-white/95 backdrop-blur-md text-emerald-950 rounded-2xl shadow-lg hover:text-gold transition-all">
                            <Download className="w-5 h-5 stroke-[2]" />
                         </a>
                      </div>
                   </div>
                   <button
                     onClick={() => addGeneratedClipToLibrary(veoOutput, 'veo')}
                     className="w-full py-3.5 bg-emerald-950 hover:bg-gold text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                   >
                     <Plus className="w-4 h-4 text-gold" /> Send to Narrative Storyboard Vault
                   </button>
                </div>
              ) : (
                <div className="aspect-video rounded-[2.5rem] border border-dashed border-gray-100 flex flex-col items-center justify-center p-12 text-center bg-gray-50/50">
                  <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-black/10 mb-4 bg-white shadow-sm">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em]">Film Synthesis Pipeline Empty</span>
                </div>
              )
            ) : (
              promoOutput ? (
                <div className="animate-lux-in space-y-4">
                   <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative group bg-white border border-gray-100 animate-in fade-in-50">
                      <MediaAsset src={promoOutput} type="video" className="w-full h-full object-cover" controls autoPlay loop />
                      <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                         <a href={promoOutput} download className="p-4 bg-white/95 backdrop-blur-md text-emerald-950 rounded-2xl shadow-lg hover:text-gold transition-all animate-bounce">
                            <Download className="w-5 h-5 stroke-[2]" />
                         </a>
                      </div>
                   </div>
                   <button
                     onClick={() => addGeneratedClipToLibrary(promoOutput, 'promo')}
                     className="w-full py-3.5 bg-emerald-950 hover:bg-gold text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                   >
                     <Plus className="w-4 h-4 text-gold" /> Send to Narrative Storyboard Vault
                   </button>
                </div>
              ) : (
                <div className="aspect-video rounded-[2.5rem] border border-dashed border-gray-150 flex flex-col items-center justify-center p-12 text-center bg-gray-50/50">
                  <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-black/10 mb-4 bg-white shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em] block mb-2">Compositions Pipeline Empty</span>
                  <p className="text-[9px] text-black/30 font-serif max-w-xs font-medium italic">Configure the storyboard on the left, check prompt styling, and execute synthesis to export a full-length high-fidelity commercial MP4.</p>
                </div>
              )
            )}
          </section>
        </div>
      </div>

      {/* Brand-New Interactive Drag-and-Drop Storyboard Suite */}
      <section className="border-t border-gray-150 pt-16 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Maison Storyteller Suite</h3>
            <h2 className="text-3xl font-serif text-emerald-950 italic">Interlocking Narrative Storyboard</h2>
            <p className="text-xs text-black/40 tracking-wider">Drag high-end generated asset blocks from the library vault and drop them into the master timeline below to sequence cinematic brand narratives.</p>
          </div>
          
          {storyboardFeedback && (
            <div className="bg-emerald-950/5 border border-gold/20 text-gold px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider animate-lux-in shrink-0">
              ⚡ {storyboardFeedback}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Asset Vault (Drag Sources) */}
          <div className="lg:col-span-4 bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
              <span className="text-[9px] font-bold text-emerald-950 uppercase tracking-widest block">Available Asset Library</span>
              <span className="text-[8px] font-mono text-emerald-950/40 bg-white border border-gray-200/50 px-2.5 py-0.5 rounded-full">{libraryClips.length} Clips Available</span>
            </div>

            <p className="text-[9px] text-black/45 leading-relaxed italic font-serif">
              Hold and drag any block from the pool below, then drop it into the designated slot on the right. Tap "+" to instantly append to the end.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              {libraryClips.map((clip) => {
                const isDragging = activeDraggedLibraryId === clip.id;
                return (
                  <div
                    key={clip.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", clip.id);
                      setActiveDraggedLibraryId(clip.id);
                    }}
                    onDragEnd={() => setActiveDraggedLibraryId(null)}
                    className={`p-4 rounded-2xl border bg-white cursor-grab active:cursor-grabbing transition-all hover:shadow-md relative group ${
                      isDragging ? 'opacity-30 border-dashed border-gold scale-95' : 'border-gray-150/50 hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${clip.colorTheme} shadow-sm shrink-0`} />
                          <h4 className="text-[10px] font-bold text-emerald-950 tracking-wider uppercase truncate max-w-[150px]">{clip.name}</h4>
                        </div>
                        <p className="text-[8px] text-black/35 font-mono uppercase tracking-wider">{clip.motion} • {clip.duration}s Clip</p>
                        <p className="text-[7.5px] text-black/45 italic leading-tight line-clamp-1">"{clip.vibe}"</p>
                        {clip.subtitle && (
                          <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-lg">
                            <span className="text-[6.5px] block font-mono font-bold text-black/20 uppercase tracking-widest lead-none">Subtitle Overlay</span>
                            <span className="text-[7.5px] font-bold text-emerald-950 block uppercase tracking-wide leading-none">{clip.subtitle}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const instClip: StoryboardClip = {
                            ...clip,
                            uniqueInstanceId: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            transition: 'Cross-dissolve'
                          };
                          setStoryboardSequence(prev => [...prev, instClip]);
                          showStoryboardStatus(`Appended "${clip.name}" onto timeline!`);
                        }}
                        className="p-2 aspect-square rounded-xl bg-gray-50 hover:bg-gold text-emerald-950 hover:text-white border border-gray-200/50 hover:border-transparent transition-all shrink-0"
                        title="Append instantly to timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Miniature Drag Overlay indicator */}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-all flex items-center justify-center">
                      <span className="text-[7px] font-bold text-gold uppercase tracking-widest bg-emerald-950/5 border border-gold/15 px-3 py-1 rounded-full backdrop-blur-sm shadow shadow-black/5">Drag Me</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Timeline Slotting & Theatre */}
          <div className="lg:col-span-8 space-y-8">
            {/* Master Timeline Reel Node Strip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-emerald-950 uppercase tracking-widest block ml-1 hover:text-gold transition-colors">Storyboard Sequencing Board</span>
                <button
                  type="button"
                  onClick={() => {
                    setStoryboardSequence([]);
                    showStoryboardStatus("Cleared storyboard sequence pipeline.");
                  }}
                  className="text-[8px] font-bold text-red-500 uppercase tracking-wider hover:underline"
                >
                  Clear Timeline
                </button>
              </div>

              {/* Node Drop Rail Container */}
              <div 
                className="bg-white border border-gray-200/60 rounded-[2.5rem] p-6 shadow-sm overflow-x-auto min-h-[140px] flex items-center gap-4 scrollbar-thin scrollbar-thumb-gray-200"
                onDragOver={handleTimelineDragOver}
                onDrop={handleTimelineEndDrop}
              >
                {storyboardSequence.length === 0 ? (
                  <div className="flex-1 text-center py-6 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 bg-gray-50/50">
                    <Sliders className="w-6 h-6 text-emerald-950/15 mb-2" />
                    <span className="text-[9px] font-bold text-black/35 uppercase tracking-wide block">Storyboard Slotting Pipeline Empty</span>
                    <p className="text-[8px] text-black/25 italic max-w-sm mt-1">Drag clips from the left pool or click "+" to populate structured narrative slot nodes.</p>
                  </div>
                ) : (
                  <>
                    {storyboardSequence.map((item, idx) => {
                      const isDraggedTimelineIdx = activeDraggedTimelineIndex === idx;
                      return (
                        <React.Fragment key={item.uniqueInstanceId}>
                          {/* Left boundary Drop Zone for insertion */}
                          <div
                            onDragOver={handleTimelineDragOver}
                            onDrop={(e) => handleTimelineDrop(e, idx)}
                            className="w-4 h-24 rounded-lg bg-emerald-950/5 border border-dashed border-transparent hover:border-gold/30 hover:bg-gold/5 shrink-0 transition-all flex items-center justify-center text-gold text-[8px]"
                            title="Drop here to insert"
                          >
                            <span className="rotate-90 pointer-events-none opacity-0 hover:opacity-100 tracking-[0.2em] font-bold text-[7px]">INSERT</span>
                          </div>

                          {/* Node Slot Cards */}
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", `timeline:${idx}`);
                              setActiveDraggedTimelineIndex(idx);
                            }}
                            onDragEnd={() => setActiveDraggedTimelineIndex(null)}
                            onDragOver={handleTimelineDragOver}
                            onDrop={(e) => handleTimelineDrop(e, idx)}
                            className={`w-48 bg-gray-50 rounded-2xl p-3 border shrink-0 transition-all cursor-grab active:cursor-grabbing hover:bg-white relative group ${
                              isDraggedTimelineIdx ? 'opacity-30 border-dashed border-gold scale-95' : 'border-gray-150 hover:border-emerald-950/20 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2">
                              <span className="text-[8px] font-mono font-bold text-emerald-950/50">SCENE 0{idx + 1}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => removeStoryboardClip(idx)}
                                  className="text-black/30 hover:text-red-500 p-0.5 rounded transition-colors"
                                  title="Remove clip"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                              <span className="text-[9px] font-bold text-emerald-950 truncate block uppercase leading-none">{item.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[7.5px] font-mono leading-none bg-emerald-950/5 text-emerald-950 px-1.5 py-0.5 rounded font-bold uppercase">{item.duration}s</span>
                                <span className="text-[7px] text-black/40 truncate block leading-none font-sans italic">{item.motion}</span>
                              </div>
                              <p className="text-[7.5px] text-black/50 line-clamp-1 italic leading-tight">"{item.subtitle}"</p>
                            </div>

                            {/* Transition Selection Segment */}
                            <div className="border-t border-gray-150 pt-2 mt-2 space-y-1">
                              <label className="text-[6.5px] font-mono font-bold text-black/35 uppercase tracking-wider block">Flow Transition</label>
                              <select
                                value={item.transition}
                                onChange={(e) => handleTransitionChange(idx, e.target.value)}
                                className="w-full text-[7.5px] font-bold uppercase tracking-wider bg-white py-1 rounded border border-gray-150 text-emerald-950 focus:outline-none focus:border-gold"
                              >
                                <option value="Cross-dissolve">Cross-dissolve</option>
                                <option value="Whip Pan">Whip Pan</option>
                                <option value="Fade to Slate">Fade to Slate</option>
                                <option value="Fade to Black">Fade to Black</option>
                                <option value="Instant Cut">Instant Cut</option>
                              </select>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {/* Final Drop End Zone */}
                    <div
                      onDragOver={handleTimelineDragOver}
                      onDrop={handleTimelineEndDrop}
                      className="w-16 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center shrink-0 hover:border-gold hover:bg-gold/5 transition-all text-gray-300 text-[8px] font-bold uppercase tracking-widest text-center cursor-pointer"
                      title="Drop asset to append onto end"
                    >
                      <Plus className="w-4 h-4 mb-1 text-black/20" />
                      <span className="text-[6px] tracking-wider leading-none">Drop Tail</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Simulated Unified Narrative Screen Theatre */}
            {storyboardSequence.length > 0 && (
              <div className="bg-emerald-950 text-white rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-xl border border-gray-900 overflow-hidden relative">
                
                {/* Visualizer Backdrop */}
                {(() => {
                  let overallAccumulated = 0;
                  let activeIndex = 0;
                  for (let i = 0; i < storyboardSequence.length; i++) {
                    if (storyboardPlaybackTime >= overallAccumulated && storyboardPlaybackTime < overallAccumulated + storyboardSequence[i].duration) {
                      activeIndex = i;
                      break;
                    }
                    overallAccumulated += storyboardSequence[i].duration;
                  }
                  const activeClip = storyboardSequence[activeIndex] || storyboardSequence[0];
                  const totalStoryboardDuration = storyboardSequence.reduce((acc, c) => acc + c.duration, 0);
                  const activeClipStartTime = overallAccumulated;
                  const activeClipProgress = (storyboardPlaybackTime - activeClipStartTime) / activeClip.duration;

                  // CSS dynamic calculations to simulate cinematic motion!
                  let motionStyles: React.CSSProperties = {
                    transition: 'transform 300ms ease-out',
                    transform: 'scale(1.05)',
                  };

                  if (activeClip.motion === 'Zoom In') {
                    motionStyles.transform = `scale(${1.05 + activeClipProgress * 0.15})`;
                  } else if (activeClip.motion === 'Zoom Out') {
                    motionStyles.transform = `scale(${1.2 - activeClipProgress * 0.15})`;
                  } else if (activeClip.motion === 'Pan Right') {
                    motionStyles.transform = `translateX(${(-20 + activeClipProgress * 40)}px) scale(1.12)`;
                  } else if (activeClip.motion === 'Orbit') {
                    motionStyles.transform = `rotate(${(activeClipProgress * 6).toFixed(1)}deg) scale(1.08)`;
                  }

                  // Determine transition indicator overlay opacity
                  let transitionOverlayOpacity = 0;
                  if (activeClipProgress > 0.88) {
                    transitionOverlayOpacity = (activeClipProgress - 0.88) * 8.3; // fade to black/slate in the final 12% of the clip
                  }

                  return (
                    <div className="space-y-6 relative">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[8px] font-mono font-bold tracking-widest text-white/50 uppercase">Narrative Master Theatre</span>
                        </div>

                        <div className="flex items-center gap-2 text-[8px] font-mono text-white/40">
                          <span>Scene {activeIndex + 1} of {storyboardSequence.length}</span>
                        </div>
                      </div>

                      {/* Main Dynamic Viewport Simulator Screen */}
                      <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-black flex items-center justify-center border border-white/5 shadow-2xl group">
                        
                        {/* Background colorized gradient loops representing active scene video */}
                        <div 
                          className={`absolute inset-0 bg-gradient-to-tr ${activeClip.colorTheme} transition-colors duration-1000`} 
                          style={motionStyles}
                        />

                        {/* Interactive floating particles to look extra expensive and high-rendering and cinematic */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 mix-blend-color-dodge">
                          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-amber-500 rounded-full blur-3xl animate-pulse" />
                          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-emerald-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
                        </div>

                        {/* Active Scene Overlay Content */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 bg-gradient-to-t from-black/60 via-transparent to-black/30">
                          {/* Live parameters */}
                          <div className="flex items-start justify-between w-full">
                            <span className="px-2.5 py-1 bg-black/55 backdrop-blur-md border border-white/10 rounded-full text-[6px] font-mono font-bold text-white/80 uppercase">
                              Clip: {activeClip.name}
                            </span>
                            <span className="px-2.5 py-1 bg-gold/15 border border-gold/20 text-gold rounded-full text-[6.5px] font-mono font-bold uppercase text-right">
                              {activeClip.motion} Active
                            </span>
                          </div>

                          {/* Large screen overlay subtitling matching cinema standards */}
                          <div className="text-center space-y-2 select-none">
                            <h1 className="text-lg md:text-2xl font-serif text-white tracking-widest leading-snug drop-shadow-md font-medium uppercase transition-all duration-300">
                              {activeClip.subtitle}
                            </h1>
                            <p className="text-[8px] font-mono text-gold tracking-widest uppercase opacity-80 max-w-sm mx-auto leading-normal">
                              {activeClip.vibe}
                            </p>
                          </div>

                          {/* Bottom Telemetry inside viewer */}
                          <div className="flex items-end justify-between w-full font-mono text-[7px] text-white/40">
                            <div>
                              <span>PROGRESS IN SCENE ({activeIndex + 1}): </span>
                              <span className="text-white/80">{(activeClipProgress * 100).toFixed(0)}%</span>
                            </div>
                            <div>
                              <span>FRAME SPEED: </span>
                              <span className="text-white/80">60FPS DIGITAL LAYER</span>
                            </div>
                          </div>
                        </div>

                        {/* Visual transition overlays */}
                        {transitionOverlayOpacity > 0 && (
                          <div 
                            className={`absolute inset-0 transition-opacity pointer-events-none z-20 ${
                              activeClip.transition === 'Fade to Slate' ? 'bg-slate-900' :
                              activeClip.transition === 'Fade to Black' ? 'bg-black' :
                              activeClip.transition === 'Whip Pan' ? 'bg-black/80 blur-xl translate-x-20' :
                              'bg-white/50 blur-md'
                            }`}
                            style={{ opacity: transitionOverlayOpacity }}
                          />
                        )}
                      </div>

                      {/* Integrated Theatre HUD Controls */}
                      <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5">
                        
                        {/* Control buttons */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsStoryboardPlaying(!isStoryboardPlaying)}
                            className="w-10 h-10 rounded-full bg-gold hover:bg-gold-hover text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                          >
                            {isStoryboardPlaying ? <Pause className="w-4.5 h-4.5 fill-white" /> : <Play className="w-4.5 h-4.5 fill-white ml-0.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => { setStoryboardPlaybackTime(0); setIsStoryboardPlaying(false); }}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                            title="Rewind Storyboard"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Track Scrubber */}
                        <div className="flex-1 w-full space-y-1">
                          <div 
                            className="h-2 w-full bg-white/15 rounded-full relative cursor-pointer overflow-hidden group/sbar"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const fraction = (e.clientX - rect.left) / rect.width;
                              setStoryboardPlaybackTime(fraction * totalStoryboardDuration);
                            }}
                          >
                            <div 
                              className="absolute left-0 top-0 h-full bg-gold rounded-full transition-all duration-75"
                              style={{ width: `${(storyboardPlaybackTime / (totalStoryboardDuration || 1)) * 100}%` }}
                            />
                          </div>

                          <div className="flex justify-between font-mono text-[7px] text-white/35">
                            <span>TIMELINE PLAYBACK START (0.0s)</span>
                            <span className="text-gold font-bold">CURRENT SEC: {storyboardPlaybackTime.toFixed(1)}s / {totalStoryboardDuration.toFixed(1)}s TOTAL</span>
                          </div>
                        </div>

                        {/* Sound volume badge */}
                        <div className="text-[8px] font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-full shrink-0">
                          {isMusicMuted ? 'Muted' : `Volume: ${Math.round(musicVolume * 100)}%`}
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VideoStudio;

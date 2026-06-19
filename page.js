'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Search, Settings, X, Volume2, VolumeX, Sparkles, Crosshair, Shield, Zap, Globe2,
  ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Star, Cpu, Eye, Info, BookOpen
} from 'lucide-react';

const ROLE_THEMES = {
  Duelist: { primary: '#ff4655', glow: '255,70,85', accent: '#ffb199', icon: Crosshair, tag: 'AGGRESSOR' },
  Initiator: { primary: '#42d3ff', glow: '66,211,255', accent: '#a7e9ff', icon: Zap, tag: 'DISRUPTOR' },
  Controller: { primary: '#a37bff', glow: '163,123,255', accent: '#d6c4ff', icon: Globe2, tag: 'STRATEGIST' },
  Sentinel: { primary: '#ffd166', glow: '255,209,102', accent: '#fff0c2', icon: Shield, tag: 'GUARDIAN' },
  Default: { primary: '#ff4655', glow: '255,70,85', accent: '#ffb199', icon: Sparkles, tag: 'AGENT' },
};

const getTheme = (agent) => ROLE_THEMES[agent?.role?.displayName] || ROLE_THEMES.Default;

// ============== Cinematic Loader ==============
const CinematicLoader = ({ progress }) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8 }}
    className="fixed inset-0 z-[100] bg-[#0f1923] flex items-center justify-center overflow-hidden"
  >
    <div className="absolute inset-0 bg-grid opacity-30" />
    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgba(255,70,85,0.15), transparent 60%)' }} />
    <div className="relative flex flex-col items-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="w-40 h-40 rounded-full border-2 border-[#ff4655]/30 relative"
      >
        <div className="absolute inset-2 border border-[#ff4655]/20 rounded-full" />
        <div className="absolute inset-6 border border-[#ff4655]/10 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-[#ff4655] rounded-full pulse-glow" />
      </motion.div>
      <div className="mt-10 font-display text-5xl tracking-[0.2em] text-[#ece8e1]">
        VAL<span className="text-[#ff4655]">O</span>RANT
      </div>
      <div className="mt-2 font-mono-val text-xs text-[#ece8e1]/60">AGENT ENCYCLOPEDIA</div>
      <div className="mt-8 w-72 h-[2px] bg-white/10 overflow-hidden relative">
        <motion.div className="absolute inset-y-0 left-0 bg-[#ff4655]" style={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>
      <div className="mt-3 font-mono-val text-[10px] text-white/40 tracking-widest">LOADING ASSETS • {Math.floor(progress)}%</div>
    </div>
  </motion.div>
);

// ============== Particle Background ==============
const ParticleBG = ({ color = '255,70,85' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const N = 60;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.4,
    }));
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    const tick = () => {
      ctx.clearRect(0,0,w,h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x<0||p.x>w) p.vx*=-1; if (p.y<0||p.y>h) p.vy*=-1;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(${color},${0.25 + p.r*0.2})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [color]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

// ============== Hero Portrait with parallax ==============
const HeroPortrait = ({ agent, theme }) => {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const rotX = useTransform(sy, [-1,1], [6,-6]);
  const rotY = useTransform(sx, [-1,1], [-8,8]);
  const tx = useTransform(sx, [-1,1], [-30,30]);
  const ty = useTransform(sy, [-1,1], [-20,20]);

  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth/2, cy = window.innerHeight/2;
      mx.set((e.clientX - cx)/cx); my.set((e.clientY - cy)/cy);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx,my]);

  if (!agent) return null;
  const grad = agent.backgroundGradientColors?.length
    ? `radial-gradient(circle at 50% 60%, #${agent.backgroundGradientColors[0]} 0%, #${agent.backgroundGradientColors[1] || agent.backgroundGradientColors[0]} 35%, transparent 70%)`
    : `radial-gradient(circle at 50% 60%, ${theme.primary}55, transparent 60%)`;

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden" style={{ perspective: 1200 }}>
      {/* Background gradient by agent */}
      <AnimatePresence mode="wait">
        <motion.div
          key={agent.uuid + '-bg'}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          style={{ background: grad }}
        />
      </AnimatePresence>

      {/* Background art if available */}
      {agent.background && (
        <AnimatePresence mode="wait">
          <motion.img
            key={agent.uuid + '-bgart'}
            src={agent.background}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
            alt=""
          />
        </AnimatePresence>
      )}

      {/* Big agent name watermark */}
      <AnimatePresence mode="wait">
        <motion.div
          key={agent.uuid + '-name'}
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute left-4 md:left-16 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none"
        >
          <div className="font-display text-[14vw] md:text-[12vw] leading-[0.85] text-stroke whitespace-nowrap">
            {agent.displayName.toUpperCase()}
          </div>
          <div className="font-mono-val text-xs md:text-sm tracking-[0.3em] mt-2 ml-2" style={{ color: theme.primary }}>
            // {theme.tag} • {agent.role?.displayName?.toUpperCase()}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Portrait */}
      <AnimatePresence mode="wait">
        <motion.div
          key={agent.uuid + '-portrait'}
          initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.2,0.8,0.2,1] }}
          style={{ rotateX: rotX, rotateY: rotY, x: tx, y: ty, transformStyle: 'preserve-3d' }}
          className="relative z-20 h-[88%] flex items-end"
        >
          <img
            src={agent.fullPortraitV2 || agent.fullPortrait || agent.bustPortrait}
            alt={agent.displayName}
            className="h-full w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Light beams */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[40%] pointer-events-none"
           style={{ background: `radial-gradient(ellipse at center, ${theme.primary}33, transparent 70%)` }} />
    </div>
  );
};

// ============== Agent Card (bottom bar) ==============
const AgentCard = ({ agent, active, onClick }) => {
  const theme = getTheme(agent);
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group shrink-0 w-[64px] md:w-[80px] aspect-square clip-corner overflow-hidden border ${active ? 'border-white' : 'border-white/15'}`}
      style={{
        background: `linear-gradient(135deg, rgba(${theme.glow},0.4), rgba(0,0,0,0.6))`,
        boxShadow: active ? `0 0 24px rgba(${theme.glow},0.7), inset 0 0 0 2px rgba(${theme.glow},1)` : 'none',
      }}
      title={agent.displayName}
    >
      <img src={agent.displayIcon} alt={agent.displayName} className="w-full h-full object-cover opacity-95 group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-1 left-0 right-0 text-center font-mono-val text-[9px] tracking-widest text-white/90">
        {agent.displayName.toUpperCase()}
      </div>
      {active && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }} />}
    </motion.button>
  );
};

// ============== Ability Pill ==============
const AbilityPill = ({ ability, theme, active, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border ${active ? 'border-white' : 'border-white/20'} clip-corner`}
    style={{ background: active ? `rgba(${theme.glow},0.25)` : 'rgba(255,255,255,0.04)' }}
  >
    {ability.displayIcon ? (
      <img src={ability.displayIcon} alt={ability.displayName} className="w-8 h-8 md:w-10 md:h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
    ) : <Sparkles className="w-6 h-6" />}
    <div className="absolute -bottom-5 left-0 right-0 text-center text-[9px] font-mono-val tracking-widest text-white/60">
      {ability.slot === 'Ultimate' ? 'X' : ability.slot === 'Grenade' ? 'C' : ability.slot === 'Ability1' ? 'Q' : 'E'}
    </div>
  </motion.button>
);

// ============== Info Side Panel ==============
const InfoPanel = ({ agent, theme, open, onClose, sources }) => {
  const [tab, setTab] = useState('overview');
  if (!agent) return null;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'lore', label: 'Biography', icon: BookOpen },
    { id: 'play', label: 'Playstyle', icon: Cpu },
    { id: 'sources', label: 'Sources', icon: ExternalLink },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="fixed top-0 right-0 z-50 h-full w-full md:w-[440px] glass border-l"
          style={{ borderColor: `rgba(${theme.glow},0.4)` }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/50">// AGENT DOSSIER</div>
              <div className="font-display text-3xl" style={{ color: theme.primary }}>{agent.displayName.toUpperCase()}</div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white"><X className="w-4 h-4"/></button>
          </div>

          <div className="flex gap-1 px-3 pt-3">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 text-[11px] font-mono-val tracking-widest flex items-center justify-center gap-1 ${tab===t.id?'bg-white text-black':'text-white/70 hover:text-white border border-white/10'}`}>
                <t.icon className="w-3 h-3"/>{t.label.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-y-auto h-[calc(100%-160px)] no-scrollbar">
            {tab === 'overview' && (
              <div className="space-y-4">
                <Row label="ROLE" value={agent.role?.displayName} theme={theme} icon={agent.role?.displayIcon}/>
                <Row label="CODE NAME" value={agent.developerName}/>
                <Row label="TAGS" value={(agent.characterTags||[]).join(' • ') || '—'}/>
                <div>
                  <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40 mb-1">DESCRIPTION</div>
                  <p className="text-sm text-white/80 leading-relaxed">{agent.description}</p>
                </div>
                <div>
                  <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40 mb-1">ROLE DESCRIPTION</div>
                  <p className="text-sm text-white/70 leading-relaxed">{agent.role?.description}</p>
                </div>
              </div>
            )}
            {tab === 'lore' && (
              <div className="space-y-4">
                <p className="text-sm text-white/80 leading-relaxed">{agent.description}</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  {agent.displayName} is an agent of the Valorant Protocol, operating under the codename <span className="text-white/90">{agent.developerName}</span>. 
                  Their kit emphasizes a unique blend of mechanical skill and tactical intent, defining how teams approach engagements.
                </p>
                <div className="glass p-3">
                  <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40 mb-2">DIFFICULTY</div>
                  <DifficultyMeter role={agent.role?.displayName} theme={theme}/>
                </div>
              </div>
            )}
            {tab === 'play' && (
              <div className="space-y-3">
                <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40">ABILITIES</div>
                {(agent.abilities||[]).filter(a=>a.slot!=='Passive').map((ab, i)=>(
                  <div key={i} className="glass p-3 flex gap-3 items-start">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `rgba(${theme.glow},0.2)` }}>
                      {ab.displayIcon ? <img src={ab.displayIcon} className="w-7 h-7" style={{filter:'brightness(0) invert(1)'}} alt=""/> : <Sparkles className="w-5 h-5"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-display text-base" style={{ color: theme.primary }}>{ab.displayName?.toUpperCase()}</div>
                        <div className="text-[9px] font-mono-val tracking-widest text-white/40">{ab.slot}</div>
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">{ab.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'sources' && (
              <div className="space-y-3">
                <p className="text-xs text-white/50">Data is synchronized live from the following trusted sources:</p>
                {(sources||[]).map((s,i)=>(
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="glass p-3 flex items-center justify-between hover:border-white group">
                    <div>
                      <div className="font-display text-base" style={{ color: theme.primary }}>{s.name}</div>
                      <div className="text-[11px] text-white/60">{s.description}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-white"/>
                  </a>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Row = ({ label, value, theme, icon }) => (
  <div className="flex items-center justify-between border-b border-white/5 pb-2">
    <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40">{label}</div>
    <div className="flex items-center gap-2">
      {icon && <img src={icon} className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} alt=""/>}
      <div className="text-sm font-display tracking-wide" style={{ color: theme?.primary || '#fff' }}>{value || '—'}</div>
    </div>
  </div>
);

const DifficultyMeter = ({ role, theme }) => {
  const level = role === 'Duelist' ? 4 : role === 'Initiator' ? 3 : role === 'Controller' ? 3 : 2;
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-2 flex-1" style={{ background: i <= level ? theme.primary : 'rgba(255,255,255,0.1)' }}/>
      ))}
    </div>
  );
};

// ============== Settings Modal ==============
const SettingsModal = ({ open, onClose }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
          onClick={(e)=>e.stopPropagation()}
          className="glass clip-corner w-[92vw] max-w-3xl border border-white/10"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#ff4655]"/>
              <div>
                <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/50">// SYSTEM</div>
                <div className="font-display text-2xl">SETTINGS</div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white"><X className="w-4 h-4"/></button>
          </div>
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <Group title="GRAPHICS">
              <Pills options={['Low','Medium','High','Ultra']} defaultIdx={2}/>
            </Group>
            <Group title="EFFECTS">
              <Toggle label="Particle Quality" defaultOn/>
              <Toggle label="Bloom" defaultOn/>
              <Toggle label="Motion Blur"/>
            </Group>
            <Group title="AUDIO">
              <Slider label="Master" def={70}/>
              <Slider label="Effects" def={80}/>
              <Slider label="Music" def={60}/>
            </Group>
            <Group title="ACCESSIBILITY">
              <Toggle label="Reduced Motion"/>
              <Toggle label="High Contrast"/>
            </Group>
          </div>
          <div className="px-6 pb-6">
            <Group title="CREDITS">
              <div className="glass p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff4655]/20 via-transparent to-[#42d3ff]/10"/>
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff4655] to-transparent"/>
                <div className="relative">
                  <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/50">// CREATED BY</div>
                  <motion.div
                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    className="font-display text-5xl md:text-6xl mt-1"
                    style={{ background: 'linear-gradient(90deg,#ff4655,#42d3ff,#a37bff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}
                  >
                    ALPHA MAN
                  </motion.div>
                  <div className="font-mono-val text-xs tracking-[0.3em] text-white/60 mt-2">BUILT BY ALPHA MAN • VALORANT AGENT ENCYCLOPEDIA • 2025</div>
                  <div className="mt-3 h-[2px] w-32 bg-gradient-to-r from-[#ff4655] to-transparent"/>
                </div>
              </div>
            </Group>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Group = ({ title, children }) => (
  <div>
    <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40 mb-2">{title}</div>
    <div className="glass p-4 space-y-3">{children}</div>
  </div>
);
const Pills = ({ options, defaultIdx=0 }) => {
  const [i, setI] = useState(defaultIdx);
  return (
    <div className="flex gap-2">
      {options.map((o,idx)=>(
        <button key={o} onClick={()=>setI(idx)} className={`flex-1 py-2 text-xs font-mono-val tracking-widest ${i===idx?'bg-[#ff4655] text-white':'border border-white/15 text-white/70 hover:text-white'}`}>{o.toUpperCase()}</button>
      ))}
    </div>
  );
};
const Toggle = ({ label, defaultOn=false }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-white/80">{label}</div>
      <button onClick={()=>setOn(!on)} className={`w-10 h-5 rounded-full relative transition-colors ${on?'bg-[#ff4655]':'bg-white/15'}`}>
        <span className={`absolute top-0.5 ${on?'left-5':'left-0.5'} w-4 h-4 bg-white rounded-full transition-all`}/>
      </button>
    </div>
  );
};
const Slider = ({ label, def=50 }) => {
  const [v, setV] = useState(def);
  return (
    <div>
      <div className="flex justify-between text-xs text-white/70"><span>{label}</span><span>{v}</span></div>
      <input type="range" min="0" max="100" value={v} onChange={e=>setV(+e.target.value)} className="w-full accent-[#ff4655]"/>
    </div>
  );
};

// ============== Player Card (top-right nameplate) ==============
const PlayerCard = ({ agent, theme, onClick }) => {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rotX = useTransform(my, [-1,1], [8,-8]);
  const rotY = useTransform(mx, [-1,1], [-8,8]);
  if (!agent) return null;
  return (
    <motion.button
      onClick={onClick}
      onMouseMove={(e)=>{ const r=e.currentTarget.getBoundingClientRect(); mx.set((e.clientX-r.left)/r.width*2-1); my.set((e.clientY-r.top)/r.height*2-1); }}
      onMouseLeave={()=>{mx.set(0);my.set(0);}}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
      className="relative w-[280px] glass clip-corner overflow-hidden border"
      whileHover={{ scale: 1.02 }}
    >
      <div className="absolute -top-px left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}/>
      <div className="flex items-center gap-3 p-3">
        <div className="w-14 h-14 clip-corner overflow-hidden border" style={{ borderColor: theme.primary, background: `rgba(${theme.glow},0.2)` }}>
          <img src={agent.displayIcon} className="w-full h-full object-cover" alt={agent.displayName}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono-val text-[9px] tracking-[0.3em] text-white/50 truncate">// {agent.role?.displayName?.toUpperCase()} • #{agent.developerName?.slice(0,8)?.toUpperCase()}</div>
          <div className="font-display text-2xl truncate" style={{ color: theme.primary }}>{agent.displayName.toUpperCase()}</div>
          <div className="mt-1 h-1 bg-white/10">
            <div className="h-full" style={{ width: '64%', background: theme.primary }}/>
          </div>
          <div className="flex justify-between text-[9px] font-mono-val tracking-widest text-white/50 mt-1">
            <span>RANK • IMMORTAL</span><span>XP 6400</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-y-4 -inset-x-12 scan-x" style={{ background: `linear-gradient(90deg,transparent, rgba(${theme.glow},0.35), transparent)` }}/>
      </div>
    </motion.button>
  );
};

// ============== Main App ==============
function App() {
  const [agents, setAgents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sources, setSources] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [muted, setMuted] = useState(true);
  const audioRef = useRef(null);

  // Load data
  useEffect(() => {
    let mounted = true;
    let p = 0;
    const tick = setInterval(()=>{ p = Math.min(p+Math.random()*12, 90); setProgress(p); }, 150);
    Promise.all([
      fetch('/api/agents').then(r=>r.json()),
      fetch('/api/meta').then(r=>r.json()).catch(()=>({sources:[]}))
    ]).then(([a, m]) => {
      if (!mounted) return;
      const list = (a.data || []).sort((x,y)=>x.displayName.localeCompare(y.displayName));
      setAgents(list);
      setLastUpdated(a.lastUpdated);
      setSources(m.sources || []);
      setActiveId(list[0]?.uuid || null);
      setProgress(100);
      setTimeout(()=>setLoading(false), 600);
    }).catch((e) => { console.error(e); setProgress(100); setTimeout(()=>setLoading(false), 400); })
    .finally(()=>clearInterval(tick));
    return () => { mounted = false; clearInterval(tick); };
  }, []);

  const filtered = useMemo(() => agents.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.displayName.toLowerCase().includes(q) || a.role?.displayName?.toLowerCase().includes(q) || (a.characterTags||[]).join(' ').toLowerCase().includes(q) || a.abilities.some(ab=>ab.displayName?.toLowerCase().includes(q));
    const matchRole = roleFilter === 'All' || a.role?.displayName === roleFilter;
    return matchQ && matchRole;
  }), [agents, search, roleFilter]);

  const activeAgent = useMemo(() => agents.find(a => a.uuid === activeId) || filtered[0] || null, [agents, activeId, filtered]);
  const theme = getTheme(activeAgent);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (!filtered.length) return;
      const i = filtered.findIndex(a => a.uuid === activeAgent?.uuid);
      if (e.key === 'ArrowRight') setActiveId(filtered[(i+1)%filtered.length].uuid);
      if (e.key === 'ArrowLeft') setActiveId(filtered[(i-1+filtered.length)%filtered.length].uuid);
      if (e.key === 'Escape') { setShowInfo(false); setShowSettings(false); }
      if (e.key === 'i' || e.key === 'I') setShowInfo(v=>!v);
    };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, [filtered, activeAgent]);

  // Voice line preview on agent change
  useEffect(() => {
    if (muted || !activeAgent?.voiceLine || !audioRef.current) return;
    try { audioRef.current.src = activeAgent.voiceLine; audioRef.current.play().catch(()=>{}); } catch(e){}
  }, [activeAgent, muted]);

  return (
    <div className="relative h-screen w-screen overflow-hidden grain scanlines" style={{ background: '#0f1923' }}>
      <AnimatePresence>{loading && <CinematicLoader progress={progress}/>}</AnimatePresence>

      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"/>
      <ParticleBG color={theme.glow}/>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, rgba(${theme.glow},0.18), transparent 60%)` }}/>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-display text-2xl tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#ff4655] pulse-glow"/>
            VAL<span className="text-[#ff4655]">O</span>RANT
          </div>
          <div className="hidden md:block font-mono-val text-[10px] tracking-[0.3em] text-white/50 border-l border-white/10 pl-4">
            AGENT ENCYCLOPEDIA • LIVE DATA
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 glass px-3 py-2 clip-corner">
            <Search className="w-4 h-4 text-white/50"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search agents, roles, abilities..." className="bg-transparent outline-none text-sm w-64 placeholder-white/40"/>
          </div>
          {/* Role filter */}
          <div className="hidden lg:flex items-center gap-1">
            {['All','Duelist','Initiator','Controller','Sentinel'].map(r => (
              <button key={r} onClick={()=>setRoleFilter(r)} className={`px-2.5 py-1.5 text-[10px] font-mono-val tracking-widest ${roleFilter===r?'bg-white text-black':'border border-white/15 text-white/70 hover:text-white'}`}>{r.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={()=>setMuted(m=>!m)} className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white" title="Toggle audio">
            {muted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
          </button>
          <button onClick={()=>setShowSettings(true)} className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white" title="Settings">
            <Settings className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Top-right nameplate */}
      <div className="absolute top-20 right-4 md:right-8 z-30" style={{ perspective: 800 }}>
        <PlayerCard agent={activeAgent} theme={theme} onClick={()=>setShowInfo(true)}/>
        <div className="mt-2 font-mono-val text-[9px] tracking-[0.3em] text-white/40 text-right">
          LAST SYNCED • {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}
        </div>
      </div>

      {/* Hero */}
      <div className="absolute inset-0">
        {activeAgent && <HeroPortrait agent={activeAgent} theme={theme}/>}
      </div>

      {/* Left side info */}
      <AnimatePresence mode="wait">
        {activeAgent && (
          <motion.div
            key={activeAgent.uuid+'-left'}
            initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
            transition={{ duration:0.6, delay:0.2 }}
            className="absolute left-4 md:left-10 bottom-44 md:bottom-48 z-30 max-w-md"
          >
            <div className="flex items-center gap-2 mb-3">
              {activeAgent.role?.displayIcon && (
                <div className="w-8 h-8 flex items-center justify-center border border-white/15" style={{ background: `rgba(${theme.glow},0.18)` }}>
                  <img src={activeAgent.role.displayIcon} alt="" className="w-5 h-5" style={{ filter:'brightness(0) invert(1)' }}/>
                </div>
              )}
              <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/60">
                {activeAgent.role?.displayName?.toUpperCase()} • {activeAgent.developerName?.toUpperCase()}
              </div>
            </div>
            <p className="text-sm md:text-[15px] text-white/85 leading-relaxed glass p-4 clip-corner" style={{ borderLeft: `3px solid ${theme.primary}` }}>
              {activeAgent.description}
            </p>

            {/* Abilities */}
            <div className="mt-6">
              <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40 mb-3">// ABILITIES</div>
              <div className="flex gap-3">
                {(activeAgent.abilities||[]).filter(a=>a.slot!=='Passive').map((ab,i)=>(
                  <AbilityPill key={i} ability={ab} theme={theme}/>
                ))}
              </div>
            </div>

            <button onClick={()=>setShowInfo(true)} className="mt-8 group flex items-center gap-3">
              <div className="w-12 h-12 border flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors" style={{ borderColor: theme.primary, color: theme.primary }}>
                <ChevronRight className="w-5 h-5"/>
              </div>
              <span className="font-display tracking-[0.2em] text-lg">VIEW DOSSIER</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom agent bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="glass border-t border-white/10 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/50">// SELECT AGENT • {filtered.length}/{agents.length}</div>
            <div className="flex items-center gap-3">
              <div className="font-mono-val text-[10px] tracking-[0.3em] text-white/40">USE ← → TO NAVIGATE • PRESS I FOR DOSSIER</div>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-2">
            {filtered.map(a => (
              <AgentCard key={a.uuid} agent={a} active={a.uuid===activeAgent?.uuid} onClick={()=>setActiveId(a.uuid)}/>
            ))}
            {!filtered.length && !loading && (
              <div className="text-white/50 text-sm py-6">No agents match your filters.</div>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
      <InfoPanel agent={activeAgent} theme={theme} open={showInfo} onClose={()=>setShowInfo(false)} sources={sources}/>
      <SettingsModal open={showSettings} onClose={()=>setShowSettings(false)}/>

      {/* Footer credit */}
      <div className="absolute bottom-1 right-3 z-40 font-mono-val text-[9px] tracking-[0.3em] text-white/40 pointer-events-none">
        CREATED BY <span className="text-white/80">ALPHA MAN</span>
      </div>

      <audio ref={audioRef} hidden/>
    </div>
  );
}

export default App;

import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "football",    label: "⚽ Football",         emoji: "⚽", premium: false, desc: "Match commentary, player interviews, fan skits",      example: "COMMENTATOR: And it's MESSI — oh what a touch! He's gone past two defenders like they weren't even there..." },
  { id: "comedy",      label: "😂 Comedy",            emoji: "😂", premium: false, desc: "Stand-up sets, sketches, roast jokes",                 example: "DAVE: So I told my therapist I felt invisible. She said, 'Next.' [beat] I think that proves my point." },
  { id: "romance",     label: "💕 Romance",           emoji: "💕", premium: false, desc: "Love stories, date scenes, heartbreak monologues",     example: "SARA: [softly] You remembered my coffee order. Nobody ever remembers my coffee order. JACK: I remember everything about you." },
  { id: "horror",      label: "👻 Horror",            emoji: "👻", premium: false, desc: "Jump scares, eerie monologues, ghost stories",         example: "[The lights flicker. MAYA turns slowly.] MAYA: I thought you said we were alone in the house..." },
  { id: "motivational",label: "🔥 Motivational",      emoji: "🔥", premium: false, desc: "Hype speeches, comeback stories, pep talks",           example: "COACH: You didn't come this far to only come this far. Every scar on your body is a medal nobody gave you." },
  { id: "news",        label: "📰 News Parody",        emoji: "📰", premium: false, desc: "Satirical news reports and anchors",                   example: "ANCHOR: Breaking news — local man still hasn't replied to a text from 2019. Experts say he 'saw it'." },
  { id: "action",      label: "💥 Action Thriller",   emoji: "💥", premium: true,  desc: "High-octane scenes, chase sequences, hero arcs",       example: "[CAR EXPLODES. RYAN rolls clear, gun in hand.] RYAN: That's the third one this week. I need a raise." },
  { id: "drama",       label: "🎭 Drama",             emoji: "🎭", premium: true,  desc: "Emotional conflicts, family tensions, courtroom",      example: "JUDGE: Order! [to witness] Ma'am, are you telling this court you had no idea? WITNESS: [long pause] ...I knew." },
  { id: "documentary", label: "🎬 Documentary",       emoji: "🎬", premium: true,  desc: "Narrated docs, wildlife, history exposés",             example: "NARRATOR: The arctic fox. Alone. Hungry. Three thousand miles from the nearest Wi-Fi signal." },
  { id: "scifi",       label: "🚀 Sci-Fi",            emoji: "🚀", premium: true,  desc: "Space opera, AI uprising, dystopian futures",          example: "UNIT-7: I have calculated 1.4 million outcomes. In only one do humans survive. COMMANDER: Which one? UNIT-7: The one where you listen to me." },
  { id: "political",   label: "🏛️ Political Satire",  emoji: "🏛️", premium: true,  desc: "Political skits, election debates, policy parody",     example: "SENATOR: I've always supported the working class. [aide whispers] Since when? SENATOR: Since this morning's poll." },
  { id: "podcast",     label: "🎙️ Podcast Script",    emoji: "🎙️", premium: true,  desc: "Interview intros, episode outlines, transitions",      example: "HOST: Welcome back to Overthinking Everything — the show where we solve problems nobody asked us to solve." },
  { id: "wedding",     label: "💍 Wedding Speech",    emoji: "💍", premium: true,  desc: "Best man, maid of honor, tearful toasts",              example: "BEST MAN: I've known Jake since he was terrible at everything. He's now only terrible at some things. Growth." },
  { id: "anime",       label: "⚡ Anime Drama",        emoji: "⚡", premium: true,  desc: "Power-up speeches, rival confrontations, training arcs",example: "RIKU: [powers surging] You took everything from me. My village. My master. My limited-edition sneakers. NOW YOU PAY." },
];

const TONES = ["Dramatic","Funny","Emotional","Dark","Inspirational","Sarcastic","Wholesome"];
const LENGTHS = [
  { label: "30 sec",  desc: "~75 words",    premium: false, tokens: 400,  mins: 0.5 },
  { label: "1 min",   desc: "~150 words",   premium: false, tokens: 700,  mins: 1   },
  { label: "3 mins",  desc: "~450 words",   premium: true,  tokens: 1200, mins: 3   },
  { label: "5 mins",  desc: "~750 words",   premium: true,  tokens: 1800, mins: 5   },
  { label: "10 mins", desc: "~1,500 words", premium: true,  tokens: 3200, mins: 10  },
  { label: "20 mins", desc: "~3,000 words", premium: true,  tokens: 6000, mins: 20  },
];

const FREE_LIMIT = 3;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function readTime(words) {
  const wpm = 130;
  const t = Math.round(words / wpm);
  return t < 1 ? "< 1 min read" : `~${t} min read`;
}

export default function ScriptForge() {
  const [selected, setSelected]           = useState(null);
  const [tone, setTone]                   = useState("Dramatic");
  const [length, setLength]               = useState(LENGTHS[1]);
  const [topic, setTopic]                 = useState("");
  const [script, setScript]               = useState("");
  const [loading, setLoading]             = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showExamples, setShowExamples]   = useState(false);
  const [history, setHistory]             = useState([]);
  const [activeHistory, setActiveHistory] = useState(null);
  const [freeUsed, setFreeUsed]           = useState(0);
  const [isPremium]                       = useState(false);
  const [displayedScript, setDisplayedScript] = useState("");
  const [genMeta, setGenMeta]             = useState(null);
  const [progress, setProgress]           = useState(0);
  const [totalGenerated, setTotalGenerated] = useState(1247);
  const typewriterRef                     = useRef(null);
  const outputRef                         = useRef(null);

  const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);

  useEffect(() => {
    if (!script) return;
    setDisplayedScript("");
    let i = 0;
    const speed = script.length > 1500 ? 4 : script.length > 600 ? 8 : 14;
    clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i += speed;
      if (i >= script.length) {
        setDisplayedScript(script);
        clearInterval(typewriterRef.current);
      } else {
        setDisplayedScript(script.slice(0, i));
      }
    }, 16);
    return () => clearInterval(typewriterRef.current);
  }, [script]);

  useEffect(() => {
    if (script && outputRef.current) {
      setTimeout(() => outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [script]);

  const handleGenerate = async () => {
    if (!selected) return;
    const cat = CATEGORIES.find(c => c.id === selected);
    if (cat.premium && !isPremium) { setShowPremiumModal(true); return; }
    if (length.premium && !isPremium) { setShowPremiumModal(true); return; }
    if (!isPremium && freeRemaining <= 0) { setShowPremiumModal(true); return; }

    setLoading(true);
    setScript("");
    setDisplayedScript("");
    setActiveHistory(null);
    setProgress(0);

    const progInterval = setInterval(() => {
      setProgress(p => p < 88 ? p + Math.random() * 7 : p);
    }, 400);

    const startTime = Date.now();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat.label,
          tone,
          length: length.label,
          topic,
          tokens: length.tokens
        })
      });
      const data = await response.json();
      const text = data.script || "Error generating script.";
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const wc = wordCount(text);
      setProgress(100);
      setTimeout(() => {
        setScript(text);
        setGenMeta({ genre: cat.label, tone, length: length.label, time: elapsed, words: wc });
        if (!isPremium) setFreeUsed(f => f + 1);
        setTotalGenerated(n => n + 1);
        setHistory(h => [{ id: Date.now(), title: topic || cat.label, genre: cat.label, tone, length: length.label, script: text, words: wc, time: elapsed }, ...h].slice(0, 10));
        setLoading(false);
        setProgress(0);
      }, 300);
    } catch (e) {
      setScript("Error generating script. Please try again.");
      setLoading(false);
      setProgress(0);
    }
    clearInterval(progInterval);
  };

  const downloadTxt = (text, title) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title || "script"}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyScript = (text) => navigator.clipboard.writeText(text);
  const shownScript = activeHistory ? activeHistory.script : displayedScript;
  const shownMeta   = activeHistory ? activeHistory : genMeta;

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#ede8f5", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "linear-gradient(135deg,#140828 0%,#0c0c1a 60%,#0a1520 100%)", borderBottom: "1px solid #1e1535", padding: "28px 20px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position:"absolute",inset:0, background:"radial-gradient(ellipse at 50% -20%,rgba(130,70,240,0.18) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"10px",right:"16px", fontSize:"11px", color:"#6a5a8a" }}>
          ✦ <span style={{ color:"#9b7fd4" }}>{totalGenerated.toLocaleString()}</span> scripts generated
        </div>
        {!isPremium && (
          <div style={{ position:"absolute",top:"10px",left:"16px", fontSize:"11px", background:"rgba(155,127,212,0.12)", border:"1px solid rgba(155,127,212,0.25)", borderRadius:"20px", padding:"3px 10px", color:"#9b7fd4" }}>
            {freeRemaining} free left today
          </div>
        )}
        <div style={{ fontSize:"11px",letterSpacing:"5px",color:"#7b5fc4",marginBottom:"8px",textTransform:"uppercase" }}>✦ AI-Powered ✦</div>
        <h1 style={{ margin:0, fontSize:"clamp(30px,7vw,56px)", fontWeight:900, background:"linear-gradient(135deg,#ead6ff,#fff,#b894ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-1.5px", lineHeight:1.05 }}>
          ScriptForge
        </h1>
        <p style={{ margin:"10px 0 0", color:"#7a6a9a", fontSize:"14px", fontStyle:"italic" }}>Every great scene starts with a great script</p>
      </div>

      <div style={{ maxWidth:"940px", margin:"0 auto", padding:"24px 14px" }}>
        <div style={{ marginBottom:"26px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <div style={{ fontSize:"10px",letterSpacing:"3px",color:"#5a4a7a",textTransform:"uppercase" }}>Choose Genre</div>
            <button onClick={() => setShowExamples(e => !e)} style={{ background:"none",border:"1px solid rgba(155,127,212,0.25)",borderRadius:"20px",padding:"4px 12px",cursor:"pointer",color:"#7b5fc4",fontSize:"11px",fontFamily:"inherit" }}>
              {showExamples ? "Hide" : "See"} Examples
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))", gap:"9px" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => {
                if (cat.premium && !isPremium) { setShowPremiumModal(true); return; }
                setSelected(cat.id); setScript(""); setDisplayedScript(""); setActiveHistory(null);
              }} style={{
                position:"relative", textAlign:"left", borderRadius:"11px", padding:"12px 11px", cursor:"pointer", transition:"all 0.18s",
                background: selected===cat.id ? "linear-gradient(135deg,#3a1c70,#5a2d9e)" : cat.premium ? "rgba(245,200,66,0.03)" : "rgba(255,255,255,0.035)",
                border: selected===cat.id ? "1.5px solid #9b7fd4" : cat.premium ? "1.5px solid rgba(245,200,66,0.2)" : "1.5px solid rgba(255,255,255,0.07)",
                opacity: cat.premium && !isPremium ? 0.72 : 1,
              }}>
                {cat.premium && <div style={{ position:"absolute",top:"6px",right:"7px",fontSize:"8px",letterSpacing:"1px",color:"#f5c842",background:"rgba(245,200,66,0.13)",padding:"2px 5px",borderRadius:"4px" }}>PRO</div>}
                <div style={{ fontSize:"20px",marginBottom:"5px" }}>{cat.emoji}</div>
                <div style={{ fontSize:"12px",fontWeight:700,color: selected===cat.id?"#e2d0ff":"#ccc0e0",lineHeight:1.2 }}>{cat.label.split(" ").slice(1).join(" ")}</div>
                <div style={{ fontSize:"10px",color:"#6a5a8a",marginTop:"3px",lineHeight:1.3 }}>{cat.desc}</div>
                {showExamples && selected===cat.id && (
                  <div style={{ marginTop:"8px",padding:"8px",background:"rgba(155,127,212,0.08)",borderRadius:"7px",fontSize:"10px",color:"#b0a0d0",lineHeight:1.5,fontStyle:"italic",borderLeft:"2px solid rgba(155,127,212,0.3)" }}>
                    {cat.example}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px", marginBottom:"18px" }}>
          <div>
            <div style={{ fontSize:"10px",letterSpacing:"3px",color:"#5a4a7a",marginBottom:"9px",textTransform:"uppercase" }}>Tone</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"7px" }}>
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)} style={{
                  background: tone===t?"rgba(155,127,212,0.22)":"transparent",
                  border: tone===t?"1.5px solid #9b7fd4":"1.5px solid rgba(255,255,255,0.09)",
                  borderRadius:"20px",padding:"5px 12px",cursor:"pointer",
                  color: tone===t?"#cdb8ff":"#7a6a9a",fontSize:"11px",fontFamily:"inherit",transition:"all 0.14s"
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:"10px",letterSpacing:"3px",color:"#5a4a7a",marginBottom:"9px",textTransform:"uppercase" }}>Length</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"7px" }}>
              {LENGTHS.map(l => (
                <button key={l.label} onClick={() => {
                  if (l.premium && !isPremium) { setShowPremiumModal(true); return; }
                  setLength(l);
                }} style={{
                  background: length.label===l.label?"rgba(155,127,212,0.22)": l.premium?"rgba(245,200,66,0.04)":"transparent",
                  border: length.label===l.label?"1.5px solid #9b7fd4": l.premium?"1.5px solid rgba(245,200,66,0.22)":"1.5px solid rgba(255,255,255,0.09)",
                  borderRadius:"10px",padding:"5px 11px",cursor:"pointer",
                  color: length.label===l.label?"#cdb8ff": l.premium?"#f5c842":"#7a6a9a",
                  fontSize:"11px",fontFamily:"inherit",transition:"all 0.14s",textAlign:"center"
                }}>
                  <div>{l.label}{l.premium && <span style={{ marginLeft:"4px",fontSize:"8px" }}>👑</span>}</div>
                  <div style={{ fontSize:"9px",opacity:0.55,marginTop:"1px" }}>{l.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom:"18px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"9px" }}>
            <div style={{ fontSize:"10px",letterSpacing:"3px",color:"#5a4a7a",textTransform:"uppercase" }}>Topic / Theme <span style={{ color:"#2e2545" }}>(optional)</span></div>
            <div style={{ fontSize:"11px",color: topic.length>180?"#e05555": topic.length>140?"#e0a020":"#4a3a6a" }}>{topic.length}/200</div>
          </div>
          <input value={topic} maxLength={200} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. 'Messi's last match', 'First date gone wrong', 'Robot uprising at a coffee shop'…"
            style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:"10px",padding:"12px 15px",color:"#d0c8e0",fontSize:"13px",fontFamily:"inherit",outline:"none" }} />
        </div>

        {loading && (
          <div style={{ marginBottom:"14px",height:"3px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",overflow:"hidden" }}>
            <div style={{ height:"100%",background:"linear-gradient(90deg,#5a2d9e,#9b7fd4)",borderRadius:"2px",width:`${progress}%`,transition:"width 0.4s ease" }} />
          </div>
        )}

        <button onClick={handleGenerate} disabled={!selected||loading} style={{
          width:"100%",padding:"15px",
          background: selected&&!loading?"linear-gradient(135deg,#4a2090,#7b5fc4)":"rgba(255,255,255,0.05)",
          border:"none",borderRadius:"11px",cursor:selected?"pointer":"not-allowed",
          color: selected?"#fff":"#3a2a5a",fontSize:"15px",fontWeight:700,
          fontFamily:"inherit",transition:"all 0.2s",
          boxShadow: selected&&!loading?"0 4px 28px rgba(110,60,210,0.4)":"none"
        }}>
          {loading ? `✍️  Writing your ${length.label} script…` : "⚡  Generate Script"}
        </button>

        {!isPremium && (
          <div style={{ textAlign:"center",marginTop:"8px",fontSize:"11px",color:"#4a3a6a" }}>
            {freeRemaining > 0 ? `${freeRemaining} free generation${freeRemaining!==1?"s":""} remaining today` : "Daily limit reached — upgrade to Pro for unlimited"}
          </div>
        )}

        {(displayedScript || activeHistory) && (
          <div ref={outputRef} style={{ marginTop:"26px", background:"rgba(255,255,255,0.025)", border:"1.5px solid rgba(155,127,212,0.25)", borderRadius:"13px",overflow:"hidden" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(80,35,150,0.12)",flexWrap:"wrap",gap:"8px" }}>
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#9b7fd4",textTransform:"uppercase" }}>✦ Your Script</div>
              <div style={{ display:"flex",gap:"8px" }}>
                <button onClick={() => copyScript(shownScript)} style={{ background:"rgba(155,127,212,0.13)",border:"1px solid rgba(155,127,212,0.28)",borderRadius:"6px",padding:"4px 12px",cursor:"pointer",color:"#b89eff",fontSize:"11px",fontFamily:"inherit" }}>Copy</button>
                <button onClick={() => downloadTxt(shownScript, shownMeta?.title||"script")} style={{ background:"rgba(80,200,120,0.1)",border:"1px solid rgba(80,200,120,0.25)",borderRadius:"6px",padding:"4px 12px",cursor:"pointer",color:"#80e0a0",fontSize:"11px",fontFamily:"inherit" }}>↓ .txt</button>
              </div>
            </div>
            {shownMeta && (
              <div style={{ padding:"8px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",flexWrap:"wrap",gap:"10px" }}>
                {[shownMeta.genre, shownMeta.tone, shownMeta.length, `${shownMeta.words} words`, readTime(shownMeta.words), shownMeta.time && `Generated in ${shownMeta.time}s`].filter(Boolean).map((tag,i) => (
                  <span key={i} style={{ fontSize:"10px",color:"#6a5a8a",background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"2px 8px" }}>{tag}</span>
                ))}
              </div>
            )}
            <pre style={{ padding:"18px 20px",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"'Courier New',monospace",fontSize:"13px",lineHeight:"1.85",color:"#e0d8f0",maxHeight:"560px",overflowY:"auto" }}>
              {shownScript}
            </pre>
            {!activeHistory && (
              <div style={{ paddin

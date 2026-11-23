import { ContactRound, Sparkles } from 'lucide-react';
export default function Brand({small=false}) { return <div className="brand"><div className="brand-mark"><ContactRound size={small?18:22}/><Sparkles className="brand-spark" size={10}/></div><div><div className="brand-name">LEVEL<span>100</span></div><div className="brand-sub">CONTACT REGISTRY</div></div></div>; }

import { CheckCircle2, AlertCircle } from 'lucide-react';
export default function Toast({toast}) { if(!toast) return null; return <div className={`toast ${toast.type==='error'?'toast-error':''}`}><span className="toast-icon">{toast.type==='error'?<AlertCircle size={17}/>:<CheckCircle2 size={17}/>}</span>{toast.message}</div>; }

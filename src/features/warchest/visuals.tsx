import React,{useEffect,useRef} from 'react';
import {X,ArrowUpRight} from 'lucide-react';
import {UnitId,UNITS,Side} from './model';
import heroAsset from './assets/campaign.webp';
import unitsAsset from './assets/units.webp';
import advancedUnitsAsset from './assets/units-advanced.webp';
export const HERO=heroAsset;
export function UnitGlyph({type='sword',size=28}:{type?:UnitId;size?:number}){
 return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {type==='sword'?<><path d="M8 25 24 9l2-6-6 2L5 21m-1-3 10 10M7 23l-4 5m19-5L8 9 6 3l6 2 15 16m1-3-10 10m7-5 4 5"/></>:
 type==='pike'?<><path d="M10 29V8l-3 2 3-8 3 8-3-2M22 29V8l-3 2 3-8 3 8-3-2M7 17h6m6 3h6"/></>:
 type==='crossbow'?<><path d="M16 29V4m-5 20h10M4 13c8-9 16-9 24 0L16 23 4 13Zm9-6 3-5 3 5"/></>:
 type==='archer'?<><path d="M10 3c17 6 17 20 0 26L15 16 10 3ZM4 16h24m-4-4 5 4-5 4"/></>:
 type==='royal'?<><path d="m4 11 6 5 6-10 6 10 6-5-3 15H7L4 11Zm3 18h18"/><circle cx="4" cy="8" r="1"/><circle cx="16" cy="3" r="1"/><circle cx="28" cy="8" r="1"/></>:
 type==='scout'?<><path d="M8 22c0-10 2-15 8-19 6 4 8 9 8 19l-8 6-8-6Zm0 0 8-10 8 10M12 20h8m-6 4h4"/></>:
 type==='berserker'?<><path d="m6 28 19-22M26 28 7 6M4 3c-4 6-1 12 7 13l3-4-5-7Zm24 0c4 6 1 12-7 13l-3-4 5-7Z"/></>:
 type==='ensign'?<><path d="M8 29V3m1 2c6-4 10 4 18 0l-4 6 4 6c-8 4-12-4-18 0M4 29h9"/><path d="m15 8 4 3-4 3"/></>:
 type==='footman'?<><path d="M5 29V6L2 8l3-6 3 6-3-2M11 11h16v8c0 6-8 10-8 10s-8-4-8-10v-8ZM16 16v7m6-7v7"/></>:
 type==='knight'?<><path d="M8 27V12C8 5 13 3 16 3s8 2 8 9v15l-8 3-8-3ZM8 13h16M16 13v16M11 19h2m6 0h2M11 23h2m6 0h2M12 7h8"/></>:
 type==='marshall'?<><path d="m6 26 18-19 3 3L9 29Zm-3-1 6 6M22 4l6 6M5 12l4-4 3 4-1 4H6l-1-4Zm14 11 3-3 3 3-1 4h-4Z"/></>:
 type==='mercenary'?<><path d="m6 24 16-17 5-3-3 6L9 27m-4-7 8 8M5 28l-2 2M18 17l-3 4v6c0 4 14 4 14 0v-6l-3-4Zm0 0h8m-8-4 4 4 4-4"/><circle cx="22" cy="24" r="2"/></>:
 type==='guard'?<><path d="M6 10 16 5l10 5v10c0 5-10 10-10 10S6 25 6 20V10Zm5 13V13h3v3h4v-3h3v10H11ZM8 4l4 1 4-3 4 3 4-1"/></>:
 type==='priest'?<><path d="M13 3h6v7h7v6h-7v13h-6V16H6v-6h7V3Z"/><path d="M10 25H4v-6m18 6h6v-6"/></>:
 <><path d="M8 29h18l-2-9c-2-6-2-9-10-13V2l-5 8-5 8 4 4 6-5-4 10M16 9h.1"/>{type==='lancer'?<path d="M26 28V4l-2 2 2-5 2 5-2-2"/>:type==='cavalry'?<path d="m20 7 7 2-3 4-4-2"/>:<path d="M4 27H1m5-3H2"/>}</>}
 </svg>;
}
export function Crest({side=0,size=36}:{side?:Side;size?:number}){return <span className={`crest side-${side}`} style={{width:size,height:size}}><svg width={size*.65} height={size*.65} viewBox="0 0 40 44" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 6 15-4 15 4v17c0 9-15 18-15 18S5 32 5 23V6Z"/>{side===0?<><path d="M20 10v23m0-12c-8 0-10-5-10-7 8 0 10 7 10 7Zm0 7c8 0 10-5 10-7-8 0-10 7-10 7Zm0-11c6 0 8-4 8-6-6 0-8 6-8 6Z"/></>:<path d="m10 14 10 6 10-6-5 11h-3v9h-4v-9h-3l-5-11Zm9 0 1-4 4 4h-5Z"/>}</svg></span>;}
export function Brand(){return <div className="brand" data-game-brand><Crest size={38}/><div><strong>战争之匣</strong><span>WAR CHEST</span></div></div>;}
export function TroopArt({type,className=''}:{type:UnitId;className?:string}){const idx=UNITS[type].art,local=idx%8;return idx<0?<div className={`troop-art royal-art ${className}`}><UnitGlyph type="royal" size={88}/></div>:<div role="img" aria-label={`${UNITS[type].name}原创插画`} className={`troop-art ${className}`} style={{backgroundImage:`url(${idx>=8?advancedUnitsAsset:unitsAsset})`,backgroundPosition:`${(local%4)*100/3}% ${Math.floor(local/4)*100}%`}}/>;}
export function Coin({type,side=0,size=55,count=1,back=false}:{type:UnitId;side?:Side;size?:number;count?:number;back?:boolean}){return <span className={`coin side-${side} ${type==='royal'?'royal':''} ${back?'coin-back':''}`} style={{width:size,height:size}}>{back?<Crest side={side} size={size*.67}/>:<UnitGlyph type={type} size={size*.48}/>}<i className="coin-edge"/>{count>1&&<b className="coin-count">{count}</b>}</span>;}
export function Eyebrow({children}:{children:React.ReactNode}){return <div className="eyebrow">{children}</div>;}
export function Modal({title,eyebrow,children,footer,onClose,className=''}:{title:string;eyebrow?:string;children:React.ReactNode;footer?:React.ReactNode;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLDivElement>(null),closeRef=useRef(onClose);closeRef.current=onClose;
 useEffect(()=>{const prev=document.activeElement as HTMLElement,old=document.body.style.overflow;document.body.style.overflow='hidden';const backdrop=ref.current?.parentElement;const siblings=[...(backdrop?.parentElement?.children||[])].filter(el=>el!==backdrop) as HTMLElement[];const inertStates=siblings.map(el=>el.inert);siblings.forEach(el=>el.inert=true);ref.current?.focus({preventScroll:true});
 const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();closeRef.current();}if(e.key==='Tab'){const list=[...ref.current!.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,a[href],[tabindex="0"]')].filter(el=>el.offsetParent!==null);const first=list[0],last=list[list.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=old;siblings.forEach((el,i)=>el.inert=inertStates[i]);prev?.focus();};},[]);
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div ref={ref} tabIndex={-1} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="sheet-handle"/><header>{eyebrow&&<Eyebrow>{eyebrow}</Eyebrow>}<h2>{title}</h2><button className="icon-button modal-close" aria-label="关闭弹窗" onClick={onClose}><X size={20}/></button></header><div className="modal-body">{children}</div>{footer&&<footer>{footer}</footer>}</div></div>;
}
export function SourceLink(){return <a className="source-link" href="https://alderac.com/wp-content/uploads/2018/01/WarChest_Rules_PRESS.pdf" target="_blank" rel="noreferrer">AEG 官方基础规则 <ArrowUpRight size={14}/></a>;}

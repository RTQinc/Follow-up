import { useState, useRef, useEffect } from "react";
import {
  lerClientes, lerInteracoes,
  salvarInteracao, salvarCliente, atualizarStatusCliente,
  iniciarLogin, verificarToken, logout
} from "./sheets.js";

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPOS = ["PRESENCIAL", "LIGAÇÃO", "WHATSAPP", "REUNIÃO ONLINE"];
const CARGOS = ["SUPERVISOR","PLANEJADOR","TÉCNICO","LÍDER","GERENTE","COORDENADOR","ENGENHEIRO","COMPRADOR"];
const DEPTOS = ["MANUTENÇÃO GERAL","PCM GERAL","MANUTENÇÃO MECÂNICA","MANUTENÇÃO ELÉTRICA","GERAL","PCM MECÂNICA","COMPRAS","ENGENHARIA","PCM ELÉTRICA"];
const FOCOS = ["HIDRÁULICA","ASCOVAL","PNEUMÁTICA","ELETRÔNICA","GERAL","GEMELS","FILTROS"];
const NEGOCIOS = ["SERVICE INTERNO","DISTRIBUIÇÃO","SERVICE EXTERNO","SISTEMAS","TREINAMENTO"];
const CLASSIFICACOES = ["A","B","C","D"];

const statusColor = { atrasado:"#E24B4A", hoje:"#BA7517", pendente:"#639922", feita:"#888780" };
const statusBg    = { atrasado:"#FCEBEB", hoje:"#FAEEDA", pendente:"#EAF3DE", feita:"#F1EFE8" };
const classColor  = { A:{bg:"#EAF3DE",text:"#27500A"}, B:{bg:"#E6F1FB",text:"#0C447C"}, C:{bg:"#FAEEDA",text:"#633806"}, D:{bg:"#FCEBEB",text:"#A32D2D"} };
const tipoIcon    = { PRESENCIAL:"🏢", LIGAÇÃO:"📞", WHATSAPP:"💬", "REUNIÃO ONLINE":"🖥️" };

const inp = { width:"100%", fontSize:12, padding:"6px 8px", borderRadius:6, border:"0.5px solid #ccc", background:"#fff", color:"#333" };

function Badge({ label, bg, color, size=11 }) {
  return <span style={{ fontSize:size, fontWeight:500, padding:"2px 8px", borderRadius:20, background:bg, color, whiteSpace:"nowrap", display:"inline-block" }}>{label}</span>;
}
function Avatar({ initials, bg="#EEEDFE", color="#3C3489", size=36 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:500, flexShrink:0 }}>{initials}</div>;
}
function getInitials(n) { return n.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase(); }

// ─── Tela de Login ────────────────────────────────────────────────────────────
function TelaLogin() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", padding:32, gap:24 }}>
      <div style={{ width:64, height:64, borderRadius:16, background:"#7F77DD", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>📋</div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:20, fontWeight:500, marginBottom:8 }}>CRM Follow-up</div>
        <div style={{ fontSize:14, color:"#888", lineHeight:1.6 }}>Entre com sua conta Google para acessar e sincronizar com a planilha.</div>
      </div>
      <button onClick={iniciarLogin} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 24px", background:"#fff", border:"1px solid #ddd", borderRadius:10, fontSize:14, fontWeight:500, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
        <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="Google"/>
        Entrar com Google
      </button>
      <div style={{ fontSize:11, color:"#aaa", textAlign:"center", maxWidth:280 }}>Seus dados são salvos direto na sua planilha do Google Sheets. Nenhuma informação é armazenada externamente.</div>
    </div>
  );
}

// ─── Modal Nova Tarefa ────────────────────────────────────────────────────────
function ModalNovaTarefa({ clientes, onSalvar, onFechar }) {
  const [form, setForm] = useState({ cliente:"", tipo:"PRESENCIAL", obs:"", prazo:"" });
  const ativos = clientes.filter(c=>c.status==="ativo");
  const ok = form.cliente && form.tipo && form.prazo;
  function upd(k,v) { setForm(f=>({...f,[k]:v})); }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }} onClick={onFechar}>
      <div style={{ background:"#fff", borderRadius:"16px 16px 0 0", padding:"20px 20px 32px", width:"100%", maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontSize:15, fontWeight:500 }}>Nova tarefa</span>
          <button onClick={onFechar} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888" }}>×</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Cliente *</div>
            <select value={form.cliente} onChange={e=>upd("cliente",e.target.value)} style={{ ...inp, fontSize:13, padding:"8px 10px" }}>
              <option value="">Selecione o cliente</option>
              {ativos.map(c=><option key={c.id} value={c.nome}>{c.nome} ({c.classificacao})</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Tipo *</div>
              <select value={form.tipo} onChange={e=>upd("tipo",e.target.value)} style={{ ...inp, fontSize:13, padding:"8px 10px" }}>
                {TIPOS.map(t=><option key={t} value={t}>{tipoIcon[t]} {t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Prazo *</div>
              <input type="date" value={form.prazo} onChange={e=>upd("prazo",e.target.value)} style={{ ...inp, fontSize:13, padding:"8px 10px" }}/>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Observação</div>
            <input value={form.obs} onChange={e=>upd("obs",e.target.value)} placeholder="Ex: Apresentar proposta de renovação..." style={{ ...inp, fontSize:13, padding:"8px 10px" }}/>
          </div>
          <button onClick={()=>{ if(!ok) return; const cl=ativos.find(c=>c.nome===form.cliente); onSalvar({ id:Date.now(), cliente:form.cliente, tipo:form.tipo, prazo:new Date(form.prazo+"T12:00:00").toLocaleDateString("pt-BR"), status:"pendente", classificacao:cl?.classificacao||"C", obs:form.obs||"Contato agendado" }); }} disabled={!ok}
            style={{ padding:"11px 0", background:ok?"#7F77DD":"#eee", color:ok?"#fff":"#999", border:"none", borderRadius:10, fontSize:14, fontWeight:500, cursor:ok?"pointer":"default", marginTop:4 }}>
            Criar tarefa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Painel Tarefas ───────────────────────────────────────────────────────────
function PainelTarefas({ tarefas, contatos, onCumprir, onVerCliente }) {
  const [showFeitas, setShowFeitas] = useState(false);
  const ativas   = tarefas.filter(t=>t.status!=="feita");
  const feitas   = tarefas.filter(t=>t.status==="feita");
  const atrasadas = ativas.filter(t=>t.status==="atrasado");
  const hoje_     = ativas.filter(t=>t.status==="hoje");
  const pendentes = ativas.filter(t=>t.status==="pendente");

  function TarefaRow({ t }) {
    const cl = classColor[t.classificacao]||classColor.C;
    const feita = t.status==="feita";
    return (
      <div style={{ display:"flex", alignItems:"stretch", borderBottom:"0.5px solid #eee", background:feita?"#fafafa":"#fff" }}>
        <button title={feita?"Concluída":"Marcar como feita e detalhar"} onClick={e=>{ e.stopPropagation(); if(!feita) onCumprir(t); }}
          style={{ width:46, background:"none", border:"none", borderRight:"0.5px solid #eee", cursor:feita?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, color:feita?"#639922":"#ddd", transition:"all .15s" }}
          onMouseEnter={e=>{ if(!feita){ e.currentTarget.style.background="#EEEDFE"; e.currentTarget.style.color="#7F77DD"; }}}
          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=feita?"#639922":"#ddd"; }}>
          {feita?"✓":"○"}
        </button>
        <div onClick={()=>!feita&&onVerCliente(t.cliente)} style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"10px 12px", cursor:feita?"default":"pointer" }}
          onMouseEnter={e=>{ if(!feita) e.currentTarget.style.background="#f9f9f9"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}>
          <div style={{ fontSize:18 }}>{tipoIcon[t.tipo]||"📋"}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:feita?"#aaa":"#333", textDecoration:feita?"line-through":"none" }}>{t.cliente}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.obs}</div>
          </div>
          {!feita && <Badge label={t.classificacao} bg={cl.bg} color={cl.text}/>}
          <Badge label={feita?"Feita":t.prazo} bg={statusBg[t.status]} color={statusColor[t.status]}/>
        </div>
      </div>
    );
  }

  function SecLabel({ txt, color="#888", bg="#f9f9f9" }) {
    return <div style={{ fontSize:11, fontWeight:500, color, padding:"6px 16px 4px", textTransform:"uppercase", letterSpacing:"0.06em", background:bg }}>{txt}</div>;
  }

  return (
    <div style={{ overflowY:"auto", height:"100%", maxHeight:"calc(100vh - 120px)", background:"#fff" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, padding:"16px 16px 10px" }}>
        {[{label:"Atrasadas",val:atrasadas.length,color:"#A32D2D",bg:"#FCEBEB"},{label:"Hoje",val:hoje_.length,color:"#633806",bg:"#FAEEDA"},{label:"Semana",val:pendentes.length,color:"#27500A",bg:"#EAF3DE"}].map(m=>(
          <div key={m.label} style={{ background:m.bg, borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:500, color:m.color }}>{m.val}</div>
            <div style={{ fontSize:11, color:m.color, marginTop:3 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"2px 16px 8px" }}>
        <span style={{ fontSize:12, color:"#888" }}>{feitas.length} concluída{feitas.length!==1?"s":""}</span>
        <button onClick={()=>setShowFeitas(s=>!s)} style={{ fontSize:12, color:"#7F77DD", background:"none", border:"none", cursor:"pointer" }}>{showFeitas?"Ver pendentes":"Ver concluídas"}</button>
      </div>
      {!showFeitas && <>
        {atrasadas.length>0 && <><SecLabel txt="Atrasadas" color="#A32D2D" bg="#FEF6F6"/>{atrasadas.map(t=><TarefaRow key={t.id} t={t}/>)}</>}
        {hoje_.length>0     && <><SecLabel txt="Para hoje" color="#633806" bg="#FEFAF5"/>{hoje_.map(t=><TarefaRow key={t.id} t={t}/>)}</>}
        {pendentes.length>0 && <><SecLabel txt="Esta semana"/>{pendentes.map(t=><TarefaRow key={t.id} t={t}/>)}</>}
        {ativas.length===0  && <div style={{ textAlign:"center", padding:"40px 16px", color:"#aaa", fontSize:13 }}>Nenhuma tarefa pendente 🎉</div>}
      </>}
      {showFeitas && (feitas.length>0 ? feitas.map(t=><TarefaRow key={t.id} t={t}/>) : <div style={{ textAlign:"center", padding:"40px", color:"#aaa", fontSize:13 }}>Nenhuma tarefa concluída ainda.</div>)}
      {!showFeitas && contatos.length>0 && (
        <div style={{ padding:"14px 16px 8px" }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Últimos contatos</div>
          {contatos.slice(0,4).map(c=>{ const cl=classColor[c.classificacao]||classColor.C; return (
            <div key={c.id} onClick={()=>onVerCliente(c.cliente)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"0.5px solid #eee", cursor:"pointer" }}>
              <Avatar initials={getInitials(c.cliente)} bg={cl.bg} color={cl.text} size={32}/>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:500 }}>{c.cliente}</div><div style={{ fontSize:12, color:"#888", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{tipoIcon[c.tipo]} {c.tipo} · {c.data}</div></div>
              <Badge label={c.classificacao} bg={cl.bg} color={cl.text}/>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

// ─── Chat IA ──────────────────────────────────────────────────────────────────
function TelaChat({ onSalvar, onNovoCliente, onInativarCliente, clientes, tarefaContexto, onLimparContexto, salvando }) {
  const msg0 = tarefaContexto
    ? `Contato com ${tarefaContexto.cliente} (${tarefaContexto.tipo}) — ${tarefaContexto.obs}. Descreva como foi.`
    : "Descreva um contato realizado, cadastre um novo cliente ou informe que quer inativar um cliente da carteira.";

  const [msgs, setMsgs]       = useState([{ role:"assistant", content:msg0 }]);
  const [input, setInput]     = useState(tarefaContexto ? `Realizei o contato ${tarefaContexto.tipo?.toLowerCase()} com ${tarefaContexto.cliente}. ` : "");
  const [loading, setLoading] = useState(false);
  const [pendente, setPendente] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm]       = useState({});
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs, pendente]);

  const ativos = clientes.filter(c=>c.status==="ativo");

  async function enviar() {
    if (!input.trim()||loading) return;
    const msg = input.trim(); setInput("");
    setMsgs(prev=>[...prev,{role:"user",content:msg}]); setLoading(true);
    try {
      const hoje = new Date().toLocaleDateString("pt-BR");
      const ctx  = tarefaContexto ? `Contexto: tarefa — ${tarefaContexto.cliente} (${tarefaContexto.tipo}): ${tarefaContexto.obs}.` : "";
      const sys  = `Assistente de CRM. Retorne APENAS JSON sem markdown.\n${ctx}\nIntenções:\n- registrar_contato: {"intencao":"registrar_contato","tipo":"PRESENCIAL|LIGAÇÃO|WHATSAPP|REUNIÃO ONLINE","data":"DD/MM/AAAA","cliente":"NOME","cidade":"","contato":"NOMES","classificacao":"A|B|C|D","cargo":"SUPERVISOR|PLANEJADOR|TÉCNICO|LÍDER|GERENTE|COORDENADOR|ENGENHEIRO|COMPRADOR","depto":"MANUTENÇÃO GERAL|PCM GERAL|MANUTENÇÃO MECÂNICA|MANUTENÇÃO ELÉTRICA|GERAL|PCM MECÂNICA|COMPRAS|ENGENHARIA|PCM ELÉTRICA","area":"texto ou GERAL","foco":"HIDRÁULICA|ASCOVAL|PNEUMÁTICA|ELETRÔNICA|GERAL|GEMELS|FILTROS","negocio":"SERVICE INTERNO|DISTRIBUIÇÃO|SERVICE EXTERNO|SISTEMAS|TREINAMENTO","feedback":"resumo 1-2 frases","proximo_passo":"próxima ação","proximo_prazo":7}\n- novo_cliente: {"intencao":"novo_cliente","nome":"NOME","cidade":"CIDADE","classificacao":"A|B|C|D","observacao":""}\n- inativar_cliente: {"intencao":"inativar_cliente","nome":"NOME","motivo":""}\nClientes ativos: ${ativos.map(c=>c.nome).join(", ")}\nHoje: ${hoje}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:[{role:"user",content:msg}] }) });
      const data = await res.json();
      const parsed = JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g,"").trim()||"{}");

      if (parsed.intencao==="registrar_contato") {
        const f = {...parsed, cliente:parsed.cliente||(tarefaContexto?.cliente||""), tipo:parsed.tipo||(tarefaContexto?.tipo||"")};
        setPendente({tipo:"contato"}); setForm(f);
        setMsgs(prev=>[...prev,{role:"assistant",content:"Extraí as informações. Confira e confirme antes de salvar na planilha."}]);
      } else if (parsed.intencao==="novo_cliente") {
        setPendente({tipo:"novo_cliente"}); setForm(parsed);
        setMsgs(prev=>[...prev,{role:"assistant",content:`Vou cadastrar ${parsed.nome} (Classe ${parsed.classificacao}). Confirme abaixo.`}]);
      } else if (parsed.intencao==="inativar_cliente") {
        const enc = ativos.find(c=>c.nome.includes(parsed.nome.split(" ")[0]));
        const d   = {...parsed, nome:enc?.nome||parsed.nome, linhaSheets:enc?.id};
        setPendente({tipo:"inativar"}); setForm(d);
        setMsgs(prev=>[...prev,{role:"assistant",content:`Inativar ${d.nome}? O histórico será preservado.`}]);
      } else {
        setMsgs(prev=>[...prev,{role:"assistant",content:"Não entendi. Tente: 'visitei a Berneck hoje', 'novo cliente Empresa X em Londrina classe B', 'inativar cliente X'."}]);
      }
    } catch { setMsgs(prev=>[...prev,{role:"assistant",content:"Não consegui processar. Tente novamente."}]); }
    setLoading(false);
  }

  async function confirmar() {
    if (pendente.tipo==="contato") {
      await onSalvar({...form,id:Date.now()});
      setMsgs([{role:"assistant",content:"✅ Contato salvo na planilha! Pode registrar outro."}]);
    } else if (pendente.tipo==="novo_cliente") {
      await onNovoCliente({id:Date.now(),nome:form.nome,cidade:form.cidade,classificacao:form.classificacao,status:"ativo",desde:new Date().toLocaleDateString("pt-BR"),motivo_inativo:""});
      setMsgs([{role:"assistant",content:`✅ ${form.nome} cadastrado na planilha!`}]);
    } else if (pendente.tipo==="inativar") {
      await onInativarCliente(form.nome,form.motivo,form.linhaSheets);
      setMsgs([{role:"assistant",content:`✅ ${form.nome} inativado. Histórico preservado.`}]);
    }
    setPendente(null); setForm({}); setEditando(false);
    if (onLimparContexto) onLimparContexto();
  }

  function cancelar() { setPendente(null); setForm({}); setEditando(false); setMsgs(prev=>[...prev,{role:"assistant",content:"Cancelado."}]); if(onLimparContexto) onLimparContexto(); }
  function upd(k,v) { setForm(f=>({...f,[k]:v})); }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", maxHeight:"calc(100vh - 120px)", background:"#fff" }}>
      {tarefaContexto && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:"#EEEDFE", borderBottom:"0.5px solid #AFA9EC", flexShrink:0 }}>
          <span style={{ fontSize:18 }}>{tipoIcon[tarefaContexto.tipo]}</span>
          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500, color:"#3C3489" }}>{tarefaContexto.cliente}</div><div style={{ fontSize:11, color:"#534AB7" }}>{tarefaContexto.obs}</div></div>
          <button onClick={()=>{ onLimparContexto(); setMsgs([{role:"assistant",content:"Contexto removido."}]); setInput(""); }} style={{ fontSize:11, color:"#534AB7", background:"none", border:"none", cursor:"pointer" }}>× remover</button>
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px" }}>
        {msgs.length===1 && !tarefaContexto && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
            {[["🏢","Registrar contato com cliente"],["➕","Cadastrar novo cliente"],["📦","Inativar cliente da carteira"]].map(([ic,s])=>(
              <button key={s} onClick={()=>setInput(s)} style={{ textAlign:"left", padding:"8px 12px", background:"#f9f9f9", border:"0.5px solid #eee", borderRadius:8, fontSize:13, color:"#888", cursor:"pointer" }}>{ic} {s}</button>
            ))}
          </div>
        )}

        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10 }}>
            <div style={{ maxWidth:"82%", padding:"9px 13px", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.role==="user"?"#7F77DD":"#f5f5f5", color:m.role==="user"?"#fff":"#333", fontSize:13, lineHeight:1.5 }}>{m.content}</div>
          </div>
        ))}

        {loading && <div style={{ display:"flex",gap:5,padding:"8px 0 8px 4px" }}>{[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#AFA9EC",animation:`bounce 1.2s ${i*0.2}s infinite` }}/>)}</div>}

        {/* Card contato */}
        {pendente?.tipo==="contato" && (
          <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:12, padding:14, marginTop:8, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:10, display:"flex", justifyContent:"space-between" }}>
              <span>REGISTRO DE CONTATO</span>
              <button onClick={()=>setEditando(e=>!e)} style={{ fontSize:12, color:"#7F77DD", background:"none", border:"none", cursor:"pointer" }}>{editando?"fechar":"editar"}</button>
            </div>
            {editando ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px" }}>
                {[{k:"tipo",label:"Tipo",opts:TIPOS},{k:"data",label:"Data"},{k:"cliente",label:"Cliente"},{k:"cidade",label:"Cidade"},{k:"contato",label:"Contato"},{k:"classificacao",label:"Classificação",opts:CLASSIFICACOES},{k:"cargo",label:"Cargo",opts:CARGOS},{k:"depto",label:"Depto",opts:DEPTOS},{k:"area",label:"Área"},{k:"foco",label:"Foco",opts:FOCOS},{k:"negocio",label:"Negócio",opts:NEGOCIOS}].map(({k,label,opts})=>(
                  <div key={k} style={{ gridColumn:["contato","area","foco","negocio"].includes(k)?"span 2":"span 1" }}>
                    <div style={{ fontSize:11, color:"#888", marginBottom:3 }}>{label}</div>
                    {opts?<select value={form[k]||""} onChange={e=>upd(k,e.target.value)} style={inp}><option value="">—</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input value={form[k]||""} onChange={e=>upd(k,e.target.value)} style={inp}/>}
                  </div>
                ))}
                <div style={{ gridColumn:"span 2" }}><div style={{ fontSize:11, color:"#888", marginBottom:3 }}>Feedback</div><textarea value={form.feedback||""} onChange={e=>upd("feedback",e.target.value)} rows={3} style={{ ...inp, resize:"none" }}/></div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                {[["Tipo",form.tipo,tipoIcon[form.tipo]],["Data",form.data],["Cliente",form.cliente],["Cidade",form.cidade],["Contato",form.contato],["Classificação",form.classificacao],["Cargo",form.cargo],["Depto",form.depto],["Área",form.area],["Foco",form.foco],["Negócio",form.negocio]].map(([label,val,icon])=>val?(
                  <div key={label} style={{ gridColumn:["Contato","Área","Foco","Negócio"].includes(label)?"span 2":"span 1", display:"flex", gap:6 }}>
                    <span style={{ fontSize:12, color:"#888", flexShrink:0 }}>{label}:</span>
                    <span style={{ fontSize:12, fontWeight:500 }}>{icon?`${icon} `:""}{val}</span>
                  </div>
                ):null)}
                {form.feedback&&<div style={{ gridColumn:"span 2", marginTop:4, padding:"7px 10px", background:"#f9f9f9", borderRadius:8, fontSize:12, lineHeight:1.5 }}>{form.feedback}</div>}
                {form.proximo_passo&&<div style={{ gridColumn:"span 2", marginTop:4, display:"flex", gap:6 }}><span style={{ fontSize:11, color:"#7F77DD", fontWeight:500 }}>Próximo:</span><span style={{ fontSize:12, color:"#534AB7" }}>{form.proximo_passo} ({form.proximo_prazo}d)</span></div>}
              </div>
            )}
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={confirmar} disabled={salvando} style={{ flex:1, padding:"9px 0", background:salvando?"#aaa":"#7F77DD", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:salvando?"default":"pointer" }}>
                {salvando?"Salvando...":"💾 Salvar no Google Sheets"}
              </button>
              <button onClick={cancelar} style={{ padding:"9px 16px", background:"none", border:"0.5px solid #eee", borderRadius:8, fontSize:13, color:"#888", cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Card novo cliente */}
        {pendente?.tipo==="novo_cliente" && (
          <div style={{ background:"#E1F5EE", border:"0.5px solid #5DCAA5", borderRadius:12, padding:14, marginTop:8 }}>
            <div style={{ fontSize:12, fontWeight:500, color:"#085041", marginBottom:10 }}>NOVO CLIENTE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:12 }}>
              {[{k:"nome",label:"Nome"},{k:"cidade",label:"Cidade"},{k:"classificacao",label:"Classificação",opts:CLASSIFICACOES}].map(({k,label,opts})=>(
                <div key={k}><div style={{ fontSize:11, color:"#085041", marginBottom:3 }}>{label}</div>{opts?<select value={form[k]||""} onChange={e=>upd(k,e.target.value)} style={{ ...inp, border:"0.5px solid #9FE1CB", background:"#fff", color:"#085041" }}><option value="">—</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input value={form[k]||""} onChange={e=>upd(k,e.target.value)} style={{ ...inp, border:"0.5px solid #9FE1CB", background:"#fff", color:"#085041" }}/> }</div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={confirmar} disabled={salvando} style={{ flex:1, padding:"9px 0", background:"#1D9E75", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>{salvando?"Salvando...":"💾 Cadastrar no Sheets"}</button>
              <button onClick={cancelar} style={{ padding:"9px 16px", background:"none", border:"0.5px solid #9FE1CB", borderRadius:8, fontSize:13, color:"#085041", cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Card inativar */}
        {pendente?.tipo==="inativar" && (
          <div style={{ background:"#FCEBEB", border:"0.5px solid #F09595", borderRadius:12, padding:14, marginTop:8 }}>
            <div style={{ fontSize:12, fontWeight:500, color:"#A32D2D", marginBottom:8 }}>INATIVAR CLIENTE</div>
            <div style={{ fontSize:13, color:"#791F1F", marginBottom:10 }}><strong>{form.nome}</strong> — histórico preservado.</div>
            <div style={{ marginBottom:12 }}><div style={{ fontSize:11, color:"#A32D2D", marginBottom:3 }}>Motivo (opcional)</div><input value={form.motivo||""} onChange={e=>upd("motivo",e.target.value)} placeholder="Ex: encerrou contrato..." style={{ ...inp, border:"0.5px solid #F09595", background:"#fff", color:"#791F1F" }}/></div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={confirmar} disabled={salvando} style={{ flex:1, padding:"9px 0", background:"#E24B4A", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>{salvando?"Salvando...":"Confirmar"}</button>
              <button onClick={cancelar} style={{ padding:"9px 16px", background:"none", border:"0.5px solid #F09595", borderRadius:8, fontSize:13, color:"#A32D2D", cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      <div style={{ padding:"10px 16px 16px", borderTop:"0.5px solid #eee", flexShrink:0 }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); enviar(); }}} placeholder="Descreva o contato, cadastre ou inative um cliente..." rows={2} style={{ flex:1, padding:"9px 12px", borderRadius:10, border:"0.5px solid #ddd", background:"#fff", color:"#333", fontSize:13, resize:"none", lineHeight:1.5 }}/>
          <button onClick={enviar} disabled={loading||!input.trim()} style={{ padding:"9px 16px", background:input.trim()&&!loading?"#7F77DD":"#eee", color:input.trim()&&!loading?"#fff":"#aaa", border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:input.trim()&&!loading?"pointer":"default", transition:"all .2s", whiteSpace:"nowrap" }}>Enviar</button>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(.6)}40%{transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── Detalhe Cliente ──────────────────────────────────────────────────────────
function DetalheCliente({ nomeCliente, contatos, clientes, onVoltar, onInativar, onReativar }) {
  const historico = contatos.filter(c=>c.cliente===nomeCliente);
  const info = clientes.find(c=>c.nome===nomeCliente);
  const cl = classColor[info?.classificacao]||classColor.C;
  const isInativo = info?.status==="inativo";
  const [resumo,setResumo]=useState(""); const [loadingR,setLoadingR]=useState(false);
  const [conf,setConf]=useState(null);

  async function gerarResumo() {
    setLoadingR(true);
    try {
      const hist = historico.map(c=>`${c.data}|${c.tipo}|${c.contato}|${c.foco}|${c.negocio}|${c.feedback}`).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:`Resumo executivo em 3-4 frases sobre ${nomeCliente}: situação atual, assuntos recorrentes, oportunidades e próxima ação.\n\n${hist}`}]})});
      const d = await res.json(); setResumo(d.content?.[0]?.text||"");
    } catch { setResumo("Não foi possível gerar."); }
    setLoadingR(false);
  }

  return (
    <div style={{ overflowY:"auto", height:"100%", maxHeight:"calc(100vh - 120px)", background:"#fff" }}>
      <div onClick={onVoltar} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderBottom:"0.5px solid #eee", cursor:"pointer", fontSize:13, color:"#888" }}>← Voltar</div>
      <div style={{ padding:"14px 16px 10px", display:"flex", alignItems:"center", gap:12 }}>
        <Avatar initials={getInitials(nomeCliente)} bg={isInativo?"#eee":cl.bg} color={isInativo?"#aaa":cl.text} size={44}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>{nomeCliente}{isInativo&&<span style={{ fontSize:10, padding:"1px 6px", borderRadius:20, background:"#f1f1f1", color:"#888" }}>inativo</span>}</div>
          <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{info?.cidade} · {historico.length} contatos</div>
          {isInativo&&info?.motivo_inativo&&<div style={{ fontSize:12, color:"#A32D2D", marginTop:2 }}>{info.motivo_inativo}</div>}
        </div>
        <Badge label={info?.classificacao||"?"} bg={cl.bg} color={cl.text} size={13}/>
      </div>
      <div style={{ padding:"0 16px 12px" }}>
        {isInativo
          ?<button onClick={()=>setConf("reativar")} style={{ fontSize:12, padding:"6px 14px", background:"#E1F5EE", color:"#085041", border:"0.5px solid #9FE1CB", borderRadius:8, cursor:"pointer", fontWeight:500 }}>Reativar cliente</button>
          :<button onClick={()=>setConf("inativar")} style={{ fontSize:12, padding:"6px 14px", background:"#FCEBEB", color:"#A32D2D", border:"0.5px solid #F09595", borderRadius:8, cursor:"pointer", fontWeight:500 }}>Inativar cliente</button>}
      </div>
      {conf&&(
        <div style={{ margin:"0 16px 12px", padding:12, borderRadius:10, background:conf==="inativar"?"#FCEBEB":"#E1F5EE", border:`0.5px solid ${conf==="inativar"?"#F09595":"#9FE1CB"}` }}>
          <div style={{ fontSize:13, color:conf==="inativar"?"#791F1F":"#085041", marginBottom:10 }}>{conf==="inativar"?`Confirma inativação de ${nomeCliente}?`:`Reativar ${nomeCliente} na carteira ativa?`}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ conf==="inativar"?onInativar(nomeCliente,"",info?.id):onReativar(nomeCliente,info?.id); setConf(null); onVoltar(); }} style={{ padding:"7px 16px", background:conf==="inativar"?"#E24B4A":"#1D9E75", color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer" }}>Confirmar</button>
            <button onClick={()=>setConf(null)} style={{ padding:"7px 12px", background:"none", border:`0.5px solid ${conf==="inativar"?"#F09595":"#9FE1CB"}`, borderRadius:8, fontSize:12, cursor:"pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
      {historico.length>0&&(
        <div style={{ margin:"0 16px 14px", background:"#EEEDFE", border:"0.5px solid #AFA9EC", borderRadius:10, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:500, color:"#534AB7", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Análise do Claude</div>
          {resumo?<div style={{ fontSize:13, color:"#3C3489", lineHeight:1.6 }}>{resumo}</div>:<button onClick={gerarResumo} disabled={loadingR} style={{ fontSize:12, color:"#534AB7", background:"rgba(255,255,255,0.5)", border:"0.5px solid #AFA9EC", borderRadius:6, padding:"6px 12px", cursor:"pointer" }}>{loadingR?"Analisando...":"Gerar resumo ↗"}</button>}
        </div>
      )}
      <div style={{ padding:"0 16px" }}>
        <div style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Histórico</div>
        {historico.length===0&&<div style={{ fontSize:13, color:"#aaa", padding:"20px 0", textAlign:"center" }}>Nenhum contato registrado.</div>}
        {historico.map(c=>(
          <div key={c.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"0.5px solid #eee" }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0 }}>{tipoIcon[c.tipo]}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><span style={{ fontSize:13, fontWeight:500 }}>{c.tipo}</span><span style={{ fontSize:12, color:"#aaa" }}>{c.data}</span></div>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>{c.contato} · {c.cargo} · {c.depto}</div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:5 }}><Badge label={c.foco} bg="#EEEDFE" color="#3C3489"/><Badge label={c.negocio} bg="#E1F5EE" color="#085041"/>{c.area&&c.area!=="GERAL"&&<Badge label={c.area} bg="#f1f1f1" color="#555"/>}</div>
              <div style={{ fontSize:12, lineHeight:1.5, background:"#f9f9f9", borderRadius:6, padding:"6px 8px" }}>{c.feedback}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tela Clientes ────────────────────────────────────────────────────────────
function TelaClientes({ clientes, contatos, onVerCliente }) {
  const [filtro,setFiltro]=useState("ativo"); const [busca,setBusca]=useState("");
  const lista = clientes.filter(c=>c.status===filtro&&c.nome.includes(busca.toUpperCase()));
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", maxHeight:"calc(100vh - 120px)", background:"#fff" }}>
      <div style={{ padding:"12px 16px 8px", flexShrink:0 }}>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:"0.5px solid #ddd", background:"#f9f9f9", color:"#333", fontSize:13 }}/>
        <div style={{ display:"flex", marginTop:8, borderRadius:8, overflow:"hidden", border:"0.5px solid #eee" }}>
          {["ativo","inativo"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{ flex:1, padding:"7px 0", background:filtro===f?"#7F77DD":"#f9f9f9", color:filtro===f?"#fff":"#888", border:"none", fontSize:13, fontWeight:filtro===f?500:400, cursor:"pointer" }}>{f==="ativo"?`Ativos (${clientes.filter(c=>c.status==="ativo").length})`:`Inativos (${clientes.filter(c=>c.status==="inativo").length})`}</button>)}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {lista.length===0&&<div style={{ fontSize:13, color:"#aaa", textAlign:"center", padding:"40px 0" }}>Nenhum cliente {filtro}.</div>}
        {lista.map(c=>{ const cl=classColor[c.classificacao]||classColor.C; const n=contatos.filter(ct=>ct.cliente===c.nome).length; return (
          <div key={c.id} onClick={()=>onVerCliente(c.nome)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:"0.5px solid #eee", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#f9f9f9"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Avatar initials={getInitials(c.nome)} bg={c.status==="inativo"?"#eee":cl.bg} color={c.status==="inativo"?"#aaa":cl.text} size={38}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>{c.nome}{c.status==="inativo"&&<span style={{ fontSize:10, padding:"1px 6px", borderRadius:20, background:"#f1f1f1", color:"#888" }}>inativo</span>}</div>
              <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{c.cidade} · {n} contato{n!==1?"s":""} · desde {c.desde}</div>
              {c.status==="inativo"&&c.motivo_inativo&&<div style={{ fontSize:11, color:"#A32D2D", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.motivo_inativo}</div>}
            </div>
            <Badge label={c.classificacao} bg={cl.bg} color={cl.text}/>
          </div>
        );})}
      </div>
    </div>
  );
}

// ─── Painel Gestão ────────────────────────────────────────────────────────────
function PainelGestao({ contatos, tarefas, clientes }) {
  const [resumo,setResumo]=useState(""); const [loading,setLoading]=useState(false);
  const ativos=clientes.filter(c=>c.status==="ativo"); const inativos=clientes.filter(c=>c.status==="inativo");
  const porTipo=TIPOS.map(t=>({tipo:t,count:contatos.filter(c=>c.tipo===t).length}));
  const porClass=CLASSIFICACOES.map(cl=>({cl,count:contatos.filter(c=>c.classificacao===cl).length}));
  const maxTipo=Math.max(...porTipo.map(p=>p.count),1);
  const atrasadas=tarefas.filter(t=>t.status==="atrasado").length;

  async function gerarResumo() {
    setLoading(true);
    try {
      const stats=`Ativos:${ativos.length},Inativos:${inativos.length},Contatos:${contatos.length},Atrasadas:${atrasadas},Tipos:${porTipo.map(p=>`${p.tipo}:${p.count}`).join(",")},Classes:${porClass.map(p=>`${p.cl}:${p.count}`).join(",")}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Resumo executivo em 3-4 frases para gestor comercial.\n\n${stats}`}]})});
      const d=await res.json(); setResumo(d.content?.[0]?.text||"");
    } catch { setResumo("Não foi possível gerar."); }
    setLoading(false);
  }

  return (
    <div style={{ overflowY:"auto", height:"100%", maxHeight:"calc(100vh - 120px)", padding:"16px", background:"#fff" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        {[{label:"Contatos",val:contatos.length,color:"#0C447C",bg:"#E6F1FB"},{label:"Atrasadas",val:atrasadas,color:"#A32D2D",bg:"#FCEBEB"},{label:"Ativos",val:ativos.length,color:"#27500A",bg:"#EAF3DE"}].map(m=>(
          <div key={m.label} style={{ background:m.bg, borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.val}</div>
            <div style={{ fontSize:11, color:m.color, marginTop:3 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#EEEDFE", border:"0.5px solid #AFA9EC", borderRadius:10, padding:12, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:500, color:"#534AB7", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Análise Claude</div>
        {resumo?<div style={{ fontSize:13, color:"#3C3489", lineHeight:1.6 }}>{resumo}</div>:<button onClick={gerarResumo} disabled={loading} style={{ fontSize:12, color:"#534AB7", background:"rgba(255,255,255,0.5)", border:"0.5px solid #AFA9EC", borderRadius:6, padding:"6px 12px", cursor:"pointer" }}>{loading?"Analisando...":"Gerar resumo ↗"}</button>}
      </div>
      <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:10, padding:12, marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Por tipo de contato</div>
        {porTipo.map(p=>(
          <div key={p.tipo} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
            <span style={{ fontSize:16 }}>{tipoIcon[p.tipo]}</span>
            <span style={{ fontSize:12, color:"#888", width:130, flexShrink:0 }}>{p.tipo}</span>
            <div style={{ flex:1, height:7, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}><div style={{ width:`${(p.count/maxTipo)*100}%`, height:"100%", background:"#7F77DD", borderRadius:4, transition:"width .4s" }}/></div>
            <span style={{ fontSize:12, color:"#888", width:16, textAlign:"right" }}>{p.count}</span>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:10, padding:12, marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Por classificação</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {porClass.map(p=>{const cl=classColor[p.cl]; return <div key={p.cl} style={{ background:cl.bg, borderRadius:8, padding:"10px 8px", textAlign:"center" }}><div style={{ fontSize:20, fontWeight:500, color:cl.text }}>{p.count}</div><div style={{ fontSize:11, color:cl.text, marginTop:2 }}>Classe {p.cl}</div></div>;})}
        </div>
      </div>
      {inativos.length>0&&(
        <div style={{ background:"#f9f9f9", border:"0.5px solid #eee", borderRadius:10, padding:12 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Carteira inativa ({inativos.length})</div>
          {inativos.map(c=><div key={c.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:"0.5px solid #eee" }}><span style={{ fontWeight:500 }}>{c.nome}</span><span style={{ color:"#aaa", fontSize:11 }}>{c.motivo_inativo||"—"}</span></div>)}
        </div>
      )}
    </div>
  );
}

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const [autenticado, setAutenticado]     = useState(false);
  const [carregando, setCarregando]       = useState(true);
  const [salvando, setSalvando]           = useState(false);
  const [tela, setTela]                   = useState("tarefas");
  const [telaAnterior, setTelaAnterior]   = useState("tarefas");
  const [clienteDetalhe, setClienteDetalhe] = useState(null);
  const [contatos, setContatos]           = useState([]);
  const [clientes, setClientes]           = useState([]);
  const [tarefas, setTarefas]             = useState([]);
  const [tarefaContexto, setTarefaContexto] = useState(null);
  const [showNovaTarefa, setShowNovaTarefa] = useState(false);
  const [erroSync, setErroSync]           = useState("");

  // Verifica autenticação e carrega dados
  useEffect(() => {
    const token = verificarToken();
    if (token) {
      setAutenticado(true);
      carregarDados();
    } else {
      setCarregando(false);
    }
  }, []);

  async function carregarDados() {
    setCarregando(true);
    try {
      const [cls, ints] = await Promise.all([lerClientes(), lerInteracoes()]);
      setClientes(cls);
      setContatos(ints.reverse()); // mais recentes primeiro

      // Gera tarefas baseadas nos dias sem contato por classificação
      const freqDias = { A:15, B:30, C:45, D:60 };
      const hoje = new Date();
      const tfs = [];
      cls.filter(c=>c.status==="ativo").forEach(c => {
        const ultimos = ints.filter(i=>i.cliente===c.nome);
        const ultimoContato = ultimos.length ? new Date(ultimos[ultimos.length-1].data?.split("/").reverse().join("-")) : null;
        const diasSemContato = ultimoContato ? Math.floor((hoje - ultimoContato) / 86400000) : 999;
        const limite = freqDias[c.classificacao] || 30;
        if (diasSemContato >= limite) {
          const status = diasSemContato >= limite * 1.5 ? "atrasado" : diasSemContato >= limite ? "hoje" : "pendente";
          tfs.push({ id:`auto-${c.id}`, cliente:c.nome, tipo:"PRESENCIAL", prazo:diasSemContato >= limite ? "Vencido" : "Em breve", status, classificacao:c.classificacao, obs:`${diasSemContato} dias sem contato (limite: ${limite}d)` });
        }
      });
      setTarefas(tfs);
      setErroSync("");
    } catch(e) {
      setErroSync("Erro ao carregar dados da planilha. Verifique a conexão.");
    }
    setCarregando(false);
  }

  async function salvarContato(reg) {
    setSalvando(true);
    try {
      await salvarInteracao(reg);
      setContatos(prev=>[{...reg,id:Date.now()},...prev]);
      if (tarefaContexto) setTarefas(prev=>prev.map(t=>t.id===tarefaContexto.id?{...t,status:"feita"}:t));
      if (reg.proximo_passo&&reg.proximo_prazo) {
        const d=new Date(); d.setDate(d.getDate()+parseInt(reg.proximo_prazo));
        setTarefas(prev=>[{id:Date.now()+1,cliente:reg.cliente,tipo:reg.tipo,prazo:d.toLocaleDateString("pt-BR"),status:"pendente",classificacao:reg.classificacao||"C",obs:reg.proximo_passo},...prev]);
      }
      setTarefaContexto(null); setTela("tarefas");
    } catch(e) { alert("Erro ao salvar: " + e.message); }
    setSalvando(false);
  }

  async function adicionarCliente(c) {
    setSalvando(true);
    try { await salvarCliente(c); setClientes(prev=>[...prev,c]); } catch(e) { alert("Erro: "+e.message); }
    setSalvando(false);
  }

  async function inativarCliente(nome, motivo, linha) {
    setSalvando(true);
    try {
      if (linha) await atualizarStatusCliente(linha, "inativo", motivo);
      setClientes(prev=>prev.map(c=>c.nome===nome?{...c,status:"inativo",motivo_inativo:motivo||"Inativado"}:c));
      setTarefas(prev=>prev.filter(t=>t.cliente!==nome));
    } catch(e) { alert("Erro: "+e.message); }
    setSalvando(false);
  }

  async function reativarCliente(nome, linha) {
    setSalvando(true);
    try {
      if (linha) await atualizarStatusCliente(linha, "ativo", "");
      setClientes(prev=>prev.map(c=>c.nome===nome?{...c,status:"ativo",motivo_inativo:""}:c));
    } catch(e) { alert("Erro: "+e.message); }
    setSalvando(false);
  }

  function cumprir(tarefa) { setTarefaContexto(tarefa); setTela("chat"); }
  function verCliente(nome) { setTelaAnterior(tela); setClienteDetalhe(nome); setTela("detalhe"); }
  function adicionarTarefa(t) { setTarefas(prev=>[t,...prev]); setShowNovaTarefa(false); }

  if (carregando) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:16, color:"#888" }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #eee", borderTop:"3px solid #7F77DD", animation:"spin 0.8s linear infinite" }}/>
      <div style={{ fontSize:13 }}>Carregando dados da planilha...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!autenticado) return <TelaLogin/>;

  const navItems = [{id:"tarefas",label:"Tarefas",icon:"☑"},{id:"chat",label:"Registrar",icon:"+"},{id:"clientes",label:"Clientes",icon:"◫"},{id:"gestao",label:"Gestão",icon:"▦"}];
  const titulos  = {tarefas:"Minhas tarefas",chat:"Registrar",clientes:"Clientes",gestao:"Painel da gestão"};

  return (
    <div style={{ maxWidth:420, margin:"0 auto", height:"100vh", display:"flex", flexDirection:"column", background:"#fff", boxShadow:"0 0 40px rgba(0,0,0,0.08)", position:"relative", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 10px", borderBottom:"0.5px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, background:"#fff" }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500 }}>{tela==="detalhe"?clienteDetalhe:titulos[tela]}</div>
          <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {tela==="tarefas"&&<button onClick={()=>setShowNovaTarefa(true)} style={{ fontSize:12, padding:"5px 12px", background:"#EEEDFE", color:"#3C3489", border:"0.5px solid #AFA9EC", borderRadius:8, cursor:"pointer", fontWeight:500 }}>+ Tarefa</button>}
          {tela==="tarefas"&&<button onClick={carregarDados} title="Sincronizar com Sheets" style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>↻</button>}
          {tela!=="detalhe"&&<button onClick={()=>{ logout(); setAutenticado(false); }} style={{ width:32, height:32, borderRadius:"50%", background:"#EEEDFE", border:"none", cursor:"pointer", fontSize:13, fontWeight:500, color:"#3C3489" }}>S</button>}
        </div>
      </div>

      {/* Banner de erro */}
      {erroSync && <div style={{ padding:"8px 16px", background:"#FCEBEB", fontSize:12, color:"#A32D2D", borderBottom:"0.5px solid #F09595" }}>{erroSync}</div>}

      {/* Conteúdo */}
      <div style={{ flex:1, overflow:"hidden" }}>
        {tela==="tarefas"  && <PainelTarefas tarefas={tarefas} contatos={contatos} onCumprir={cumprir} onVerCliente={verCliente}/>}
        {tela==="chat"     && <TelaChat onSalvar={salvarContato} onNovoCliente={adicionarCliente} onInativarCliente={inativarCliente} clientes={clientes} tarefaContexto={tarefaContexto} onLimparContexto={()=>setTarefaContexto(null)} salvando={salvando}/>}
        {tela==="clientes" && <TelaClientes clientes={clientes} contatos={contatos} onVerCliente={verCliente}/>}
        {tela==="gestao"   && <PainelGestao contatos={contatos} tarefas={tarefas} clientes={clientes}/>}
        {tela==="detalhe"  && <DetalheCliente nomeCliente={clienteDetalhe} contatos={contatos} clientes={clientes} onVoltar={()=>setTela(telaAnterior)} onInativar={inativarCliente} onReativar={reativarCliente}/>}
      </div>

      {/* Nav */}
      {tela!=="detalhe"&&(
        <div style={{ display:"flex", borderTop:"0.5px solid #eee", background:"#fff", flexShrink:0 }}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>{ setTarefaContexto(null); setTela(n.id); }} style={{ flex:1, padding:"10px 0 12px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, borderTop:tela===n.id?"2px solid #7F77DD":"2px solid transparent", transition:"border-color .2s" }}>
              <span style={{ fontSize:n.id==="chat"?20:16, color:tela===n.id?"#534AB7":"#aaa" }}>{n.icon}</span>
              <span style={{ fontSize:11, fontWeight:tela===n.id?500:400, color:tela===n.id?"#534AB7":"#aaa" }}>{n.label}</span>
            </button>
          ))}
        </div>
      )}

      {showNovaTarefa&&<ModalNovaTarefa clientes={clientes} onSalvar={adicionarTarefa} onFechar={()=>setShowNovaTarefa(false)}/>}
    </div>
  );
}

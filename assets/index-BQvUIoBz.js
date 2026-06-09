(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();const Y="AVOIDER",Ge="FORCER",gi=e=>e===Y?"R":"B";function Ir(e,t=1){const n=e.length;for(let i=0;i<n;i++)for(let o=t;i+2*o<=n;o++)if(rs(e,i,i+o,o))return{start:i,end:i+2*o,period:o};return null}function is(e){const t=e.length;for(let n=0;n<t;n++)for(let i=1;n+2*i+1<=t;i++)if(as(e,n,n+2*i+1,i))return{start:n,end:n+2*i+1,period:i};return null}function os(e,t=1){const n=e.length;for(let i=0;i<n;i++)for(let o=t;i+2*o<=n;o++)if(ls(e,i,i+o,o))return{start:i,end:i+2*o,period:o};return null}function rs(e,t,n,i){for(let o=0;o<i;o++)if(e[t+o]!==e[n+o])return!1;return!0}function as(e,t,n,i){for(let o=t;o+i<n;o++)if(e[o]!==e[o+i])return!1;return!0}function ls(e,t,n,i){const o=new Map;for(let r=0;r<i;r++)o.set(e[t+r],(o.get(e[t+r])??0)+1),o.set(e[n+r],(o.get(e[n+r])??0)-1);for(const r of o.values())if(r!==0)return!1;return!0}function ss(e,t){switch(t){case"overlap":return is(e);case"abelian":return os(e,1);case"nontrivial":return Ir(e,2);default:return Ir(e,1)}}const cs="abcdefghijklmnopqrstuvwxyz";function be(e){return e<26?cs[e]:`<${e}>`}function ds(e){const t=e.game==="online"?"point":"move";return{config:e,word:[],phase:t,gap:null}}function K(e){return e.config.game==="append"?e.word.length%2===0?Y:Ge:e.phase==="point"?Ge:Y}function us(e,t){return ss(e,t)}function fs(e){const t=us(e.word,e.config.repMode);return t?{winner:Ge,witness:t}:e.word.length>=e.config.n?{winner:Y}:{}}function tt(e){return!!e.winner}function le(e){return e.winner?[]:e.config.game==="append"?Wi(e.config.k):e.phase==="point"?Wi(e.word.length+1):Wi(e.config.k)}function pe(e,t){if(e.winner||!le(e).includes(t))return e;if(e.config.game==="append")return Pr({...e,word:[...e.word,t],phase:"move",gap:null});if(e.phase==="point")return{...e,phase:"insert",gap:t};const i=e.gap??e.word.length,o=[...e.word.slice(0,i),t,...e.word.slice(i)];return Pr({...e,word:o,phase:"point",gap:null})}function Pr(e){const{winner:t,witness:n}=fs(e);return t?{...e,winner:t,witness:n}:e}function Wi(e){return Array.from({length:e},(t,n)=>n)}function ps(e){const t={square:"any square XX",nontrivial:"a nontrivial repetition XX (|X| ≥ 2)",overlap:"an overlap aXaXa",abelian:"an abelian square XY (Y a rearrangement of X)"};return`Ann (red) wants to ${e.game==="append"?"append letters":"insert letters where Ben points"} until length ${e.n} without ${t[e.repMode]}; Ben (blue) wins the instant one appears.`}function _(e){let t=e>>>0;return()=>{t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}const Po=1,Ho=-1;function mi(e,t){return e[Math.floor(t()*e.length)%e.length]}function No(e){return e.winner===Y?Po:e.winner===Ge?Ho:null}function hs(e){const t=No(e);return t!==null?t:e.word.length/e.config.n*2-1}function oo(e,t,n,i){const o=No(e);if(o!==null)return o;if(t===0)return hs(e);const r=K(e),a=le(e);if(r===Y){let s=-2;for(const c of a)if(s=Math.max(s,oo(pe(e,c),t-1,n,i)),n=Math.max(n,s),n>=i)break;return s}let l=2;for(const s of a)if(l=Math.min(l,oo(pe(e,s),t-1,n,i)),i=Math.min(i,l),i<=n)break;return l}function gs(e){return`${e.word.join(",")}|${e.phase}|${e.gap??-1}`}function Ra(e,t=new Map){const n=No(e);if(n!==null)return n;const i=gs(e),o=t.get(i);if(o!==void 0)return o;const r=K(e);let a=r===Y?-2:2;for(const l of le(e)){const s=Ra(pe(e,l),t);if(r===Y){if(s>a&&(a=s),a===Po)break}else if(s<a&&(a=s),a===Ho)break}return t.set(i,a),a}function ms(e){const t=e.config.n-e.word.length;if(t<=0)return!1;const n=e.config.k,i=e.config.game==="online"?Math.max(2,e.config.n):n,o=e.config.game==="online"?t*2:t;let r=1;for(let a=0;a<o;a++)if(r*=a%2===0?n:i,r>4e5)return!0;return!1}function bs(e,t){if(e.winner)return 0;const n=t===Y?Ge:Y;let i=0;for(const o of le(e))pe(e,o).winner!==n&&i++;return t===Y?i:-i}function Ba(e,t){const n=K(e);let i=null,o=[];for(const r of le(e)){const a=pe(e,r);if(a.winner===n)return r;let l=bs(a,n);a.winner&&a.winner!==n&&(l=-1e9),i===null||l>i?(i=l,o=[r]):l===i&&o.push(r)}return o.length?mi(o,t):le(e)[0]}function La(e){const t=[[0,1,2],[0,2],[1]];let n=[0];for(;n.length<e;){const i=[];for(const o of n)i.push(...t[o]);n=i}return n.slice(0,e)}let ti=La(64);function vs(e){return e>=ti.length&&(ti=La(Math.max(e+1,ti.length*2))),ti[e]}const ws=e=>[Math.floor(e/3),e%3],ys=(e,t)=>3*e+t;function $s(e){return e.config.game==="append"&&e.config.repMode==="nontrivial"&&e.config.k>=9&&!e.winner&&K(e)===Y}function ks(e){const t=e.word,n=t.length,i=vs(n/2),o=t.map(l=>ws(l)[1]);let r=0,a=1;for(let l=2;l<n;l+=2){const s=o[l-1];s===r&&(r=3-s-a),a=s}if(n!==0){const l=o[n-1];l===r&&(r=3-l-a)}return ys(i,r)}function Sa(e,t,n=6){const i=K(e);let o=i===Y?-1/0:1/0,r=[];for(const a of le(e)){const l=oo(pe(e,a),n-1,-2,2);(i===Y?l>o:l<o)?(o=l,r=[a]):l===o&&r.push(a)}return r.length?mi(r,t):le(e)[0]}function xs(e,t){if($s(e))return ks(e);if(ms(e))return Sa(e,t,6);const i=K(e)===Y?Po:Ho,o=new Map,a=le(e).map(l=>({v:Ra(pe(e,l),o),m:l})).filter(l=>l.v===i).map(l=>l.m);return a.length?mi(a,t):Ba(e,t)}function Ma(e,t,n){const i=le(e);if(i.length===0)return 0;switch(t){case 1:return Ba(e,n);case 2:return Sa(e,n,6);case 3:return xs(e,n);default:return mi(i,n)}}function Ta(e,t,n=3,i){if(e.winner)return null;const o=K(e),r=i??Ma(e,n,t),a=pe(e,r);if(e.config.game==="online"&&e.phase==="point")return{move:r,text:`Ben (forcer) should point at gap ${r} — the position that most pressures Ann.`};const l=be(r);if(o===Ge&&a.winner===Ge&&a.witness){const s=Bs(a,a.witness);return{move:r,text:`Ben plays "${l}" — it completes ${s}, so Ann loses.`}}if(o===Y){const s=le(e),c=new Set(Rs(e));if(c.size===s.length)return{move:r,text:`Ann has no safe move — every letter completes a forbidden repetition, so she is lost. "${be(r)}" only delays it.`};const d=i===void 0&&c.has(r)?s.find(v=>!c.has(v)):r,u=be(d);if(c.has(d)){const v=s.filter($=>!c.has($)).map(be).map($=>`"${$}"`);return{move:d,text:`Ann plays "${u}" — it completes a forbidden repetition and loses; ${v.join(", ")} would have stayed safe.`}}const p=[...c].filter(v=>v!==d),f=p.length?` Avoid ${p.map(be).map(v=>`"${v}"`).join(", ")} — ${p.length===1?"it makes":"they each make"} a forbidden repetition.`:"";return{move:d,text:`Ann should play "${u}" to stay repetition-free.${f}`}}return{move:r,text:`Recommended move: "${l}".`}}function Rs(e){const t=[];for(const n of le(e))pe(e,n).winner===Ge&&t.push(n);return t}function Bs(e,t){const n=e.word.slice(t.start,t.end).map(be).join(""),i=e.word.slice(t.start,t.start+t.period).map(be).join("");return{square:`the square ${i}${i}`,nontrivial:`the repetition ${i}${i}`,overlap:`the overlap ${n}`,abelian:`the abelian square ${n}`}[e.config.repMode]}const S=e=>document.getElementById(e),Ls=`
  <section class="card">
    <h2>Settings</h2>
    <div class="controls">
      <div class="field span2">
        <label for="gameSel">Game</label>
        <select id="gameSel">
          <option value="append">Append (alternating)</option>
          <option value="online" selected>Thue online (insertion)</option>
        </select>
      </div>
      <div class="field">
        <label for="kRange">Alphabet k <span class="hint-num" id="kLabel">4</span></label>
        <input type="range" id="kRange" min="2" max="6" value="4" />
      </div>
      <div class="field">
        <label for="nRange">Target n <span class="hint-num" id="nLabel">12</span></label>
        <input type="range" id="nRange" min="4" max="24" value="12" />
      </div>
      <div class="field span2">
        <label for="repSel">Repetition</label>
        <select id="repSel">
          <option value="square">Square XX</option>
          <option value="nontrivial">Nontrivial XX (|X| ≥ 2)</option>
          <option value="overlap" selected>Overlap aXaXa</option>
          <option value="abelian">Abelian square XY</option>
        </select>
      </div>
      <div class="field">
        <label for="roleSel">You play</label>
        <select id="roleSel">
          <option value="R" selected>Ann (avoider)</option>
          <option value="B">Ben (forcer)</option>
          <option value="both">Hotseat (both)</option>
          <option value="none">Watch AI vs AI</option>
        </select>
      </div>
      <div class="field" id="aiRField">
        <label for="aiR">Ann AI</label>
        <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
      </div>
      <div class="field" id="aiBField">
        <label for="aiB">Ben AI</label>
        <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
      </div>
    </div>
    <div class="buttons">
      <button id="newBtn" class="btn btn-primary">New game</button>
      <button id="hintBtn" class="btn">Hint</button>
      <button id="undoBtn" class="btn">Undo</button>
      <button id="runBtn" class="btn" hidden>Run</button>
    </div>
    <div class="explain-note hidden" id="explainNote"></div>
  </section>
`,Ss=`
  <section class="card board-card">
    <div class="status">
      <span class="turn-pill" id="turnPill">Ann to move</span>
      <span class="goal" id="goalText"></span>
    </div>

    <div class="wordbox">
      <div class="word" id="word"></div>
    </div>

    <div class="palette" id="palette"></div>

    <div class="meterrow">
      <div class="meter">
        <div class="meter-label" id="meterLabel">Length toward target</div>
        <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
        <div class="meter-value" id="meterValue">0 / 12</div>
      </div>
    </div>
    <div class="banner" id="banner" hidden></div>
  </section>
`,Ms=`
  <section class="card explainer" id="howto">
    <h2>How to play</h2>
    <ol class="howto-list">
      <li><b class="red-text">Ann (avoider, red)</b> keeps the word free of the chosen repetition; <b class="blue-text">Ben (forcer, blue)</b> tries to force one.</li>
      <li id="howtoMode"><b>Append game:</b> players take turns adding a letter to the end.</li>
      <li><b class="red-text">Ann</b> wins by reaching length <b id="howtoN">12</b> repetition-free.</li>
      <li><b class="blue-text">Ben</b> wins the instant a forbidden repetition appears — its two equal blocks pulse.</li>
      <li>Turn on <b>Explainers</b> and use <b>Hint</b> to see the recommended move named.</li>
    </ol>
  </section>

  <section class="card explainer" id="maths">
    <h2>The maths behind it</h2>
    <p><b>Thue's theorem (1906).</b> Arbitrarily long <i>square-free</i> words exist over a
      <b>3-letter</b> alphabet, never over 2 — the seed of combinatorics on words.</p>
    <p><b>The game raises the bar.</b> When Ben interferes, Ann needs more room: in
      <i>How to play Thue games</i> (Grytczuk, Kosiński, Zmarz) she has an explicit strategy to
      dodge nontrivial repetitions over <b>9</b> letters and overlaps over <b>4</b> — even when
      Ben inserts at arbitrary positions.</p>
    <p><b>Square / overlap / abelian.</b> A square is <code>XX</code>; an overlap is
      <code>aXaXa</code>; an abelian square is <code>XY</code> with <code>Y</code> an anagram of
      <code>X</code>. Switch the repetition notion to change the threshold.</p>
    <p><b>The AI.</b> “Solver” searches the whole game tree exactly on small instances (so
      <i>k</i>, <i>n</i> small reproduces the paper's thresholds), and on the append game with
      nontrivial repetitions over <b>9</b> letters it plays Ann's <i>explicit</i> proven
      strategy (Theorem 2) — a tier that never loses, at any length. “Strong” is depth-limited
      minimax. Explanation mode names the square each move creates or averts.</p>
    <p class="muted small">References: Thue, <i>Über unendliche Zeichenreihen</i> (1906);
      Grytczuk, Kosiński &amp; Zmarz, <i>How to play Thue games</i>, Theoret. Comput. Sci. 582 (2015).</p>
  </section>
`;let m,gt=[],Be=null,bi=_(1),Ts=1,$n,At=!1,vi=0,mt=null;const Es=430;function Cs(e){const t=+S("kRange").value,n=+S("nRange").value;return{game:S("gameSel").value,k:t,n,repMode:S("repSel").value,humanRole:S("roleSel").value,aiLevel:{R:+S("aiR").value,B:+S("aiB").value},seed:e}}function Fo(e){const t=m.config.humanRole;return t==="both"?!0:t==="none"?!1:t===gi(e)}const fn=()=>!tt(m)&&Fo(K(m)),qo=()=>!tt(m)&&!Fo(K(m));function dt(){window.clearTimeout($n);const e=Ts++;bi=_(2654435761^e*2654435761),m=ds(Cs(e)),gt=[],Be=null,mt=null,vi=0,m.config.humanRole!=="none"&&(At=!1),Hn(),zo()}function Go(e){if(tt(m))return;const t=pe(m,e);t!==m&&(gt.push(m),vi=m.word.length,m=t,Be=null,mt=null,Hn(),zo())}function zo(){window.clearTimeout($n),qo()&&(m.config.humanRole==="none"&&!At||($n=window.setTimeout(Is,Es)))}function As(e){return`${e.word.join(",")}|${e.phase}|${e.gap??-1}|${e.config.aiLevel[gi(K(e))]}`}function Ea(){const e=As(m);if(!mt||mt.key!==e){const t=m.config.aiLevel[gi(K(m))];mt={key:e,move:Ma(m,t,bi)}}return mt.move}function Is(){qo()&&(m.config.humanRole==="none"&&!At||Go(Ea()))}function Ps(e){fn()&&(m.config.game==="online"&&m.phase!=="insert"||Go(e))}function Hs(e){fn()&&(m.config.game!=="online"||m.phase!=="point"||Go(e))}function Ns(){fn()&&(Be=Ta(m,bi),Hn())}function Fs(){if(!gt.length)return;m=gt.pop();const e=m.config.humanRole;if(e==="R"||e==="B")for(;gt.length&&!Fo(K(m))&&!tt(m);)m=gt.pop();Be=null,mt=null,At=!1,vi=m.word.length,Hn()}function qs(e){const t=m.witness;if(!t||e<t.start||e>=t.end)return"";const n=t.start+Math.ceil((t.end-t.start)/2);return e<n?"win-a":"win-b"}function Gs(){const e=S("word"),t=tt(m),n=m.config.game==="online",i=n&&!t&&m.phase==="point"&&fn(),o=n&&m.phase==="insert"?m.gap:null;e.classList.toggle("empty",m.word.length===0&&!n);const r=[],a=i&&Be?Be.move:-1,l=s=>i?`<button class="${s===a?"caret suggest":"caret"}" data-gap="${s}" aria-label="point at gap ${s}"></button>`:o===s?`<button class="caret active" data-gap="${s}" disabled aria-label="chosen gap ${s}"></button>`:`<button class="caret disabled" data-gap="${s}" disabled tabindex="-1" aria-label="gap ${s}"></button>`;if(n&&m.word.length===0){const s=i?"caret empty":"caret empty disabled",c=i?"":' disabled tabindex="-1"',d=i?"Ben: click anywhere here to point at the first gap.":"(empty word — Ann starts repetition-free)";e.innerHTML=`<button class="${s}" data-gap="0"${c} aria-label="point at the first gap"><span class="empty-hint">${d}</span></button>`;return}for(let s=0;s<=m.word.length;s++)if(n&&r.push(l(s)),s<m.word.length){const c=["tile"],d=qs(s);d?c.push(d):s>=vi&&!t&&c.push("fresh"),r.push(`<span class="${c.join(" ")}">${be(m.word[s])}</span>`)}e.innerHTML=r.join("")}function zs(){const e=S("palette"),t=tt(m),n=m.config.game==="online",i=!t&&fn()&&(!n||m.phase==="insert"),o=new Set,r=Be&&(!n||m.phase==="insert")?Be.move:-1;if(i)for(let l=0;l<m.config.k;l++)pe(m,l).winner===Ge&&o.add(l);const a=[];for(let l=0;l<m.config.k;l++){const s=[""];i&&o.has(l)&&s.push("danger"),i&&r===l&&s.push("suggest");const c=i?"":" disabled";a.push(`<button class="${s.join(" ").trim()}" data-letter="${l}"${c}>${be(l)}</button>`)}e.innerHTML=a.join("")}function Os(){const e=S("explainNote"),t=document.body.classList.contains("explain-on");let n="";if(t&&!tt(m)){if(Be)n=`<b>Hint:</b> ${Be.text}`;else if(qo()){const i=m.config.aiLevel[gi(K(m))],o=Ta(m,bi,i,Ea());o&&(n=`<b>${K(m)===Y?"Ann":"Ben"} (AI):</b> ${o.text}`)}}e.innerHTML=n,e.classList.toggle("hidden",n==="")}function Hn(){const e=m.config,t=tt(m);Gs(),zs(),Os();const n=S("turnPill");if(t)n.textContent=m.winner===Y?"Ann wins":"Ben wins",n.className="turn-pill done";else{const r=K(m),a=e.game==="online"&&m.phase==="point"?" — pick a gap":"";n.textContent=(r===Y?"Ann to move":"Ben to move")+a,n.className=`turn-pill ${r===Y?"":"blue"}`.trim()}S("goalText").textContent=ps(e),S("meterLabel").textContent="Length toward target",S("meterFill").style.width=`${Math.min(m.word.length/e.n,1)*100}%`,S("meterValue").textContent=`${m.word.length} / ${e.n}`;const i=S("banner");if(t)if(i.hidden=!1,m.winner===Y)i.className="banner red",i.textContent=`Ann wins — reached length ${e.n} with no forbidden repetition! 🎉`;else{i.className="banner blue";const r=m.witness,a=r?m.word.slice(r.start,r.end).map(be).join(""):"";i.textContent=`Ben wins — a forbidden repetition appeared${a?`: ${a}`:""}.`}else i.hidden=!0;S("hintBtn").disabled=!fn(),S("undoBtn").disabled=gt.length===0;const o=S("runBtn");e.humanRole==="none"?(o.hidden=!1,o.textContent=At?"Pause":"Run",o.disabled=t):o.hidden=!0}function ni(){const e=S("kRange"),t=S("nRange");S("kLabel").textContent=e.value,S("nLabel").textContent=t.value,S("howtoN").textContent=t.value;const n=S("gameSel").value;S("howtoMode").innerHTML=n==="append"?"<b>Append game:</b> players take turns adding a letter to the end.":"<b>Thue online:</b> Ben clicks a caret to choose a gap, then Ann inserts a letter there."}function Hr(){const e=S("roleSel").value;S("aiRField").style.display=e==="B"||e==="none"?"":"none",S("aiBField").style.display=e==="R"||e==="none"?"":"none"}function js(e){e.settings.innerHTML=Ls,e.board.innerHTML=Ss,e.sidebar.innerHTML=Ms,S("word").addEventListener("click",t=>{const n=t.target.closest("[data-gap]");n&&Hs(+n.getAttribute("data-gap"))}),S("palette").addEventListener("click",t=>{const n=t.target.closest("[data-letter]");n&&Ps(+n.getAttribute("data-letter"))}),S("gameSel").addEventListener("change",()=>{ni(),dt()});for(const t of["kRange","nRange"])S(t).addEventListener("input",ni),S(t).addEventListener("change",()=>{ni(),dt()});S("repSel").addEventListener("change",dt),S("roleSel").addEventListener("change",()=>{Hr(),dt()});for(const t of["aiR","aiB"])S(t).addEventListener("change",dt);return S("newBtn").addEventListener("click",dt),S("hintBtn").addEventListener("click",Ns),S("undoBtn").addEventListener("click",Fs),S("runBtn").addEventListener("click",()=>{At=!At,Hn(),zo()}),ni(),Hr(),dt(),{destroy(){window.clearTimeout($n),$n=void 0}}}const Ws={id:"thue-arena",title:"Thue Arena",tagline:"Build a repetition-free word",blurb:"One player extends a word, the other forces a repeated block (a square). Avoid squares as long as you can — or force one. Includes an exact solver and an explanation mode.",topic:"Thue / nonrepetitive words",family:"Repetitions & Thue",mechanic:"insertion + append",tags:["squares","nonrepetitive","abelian"],icon:`<svg viewBox="0 0 64 28" width="64" height="28">
            <rect x="2" y="8" width="13" height="13" rx="3" fill="var(--red)"/>
            <rect x="18" y="8" width="13" height="13" rx="3" fill="var(--blue)"/>
            <rect x="34" y="8" width="13" height="13" rx="3" fill="var(--red)"/>
            <rect x="50" y="8" width="13" height="13" rx="3" fill="var(--blue)" opacity="0.45"/>
          </svg>`,mount:js},re="R",Nr="B",_s="shortest";function Vs(e,t){const n=e.length;let i=-1;for(let o=1;o*2<=n;o++){let r=!0;for(let a=0;a<o;a++)if(e[n-2*o+a]!==e[n-o+a]){r=!1;break}if(r){if(t==="shortest")return o;i=o}}return i}function Ds(e,t,n=_s){const i=e.slice();i.push(t);let o=0;for(;;){const r=Vs(i,n);if(r<0)break;i.length=i.length-r,o+=r}return{word:i,erased:o}}function Ys(e){return{config:e,word:[],turn:re,round:0,lastErased:0}}function wi(e){return e.winner?[]:Array.from({length:e.config.k},(t,n)=>n)}function kn(e,t){if(e.winner||t<0||t>=e.config.k)return e;const{word:n,erased:i}=Ds(e.word,t,e.config.rule),o={...e,word:n,turn:e.turn===re?Nr:re,round:e.round+1,lastErased:i};return n.length>=e.config.d?o.winner=re:o.round>=e.config.rounds&&(o.winner=Nr),o}function pn(e){return!!e.winner}function Us(e){return`Red grows the word to ${e.d}; Blue keeps it short for ${e.rounds} moves.`}const Fr=1e6;function Ca(e){return e.winner===re?Fr:e.winner&&e.winner!==re?-Fr:e.word.length*100-e.round}function _i(e,t,n){const i=wi(e),o=e.turn===re;let r=i[0],a=o?-1/0:1/0;for(const l of i){const s=(t>1?ro(kn(e,l),t-1,-1/0,1/0):Ca(kn(e,l)))+(n()-.5)*.001;(o?s>a:s<a)&&(a=s,r=l)}return r}function ro(e,t,n,i){if(e.winner||t===0)return Ca(e);const o=wi(e);if(e.turn===re){let a=-1/0;for(const l of o)if(a=Math.max(a,ro(kn(e,l),t-1,n,i)),n=Math.max(n,a),n>=i)break;return a}let r=1/0;for(const a of o)if(r=Math.min(r,ro(kn(e,a),t-1,n,i)),i=Math.min(i,r),n>=i)break;return r}function Xs(e){const t=e.config.rounds-e.round,n=e.config.k<=2?16:e.config.k<=3?11:8;return Math.min(t,n)}function Ks(e,t,n){switch(t){case 1:return _i(e,1,n);case 2:return _i(e,3,n);case 3:return _i(e,Xs(e),n);default:{const i=wi(e);return i[Math.floor(n()*i.length)]}}}const Zs=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="kRange">Alphabet <span class="hint-num" id="kLabel">4</span></label>
      <input type="range" id="kRange" min="2" max="5" value="4" />
    </div>
    <div class="field">
      <label for="dRange">Target length <span class="hint-num" id="dLabel">8</span></label>
      <input type="range" id="dRange" min="4" max="20" value="8" />
    </div>
    <div class="field">
      <label for="roundsRange">Moves <span class="hint-num" id="roundsLabel">24</span></label>
      <input type="range" id="roundsRange" min="6" max="40" value="24" />
    </div>
    <div class="field">
      <label for="eraseSel">Erase rule</label>
      <select id="eraseSel">
        <option value="shortest" selected>Shortest square</option>
        <option value="longest">Longest square</option>
      </select>
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Red (Grower)</option>
        <option value="B">Blue (Shrinker)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Search</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Search</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,Js=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="wordbox">
    <div class="word" id="word"></div>
    <div class="erase-badge" id="eraseBadge" hidden></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label">Length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 8</div>
    </div>
    <div class="rounds" id="rounds">move 0 / 24</div>
  </div>
  <div class="chartbox">
    <div class="chart-label">Length over time</div>
    <div class="chart" id="chart"></div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,Qs=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b>Click a letter</b> to append it to the word.</li>
    <li>Whenever a repetition <code>XX</code> appears at the end, its second copy is <b>erased</b> — so the word can shrink.</li>
    <li>You are <b class="red-text">Red (Grower)</b> — make the word reach length <b id="howtoD">8</b>.</li>
    <li><b class="blue-text">Blue (Shrinker)</b> wants to keep it short until the moves run out.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Square-free reducts.</b> Erasing the repeated block of a square repeatedly leads to a
    square-free word (Grytczuk &amp; Stankiewicz, <i>Square-free reducts of words</i>, 2020).</p>
  <p><b>Why only the end?</b> Because squares are erased as they form, the word stays
    <b>square-free between moves</b> — so a new square can only end at the just-added letter.
    That's why we only check the suffix.</p>
  <p><b>Game value / who's favoured.</b> With a small alphabet the Shrinker dominates: for
    <code>k&nbsp;=&nbsp;3</code> the longest square-free word the Grower can force tops out
    around length&nbsp;5, so any target <code>d&nbsp;&ge;&nbsp;6</code> (and all of
    <code>k&nbsp;=&nbsp;2</code>) is a forced Shrinker win. A larger alphabet gives the Grower
    room — the default <code>k&nbsp;=&nbsp;4</code>, <code>d&nbsp;=&nbsp;8</code> is a genuine
    toss-up.</p>
  <p class="muted small">Erasure rule: erase the second half of the <i>shortest</i> square ending at
    the last letter, and repeat until clean.</p>
  <p class="muted small">Reference: Grytczuk &amp; Stankiewicz, <i>Square-free reducts of words</i>
    (2020), <a href="https://arxiv.org/abs/2011.12822" target="_blank" rel="noopener">arXiv:2011.12822</a>.</p>
</section>`,P=e=>document.getElementById(e);let E,je=[],Aa=_(1),ec=1,ci,It=!1;const tc=430;let tn=[],xn;const ao="ABCDEFGHIJKLMNOPQRSTUVWXYZ";function nc(e){return{k:+P("kRange").value,d:+P("dRange").value,rounds:+P("roundsRange").value,rule:P("eraseSel").value,humanRole:P("roleSel").value,aiLevel:{R:+P("aiR").value,B:+P("aiB").value},seed:e}}function Oo(e){const t=E.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const Ia=()=>!pn(E)&&Oo(E.turn),Pa=()=>!pn(E)&&!Oo(E.turn);function Yt(){window.clearTimeout(ci),window.clearTimeout(xn),tn=[];const e=ec++;Aa=_(2654435761^e*2654435761),E=Ys(nc(e)),je=[],E.config.humanRole!=="none"&&(It=!1),yi(),jo()}function Ha(e){if(pn(E))return;const t=kn(E,e);if(t===E)return;const n=E.word.concat(e);tn=t.lastErased>0?n.slice(t.word.length):[],je.push(E),E=t,yi(),jo()}function jo(){window.clearTimeout(ci),Pa()&&(E.config.humanRole==="none"&&!It||(ci=window.setTimeout(ic,tc)))}function ic(){Pa()&&(E.config.humanRole==="none"&&!It||Ha(Ks(E,E.config.aiLevel[E.turn],Aa)))}function oc(e){Ia()&&Ha(e)}function rc(){if(!je.length)return;window.clearTimeout(xn),tn=[],E=je.pop();const e=E.config.humanRole;if(e==="R"||e==="B")for(;je.length&&!Oo(E.turn)&&!pn(E);)E=je.pop();It=!1,yi()}function Na(){const e=P("word");e.innerHTML="";const t=E.word.length;if(E.word.forEach((n,i)=>{const o=document.createElement("div");o.className="tile"+(i===t-1&&t>0&&!pn(E)?" fresh":""),o.textContent=ao[n]??String(n),e.appendChild(o)}),tn.length){const n=tn;tn=[];for(const i of n){const o=document.createElement("div");o.className="tile erasing",o.textContent=ao[i]??String(i),e.appendChild(o)}window.clearTimeout(xn),xn=window.setTimeout(Na,240)}}function ac(){const e=P("palette");e.innerHTML="";const t=Ia(),n=new Set(wi(E));for(let i=0;i<E.config.k;i++){const o=document.createElement("button");o.type="button",o.textContent=ao[i]??String(i),o.dataset.letter=String(i),o.disabled=!t||!n.has(i),e.appendChild(o)}}function lc(){const e=P("chart"),t=[0,...je.map(o=>o.word.length),E.word.length],n=t.length>1?t.slice(1):t,i=Math.max(E.config.d,1,...n);e.innerHTML="";for(const o of n){const r=document.createElement("div");r.className="bar",r.style.height=`${Math.max(2,o/i*100)}%`,r.title=String(o),e.appendChild(r)}}function sc(){const e=P("eraseBadge");E.lastErased>0?(e.textContent=`−${E.lastErased}`,e.hidden=!1,e.style.animation="none",e.offsetWidth,e.style.animation=""):e.hidden=!0}function yi(){const e=E.config,t=pn(E),n=E.word.length;Na(),ac(),lc(),sc();const i=P("turnPill");t?(i.textContent=`${E.winner===re?"Red":"Blue"} wins`,i.className="turn-pill done"):(i.textContent=E.turn===re?"Red to move":"Blue to move",i.className=`turn-pill ${E.turn===re?"":"blue"}`.trim()),P("goalText").textContent=Us(e),P("meterFill").style.width=`${Math.min(n/e.d,1)*100}%`,P("meterValue").textContent=`${n} / ${e.d}`,P("rounds").textContent=`move ${E.round} / ${e.rounds}`;const o=P("banner");t?(o.hidden=!1,E.winner===re?(o.className="banner red",o.textContent=`Red (Grower) wins — the word reached length ${e.d}! 🎉`):(o.className="banner blue",o.textContent=`Blue (Shrinker) wins — ${e.rounds} moves up, the word stayed at ${n} < ${e.d}.`)):o.hidden=!0,P("undoBtn").disabled=je.length===0;const r=P("runBtn");e.humanRole==="none"?(r.hidden=!1,r.textContent=It?"Pause":"Run",r.disabled=t):r.hidden=!0}function Vi(){const e=P("kRange").value,t=P("dRange").value,n=P("roundsRange").value;P("kLabel").textContent=e,P("dLabel").textContent=t,P("roundsLabel").textContent=n,P("howtoD").textContent=t}function qr(){const e=P("roleSel").value;P("aiRField").style.display=e==="B"||e==="none"?"":"none",P("aiBField").style.display=e==="R"||e==="none"?"":"none"}function cc(e){e.settings.innerHTML=Zs,e.board.innerHTML=Js,e.sidebar.innerHTML=Qs,P("palette").addEventListener("click",t=>{const n=t.target.closest("[data-letter]");n&&oc(+n.getAttribute("data-letter"))});for(const t of["kRange","dRange","roundsRange"])P(t).addEventListener("input",Vi),P(t).addEventListener("change",()=>{Vi(),Yt()});P("eraseSel").addEventListener("change",Yt),P("roleSel").addEventListener("change",()=>{qr(),Yt()});for(const t of["aiR","aiB"])P(t).addEventListener("change",Yt);return P("newBtn").addEventListener("click",Yt),P("undoBtn").addEventListener("click",rc),P("runBtn").addEventListener("click",()=>{It=!It,yi(),jo()}),Vi(),qr(),Yt(),{destroy(){window.clearTimeout(ci),window.clearTimeout(xn)}}}const dc={id:"repetition-eraser",title:"Repetition Eraser",tagline:"A grow-and-shrink word game",blurb:"Append letters; squares at the end are erased, so the word grows and shrinks. Reach the target length (Grower) — or stall it out until the moves run out (Shrinker).",topic:"Square-free reducts",family:"Repetitions & Thue",mechanic:"append + erase",tags:["square-free","grow & shrink"],icon:`<svg viewBox="0 0 52 28" width="52" height="28">
            <rect x="3" y="8" width="12" height="12" rx="3" fill="var(--red)"/>
            <rect x="18" y="8" width="12" height="12" rx="3" fill="var(--blue)"/>
            <rect x="33" y="8" width="12" height="12" rx="3" fill="var(--red)" opacity="0.4"/>
          </svg>`,mount:cc},_e="BUILDER",X="GRASSHOPPER",Wo=e=>e===X?"R":"B";function uc(e,t,n,i){for(let o=0;o<i;o++)if(e[t+o]!==e[n+o])return!1;return!0}function fc(e,t=2){const n=e.length;if(t<2)return null;for(let i=1;t*i<=n;i++){const o=n-t*i;let r=!0;for(let a=1;a<t&&r;a++)uc(e,o,o+a*i,i)||(r=!1);if(r)return{start:o,end:n,block:i}}return null}const pc="abcdefghijklmnopqrstuvwxyz";function $i(e){return e<26?pc[e]:`<${e}>`}function Fa(e){return e.pos+3-e.word.length}function hc(e){const t={config:e,word:[],pos:-1,inspected:[],phase:"build",needLeft:0,winner:null};return t.needLeft=Fa(t),t}function se(e){return e.phase==="build"?_e:X}function nt(e){return e.winner!==null}function ae(e){return e.winner?[]:e.phase==="build"?gc(e.config.alpha):[1,2]}function ue(e,t){if(e.winner)return e;if(e.phase==="build"){if(t<0||t>=e.config.alpha)return e;const a=[...e.word,t],l=e.needLeft-1,s=l<=0?"hop":"build";return{...e,word:a,needLeft:Math.max(0,l),phase:s}}if(t!==1&&t!==2)return e;const n=e.pos+t,i=[...e.inspected,e.word[n]],o={...e,word:e.word,pos:n,inspected:i,phase:"build",needLeft:0},r=fc(i,e.config.power);return r?{...o,winner:X,witness:r}:i.length>=e.config.d?{...o,winner:_e}:{...o,needLeft:Fa(o)}}function gc(e){return Array.from({length:e},(t,n)=>n)}function mc(e){return`Grasshopper (red) hops +1/+2 to force ${e.power===2?"a square XX":`a ${e.power}th power x^${e.power}`} into the inspected word S; Builder (blue) appends letters to keep S square-free and reach |S| = ${e.d}.`}const _o=1,Vo=-1;function ki(e,t){return e[Math.floor(t()*e.length)%e.length]}function Do(e){return e.winner===X?_o:e.winner===_e?Vo:null}function lo(e){const t=e.inspected,n=e.config.power;let i=0;for(let o=1;o*2<=t.length+2;o++){let r=1,a=t.length-o;for(;a-o>=0&&bc(t,a-o,a,o);)r++,a-=o;if(r>=n){i=1;break}i=Math.max(i,r/n)}return i}function bc(e,t,n,i){for(let o=0;o<i;o++)if(e[t+o]!==e[n+o])return!1;return!0}function vc(e){const t=Do(e);if(t!==null)return t;const n=e.inspected.length/e.config.d,i=lo(e);return Math.max(-.99,Math.min(.99,i*1-n*.8))}function so(e,t,n,i){const o=Do(e);if(o!==null)return o;if(t===0)return vc(e);const r=se(e),a=ae(e);if(r===X){let s=-2;for(const c of a)if(s=Math.max(s,so(ue(e,c),t-1,n,i)),n=Math.max(n,s),n>=i)break;return s}let l=2;for(const s of a)if(l=Math.min(l,so(ue(e,s),t-1,n,i)),i=Math.min(i,l),i<=n)break;return l}function wc(e){const t=e.word.slice(e.pos+1);return`${e.inspected.join(",")}|${t.join(",")}|${e.phase}|${e.needLeft}`}function qa(e,t=new Map){const n=Do(e);if(n!==null)return n;const i=wc(e),o=t.get(i);if(o!==void 0)return o;const r=se(e);let a=r===X?-2:2;for(const l of ae(e)){const s=qa(ue(e,l),t);if(r===X){if(s>a&&(a=s),a===_o)break}else if(s<a&&(a=s),a===Vo)break}return t.set(i,a),a}function yc(e){return e.config.d-e.inspected.length<=0||e.config.power>=2&&e.config.alpha<=4&&e.config.d<=14||e.config.alpha<=3&&e.config.d<=18}function $c(e,t){if(e.winner)return e.winner===t?1e6:-1e6;const n=t===X?_e:X;let i=0;for(const o of ae(e))ue(e,o).winner!==n&&i++;return i}function Ga(e,t){const n=se(e),i=ae(e);let o=null,r=[];for(const a of i){const l=ue(e,a);if(l.winner===n)return a;let s=$c(l,n);l.winner&&l.winner!==n&&(s=-1e9),n===X?s+=lo(l)*.5:s+=(1-lo(l))*.5,o===null||s>o?(o=s,r=[a]):s===o&&r.push(a)}return r.length?ki(r,t):i[0]}function za(e,t,n=8){const i=se(e),o=ae(e);let r=i===X?-1/0:1/0,a=[];for(const l of o){const s=so(ue(e,l),n-1,-2,2);(i===X?s>r:s<r)?(r=s,a=[l]):s===r&&a.push(l)}return a.length?ki(a,t):o[0]}function kc(e,t){if(!yc(e))return za(e,t,8);const i=se(e)===X?_o:Vo,o=new Map,a=ae(e).map(l=>({v:qa(ue(e,l),o),m:l})).filter(l=>l.v===i).map(l=>l.m);return a.length?ki(a,t):Ga(e,t)}function Oa(e,t,n){const i=ae(e);if(i.length===0)return 0;switch(t){case 1:return Ga(e,n);case 2:return za(e,n,8);case 3:return kc(e,n);default:return ki(i,n)}}function xc(e,t,n=3,i){if(e.winner)return null;const o=se(e),r=i??Oa(e,n,t);if(o===_e){const l=ue(e,r),s=e.needLeft;return l.phase==="hop"&&ae(l).every(d=>ue(l,d).winner===X)?{move:r,text:`Builder is cornered — after "${Gr(r)}" both grasshopper hops complete a forbidden power; no safe letter remains.`}:{move:r,text:`Builder appends "${Gr(r)}"${s>1?` (${s} letters owed this round — making them different denies the grasshopper a repeat)`:""} to keep every reachable landing square-free.`}}const a=ae(e).filter(l=>ue(e,l).winner===X);if(ae(e),a.length){const l=a.includes(r)?r:a[0];return{move:l,text:`Grasshopper hops +${l} — it lands on a letter that completes a forbidden power in S. Win!`}}return{move:r,text:`Grasshopper hops +${r} to extend a repeated block in S and manoeuvre toward forcing a ${e.config.power===2?"square":"power"}; no hop completes one yet.`}}function Gr(e){return e<26?"abcdefghijklmnopqrstuvwxyz"[e]:`<${e}>`}const A=e=>document.getElementById(e),Rc=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="alphaRange">Alphabet |A| <span class="hint-num" id="alphaLabel">3</span></label>
      <input type="range" id="alphaRange" min="2" max="6" value="3" />
    </div>
    <div class="field">
      <label for="dRange">Inspected target d <span class="hint-num" id="dLabel">6</span></label>
      <input type="range" id="dRange" min="2" max="16" value="6" />
    </div>
    <div class="field span2">
      <label for="powerSel">Forbidden pattern</label>
      <select id="powerSel">
        <option value="2" selected>Square xx</option>
        <option value="3">Cube xxx</option>
      </select>
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="B">Builder (blue) · avoider</option>
        <option value="R" selected>Grasshopper (red) · forcer</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Builder AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Grasshopper AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,Bc=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Builder to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="phaselabel" id="phaseLabel"></div>

  <div class="wordbox">
    <div class="word" id="word"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="inspectbox">
    <div class="inspect-label">Inspected word S (what is judged)</div>
    <div class="inspected" id="inspected"></div>
  </div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Inspected length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 6</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,Lc=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Builder (blue)</b> — the <b>avoider</b> — appends letters to the end of the word <b>W</b>, one at a time, until the grasshopper has somewhere to jump (it must be able to reach both <code>p+1</code> and <code>p+2</code>). When it owes <b>two</b> letters it can make them <i>different</i> so the grasshopper can't simply repeat.</li>
    <li><b class="red-text">Grasshopper (red)</b> 🦗 — the <b>forcer</b> — then hops forward <b>+1</b> or <b>+2</b> — never backward. The letter it lands on is appended to the <b>inspected word S</b>.</li>
    <li><b class="red-text">Grasshopper</b> wins the instant <b>S</b> ends with the forbidden pattern (a square <code>xx</code>, or a cube <code>xxx</code>) — it has <b>forced a square into the path</b>; its repeated blocks pulse.</li>
    <li id="howtoGoal"><b class="blue-text">Builder</b> wins by keeping <b>S</b> square-free all the way to <b>|S| = <span id="howtoD">6</span></b>.</li>
    <li>A letter the grasshopper <b>skips with a +2 hop</b> is behind it forever — hops are forward-only, so it can never be landed on again.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Thue's theorem (1906).</b> Arbitrarily long <i>square-free</i> words exist over a
    <b>3-letter</b> alphabet, never over 2 — the seed of combinatorics on words. The plain Thue
    pursuit–evasion game asks whether an <i>avoider</i> who controls the letters can dodge a square
    forever; over <b>|A| ≥ 3</b> it can.</p>
  <p><b>The grasshopper twist.</b> The avoider is the <b class="blue-text">Builder</b>: it controls
    the letters but <b>not</b> which of them is judged. The <b class="red-text">Grasshopper</b> (the
    forcer) chooses <i>which subsequence</i> — via <code>+1/+2</code> hops — becomes <b>S</b>. So the
    Builder must keep <i>every</i> hop-reachable subsequence square-free, while the Grasshopper
    manoeuvres to steer some reachable path into a repeat. This is a genuine pursuit–evasion game on
    a word.</p>
  <p><b>The contest.</b> When the Builder owes <b>two</b> letters it can make the two landable
    letters <i>different</i>, denying the grasshopper an automatic repeat — so the grasshopper must
    work to force a square, and the Builder must plan its letters so no reachable path closes one.
    Neither side wins for free.</p>
  <p><b>Why the lookahead is tiny.</b> The value of a position depends only on
    <code>(S, the committed-but-unreached tail W[p+1…], phase, needLeft)</code>. A letter bypassed
    by a <code>+2</code> hop is behind <code>p</code> forever, so it is irrelevant; the tail is
    <b>≤ 2 letters</b>, so the exact solver memoises well even though <b>W</b> grows.</p>
  <p><b>What the solver finds.</b> The <b>Builder's guaranteed <code>d</code></b> — the largest length
    it can keep <b>S</b> square-free against perfect hopping — is small for <b>|A| = 2</b> (the
    grasshopper soon forces a square) but grows without bound for <b>|A| ≥ 3</b> (Thue): a real,
    non-constant table.</p>
  <p class="muted small"><b>Start-condition assumption.</b> The Builder chooses <i>all</i> letters and
    <b>S starts empty</b> (the grasshopper has not landed yet at <code>p = -1</code>). A variant where
    the first letter is fixed, or where <b>S</b> includes a pre-placed letter, would shift the balance.
    <b>Win-direction note:</b> the version where the letter-chooser also wants the pattern is degenerate
    — that side forces a square trivially — so we implement the <b>avoidance form</b> (Builder avoids,
    Grasshopper forces) as the genuine game.</p>
  <p class="muted small">References: Thue, <i>Über unendliche Zeichenreihen</i> (1906);
    Grytczuk, Szafruga &amp; Zmarz, <i>Online version of the theorem of Thue</i> (2012),
    <a href="https://arxiv.org/abs/1204.6687" target="_blank" rel="noopener">arXiv:1204.6687</a>.</p>
</section>`;let g,bt=[],Ye=null,Yo=_(1),Sc=1,Rn,Pt=!1,xi=0,vt=null;const Mc=430;function Tc(e){const t=+A("alphaRange").value,n=+A("dRange").value,i=+A("powerSel").value,o=A("roleSel").value;return{alpha:t,d:n,power:i,humanRole:o==="B"?"B":o==="R"?"R":o,aiLevel:{B:+A("aiB").value,R:+A("aiR").value},seed:e}}function Uo(e){const t=g.config.humanRole;return t==="both"?!0:t==="none"?!1:t===Wo(e)}const hn=()=>!nt(g)&&Uo(se(g)),ja=()=>!nt(g)&&!Uo(se(g));function Ut(){window.clearTimeout(Rn);const e=Sc++;Yo=_(2654435761^e*2654435761),g=hc(Tc(e)),bt=[],Ye=null,vt=null,xi=0,g.config.humanRole!=="none"&&(Pt=!1),Nn(),Ko()}function Xo(e){if(nt(g))return;g.phase==="hop"&&(xi=g.word.length);const t=ue(g,e);t!==g&&(bt.push(g),g=t,Ye=null,vt=null,Nn(),Ko())}function Ko(){window.clearTimeout(Rn),ja()&&(g.config.humanRole==="none"&&!Pt||(Rn=window.setTimeout(Ac,Mc)))}function Ec(e){return`${e.word.join(",")}|${e.pos}|${e.phase}|${e.needLeft}|${e.config.aiLevel[Wo(se(e))]}`}function Cc(){const e=Ec(g);if(!vt||vt.key!==e){const t=g.config.aiLevel[Wo(se(g))];vt={key:e,move:Oa(g,t,Yo)}}return vt.move}function Ac(){ja()&&(g.config.humanRole==="none"&&!Pt||Xo(Cc()))}function Ic(e){!hn()||g.phase!=="build"||ae(g).includes(e)&&Xo(e)}function Pc(e){!hn()||g.phase!=="hop"||ae(g).includes(e)&&Xo(e)}function Hc(){hn()&&(Ye=xc(g,Yo,2),Nn())}function Nc(){if(!bt.length)return;g=bt.pop();const e=g.config.humanRole;if(e==="B"||e==="R")for(;bt.length&&!Uo(se(g))&&!nt(g);)g=bt.pop();Ye=null,vt=null,Pt=!1,xi=g.word.length,Nn()}function Fc(e){const t=g.witness;return!t||e<t.start||e>=t.end?"":Math.floor((e-t.start)/t.block)%2===0?"win-a":"win-b"}function qc(){const e=A("word"),t=nt(g),n=!t&&g.phase==="hop",i=g.pos+1,o=g.pos+2,r=n&&Ye?Ye.move:-1,a=n&&hn();e.classList.toggle("empty",g.word.length===0);const l=[];for(let s=0;s<g.word.length;s++){const c=["tile"];s<=g.pos&&c.push("past"),s>=xi&&g.phase==="build"&&!t&&c.push("fresh");let d="";if(n&&(s===i||s===o)){const f=s===i?1:2;c.push("target",`target-${f}`),r===f&&c.push("suggest"),a&&(d=` data-step="${f}" role="button" tabindex="0"`)}const u=s===g.pos?'<span class="hopper">🦗</span>':"",p=n&&(s===i||s===o)?`<span class="step-badge">+${s===i?1:2}</span>`:"";l.push(`<span class="${c.join(" ")}"${d}>${u}${$i(g.word[s])}${p}</span>`)}g.pos<0&&l.unshift('<span class="tile pre"><span class="hopper">🦗</span></span>'),e.innerHTML=l.join("")}function Gc(){const e=A("palette"),t=nt(g),n=!t&&g.phase==="build",i=n&&hn(),o=i&&Ye?Ye.move:-1,r=[];for(let a=0;a<g.config.alpha;a++){const l=[];i&&o===a&&l.push("suggest");const s=i?"":" disabled";r.push(`<button class="${l.join(" ")}" data-letter="${a}"${s}>${$i(a)}</button>`)}if(!n){e.innerHTML=`<span class="palette-hint">${t?"":"Grasshopper: click a +1 / +2 landing tile above."}</span>`;return}e.innerHTML=r.join("")+`<span class="palette-hint">Builder owes ${g.needLeft} letter${g.needLeft===1?"":"s"} this round.</span>`}function zc(){const e=A("inspected"),t=nt(g);e.classList.toggle("empty",g.inspected.length===0);const n=[];for(let i=0;i<g.inspected.length;i++){const o=["stile"],r=Fc(i);r?o.push(r,"pulse"):i===g.inspected.length-1&&!t&&o.push("fresh"),n.push(`<span class="${o.join(" ")}">${$i(g.inspected[i])}</span>`)}e.innerHTML=n.join("")}function Nn(){const e=g.config,t=nt(g);qc(),Gc(),zc();const n=A("phaseLabel");t?n.textContent="":n.textContent=g.phase==="build"?`Build phase — Builder appends letters (owes ${g.needLeft}).`:"Hop phase — Grasshopper jumps +1 or +2.";const i=A("turnPill");if(t)i.textContent=g.winner===_e?"Builder wins":"Grasshopper wins",i.className="turn-pill done";else{const a=se(g);i.textContent=a===_e?"Builder to append":"Grasshopper to hop",i.className=`turn-pill ${a===_e?"blue":""}`.trim()}A("goalText").textContent=mc(e),A("meterLabel").textContent="Inspected length toward target",A("meterFill").style.width=`${e.d?Math.min(g.inspected.length/e.d,1)*100:0}%`,A("meterValue").textContent=`${g.inspected.length} / ${e.d}`;const o=A("banner");if(t)if(o.hidden=!1,g.winner===X){o.className="banner red";const a=g.witness,l=a?g.inspected.slice(a.start,a.end).map($i).join(""):"";o.textContent=`Grasshopper wins — forced a square in the path${l?`: ${l}`:""} 🦗🎉`}else o.className="banner blue",o.textContent=`Builder wins — kept the path square-free to length d = ${e.d} 🎉`;else o.hidden=!0;A("hintBtn").disabled=!hn(),A("undoBtn").disabled=bt.length===0;const r=A("runBtn");e.humanRole==="none"?(r.hidden=!1,r.textContent=Pt?"Pause":"Run",r.disabled=t):r.hidden=!0}function Di(){A("alphaLabel").textContent=A("alphaRange").value,A("dLabel").textContent=A("dRange").value,A("howtoD").textContent=A("dRange").value}function zr(){const e=A("roleSel").value;A("aiBField").style.display=e==="R"||e==="none"?"":"none",A("aiRField").style.display=e==="B"||e==="none"?"":"none"}function Oc(e){e.settings.innerHTML=Rc,e.board.innerHTML=Bc,e.sidebar.innerHTML=Lc,A("word").addEventListener("click",t=>{const n=t.target.closest("[data-step]");n&&Pc(+n.getAttribute("data-step"))}),A("palette").addEventListener("click",t=>{const n=t.target.closest("[data-letter]");n&&Ic(+n.getAttribute("data-letter"))});for(const t of["alphaRange","dRange"])A(t).addEventListener("input",Di),A(t).addEventListener("change",()=>{Di(),Ut()});A("powerSel").addEventListener("change",Ut),A("roleSel").addEventListener("change",()=>{zr(),Ut()});for(const t of["aiB","aiR"])A(t).addEventListener("change",Ut);return A("newBtn").addEventListener("click",Ut),A("hintBtn").addEventListener("click",Hc),A("undoBtn").addEventListener("click",Nc),A("runBtn").addEventListener("click",()=>{Pt=!Pt,Nn(),Ko()}),Di(),zr(),Ut(),{destroy(){window.clearTimeout(Rn),Rn=void 0}}}const jc={id:"grasshopper",title:"Grasshopper",tagline:"Hop to force a square — or keep every path clean",topic:"Forbidden patterns with a grasshopper",family:"Repetitions & Thue",mechanic:"build + hop",tags:["subsequence","pursuit"],blurb:"A builder appends letters trying to keep the path clean; a grasshopper hops over them, and only the letters it lands on are judged. Hop to force a square into that path — or build to dodge it forever.",icon:`<svg viewBox="0 0 64 28" width="64" height="28">
            <rect x="2" y="9" width="12" height="12" rx="3" fill="var(--blue)"/>
            <rect x="16" y="9" width="12" height="12" rx="3" fill="var(--blue)" opacity="0.5"/>
            <rect x="30" y="9" width="12" height="12" rx="3" fill="var(--blue)"/>
            <path d="M8 8 q11 -10 22 0" fill="none" stroke="var(--red)" stroke-width="2.2"/>
            <circle cx="30" cy="6" r="3.4" fill="var(--red)"/>
          </svg>`,mount:Oc},we="C",te="A";function Wc(e,t,n){let i="";for(let o=0;o<n;o++)i+=e[t+o]+",";return i}function _c(e,t){const n=e.length;if(t<2)return null;const i=Math.floor(n/t);for(let o=1;o<=i;o++)for(let r=0;r+t*o<=n;r++){const a=new Map;for(let l=0;l<t;l++){const s=Wc(e,r+l*o,o),c=a.get(s);if(c!==void 0)return{start:r,m:o,i:c,j:l};a.set(s,l)}}return null}function Vc(e){const t=Math.max(e.alpha,e.k);return{config:{...e,alpha:t},word:[],phase:"point",turn:we}}function Ee(e){return e.phase==="point"?we:te}function Le(e){if(e.winner)return[];const t=[];if(e.phase==="point"){for(let n=0;n<=e.word.length;n++)t.push(n);return t}for(let n=0;n<e.config.alpha;n++)t.push(n);return t}function Dc(e,t){const n=_c(e,t.k);return n?{winner:we,witness:n}:e.length>=t.n?{winner:te}:{}}function Ue(e,t){if(e.winner||!Le(e).includes(t))return e;if(e.phase==="point")return{...e,phase:"insert",gap:t,turn:te};const i=e.gap??e.word.length,o=[...e.word.slice(0,i),t,...e.word.slice(i)],r={...e,word:o,phase:"point",gap:void 0,turn:we},{winner:a,witness:l}=Dc(o,e.config);return a&&(r.winner=a,l&&(r.witness=l)),r}function it(e){return!!e.winner}function Yc(e){return`Constructor wants ${e.k} equal-length adjacent blocks with two identical; Avoider wants to reach length ${e.n} over a ${e.alpha}-letter alphabet with every such run all-different.`}function Wa(e){return e.word.join(",")+"|"+e.phase+"|"+(e.gap??-1)}function co(e,t){const n=e.length;let i=0;const o=Math.floor(n/t);for(let r=1;r<=o;r++)for(let a=0;a+t*r<=n;a++)for(let l=0;l<t;l++)for(let s=l+1;s<t;s++){let c=0;for(let d=0;d<r&&c<=1;d++)e[a+l*r+d]!==e[a+s*r+d]&&c++;c===1&&i++}return i}function Uc(e){const t=e.config.n?e.word.length/e.config.n:0,n=co(e.word,e.config.k);return .9*t-.45*(1-1/(1+n))}let _a=class extends Error{};const Xc=5e4;function Va(e,t,n={n:0}){if(e.winner)return e.winner===te?1:-1;const i=Wa(e),o=t.get(i);if(o!==void 0)return o;if(++n.n>Xc)throw new _a;const r=Ee(e),a=Le(e);let l=r===te?-1/0:1/0;for(const s of a){const c=Va(Ue(e,s),t,n);l=r===te?Math.max(l,c):Math.min(l,c)}return t.set(i,l),l}function uo(e,t,n,i,o=new Map){if(e.winner)return e.winner===te?1:-1;if(t===0)return Uc(e);const r=Wa(e)+"@"+t,a=o.get(r);if(a!==void 0)return a;const l=Ee(e),s=Le(e);let c=!1;if(l===te){let u=-1/0;for(const p of s)if(u=Math.max(u,uo(Ue(e,p),t-1,n,i,o)),n=Math.max(n,u),n>=i){c=!0;break}return c||o.set(r,u),u}let d=1/0;for(const u of s)if(d=Math.min(d,uo(Ue(e,u),t-1,n,i,o)),i=Math.min(i,d),i<=n){c=!0;break}return c||o.set(r,d),d}function Ri(e,t){return e[Math.floor(t()*e.length)]}function Kc(e,t){return Ri(Le(e),t)}function Da(e,t){const n=Ee(e);let i=-1/0,o=[];for(const r of Le(e)){const a=Ue(e,r);if(a.winner===n)return r;let l;if(a.winner)l=-1e9;else if(e.phase==="insert")l=-co(a.word,e.config.k);else{const s=Le(a);let c=0,d=-1;for(const u of s){const p=Ue(a,u);p.winner!==n&&(c++,d=Math.max(d,co(p.word,e.config.k)))}l=-c*1e3+d}l>i?(i=l,o=[r]):l===i&&o.push(r)}return Ri(o,t)}function fo(e,t,n=4){const i=Ee(e),r=Le(e).map(l=>({m:l,v:uo(Ue(e,l),n-1,-1/0,1/0)})),a=i===te?Math.max(...r.map(l=>l.v)):Math.min(...r.map(l=>l.v));return Ri(r.filter(l=>l.v===a).map(l=>l.m),t)}const Or=2e6;function Zc(e){const t=e.config.n-e.word.length;if(t<=0)return!1;const n=e.config.alpha;let i=1;for(let o=0;o<t;o++){const r=e.word.length+1+o;if(i*=r*n,i>Or)return!0}return i>Or}function Jc(e,t){if(Zc(e))return fo(e,t,5);const n=Ee(e),i=new Map,o={n:0};try{const r=Le(e).map(s=>({m:s,v:Va(Ue(e,s),i,o)})),a=n===te?1:-1,l=r.filter(s=>s.v===a).map(s=>s.m);return l.length?Ri(l,t):Da(e,t)}catch(r){if(r instanceof _a)return fo(e,t,5);throw r}}function Ya(e,t,n){switch(t){case 1:return Da(e,n);case 2:return fo(e,n);case 3:return Jc(e,n);default:return Kc(e,n)}}const I=e=>document.getElementById(e),Ua="abcdefghijklmnopqrstuvwxyz",Qc=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="alphaRange">Alphabet |A| <span class="hint-num" id="alphaLabel">3</span></label>
      <input type="range" id="alphaRange" min="2" max="6" value="3" />
    </div>
    <div class="field">
      <label for="kRange">Blocks k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="2" max="5" value="3" />
    </div>
    <div class="field">
      <label for="nRange">Target length n <span class="hint-num" id="nLabel">12</span></label>
      <input type="range" id="nRange" min="4" max="24" value="12" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="C" selected>Constructor (blue)</option>
        <option value="A">Avoider (red)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Constructor AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Avoider AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
  <div class="hint-note" id="alphaNote"></div>
</section>`,ed=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Blue to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="wordbox">
    <div class="word" id="word"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 12</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,td=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Constructor (blue)</b> clicks a <b>caret</b> (a gap) to point at where the next letter goes.</li>
    <li><b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.</li>
    <li><b class="blue-text">Constructor</b> wins the instant the word has <b>k equal-length adjacent blocks with two identical</b> (a bad configuration).</li>
    <li><b class="red-text">Avoider</b> wins by reaching length <b id="howtoN">12</b> with every such run all-different.</li>
    <li>On a Constructor win the offending k-block run is boxed and the two equal blocks are painted <span class="blkA-text">block A</span> and <span class="blkB-text">block B</span>.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Squares to k-blocks.</b> A <b>square</b> is <code>XX</code> — two adjacent equal-length
    equal blocks. That is exactly the bad pattern at <b>k = 2</b>, so Different Blocks at k = 2
    coincides with the square game. The default <b>k = 3</b> forbids <i>three</i> equal-length
    adjacent blocks with a repeat: for length-1 blocks <code>abc</code> is safe but
    <code>aab</code>, <code>aba</code>, <code>baa</code> all lose (two single letters coincide).</p>
  <p><b>Why |A| &ge; k.</b> With <b>fewer than k letters</b>, any k single-letter blocks
    (<code>m = 1</code>) must repeat by the <b>pigeonhole principle</b>, so the Constructor wins for
    free. Interesting play needs at least k letters so an <code>m = 1</code> run can be pairwise
    distinct; we clamp <code>|A|</code> up to k.</p>
  <p><b>Connection to Thue theory.</b> "k adjacent blocks all pairwise different" is a rainbow-
    flavoured strengthening of square-freeness — a Thue-type avoidance question. The online forcing
    version has no published survivable-length table, so the tables here are computed from scratch.</p>
  <p><b>The AI.</b> "Strong" is depth-limited alpha-beta over (gap, letter) with a near-repeat leaf
    score; "Solver" searches exactly on small instances (memoised), falling back to Strong.</p>
  <p class="muted small">Reference: Thue, <i>Über unendliche Zeichenreihen</i> (1906).</p>
</section>`;let M,wt=[],Ht=null,Zo=_(1),nd=1,Bn,Nt=!1;const id=430;function od(e){const t=+I("kRange").value,n=Math.max(+I("alphaRange").value,t),i=+I("nRange").value,o=I("roleSel").value;return{alpha:n,k:t,n:i,humanRole:o==="C"?we:o==="A"?te:o,aiLevel:{C:+I("aiR").value,A:+I("aiB").value},seed:e}}function Bi(e){const t=M.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const Fn=()=>!it(M)&&Bi(Ee(M)),Xa=()=>!it(M)&&!Bi(Ee(M));function vn(){window.clearTimeout(Bn);const e=nd++;Zo=_(2654435761^e*2654435761),M=Vc(od(e)),wt=[],Ht=null,M.config.humanRole!=="none"&&(Nt=!1),qn(),Qo()}function Jo(e){if(it(M))return;const t=Ue(M,e);t!==M&&(wt.push(M),M=t,Ht=null,qn(),Qo())}function Qo(){window.clearTimeout(Bn),Xa()&&(M.config.humanRole==="none"&&!Nt||(Bn=window.setTimeout(rd,id)))}function rd(){Xa()&&(M.config.humanRole==="none"&&!Nt||Jo(Ya(M,M.config.aiLevel[Ee(M)],Zo)))}function ad(e){!Fn()||M.phase!=="point"||Jo(e)}function ld(e){!Fn()||M.phase!=="insert"||Le(M).includes(e)&&Jo(e)}function sd(){Fn()&&(Ht=Ya(M,2,Zo),qn())}function cd(){if(!wt.length)return;M=wt.pop();const e=M.config.humanRole;if(e===we||e===te)for(;wt.length&&!Bi(Ee(M))&&!it(M);)M=wt.pop();Ht=null,Nt=!1,qn()}function dd(e){const t=new Map;let n=-1,i=-1;if(it(e)&&e.witness){const{start:o,m:r,i:a,j:l,k:s}={...e.witness,k:e.config.k};n=o,i=o+s*r;for(let c=0;c<r;c++)t.set(o+a*r+c,"blkA");for(let c=0;c<r;c++)t.set(o+l*r+c,"blkB")}return{color:t,runStart:n,runEnd:i}}function ud(){const e=I("word");e.innerHTML="";const t=M,{color:n,runStart:i,runEnd:o}=dd(t);if(t.word.length===0){const r=jr(0);r.classList.add("empty");const a=document.createElement("span");a.className="empty-hint",a.textContent=t.phase==="point"?"Constructor: click anywhere here to point at the first gap.":"Avoider: pick a letter to insert.",r.appendChild(a),e.appendChild(r);return}for(let r=0;r<=t.word.length;r++)if(e.appendChild(jr(r)),r<t.word.length){const a=r>=i&&r<o;e.appendChild(fd(t.word[r],r,n.get(r),a))}}function jr(e){const t=M.phase==="point"&&!it(M)&&Fn(),n=M.phase==="insert"?M.gap===e:M.phase==="point"&&Ht===e,i=document.createElement("button");i.className="caret"+(t?"":" disabled")+(n?" sel":""),i.dataset.gap=String(e);const o=document.createElement("span");return o.className="bar",i.appendChild(o),t||(i.tabIndex=-1),i}function fd(e,t,n,i=!1){const o=document.createElement("span");o.className="tile"+(n?" "+n:"")+(i?" inrun":"");const r=document.createElement("span");return r.className="val",r.textContent=Ua[e]??String(e),o.appendChild(r),o}function pd(){const e=I("palette");e.innerHTML="";const t=M,n=it(t),i=t.phase==="insert"&&!n&&(Bi(te)||t.config.humanRole==="none"),o=new Set(Le(t));for(let a=0;a<t.config.alpha;a++)e.appendChild(hd(a,i&&o.has(a)));const r=document.createElement("span");r.className="palette-hint",n?r.textContent="":t.phase==="point"?r.textContent="Constructor points at a gap first.":r.textContent="Insert a letter.",e.appendChild(r)}function hd(e,t){const n=document.createElement("button");n.dataset.sym=String(e),n.disabled=!t,Ht!==null&&M.phase==="insert"&&Ht===e&&t&&(n.style.borderColor="var(--violet)",n.style.boxShadow="0 0 0 2px rgba(110,86,207,.25)");const i=document.createElement("span");return i.textContent=Ua[e]??String(e),n.appendChild(i),n}function qn(){const e=M.config,t=it(M);ud(),pd();const n=I("turnPill");if(t)n.textContent=`${M.winner===we?"Constructor (blue)":"Avoider (red)"} wins`,n.className="turn-pill done";else{const a=Ee(M);n.textContent=a===we?"Constructor to point":"Avoider to insert",n.className=`turn-pill ${a===we?"blue":""}`.trim()}I("goalText").textContent=Yc(e);const i=M.word.length;I("meterFill").style.width=`${e.n?Math.min(i/e.n,1)*100:0}%`,I("meterValue").textContent=`${i} / ${e.n}`,I("meterLabel").textContent="Length toward target";const o=I("banner");if(t)if(o.hidden=!1,M.winner===we){o.className="banner blue";const a=M.witness,l=a?` blocks ${a.i+1} and ${a.j+1} of a ${e.k}-block run (length ${a.m} each) at position ${a.start+1}.`:".";o.textContent=`Constructor wins — a bad configuration appeared:${l} The two equal blocks are painted.`}else o.className="banner red",o.textContent=`Avoider wins — reached length ${e.n} with every k-block run all-different. 🎉`;else o.hidden=!0;I("hintBtn").disabled=!Fn(),I("undoBtn").disabled=wt.length===0;const r=I("runBtn");e.humanRole==="none"?(r.hidden=!1,r.textContent=Nt?"Pause":"Run",r.disabled=t):r.hidden=!0}function Yi(){const e=+I("kRange").value,t=I("alphaRange"),n=+t.value<e;n&&(t.value=String(e)),+t.min<2&&(t.min="2"),I("alphaLabel").textContent=t.value,I("kLabel").textContent=String(e),I("nLabel").textContent=I("nRange").value,I("howtoN").textContent=I("nRange").value;const i=n;I("alphaNote").textContent=i?`Alphabet clamped to k = ${e}: with |A| < k a bad configuration is forced (pigeonhole).`:`Keep |A| ≥ k = ${e}; below that the m = 1 case is forced by pigeonhole.`}function Wr(){const e=I("roleSel").value;I("aiRField").style.display=e==="A"||e==="none"?"":"none",I("aiBField").style.display=e==="C"||e==="none"?"":"none"}function gd(e){e.settings.innerHTML=Qc,e.board.innerHTML=ed,e.sidebar.innerHTML=td,I("word").addEventListener("click",t=>{const n=t.target.closest("[data-gap]");n&&ad(+n.dataset.gap)}),I("palette").addEventListener("click",t=>{const n=t.target.closest("[data-sym]");n&&!n.disabled&&ld(+n.dataset.sym)});for(const t of["alphaRange","kRange","nRange"])I(t).addEventListener("input",Yi),I(t).addEventListener("change",()=>{Yi(),vn()});I("roleSel").addEventListener("change",()=>{Wr(),vn()});for(const t of["aiR","aiB"])I(t).addEventListener("change",vn);return I("newBtn").addEventListener("click",vn),I("hintBtn").addEventListener("click",sd),I("undoBtn").addEventListener("click",cd),I("runBtn").addEventListener("click",()=>{Nt=!Nt,qn(),Qo()}),Yi(),Wr(),vn(),{destroy(){window.clearTimeout(Bn),Bn=void 0}}}const md={id:"different-blocks",title:"Different Blocks",tagline:"k adjacent blocks, all distinct",blurb:"Generalises the square game: one player forces k equal-length adjacent blocks with a repeat among them; the other keeps every such run all-different.",topic:"Different blocks",family:"Repetitions & Thue",mechanic:"insertion",tags:["k-blocks","generalised squares"],icon:`<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3" y="8" width="14" height="12" rx="3" fill="var(--blkA, #e5484d)"/>
            <rect x="19" y="8" width="14" height="12" rx="3" fill="var(--blkB, #2a9d6b)"/>
            <rect x="35" y="8" width="14" height="12" rx="3" fill="var(--blkA, #e5484d)"/>
          </svg>`,mount:gd},ne="AVOIDER",ye="FORCER";function bd(e){const t=e.map((i,o)=>o).sort((i,o)=>e[i]-e[o]||i-o),n=new Array(e.length);for(let i=0;i<t.length;i++)n[t[i]]=i;return n}function di(e){return bd(e).join(",")}function vd(e){const t=e.length;if(t===0||t%2!==0)return!1;const n=new Set,i=[[0,[]]];for(;i.length;){const[o,r]=i.pop();if(o===t){if(r.length===0)return!0;continue}const a=o+"|"+r.join(",");if(n.has(a))continue;n.add(a);const l=e[o];r.length<t-o&&i.push([o+1,[...r,l]]),r.length&&r[0]===l&&i.push([o+1,r.slice(1)])}return!1}function Ka(e,t){const n=[],i=[],o=r=>{if(i.length===t){n.push(i.slice());return}for(let a=r;a<e;a++)i.push(a),o(a+1),i.pop()};return o(0),n}function wd(e){const t=e.length;if(t===0||t%2!==0)return!1;const n=t/2;for(const i of Ka(t,n)){const o=new Array(t).fill(!1);for(const l of i)o[l]=!0;const r=[],a=[];for(let l=0;l<t;l++)(o[l]?r:a).push(e[l]);if(di(r)===di(a))return!0}return!1}function yd(e){return e==="words"?vd:wd}function $d(e,t,n=1){const i=e.length,o=yd(t);for(let r=2*n;r<=i;r+=2)for(let a=0;a+r<=i;a++)if(o(e.slice(a,a+r)))return!0;return!1}function kd(e){const t=e.length;if(t===0||t%2!==0)return null;const n=new Set,i=[{i:0,pending:[],lead:[],trail:[]}];for(;i.length;){const{i:o,pending:r,lead:a,trail:l}=i.pop();if(o===t){if(r.length===0)return[a,l];continue}const s=o+"|"+r.join(",");if(n.has(s))continue;n.add(s);const c=e[o];r.length<t-o&&i.push({i:o+1,pending:[...r,c],lead:[...a,o],trail:l}),r.length&&r[0]===c&&i.push({i:o+1,pending:r.slice(1),lead:a,trail:[...l,o]})}return null}function xd(e){const t=e.length;if(t===0||t%2!==0)return null;const n=t/2;for(const i of Ka(t,n)){const o=new Array(t).fill(!1);for(const c of i)o[c]=!0;const r=[],a=[],l=[],s=[];for(let c=0;c<t;c++)o[c]?(r.push(c),l.push(e[c])):(a.push(c),s.push(e[c]));if(di(l)===di(s))return[r,a]}return null}function Rd(e,t,n=1){const i=e.length,o=t==="words"?kd:xd;for(let r=2*n;r<=i;r+=2)for(let a=0;a+r<=i;a++){const l=e.slice(a,a+r),s=o(l);if(s){const[c,d]=s;return{start:a,end:a+r,a:c.map(u=>u+a),b:d.map(u=>u+a)}}}}function _r(e){return e==="perm"?2:1}function Bd(e){return{config:e,seq:[],phase:"point",turn:ye}}function Ce(e){return e.phase==="point"?ye:ne}function Se(e){if(e.winner)return[];if(e.phase==="point"){const i=[];for(let o=0;o<=e.seq.length;o++)i.push(o);return i}if(e.config.variant==="words"){const i=[];for(let o=0;o<e.config.k;o++)i.push(o);return i}const t=new Set(e.seq),n=[];for(let i=1;i<=e.config.n;i++)t.has(i)||n.push(i);return n}function Ld(e,t){return $d(e,t.variant,t.minBlock)?{winner:ye,witness:Rd(e,t.variant,t.minBlock)}:e.length>=t.n?{winner:ne}:{}}function Xe(e,t){if(e.winner||!Se(e).includes(t))return e;if(e.phase==="point")return{...e,phase:"insert",gap:t,turn:ne};const i=e.gap??e.seq.length,o=[...e.seq.slice(0,i),t,...e.seq.slice(i)],r={...e,seq:o,phase:"point",gap:void 0,turn:ye},{winner:a,witness:l}=Ld(o,e.config);return a&&(r.winner=a,l&&(r.witness=l)),r}function ot(e){return!!e.winner}function Sd(e){return e.variant==="words"?`Forcer (blue) wants tight twins; Avoider (red) wants to reach length ${e.n} with an ${e.k}-letter alphabet.`:`Forcer (blue) wants tight twins; Avoider (red) wants to place all ${e.n} numbers.`}function Za(e){return e.seq.join(",")+"|"+e.phase+"|"+(e.gap??-1)}function Md(e){return e.seq.length/e.config.n}let Ja=class extends Error{};const Td=5e4;function Qa(e,t,n={n:0}){if(e.winner)return e.winner===ne?1:-1;const i=Za(e),o=t.get(i);if(o!==void 0)return o;if(++n.n>Td)throw new Ja;const r=Ce(e),a=Se(e);let l=r===ne?-1/0:1/0;for(const s of a){const c=Qa(Xe(e,s),t,n);l=r===ne?Math.max(l,c):Math.min(l,c)}return t.set(i,l),l}function po(e,t,n,i,o=new Map){if(e.winner)return e.winner===ne?1:-1;if(t===0)return Md(e);const r=Za(e)+"@"+t,a=o.get(r);if(a!==void 0)return a;const l=Ce(e),s=Se(e);let c=!1;if(l===ne){let u=-1/0;for(const p of s)if(u=Math.max(u,po(Xe(e,p),t-1,n,i,o)),n=Math.max(n,u),n>=i){c=!0;break}return c||o.set(r,u),u}let d=1/0;for(const u of s)if(d=Math.min(d,po(Xe(e,u),t-1,n,i,o)),i=Math.min(i,d),i<=n){c=!0;break}return c||o.set(r,d),d}function Li(e,t){return e[Math.floor(t()*e.length)]}function Ed(e,t){return Li(Se(e),t)}function Cd(e,t){const n=Ce(e);let i=-1/0,o=[];for(const r of Se(e)){const a=Xe(e,r);if(a.winner===n)return r;let l;a.winner?l=-1e9:l=-Se(a).reduce((d,u)=>d+(Xe(a,u).winner===n?0:1),0),l>i?(i=l,o=[r]):l===i&&o.push(r)}return Li(o,t)}function ho(e,t,n=4){const i=Ce(e),r=Se(e).map(l=>({m:l,v:po(Xe(e,l),n-1,-1/0,1/0)})),a=i===ne?Math.max(...r.map(l=>l.v)):Math.min(...r.map(l=>l.v));return Li(r.filter(l=>l.v===a).map(l=>l.m),t)}const Vr=2e6;function Ad(e){const t=e.config.n-e.seq.length;if(t<=0)return!1;const n=e.config.variant==="words"?e.config.k:e.config.n;let i=1;for(let o=0;o<t;o++){const r=e.seq.length+1+o;if(i*=r*n,i>Vr)return!0}return i>Vr}function Id(e,t){if(Ad(e))return ho(e,t,5);const n=Ce(e),i=new Map,o={n:0};try{const r=Se(e).map(s=>({m:s,v:Qa(Xe(e,s),i,o)})),a=n===ne?1:-1,l=r.filter(s=>s.v===a).map(s=>s.m);return Li(l.length?l:r.map(s=>s.m),t)}catch(r){if(r instanceof Ja)return ho(e,t,5);throw r}}function el(e,t,n){switch(t){case 1:return Cd(e,n);case 2:return ho(e,n);case 3:return Id(e,n);default:return Ed(e,n)}}const k=e=>document.getElementById(e),Pd="abcdefghijklmnopqrstuvwxyz",Hd=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field span2">
      <label for="variantSel">Variant</label>
      <select id="variantSel">
        <option value="words" selected>Words — equal copies (k-letter alphabet)</option>
        <option value="perm">Permutations — order-isomorphic copies (1..m)</option>
      </select>
    </div>
    <div class="field" id="kField">
      <label for="kRange">Alphabet k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="2" max="6" value="3" />
    </div>
    <div class="field">
      <label for="nRange"><span id="nName">Target length n</span> <span class="hint-num" id="nLabel">12</span></label>
      <input type="range" id="nRange" min="4" max="20" value="12" />
    </div>
    <div class="field">
      <label for="minBlockRange">Min block <span class="hint-num" id="minBlockLabel">1</span></label>
      <input type="range" id="minBlockRange" min="1" max="3" value="1" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Forcer (blue)</option>
        <option value="B">Avoider (red)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Forcer AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Avoider AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,Nd=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Blue to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="wordbox">
    <div class="word" id="word"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 12</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,Fd=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Forcer (blue)</b> clicks a <b>caret</b> (a gap) to point at where the next symbol goes.</li>
    <li id="howtoInsert"><b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.</li>
    <li><b class="blue-text">Forcer</b> wins the instant a <b>tight twin</b> (a shuffle square) appears anywhere in the sequence.</li>
    <li id="howtoGoal"><b class="red-text">Avoider</b> wins by reaching length <b id="howtoN">12</b> with no tight twin.</li>
    <li>When a tight twin forms, its two interleaved copies are painted <span class="twinA-text">copy A</span> and <span class="twinB-text">copy B</span> so you can see the shuffle.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Twins vs squares vs shuffle squares.</b> <i>Twins</i> are two disjoint subsequences
    that are equal (words) or <i>order-isomorphic</i> (permutations — e.g. <code>586</code> and
    <code>397</code> both reduce to the pattern <code>132</code>). <i>Tight twins</i> are twins
    whose positions together form a contiguous block — a <b>shuffle square</b>. So tight twins
    generalise ordinary squares <code>XX</code>: <code>aabb</code> is a shuffle square (split
    into positions {0,2}=<code>ab</code> and {1,3}=<code>ab</code>) even though it is not a
    square.</p>
  <p><b>The headline: NP-hardness.</b> Recognising a shuffle square is <b>NP-hard — even on a
    binary alphabet</b> (Buss &amp; Soltys 2014, <i>Unshuffling a Square is NP-Hard</i>;
    Bulteau &amp; Vialette 2019). The avoidance detector embeds an NP-hard subproblem, so the
    computer opponent is genuinely, citably hard — we keep sequences game-sized.</p>
  <p><b>The AI.</b> "Strong" is depth-limited alpha-beta; "Solver" searches exactly on small
    instances (memoised), falling back to Strong when the tree is too large.</p>
  <p class="muted small">The avoider's guaranteed length per alphabet/interval size is not pinned
    down in the literature, so the threshold tables here are computed from scratch.</p>
  <p class="muted small">References: Grytczuk, Pawlik &amp; Ruciński, <i>Shuffle squares and ordered
    nest-free graphs</i> (2025),
    <a href="https://arxiv.org/abs/2503.22043" target="_blank" rel="noopener">arXiv:2503.22043</a>;
    Dudek, Grytczuk &amp; Ruciński, <i>Long twins in random words</i> (2023),
    <a href="https://arxiv.org/abs/2112.14197" target="_blank" rel="noopener">arXiv:2112.14197</a>.</p>
</section>`;let T,yt=[],Ft=null,er=_(1),qd=1,Ln,qt=!1;const Gd=430;function zd(e){const t=k("variantSel").value,n=+k("nRange").value,i=t==="words"?+k("kRange").value:n,o=+k("minBlockRange").value,r=k("roleSel").value;return{variant:t,k:i,n,minBlock:o,humanRole:r==="R"?ye:r==="B"?ne:r,aiLevel:{FORCER:+k("aiR").value,AVOIDER:+k("aiB").value},seed:e}}function Si(e){const t=T.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const Gn=()=>!ot(T)&&Si(Ce(T)),tl=()=>!ot(T)&&!Si(Ce(T));function Xt(){window.clearTimeout(Ln);const e=qd++;er=_(2654435761^e*2654435761),T=Bd(zd(e)),yt=[],Ft=null,T.config.humanRole!=="none"&&(qt=!1),zn(),nr()}function tr(e){if(ot(T))return;const t=Xe(T,e);t!==T&&(yt.push(T),T=t,Ft=null,zn(),nr())}function nr(){window.clearTimeout(Ln),tl()&&(T.config.humanRole==="none"&&!qt||(Ln=window.setTimeout(Od,Gd)))}function Od(){tl()&&(T.config.humanRole==="none"&&!qt||tr(el(T,T.config.aiLevel[Ce(T)],er)))}function jd(e){!Gn()||T.phase!=="point"||tr(e)}function Wd(e){!Gn()||T.phase!=="insert"||Se(T).includes(e)&&tr(e)}function _d(){Gn()&&(Ft=el(T,2,er),zn())}function Vd(){if(!yt.length)return;T=yt.pop();const e=T.config.humanRole;if(e===ye||e===ne)for(;yt.length&&!Si(Ce(T))&&!ot(T);)T=yt.pop();Ft=null,qt=!1,zn()}function nl(e,t){return t==="words"?Pd[e]:String(e)}function Dd(){const e=k("word");e.innerHTML="";const t=T,n=ot(t),i=t.config.variant,o=new Map;if(n&&t.witness){for(const a of t.witness.a)o.set(a,"twinA");for(const a of t.witness.b)o.set(a,"twinB")}const r=Math.max(1,t.config.n);if(t.seq.length===0){const a=Dr(0);a.classList.add("empty");const l=document.createElement("span");l.className="empty-hint",l.textContent=t.phase==="point"?"Forcer: click anywhere here to point at the first gap.":"Avoider: pick a symbol to insert.",a.appendChild(l),e.appendChild(a);return}for(let a=0;a<=t.seq.length;a++)e.appendChild(Dr(a)),a<t.seq.length&&e.appendChild(Yd(t.seq[a],a,i,r,o.get(a)))}function Dr(e){const t=T.phase==="point"&&!ot(T)&&Gn(),n=T.phase==="insert"?T.gap===e:T.phase==="point"&&Ft===e,i=document.createElement("button");i.className="caret"+(t?"":" disabled")+(n?" sel":""),i.dataset.gap=String(e);const o=document.createElement("span");return o.className="bar",i.appendChild(o),t||(i.tabIndex=-1),i}function Yd(e,t,n,i,o){const r=document.createElement("span");if(r.className="tile"+(o?" "+o:""),n==="perm"){const l=document.createElement("span");l.className="valbar",l.style.height=`${Math.round(e/i*100)}%`,r.appendChild(l)}const a=document.createElement("span");return a.className="val",a.textContent=nl(e,n),r.appendChild(a),r}function Ud(){const e=k("palette");e.innerHTML="";const t=T,n=ot(t),i=t.config.variant,o=t.phase==="insert"&&!n&&(Si(ne)||t.config.humanRole==="none"),r=new Set(Se(t));if(i==="words")for(let l=0;l<t.config.k;l++)e.appendChild(Yr(l,i,o&&r.has(l),t.config.n));else for(let l=1;l<=t.config.n;l++)e.appendChild(Yr(l,i,o&&r.has(l),t.config.n));const a=document.createElement("span");a.className="palette-hint",n?a.textContent="":t.phase==="point"?a.textContent="Forcer points at a gap first.":a.textContent=i==="perm"?"Insert an unused number.":"Insert a letter.",e.appendChild(a)}function Yr(e,t,n,i){const o=document.createElement("button");if(o.dataset.sym=String(e),o.disabled=!n,Ft!==null&&T.phase==="insert"&&Ft===e&&n&&(o.style.borderColor="var(--violet)",o.style.boxShadow="0 0 0 2px rgba(110,86,207,.25)"),t==="perm"){const a=document.createElement("span");a.className="valbar",a.style.height=`${Math.round(e/i*100)}%`,o.appendChild(a)}const r=document.createElement("span");return r.style.position="relative",r.textContent=nl(e,t),o.appendChild(r),o}function zn(){const e=T.config,t=ot(T);Dd(),Ud();const n=k("turnPill");if(t)n.textContent=`${T.winner===ye?"Forcer (blue)":"Avoider (red)"} wins`,n.className="turn-pill done";else{const a=Ce(T);n.textContent=a===ye?"Forcer to point":"Avoider to insert",n.className=`turn-pill ${a===ye?"blue":""}`.trim()}k("goalText").textContent=Sd(e);const i=T.seq.length;k("meterFill").style.width=`${e.n?Math.min(i/e.n,1)*100:0}%`,k("meterValue").textContent=`${i} / ${e.n}`,k("meterLabel").textContent="Length toward target";const o=k("banner");if(t)if(o.hidden=!1,T.winner===ye){o.className="banner blue";const a=T.witness,l=a?` (positions ${a.start+1}–${a.end}).`:".";o.textContent=`Forcer wins — tight twins appeared${l} The two interleaved copies are painted.`}else o.className="banner red",o.textContent=`Avoider wins — reached length ${e.n} with no tight twin. 🎉`;else o.hidden=!0;k("hintBtn").disabled=!Gn(),k("undoBtn").disabled=yt.length===0;const r=k("runBtn");e.humanRole==="none"?(r.hidden=!1,r.textContent=qt?"Pause":"Run",r.disabled=t):r.hidden=!0}function Ur(e){const t=k("variantSel").value,n=k("nRange"),i=k("minBlockRange");t==="words"?(k("kField").style.display="",k("nName").textContent="Target length n",n.min="4",n.max="20",e&&(n.value="12",i.value=String(_r("words")))):(k("kField").style.display="none",k("nName").textContent="Interval m",n.min="4",n.max="9",e&&(n.value="7",i.value=String(_r("perm"))),+n.value>9&&(n.value="9"))}function ii(){k("kLabel").textContent=k("kRange").value,k("nLabel").textContent=k("nRange").value,k("minBlockLabel").textContent=k("minBlockRange").value;const e=k("variantSel").value,t=k("nRange").value;k("howtoN").textContent=e==="words"?t:`${t} numbers`,k("howtoInsert").innerHTML=e==="words"?'<b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.':'<b class="red-text">Avoider (red)</b> then clicks an <b>unused number</b> in the palette to insert it there.'}function Xr(){const e=k("roleSel").value;k("aiRField").style.display=e==="B"||e==="none"?"":"none",k("aiBField").style.display=e==="R"||e==="none"?"":"none"}function Xd(e){e.settings.innerHTML=Hd,e.board.innerHTML=Nd,e.sidebar.innerHTML=Fd,k("word").addEventListener("click",t=>{const n=t.target.closest("[data-gap]");n&&jd(+n.dataset.gap)}),k("palette").addEventListener("click",t=>{const n=t.target.closest("[data-sym]");n&&!n.disabled&&Wd(+n.dataset.sym)}),k("variantSel").addEventListener("change",()=>{Ur(!0),ii(),Xt()});for(const t of["kRange","nRange","minBlockRange"])k(t).addEventListener("input",ii),k(t).addEventListener("change",()=>{ii(),Xt()});k("roleSel").addEventListener("change",()=>{Xr(),Xt()});for(const t of["aiR","aiB"])k(t).addEventListener("change",Xt);return k("newBtn").addEventListener("click",Xt),k("hintBtn").addEventListener("click",_d),k("undoBtn").addEventListener("click",Vd),k("runBtn").addEventListener("click",()=>{qt=!qt,zn(),nr()}),Ur(!1),ii(),Xr(),Xt(),{destroy(){window.clearTimeout(Ln),Ln=void 0}}}const Kd={id:"twin-hunter",title:"Twin Hunter",tagline:"Tight twins & shuffle squares",blurb:"Place symbols (or permutation values) while dodging — or forcing — two identical interleaved copies, a shuffle square. Recognising them is NP-hard.",topic:"Twins / shuffle squares",family:"Twins & shuffle squares",mechanic:"insertion",tags:["shuffle squares","NP-hard","permutations"],icon:`<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3" y="8" width="11" height="12" rx="3" fill="var(--twinA, #e5484d)"/>
            <rect x="16" y="8" width="11" height="12" rx="3" fill="var(--twinB, #2a9d6b)"/>
            <rect x="29" y="8" width="11" height="12" rx="3" fill="var(--twinA, #e5484d)"/>
            <rect x="42" y="8" width="11" height="12" rx="3" fill="var(--twinB, #2a9d6b)"/>
          </svg>`,mount:Xd},de="P",ie="A";function il(e,t){const n=e.length;let i=0;for(let o=0;o<n;o++)if(e[o]===t){i<1&&(i=1);for(let r=1;o+r<n||o-r>=0;r++){let a=1,l=o+r;for(;l<n&&e[l]===t;)a++,l+=r;if(a>i&&(i=a),o+r>=n)break}}return i}function Zd(e,t){const n=e.length;for(let i=0;i<n;i++){const o=e[i],r=t[o];if(!r||r<1)continue;if(r===1)return{color:o,idx:[i]};const a=Math.floor((n-1-i)/(r-1));for(let l=1;l<=a;l++){const s=[i];let c=!0;for(let d=1;d<r;d++){const u=i+d*l;if(e[u]!==o){c=!1;break}s.push(u)}if(c)return{color:o,idx:s}}}return null}function ol(e){return e===2?[3,4]:e===3?[3,3,4]:Array.from({length:e},()=>3)}function Jd(e){return{config:e,line:[],phase:"point",gap:null,winner:null,witness:null}}function Ae(e){return e.phase==="point"?de:ie}function fe(e){if(e.winner)return[];const t=[];if(e.phase==="point")for(let n=0;n<=e.line.length;n++)t.push(n);else for(let n=0;n<e.config.r;n++)t.push(n);return t}function Qd(e,t){const n=Zd(e,t.k);return n?{winner:de,witness:n}:e.length>=t.n?{winner:ie,witness:null}:{winner:null,witness:null}}function Fe(e,t){if(e.winner||!fe(e).includes(t))return e;if(e.phase==="point")return{...e,phase:"paint",gap:t};const n=e.gap??e.line.length,i=[...e.line.slice(0,n),t,...e.line.slice(n)],{winner:o,witness:r}=Qd(i,e.config);return{...e,line:i,phase:"point",gap:null,winner:o,witness:r}}function rt(e){return e.winner!==null}function Sn(e){return e.every(t=>t===e[0])}function eu(e){return Sn(e.k)?`Pointer wants a monochromatic ${e.k[0]}-term progression; Painter (avoider) wants to reach length ${e.n} using ${e.r} colours.`:`Pointer forces any one colour's AP (${e.k.map((n,i)=>`colour ${i+1}→${n}`).join(", ")}); Painter survives to length ${e.n}.`}function rl(e){return e.line.join(",")+"|"+e.phase+"|"+(e.gap??-1)}function Mn(e,t){return e[Math.floor(t()*e.length)]}function tu(e){const t=e.line,n=t.length,i=e.config.r,o=e.config.k;let r=0;for(let a=0;a<i;a++){const l=o[a];if(!(l<1))for(let s=0;s<n;s++){const c=Math.floor((n-1-s)/Math.max(1,l-1));for(let d=1;d<=c;d++){let u=0,p=!1;for(let f=0;f<l;f++)if(t[s+f*d]===a)u++;else{p=!0;break}p||u===0||(r+=Math.pow(i,-(l-u)))}}}return e.line.length/e.config.n-r}let al=class extends Error{};const nu=5e4;function ll(e,t,n={n:0}){if(e.winner)return e.winner===ie?1:-1;const i=rl(e),o=t.get(i);if(o!==void 0)return o;if(++n.n>nu)throw new al;const r=Ae(e),a=fe(e);let l=r===ie?-1/0:1/0;for(const s of a){const c=ll(Fe(e,s),t,n);l=r===ie?Math.max(l,c):Math.min(l,c)}return t.set(i,l),l}function go(e,t,n,i,o=new Map){if(e.winner)return e.winner===ie?1:-1;if(t===0)return tu(e);const r=rl(e)+"@"+t,a=o.get(r);if(a!==void 0)return a;const l=Ae(e),s=fe(e);let c=!1;if(l===ie){let u=-1/0;for(const p of s)if(u=Math.max(u,go(Fe(e,p),t-1,n,i,o)),n=Math.max(n,u),n>=i){c=!0;break}return c||o.set(r,u),u}let d=1/0;for(const u of s)if(d=Math.min(d,go(Fe(e,u),t-1,n,i,o)),i=Math.min(i,d),i<=n){c=!0;break}return c||o.set(r,d),d}function iu(e,t){return Mn(fe(e),t)}function Kr(e){const t=e.config.k,n=Math.max(...t);let i=0;for(let o=0;o<e.config.r;o++){const r=il(e.line,o),a=n/t[o];i+=r/t[o]*a}return i}function ou(e,t){if(Ae(e)===ie){let r=1/0,a=[];for(const l of fe(e)){const s=Fe(e,l),c=s.winner===de?1e9:Kr(s);c<r?(r=c,a=[l]):c===r&&a.push(l)}return Mn(a,t)}let i=-1/0,o=[];for(const r of fe(e)){const a=Fe(e,r);if(a.winner===de)return r;let l=1/0;for(const s of fe(a)){const c=Fe(a,s),d=c.winner===de?1e9:Kr(c);l=Math.min(l,d)}l>i?(i=l,o=[r]):l===i&&o.push(r)}return Mn(o,t)}function mo(e,t,n=4){const i=Ae(e),o=fe(e).map(a=>({m:a,v:go(Fe(e,a),n-1,-1/0,1/0)})),r=i===ie?Math.max(...o.map(a=>a.v)):Math.min(...o.map(a=>a.v));return Mn(o.filter(a=>a.v===r).map(a=>a.m),t)}const Zr=2e6;function ru(e){const t=e.config.n-e.line.length;if(t<=0)return!1;const n=e.config.r;let i=1;for(let o=0;o<t;o++){const r=e.line.length+1+o;if(i*=r*n,i>Zr)return!0}return i>Zr}function au(e,t){if(ru(e))return mo(e,t,5);const n=Ae(e),i=new Map,o={n:0};try{const r=fe(e).map(s=>({m:s,v:ll(Fe(e,s),i,o)})),a=n===ie?1:-1,l=r.filter(s=>s.v===a).map(s=>s.m);return Mn(l.length?l:r.map(s=>s.m),t)}catch(r){if(r instanceof al)return mo(e,t,5);throw r}}function sl(e,t,n){switch(t){case 1:return ou(e,n);case 2:return mo(e,n);case 3:return au(e,n);default:return iu(e,n)}}const y=e=>document.getElementById(e),Ke=["#e5484d","#2a6fdb","#2a9d6b","#e0a325","#6e56cf","#d6409f"],$e=["Red","Blue","Green","Amber","Violet","Pink"],lu=6,su=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="rRange">Colours r <span class="hint-num" id="rLabel">2</span></label>
      <input type="range" id="rRange" min="2" max="${lu}" value="2" />
    </div>
    <div class="field">
      <label for="targetsSel">Targets</label>
      <select id="targetsSel">
        <option value="diagonal" selected>Diagonal (one k)</option>
        <option value="offdiagonal">Off-diagonal (per colour)</option>
      </select>
    </div>
    <div class="field" id="kField">
      <label for="kRange">AP length k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="2" max="6" value="3" />
    </div>
    <div class="field span2" id="kvecField" hidden>
      <label>Per-colour target length k<sub>i</sub></label>
      <div class="kvec" id="kvec"></div>
    </div>
    <div class="field span2">
      <label for="nRange">Token budget n <span class="hint-num" id="nLabel">18</span></label>
      <input type="range" id="nRange" min="3" max="30" value="18" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="P" selected>Pointer (forcer)</option>
        <option value="A">Painter (avoider)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiPField">
      <label for="aiP">Pointer AI</label>
      <select id="aiP"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiAField">
      <label for="aiA">Painter AI</label>
      <select id="aiA"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,cu=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Pointer to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="linebox">
    <div class="line" id="line"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow" id="meterrow"></div>
  <div class="banner" id="banner" hidden></div>
</section>`,du=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Pointer</b> clicks a <b>caret</b> (a gap) to choose where the next token goes.</li>
    <li><b class="red-text">Painter</b> then clicks a <b>colour</b> in the palette to paint a token into that gap.</li>
    <li>Token positions are the <b>line indices</b> — inserting a token <b>shifts</b> the indices of everything to its right.</li>
    <li><b class="blue-text">Pointer</b> wins the instant a <b>monochromatic arithmetic progression</b> reaches its target — length <b id="howtoK">3</b> for every colour (diagonal), or each colour's own k<sub>i</sub> (off-diagonal).</li>
    <li><b class="red-text">Painter</b> wins by reaching <b id="howtoN">18</b> tokens with no such progression.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Van der Waerden's theorem.</b> For any r, k there is a number W(r;k) such that every
    r-colouring of {1…W} contains a monochromatic k-term arithmetic progression. So with enough tokens
    a progression is unavoidable; <b>W(2;3)=9</b>, W(3;3)=27, W(2;4)=35. Keep n below W so the
    Painter has a fighting chance and the knife-edge is visible by sliding n.</p>
  <p><b>Off-diagonal targets.</b> Give each colour its own threshold and you get the off-diagonal
    numbers <code>W(k₀,…,k_{r-1})</code> (a comma list = a threshold vector): <b>W(3,4)=18</b>,
    <b>W(3,5)=22</b>, <b>W(4,5)=55</b> (Chvátal). Equal thresholds recover the diagonal case, so this
    game is a strict generalisation — set all k<sub>i</sub> equal and it <i>is</i> plain online VdW.</p>
  <p><b>Online / adaptive.</b> Here the board is revealed adaptively (the Pointer chooses each slot),
    so the clean Erdős–Selfridge potential of the fixed-board game does <i>not</i> transfer. The
    "Strong" AI's potential Φ = Σ r<sup>−(k−filled)</sup> over live APs is a <b>heuristic guide</b>,
    not a theorem. The open question is the <b>forcing length</b>: how many moves the Pointer needs
    against best play, both diagonal and off-diagonal.</p>
  <p class="muted small">By analogy with every other avoidance game, the avoider (Painter / player 2)
    wins at length n — the rule implemented here.</p>
  <p class="muted small">Reference: van der Waerden, <i>Beweis einer Baudetschen Vermutung</i> (1927).</p>
</section>`;let L,$t=[],Gt=null,ir=_(1),uu=1,Tn,zt=!1,Ne=ol(2);const fu=430;function or(){return y("targetsSel").value==="offdiagonal"?"offdiagonal":"diagonal"}function cl(e){if(or()==="offdiagonal")return Ne.slice(0,e);const t=+y("kRange").value;return Array.from({length:e},()=>t)}function pu(e){const t=+y("rRange").value,n=cl(t),i=Math.max(+y("nRange").value,...n),o=y("roleSel").value;return{r:t,k:n,n:i,humanRole:o==="P"?de:o==="A"?ie:o,aiLevel:{P:+y("aiP").value,A:+y("aiA").value},seed:e}}function Mi(e){const t=L.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const On=()=>!rt(L)&&Mi(Ae(L)),dl=()=>!rt(L)&&!Mi(Ae(L));function Pe(){window.clearTimeout(Tn);const e=uu++;ir=_(2654435761^e*2654435761),L=Jd(pu(e)),$t=[],Gt=null,L.config.humanRole!=="none"&&(zt=!1),jn(),ar()}function rr(e){if(rt(L))return;const t=Fe(L,e);t!==L&&($t.push(L),L=t,Gt=null,jn(),ar())}function ar(){window.clearTimeout(Tn),dl()&&(L.config.humanRole==="none"&&!zt||(Tn=window.setTimeout(hu,fu)))}function hu(){dl()&&(L.config.humanRole==="none"&&!zt||rr(sl(L,L.config.aiLevel[Ae(L)],ir)))}function gu(e){!On()||L.phase!=="point"||rr(e)}function mu(e){!On()||L.phase!=="paint"||fe(L).includes(e)&&rr(e)}function bu(){On()&&(Gt=sl(L,2,ir),jn())}function vu(){if(!$t.length)return;L=$t.pop();const e=L.config.humanRole;if(e===de||e===ie)for(;$t.length&&!Mi(Ae(L))&&!rt(L);)L=$t.pop();Gt=null,zt=!1,jn()}function wu(){const e=y("line");e.innerHTML="";const t=L,n=rt(t),i=new Set(n&&t.witness?t.witness.idx:[]),o=n&&t.witness?t.witness.color:-1;if(t.line.length===0){const r=Jr(0);r.classList.add("empty");const a=document.createElement("span");a.className="empty-hint",a.textContent=t.phase==="point"?"Pointer: click anywhere here to point at the first gap.":"Painter: pick a colour.",r.appendChild(a),e.appendChild(r);return}for(let r=0;r<=t.line.length;r++)e.appendChild(Jr(r)),r<t.line.length&&e.appendChild(yu(t.line[r],r,i.has(r)&&t.line[r]===o))}function Jr(e){const t=L.phase==="point"&&!rt(L)&&On(),n=L.phase==="paint"?L.gap===e:L.phase==="point"&&Gt===e,i=document.createElement("button");i.className="caret"+(t?"":" disabled")+(n?" sel":""),i.dataset.gap=String(e);const o=document.createElement("span");return o.className="bar",i.appendChild(o),t||(i.tabIndex=-1),i}function yu(e,t,n){const i=document.createElement("span");i.className="tile"+(n?" witness":""),i.style.setProperty("--chip",Ke[e%Ke.length]);const o=document.createElement("span");o.className="chip",i.appendChild(o);const r=document.createElement("span");return r.className="idx",r.textContent=String(t+1),i.appendChild(r),i}function $u(){const e=y("palette");e.innerHTML="";const t=L,n=rt(t),i=t.phase==="paint"&&!n&&(Mi(ie)||t.config.humanRole==="none"),o=new Set(fe(t));for(let a=0;a<t.config.r;a++)e.appendChild(ku(a,i&&o.has(a)));const r=document.createElement("span");r.className="palette-hint",n?r.textContent="":t.phase==="point"?r.textContent="Pointer points at a gap first.":r.textContent="Paint a colour into the chosen gap.",e.appendChild(r)}function ku(e,t){const n=document.createElement("button");n.dataset.color=String(e),n.disabled=!t,n.style.setProperty("--chip",Ke[e%Ke.length]),Gt!==null&&L.phase==="paint"&&Gt===e&&t&&n.classList.add("suggested");const i=document.createElement("span");i.className="chip",n.appendChild(i);const o=document.createElement("span");return o.className="pal-label",o.textContent=Sn(L.config.k)?$e[e%$e.length]:`${$e[e%$e.length]} (k=${L.config.k[e]})`,n.appendChild(o),n}function xu(){const e=y("meterrow");e.innerHTML="";const t=L;if(!Sn(t.config.k))for(let l=0;l<t.config.r;l++){const s=t.config.k[l],c=il(t.line,l),d=document.createElement("div");d.className="meter mini",d.style.setProperty("--chip",Ke[l%Ke.length]);const u=document.createElement("div");u.className="meter-label",u.textContent=`${$e[l%$e.length]} run / k`;const p=document.createElement("div");p.className="meter-track";const f=document.createElement("div");f.className="meter-fill",f.style.width=`${Math.min(c/s,1)*100}%`,p.appendChild(f);const v=document.createElement("div");v.className="meter-value",v.textContent=`${c} / ${s}`,d.appendChild(u),d.appendChild(p),d.appendChild(v),e.appendChild(d)}const n=document.createElement("div");n.className="meter";const i=document.createElement("div");i.className="meter-label",i.id="meterLabel",i.textContent="Tokens placed toward budget";const o=document.createElement("div");o.className="meter-track";const r=document.createElement("div");r.className="meter-fill len",r.id="meterFill",r.style.width=`${t.config.n?Math.min(t.line.length/t.config.n,1)*100:0}%`,o.appendChild(r);const a=document.createElement("div");a.className="meter-value len",a.id="meterValue",a.textContent=`${t.line.length} / ${t.config.n}`,n.appendChild(i),n.appendChild(o),n.appendChild(a),e.appendChild(n)}function jn(){const e=L.config,t=rt(L);wu(),$u(),xu();const n=y("turnPill");if(t)n.textContent=`${L.winner===de?"Pointer":"Painter"} wins`,n.className="turn-pill done";else{const r=Ae(L);n.textContent=r===de?"Pointer to point":"Painter to colour",n.className=`turn-pill ${r===de?"blue":""}`.trim()}y("goalText").textContent=eu(e);const i=y("banner");if(t)if(i.hidden=!1,L.winner===de){i.className="banner blue";const r=L.witness;r&&Sn(e.k)?i.textContent=`Pointer wins — a monochromatic ${e.k[0]}-term progression appeared at indices ${r.idx.map(a=>a+1).join(", ")}. The witnessing tokens pulse.`:r?i.textContent=`Pointer wins — ${$e[r.color%$e.length]} made a ${e.k[r.color]}-AP at indices ${r.idx.map(a=>a+1).join(", ")}. The witnessing tokens pulse.`:i.textContent="Pointer wins — a monochromatic progression appeared."}else i.className="banner red",i.textContent=Sn(e.k)?`Painter wins — reached ${e.n} tokens with no monochromatic ${e.k[0]}-AP. 🎉`:`Painter wins — reached length ${e.n} with no colour hitting its target. 🎉`;else i.hidden=!0;y("hintBtn").disabled=!On(),y("undoBtn").disabled=$t.length===0;const o=y("runBtn");e.humanRole==="none"?(o.hidden=!1,o.textContent=zt?"Pause":"Run",o.disabled=t):o.hidden=!0}function Ru(){const e=+y("rRange").value,t=ol(e),n=[];for(let o=0;o<e;o++)n.push(Ne[o]??t[o]??3);Ne=n;const i=y("kvec");i.innerHTML="";for(let o=0;o<e;o++){const r=document.createElement("div");r.className="kcell",r.style.setProperty("--chip",Ke[o%Ke.length]);const a=document.createElement("label");a.htmlFor=`kRange${o}`,a.innerHTML=`${$e[o%$e.length]} k <span class="hint-num" id="kLabel${o}">${Ne[o]}</span>`;const l=document.createElement("input");l.type="range",l.id=`kRange${o}`,l.min="2",l.max="6",l.value=String(Ne[o]),l.dataset.color=String(o),r.appendChild(a),r.appendChild(l),i.appendChild(r)}}function Qr(){for(let e=0;e<Ne.length;e++){const t=document.getElementById(`kLabel${e}`);t&&(t.textContent=String(Ne[e]))}}function Bu(){const e=+y("rRange").value;return Math.max(...cl(e))}function ge(){const e=y("rRange").value,t=y("nRange"),n=Bu();if(t.min=String(n),+t.value<n&&(t.value=String(n)),y("rLabel").textContent=e,y("nLabel").textContent=t.value,y("howtoN").textContent=t.value,or()==="diagonal"){const i=y("kRange").value;y("kLabel").textContent=i,y("howtoK").textContent=i}else y("howtoK").textContent=String(n)}function oi(){const e=or()==="offdiagonal";y("kField").hidden=e,y("kvecField").hidden=!e,e&&Ru()}function ea(){const e=y("roleSel").value;y("aiPField").style.display=e==="A"||e==="none"?"":"none",y("aiAField").style.display=e==="P"||e==="none"?"":"none"}function Lu(e){e.settings.innerHTML=su,e.board.innerHTML=cu,e.sidebar.innerHTML=du,y("line").addEventListener("click",t=>{const n=t.target.closest("[data-gap]");n&&gu(+n.dataset.gap)}),y("palette").addEventListener("click",t=>{const n=t.target.closest("[data-color]");n&&!n.disabled&&mu(+n.dataset.color)}),y("rRange").addEventListener("input",()=>{oi(),ge()}),y("rRange").addEventListener("change",()=>{oi(),ge(),Pe()}),y("targetsSel").addEventListener("change",()=>{oi(),ge(),Pe()}),y("kRange").addEventListener("input",ge),y("kRange").addEventListener("change",()=>{ge(),Pe()}),y("kvec").addEventListener("input",t=>{const n=t.target;n.dataset.color!==void 0&&(Ne[+n.dataset.color]=+n.value,Qr(),ge())}),y("kvec").addEventListener("change",t=>{const n=t.target;n.dataset.color!==void 0&&(Ne[+n.dataset.color]=+n.value,Qr(),ge(),Pe())}),y("nRange").addEventListener("input",ge),y("nRange").addEventListener("change",()=>{ge(),Pe()}),y("roleSel").addEventListener("change",()=>{ea(),Pe()});for(const t of["aiP","aiA"])y(t).addEventListener("change",Pe);return y("newBtn").addEventListener("click",Pe),y("hintBtn").addEventListener("click",bu),y("undoBtn").addEventListener("click",vu),y("runBtn").addEventListener("click",()=>{zt=!zt,jn(),ar()}),oi(),ge(),ea(),Pe(),{destroy(){window.clearTimeout(Tn),Tn=void 0}}}const Su={id:"vdw-online",title:"VdW Online",tagline:"Force a monochromatic progression",blurb:"A Pointer chooses where each token goes; a Painter colours it. Force — or dodge — a monochromatic arithmetic progression. Toggle to off-diagonal targets to give each colour its own length.",topic:"Van der Waerden online",family:"Van der Waerden",mechanic:"insertion",tags:["arithmetic progressions","online","off-diagonal"],icon:`<svg viewBox="0 0 56 28" width="56" height="28">
            <circle cx="8" cy="14" r="5" fill="var(--red, #e5484d)"/>
            <circle cx="20" cy="14" r="5" fill="var(--blue, #2a6fdb)"/>
            <circle cx="32" cy="14" r="5" fill="var(--red, #e5484d)"/>
            <circle cx="44" cy="14" r="5" fill="var(--violet, #6e56cf)"/>
            <rect x="6" y="22" width="4" height="4" rx="1" fill="var(--red, #e5484d)"/>
            <rect x="30" y="22" width="4" height="4" rx="1" fill="var(--red, #e5484d)"/>
          </svg>`,mount:Lu},ze="R",rn="B";function bo(e,t,n){if(n<2)return null;const i=e.length,o=r=>e[r]===t;for(let r=0;r<i;r++)if(o(r))for(let a=1;r+(n-1)*a<i;a++){let l=!0;const s=[r];for(let c=1;c<n;c++){const d=r+c*a;if(!o(d)){l=!1;break}s.push(d)}if(l)return s}return null}function ul(e){switch(e){case 1:return 1;case 2:return 3;case 3:return 9;case 4:return 35;case 5:return 178;default:return 35}}function Mu(e){return ul(e)}function Tu(e){return{config:e,line:[],turn:ze,loser:null,winner:null,witness:null}}function Wn(e){return e.turn}const vo=e=>e===ze?rn:ze;function at(e){if(Q(e))return[];if(e.line.length>=e.config.maxLen)return[];const t=[];for(let n=0;n<=e.line.length;n++)t.push(n);return t}function Q(e){return e.loser!==null}function Ze(e,t){if(Q(e)||t<0||t>e.line.length||e.line.length>=e.config.maxLen)return e;const n=e.turn,i=[...e.line.slice(0,t),n,...e.line.slice(t)],o={...e,line:i,turn:vo(n),loser:null,winner:null,witness:null},r=e.config.k,a=vo(n),l=bo(i,n,r);if(l)return o.loser=n,o.winner=a,o.witness=l,o;const s=bo(i,a,r);return s&&(o.loser=a,o.winner=n,o.witness=s),o}function ta(e,t,n){let i=0;for(const o of e.keys())e[o]===t&&(i=Math.max(i,1));for(let o=2;o<=n;o++)bo(e,t,o)&&(i=Math.max(i,o));return i}function Eu(e){return`Each player drops their own colour into the line. You LOSE the instant your colour forms a monochromatic ${e.k}-term arithmetic progression. The game always ends by W(2;${e.k}) = ${ul(e.k)} tokens.`}const Ve=1e9,De=-1e9;function Cu(e){return e.line.join("")+"|"+e.turn}function wo(e){let t=0;for(const n of at(e))Ze(e,n).loser!==e.turn&&t++;return t}function Au(e,t){const n=vo(t),i=na(e,t),o=na(e,n);return i-o}function na(e,t){return e.turn===t?wo(e):wo({...e,turn:t})}function fl(e,t){if(Q(e))return e.loser===e.turn?De:Ve;const n=at(e);if(n.length===0)return 0;const i=Cu(e),o=t.get(i);if(o!==void 0)return o;let r=De;for(const a of n){const l=Ze(e,a);let s;if(Q(l)?s=l.loser===e.turn?De:Ve:s=-fl(l,t),s>r&&(r=s),r>=Ve)break}return t.set(i,r),r}function pl(e,t){if(Q(e))return e.loser===e.turn?De:Ve;const n=at(e);if(n.length===0)return 0;if(t===0)return Au(e,e.turn);let i=De;for(const o of n){const r=Ze(e,o);let a;if(Q(r)?a=r.loser===e.turn?De:Ve:a=-pl(r,t-1),a>i&&(i=a),i>=Ve)break}return i}function Ti(e,t){return e[Math.floor(t()*e.length)]}function Iu(e,t){return Ti(at(e),t)}function Pu(e,t){const n=e.turn,i=at(e),o=[],r=[];for(const c of i)Ze(e,c).loser===n?r.push(c):o.push(c);const a=o.length?o:r;let l=-1/0,s=[];for(const c of a){const d=Ze(e,c);let u;d.loser&&d.loser!==n?u=1e12:d.loser===n?u=-1e12:u=-wo(d),u>l?(l=u,s=[c]):u===l&&s.push(c)}return Ti(s,t)}function hl(e,t,n=5){const i=e.turn,r=at(e).map(l=>{const s=Ze(e,l);let c;return Q(s)?c=s.loser===i?De:Ve:c=-pl(s,n-1),{m:l,v:c}}),a=Math.max(...r.map(l=>l.v));return Ti(r.filter(l=>l.v===a).map(l=>l.m),t)}function Hu(e,t){if(e.config.k>3)return hl(e,t,6);const n=e.turn,i=new Map,o=at(e).map(l=>{const s=Ze(e,l);let c;return Q(s)?c=s.loser===n?De:Ve:c=-fl(s,i),{m:l,v:c}}),r=Math.max(...o.map(l=>l.v)),a=o.filter(l=>l.v===r).map(l=>l.m);return Ti(a,t)}function gl(e,t,n){switch(t){case 1:return Pu(e,n);case 2:return hl(e,n);case 3:return Hu(e,n);default:return Iu(e,n)}}const O=e=>document.getElementById(e),Nu=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field span2">
      <label for="kRange">AP length k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="3" max="4" value="3" />
    </div>
    <div class="field span2">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Red (first)</option>
        <option value="B">Blue (second)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,Fu=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to place</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="linebox">
    <div class="line" id="line"></div>
  </div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label red-text">Red — longest run toward k</div>
      <div class="meter-track"><div class="meter-fill" id="meterFillR"></div></div>
      <div class="meter-value" id="meterValueR">0 / 3</div>
    </div>
    <div class="meter">
      <div class="meter-label blue-text">Blue — longest run toward k</div>
      <div class="meter-track"><div class="meter-fill blue" id="meterFillB"></div></div>
      <div class="meter-value blue" id="meterValueB">0 / 3</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,qu=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="red-text">Red</b> moves first; players alternate. You always drop <b>your own</b> colour.</li>
    <li>Click a <b>caret</b> (a gap between tokens) to insert your colour there. There is no palette — the colour is always yours.</li>
    <li>You <b>lose</b> the instant your colour sits on a monochromatic <b id="howtoK">3</b>-term arithmetic progression (equally spaced positions like <code>2, 4, 6</code>).</li>
    <li>Inserting shifts every token to the right, re-indexing the line — so a move can even push the <b>opponent</b> into an AP. Whoever owns the completed AP loses; a double loses for the mover.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Why it always ends.</b> The placed tokens form a 2-colouring of the index set
    <code>{1…L}</code>. By <b>Van der Waerden's theorem</b>, <i>every</i> 2-colouring of
    <code>{1…W(2;k)}</code> contains a monochromatic <code>k</code>-AP — so by length
    <code>W(2;k)</code> someone has already lost. The game cannot run past <code>W(2;k)</code> moves:
    <code>W(2;3) = 9</code>, <code>W(2;4) = 35</code> (the semicolon marks the diagonal — 2 colours,
    length <code>k</code>).</p>
  <p><b>k = 3 is the sweet spot.</b> Over within 9 tokens — small enough to <b>solve exactly</b> by
    game-tree search. <code>k = 4</code> can run to 35 tokens, so the exact Solver falls back to the
    depth-limited Strong AI there.</p>
  <p><b>Misère / avoidance.</b> Both players avoid the structure, so (unlike Maker–Breaker) there is
    no Erdős–Selfridge shortcut — values come from search. Whether the first or second player wins at
    <code>k = 3</code> is settled by exact game-tree search.</p>
  <p class="muted small">Reference: van der Waerden, <i>Beweis einer Baudetschen Vermutung</i> (1927).</p>
</section>`;let H,kt=[],_n=null,lr=_(1),Gu=1,En,Ot=!1;const zu=430;function Ou(e){const t=+O("kRange").value,n=O("roleSel").value,i=n==="R"?ze:n==="B"?rn:n;return{k:t,maxLen:Mu(t),humanRole:i,aiLevel:{R:+O("aiR").value,B:+O("aiB").value},seed:e}}function sr(e){const t=H.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const Ei=()=>!Q(H)&&sr(Wn(H)),ml=()=>!Q(H)&&!sr(Wn(H));function wn(){window.clearTimeout(En);const e=Gu++;lr=_(2654435761^e*2654435761),H=Tu(Ou(e)),kt=[],_n=null,H.config.humanRole!=="none"&&(Ot=!1),Vn(),cr()}function bl(e){if(Q(H))return;const t=Ze(H,e);t!==H&&(kt.push(H),H=t,_n=null,Vn(),cr())}function cr(){window.clearTimeout(En),ml()&&(H.config.humanRole==="none"&&!Ot||(En=window.setTimeout(ju,zu)))}function ju(){ml()&&(H.config.humanRole==="none"&&!Ot||bl(gl(H,H.config.aiLevel[Wn(H)],lr)))}function Wu(e){Ei()&&at(H).includes(e)&&bl(e)}function _u(){Ei()&&(_n=gl(H,2,lr),Vn())}function Vu(){if(!kt.length)return;H=kt.pop();const e=H.config.humanRole;if(e===ze||e===rn)for(;kt.length&&!sr(Wn(H))&&!Q(H);)H=kt.pop();_n=null,Ot=!1,Vn()}function ut(e){return e===ze?"Red":"Blue"}function Du(){const e=O("line");e.innerHTML="";const t=H,n=new Set(t.witness??[]);if(t.line.length===0){const i=ia(0);i.classList.add("empty");const o=document.createElement("span");o.className="empty-hint",o.textContent=`${ut(t.turn)} to place — click anywhere here to drop your colour.`,i.appendChild(o),e.appendChild(i);return}for(let i=0;i<=t.line.length;i++)e.appendChild(ia(i)),i<t.line.length&&e.appendChild(Yu(t.line[i],i,n.has(i)))}function ia(e){const t=document.createElement("button"),n=!Q(H)&&Ei();t.className="caret"+(n?"":" disabled")+(H.turn===rn?" blue":"")+(_n===e?" hint":""),t.dataset.gap=String(e);const i=document.createElement("span");return i.className="bar",t.appendChild(i),n||(t.tabIndex=-1),t}function Yu(e,t,n){const i=document.createElement("span");i.className="tile "+(e===ze?"red":"blue")+(n?" witness":"");const o=document.createElement("span");return o.className="val",o.textContent=String(t+1),i.appendChild(o),i}function Vn(){const e=H.config,t=Q(H);Du();const n=O("turnPill");if(t){const l=H.loser;n.textContent=`${ut(l)} built a ${e.k}-AP — ${ut(l)} loses`,n.className="turn-pill done"}else{const l=Wn(H);n.textContent=`${ut(l)} to place`,n.className=`turn-pill ${l===rn?"blue":""}`.trim()}O("goalText").textContent=Eu(e);const i=ta(H.line,ze,e.k),o=ta(H.line,rn,e.k);O("meterFillR").style.width=`${Math.min(i/e.k,1)*100}%`,O("meterFillB").style.width=`${Math.min(o/e.k,1)*100}%`,O("meterValueR").textContent=`${i} / ${e.k}`,O("meterValueB").textContent=`${o} / ${e.k}`;const r=O("banner");if(t){r.hidden=!1;const l=H.loser,s=H.winner;r.className="banner "+(l===ze?"red":"blue");const c=H.witness?` at positions ${H.witness.map(d=>d+1).join(", ")}`:"";r.textContent=`${ut(l)} built a ${e.k}-AP${c} — ${ut(l)} loses, ${ut(s)} wins.`}else r.hidden=!0;O("hintBtn").disabled=!Ei(),O("undoBtn").disabled=kt.length===0;const a=O("runBtn");e.humanRole==="none"?(a.hidden=!1,a.textContent=Ot?"Pause":"Run",a.disabled=t):a.hidden=!0}function Ui(){const e=O("kRange").value;O("kLabel").textContent=e,O("howtoK").textContent=e}function oa(){const e=O("roleSel").value;O("aiRField").style.display=e==="B"||e==="none"?"":"none",O("aiBField").style.display=e==="R"||e==="none"?"":"none"}function Uu(e){e.settings.innerHTML=Nu,e.board.innerHTML=Fu,e.sidebar.innerHTML=qu,O("line").addEventListener("click",t=>{const n=t.target.closest("[data-gap]");n&&Wu(+n.dataset.gap)}),O("kRange").addEventListener("input",Ui),O("kRange").addEventListener("change",()=>{Ui(),wn()}),O("roleSel").addEventListener("change",()=>{oa(),wn()});for(const t of["aiR","aiB"])O(t).addEventListener("change",wn);return O("newBtn").addEventListener("click",wn),O("hintBtn").addEventListener("click",_u),O("undoBtn").addEventListener("click",Vu),O("runBtn").addEventListener("click",()=>{Ot=!Ot,Vn(),cr()}),Ui(),oa(),wn(),{destroy(){window.clearTimeout(En),En=void 0}}}const Xu={id:"vdw-duel",title:"VdW Duel",tagline:"Don’t be the one who makes the progression",topic:"Van der Waerden game",family:"Van der Waerden",mechanic:"misère duel",tags:["arithmetic progressions","misère"],blurb:"Two colours, one line. Each player drops their own tokens — and loses the moment they complete a monochromatic arithmetic progression.",icon:`<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3" y="8" width="11" height="12" rx="3" fill="var(--red, #e5484d)"/>
            <rect x="16" y="8" width="11" height="12" rx="3" fill="var(--blue, #3e63dd)"/>
            <rect x="29" y="8" width="11" height="12" rx="3" fill="var(--red, #e5484d)"/>
            <rect x="42" y="8" width="11" height="12" rx="3" fill="var(--blue, #3e63dd)"/>
          </svg>`,mount:Uu},W="R",Tt="B";function Ku(e){return(t,n)=>(t>n&&([t,n]=[n,t]),t*(2*e-t-1)/2+(n-t-1))}function Zu(e){const t=[];for(let n=0;n<e;n++)for(let i=n+1;i<e;i++)t.push([n,i]);return t}function Ju(e,t){const n=[];if(t===1)for(let i=0;i<e;i++)n.push([i]);else if(t>=2&&t<=e)for(let i=0;i<e;i++)for(let o=1;i+(t-1)*o<e;o++){const r=[];for(let a=0;a<t;a++)r.push(i+a*o);n.push(r)}return{cellCount:e,winningSets:n}}function Qu(e,t){const n=Ku(e),i=e*(e-1)/2,o=[];if(t>=2&&t<=e){const r=[],a=l=>{if(r.length===t){const s=[];for(let c=0;c<t;c++)for(let d=c+1;d<t;d++)s.push(n(r[c],r[d]));o.push(s);return}for(let s=l;s<e;s++)r.push(s),a(s+1),r.pop()};a(0)}return{cellCount:i,winningSets:o}}function ef(e){return e.kind==="vdw"?Ju(e.boardSize,e.target):Qu(e.boardSize,e.target)}function tf(e){return e.winningSets.length?e.winningSets[0].length:0}function vl(e){const t=ef(e);return{config:e,hg:t,owner:new Array(t.cellCount).fill(null),turn:W}}function Ci(e){if(e.winner)return[];const t=[];for(let n=0;n<e.owner.length;n++)e.owner[n]===null&&t.push(n);return t}function yo(e,t){let n=0,i=[];const o=tf(e);for(const r of e.winningSets){let a=0,l=!1;for(const s of r){const c=t[s];if(c===Tt){l=!0;break}c===W&&a++}l||a>n&&(n=a,i=r)}return{size:n,need:o,witness:i}}function dr(e){return yo(e.hg,e.owner)}function ra(e){return e.every(t=>t!==null)}function aa(e,t){return e.winningSets.find(n=>n.every(i=>t[i]===W))}function an(e,t){if(e.winner||t<0||t>=e.owner.length||e.owner[t]!==null)return e;const n=e.turn,i=e.owner.slice();i[t]=n;const o={...e,owner:i,turn:n===W?Tt:W};if(e.config.mode==="scoring"){const r=yo(e.hg,i);return(ra(i)||r.size>=r.need)&&(o.score=r.size,o.witness=r.witness,o.winner=r.size>=r.need?W:Tt),o}if(n===W){const r=aa(e.hg,i);if(r)return o.winner=W,o.witness=r,o}if(ra(i)){const r=aa(e.hg,i);o.witness=r??yo(e.hg,i).witness,o.winner=r?W:Tt}return o}function ce(e){return!!e.winner}function wl(e){return e.kind==="vdw"?`Maker (red) wants ${e.target} red marks in arithmetic progression.`:`Maker (red) wants a red clique on ${e.target} vertices (all edges among them).`}const ui=1e6;function nf(e){return e.winner===W?ui:e.winner===Tt?-ui:dr(e).size*100}function fi(e){if(e.winner===W)return ui;if(e.winner===Tt)return-ui;let t=0;for(const n of e.hg.winningSets){let i=0,o=!1;for(const r of n){const a=e.owner[r];if(a===Tt){o=!0;break}a===W&&i++}o||(t+=2**-(n.length-i))}return t}function $o(e,t,n){const i=Ci(e),o=e.turn===W;let r=i[0],a=o?-1/0:1/0;for(const l of i){const s=t(an(e,l))+(n()-.5)*1e-6;(o?s>a:s<a)&&(a=s,r=l)}return r}function ko(e,t,n,i){if(e.winner||t===0)return fi(e);const o=Ci(e);if(o.length===0)return fi(e);if(e.turn===W){let a=-1/0;for(const l of o)if(a=Math.max(a,ko(an(e,l),t-1,n,i)),n=Math.max(n,a),n>=i)break;return a}let r=1/0;for(const a of o)if(r=Math.min(r,ko(an(e,a),t-1,n,i)),i=Math.min(i,r),n>=i)break;return r}function of(e,t){const n=Ci(e);if(n.length>9)return $o(e,fi,t);const i=n.length,o=e.turn===W;let r=n[0],a=o?-1/0:1/0;for(const l of n){const s=ko(an(e,l),i-1,-1/0,1/0)+(t()-.5)*1e-6;(o?s>a:s<a)&&(a=s,r=l)}return r}function Ai(e,t,n){switch(t){case 1:return $o(e,nf,n);case 2:return $o(e,fi,n);case 3:return of(e,n);default:{const i=Ci(e);return i[Math.floor(n()*i.length)]}}}const rf=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="sizeRange">Positions <span class="hint-num" id="sizeLabel">13</span></label>
      <input type="range" id="sizeRange" min="5" max="20" value="13" />
    </div>
    <div class="field">
      <label for="targetRange">AP length k <span class="hint-num" id="targetLabel">4</span></label>
      <input type="range" id="targetRange" min="2" max="6" value="4" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Maker (red)</option>
        <option value="B">Breaker (blue)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field">
      <label for="modeSel">Mode</label>
      <select id="modeSel">
        <option value="maker-breaker" selected>Maker–Breaker</option>
        <option value="scoring">Scoring duel</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Potential</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Potential</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,af=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to move</span>
    <span class="goal" id="goalText"></span>
  </div>
  <div class="board-wrap">
    <svg id="board" class="board" role="img" aria-label="game board"></svg>
  </div>
  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Largest red progression</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 4</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,lf=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b>Click an empty position</b> to claim it in your colour.</li>
    <li id="howtoGoal">You are <b class="red-text">Maker (red)</b>.</li>
    <li><b class="blue-text">Breaker (blue)</b> claims positions too, to block you.</li>
    <li>Maker always moves first. Maker wins the instant a progression is complete; otherwise Breaker wins when the line fills.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Maker–Breaker.</b> A positional game (Beck, <i>Tic-Tac-Toe Theory</i>): Maker claims
    positions to occupy a whole <i>winning set</i> — here a k-term arithmetic progression — while
    Breaker just blocks. Maker, moving first, has the initiative.</p>
  <p><b>Erdős–Selfridge threshold.</b> If the winning sets are many and large enough
    (<i>Σ 2<sup>−|A|</sup> &lt; ½</i>), <b>Breaker wins</b>. So there's a sharp boundary: e.g.
    for 4-term progressions Breaker wins up to ~11 positions, then Maker takes over. Keep
    <b>k = 4</b> and slide the board size across ~12 to see it flip — that boundary is the
    whole point.</p>
  <p><b>The AI.</b> “Potential” is the Erdős–Selfridge weighting itself; “Solver” searches
    exactly on small boards. Lower the AI level if you want to win more easily.</p>
  <p class="muted small">References: van der Waerden, <i>Beweis einer Baudetschen Vermutung</i> (1927);
    Erdős &amp; Selfridge, <i>On a combinatorial game</i> (1973);
    Beck, <i>Combinatorial Games: Tic-Tac-Toe Theory</i> (2008).</p>
</section>`,F=e=>document.getElementById(e);let N,xt=[],Dn=null,ur=_(1),sf=1,ln,jt=!1;const cf=430;function df(e){const t=+F("sizeRange").value;let n=+F("targetRange").value;return n=Math.min(n,t),{kind:"vdw",boardSize:t,target:n,mode:F("modeSel").value,humanRole:F("roleSel").value,aiLevel:{R:+F("aiR").value,B:+F("aiB").value},seed:e}}function fr(e){const t=N.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const pi=()=>!ce(N)&&fr(N.turn),yl=()=>!ce(N)&&!fr(N.turn);function Kt(){window.clearTimeout(ln);const e=sf++;ur=_(2654435761^e*2654435761),N=vl(df(e)),xt=[],Dn=null,N.config.humanRole!=="none"&&(jt=!1),Yn(),Ii()}function $l(e){if(ce(N))return;const t=an(N,e);t!==N&&(xt.push(N),N=t,Dn=null,Yn(),Ii())}function Ii(){window.clearTimeout(ln),yl()&&(N.config.humanRole==="none"&&!jt||(ln=window.setTimeout(uf,cf)))}function uf(){yl()&&(N.config.humanRole==="none"&&!jt||$l(Ai(N,N.config.aiLevel[N.turn],ur)))}function ff(e){!pi()||N.owner[e]!==null||$l(e)}function pf(){pi()&&(Dn=Ai(N,2,ur),Yn())}function hf(){if(!xt.length)return;window.clearTimeout(ln),N=xt.pop();const e=N.config.humanRole;if(e==="R"||e==="B")for(;xt.length&&!fr(N.turn)&&!ce(N);)N=xt.pop();Dn=null,jt=!1,Yn(),Ii()}function gf(e){return e===W?"r":e==="B"?"b":"free"}function mf(e){const t=e.config.boardSize,n=40,i=26,o=11,r=30,a=64,l=i*2+(t-1)*n,s=f=>i+f*n,c=ce(e),d=new Set(c?e.witness??[]:[]),u=[];if(d.size){const f=[...d].map(s).sort((v,$)=>v-$);u.push(`<line x1="${f[0]}" y1="${r}" x2="${f[f.length-1]}" y2="${r}" class="ap-line" />`)}const p=n/2-2;for(let f=0;f<t;f++){const v=e.owner[f],$=["cell",gf(v)];d.has(f)&&$.push("win");const z=[];Dn===f&&!c&&z.push(`<circle cx="${s(f)}" cy="${r}" r="${o+4}" class="hint-dot" />`),z.push(`<circle cx="${s(f)}" cy="${r}" r="${o}" class="${$.join(" ")}" />`),z.push(`<text x="${s(f)}" y="${r+24}" class="cell-label">${f+1}</text>`),z.push(`<circle cx="${s(f)}" cy="${r}" r="${p}" class="cell-hit" data-cell="${f}" />`),u.push(`<g class="cell-group${v?" used":""}">${z.join("")}</g>`)}return{viewBox:`0 0 ${l} ${a}`,body:u.join("")}}function Yn(){const e=N.config,t=dr(N),n=ce(N),{viewBox:i,body:o}=mf(N),r=F("board");r.setAttribute("viewBox",i),r.innerHTML=o;const a=!n&&pi();r.classList.toggle("turn-r",a&&N.turn===W),r.classList.toggle("turn-b",a&&N.turn!==W);const l=F("turnPill");n?(l.textContent=`${N.winner===W?"Red":"Blue"} wins`,l.className="turn-pill done"):(l.textContent=N.turn===W?"Red to move":"Blue to move",l.className=`turn-pill ${N.turn===W?"":"blue"}`.trim()),F("goalText").textContent=wl(e);const s=t.need||e.target;F("meterFill").style.width=`${s?Math.min(t.size/s,1)*100:0}%`,F("meterValue").textContent=`${t.size} / ${s}`;const c=F("banner");if(n){c.hidden=!1;const u=e.mode==="scoring",p=N.score??t.size;N.winner===W?(c.className="banner red",c.textContent=u?`Maker scored ${p}/${s} — a full ${e.target}-term progression! 🎉`:`Maker wins — a ${e.target}-term red progression! 🎉`):(c.className="banner blue",c.textContent=u?`Breaker wins — Maker scored only ${p}/${s}.`:`Breaker wins — Maker blocked (best ${t.size}/${s}).`)}else c.hidden=!0;F("hintBtn").disabled=!pi(),F("undoBtn").disabled=xt.length===0;const d=F("runBtn");e.humanRole==="none"?(d.hidden=!1,d.textContent=jt?"Pause":"Run",d.disabled=n):d.hidden=!0}function Xi(){const e=F("sizeRange"),t=F("targetRange");+t.value>+e.value&&(t.value=e.value),F("sizeLabel").textContent=e.value,F("targetLabel").textContent=t.value,F("howtoGoal").innerHTML=`You are <b class="red-text">Maker (red)</b> — claim <b>${t.value}</b> positions in an evenly-spaced row (an arithmetic progression).`}function la(){const e=F("roleSel").value;F("aiRField").style.display=e==="B"||e==="none"?"":"none",F("aiBField").style.display=e==="R"||e==="none"?"":"none"}function bf(e){e.settings.innerHTML=rf,e.board.innerHTML=af,e.sidebar.innerHTML=lf,F("board").addEventListener("click",t=>{const n=t.target.closest("[data-cell]");n&&ff(+n.getAttribute("data-cell"))});for(const t of["sizeRange","targetRange"])F(t).addEventListener("input",Xi),F(t).addEventListener("change",()=>{Xi(),Kt()});F("modeSel").addEventListener("change",Kt),F("roleSel").addEventListener("change",()=>{la(),Kt()});for(const t of["aiR","aiB"])F(t).addEventListener("change",Kt);return F("newBtn").addEventListener("click",Kt),F("hintBtn").addEventListener("click",pf),F("undoBtn").addEventListener("click",hf),F("runBtn").addEventListener("click",()=>{jt=!jt,Yn(),Ii()}),Xi(),la(),Kt(),{destroy(){window.clearTimeout(ln),ln=void 0}}}const vf={id:"mb-vdw",title:"MB Van der Waerden",tagline:"Maker–Breaker: arithmetic progressions on a line",blurb:"Claim positions on a number line to complete a k-term arithmetic progression while your opponent blocks. The Erdős–Selfridge threshold decides who is favoured.",topic:"Maker–Breaker Van der Waerden",family:"Van der Waerden",mechanic:"Maker–Breaker",tags:["arithmetic progressions","Erdős–Selfridge"],icon:`<svg viewBox="0 0 48 28" width="48" height="28">
            <circle cx="8" cy="14" r="3" fill="var(--red)"/><circle cx="20" cy="14" r="3" fill="var(--blue)"/>
            <circle cx="32" cy="14" r="3" fill="var(--red)"/><circle cx="44" cy="14" r="3" fill="var(--red)"/>
            <path d="M8 14 H44" stroke="var(--line)" stroke-width="1.5"/>
          </svg>`,mount:bf},We="C",oe="A";function pr(e,t){return Math.pow(e,t)}function wf(e,t,n,i){const o=pr(e,t),r=new Uint8Array(o),a=_(i);for(let l=0;l<o;l++)r[l]=Math.floor(a()*n)%n;return r}function Rt(e,t,n,i){let o=0;for(let r=0;r<n;r++)o=o*i+e[t+r];return o}function xo(e,t,n,i,o){return i[Rt(e,t,n,o)]}function yf(){const n=new Uint8Array(pr(3,2));return n[Rt([0,1],0,2,3)]=1,n[Rt([1,2],0,2,3)]=1,n}function $f(){const n=new Uint8Array(pr(2,2));return n[Rt([0,0],0,2,2)]=0,n[Rt([0,1],0,2,2)]=1,n[Rt([1,0],0,2,2)]=1,n[Rt([1,1],0,2,2)]=0,n}function kf(){return Uint8Array.from([2,2,2,1,2,2,1,3,3,2,0,1,1,3,3,2])}const kl=[{name:"contest",label:"Contest (|A|=4, l=2, c=4) — default",alpha:4,l:2,c:4,build:kf},{name:"balanced",label:"Balanced (|A|=2, l=2, c=2)",alpha:2,l:2,c:2,build:$f},{name:"abbc",label:"abbc demo (|A|=3, l=2, c=2)",alpha:3,l:2,c:2,build:yf}];function hr(e){return kl.find(t=>t.name===e)}function xf(e){if(e.preset){const t=hr(e.preset);if(t&&t.alpha===e.alpha&&t.l===e.l&&t.c===e.c)return t.build()}return wf(e.alpha,e.l,e.c,e.seed)}function Rf(e,t,n,i){const o=e.length-2*t;for(let r=0;r<=o;r++){const a=xo(e,r,t,n,i),l=xo(e,r+t,t,n,i);if(a===l)return{i:r,color:a}}return null}function Bf(e){return{config:e,coloring:xf(e),word:[],phase:"point",gap:null,winner:null,witness:null}}function Ie(e){return e.phase==="point"?We:oe}function Me(e){if(e.winner)return[];const t=[];if(e.phase==="point")for(let n=0;n<=e.word.length;n++)t.push(n);else for(let n=0;n<e.config.alpha;n++)t.push(n);return t}function Lf(e,t){const n=Rf(e,t.config.l,t.coloring,t.config.alpha);return n?{winner:We,witness:n}:e.length>=t.config.n?{winner:oe,witness:null}:{winner:null,witness:null}}function Je(e,t){if(e.winner||!Me(e).includes(t))return e;if(e.phase==="point")return{...e,phase:"insert",gap:t};const n=e.gap??e.word.length,i=[...e.word.slice(0,n),t,...e.word.slice(n)],o={...e,word:i,phase:"point",gap:null},{winner:r,witness:a}=Lf(i,e);return o.winner=r,o.witness=a,o}function lt(e){return!!e.winner}function Sf(e){return`Constructor wants two adjacent same-coloured length-${e.l} blocks; Avoider wants to reach length ${e.n} over a ${e.alpha}-letter alphabet (${e.c} colours).`}function xl(e){return e.word.join(",")+"|"+e.phase+"|"+(e.gap??-1)}function Mf(e){return e.config.n?e.word.length/e.config.n:0}function Rl(e){const{l:t,alpha:n}=e.config,i=e.word;let o=0;for(let r=0;r+2*t<=i.length;r++){let a=0;for(let l=0;l<t;l++)i[r+l]!==i[r+t+l]&&a++;a===1&&o++}return Math.min(o,n*t)*.01}class Bl extends Error{}const Tf=6e4;function Ll(e,t,n={n:0}){if(e.winner)return e.winner===oe?1:-1;const i=xl(e),o=t.get(i);if(o!==void 0)return o;if(++n.n>Tf)throw new Bl;const r=Ie(e),a=Me(e);let l=r===oe?-1/0:1/0;for(const s of a){const c=Ll(Je(e,s),t,n);l=r===oe?Math.max(l,c):Math.min(l,c)}return t.set(i,l),l}function Ro(e,t,n,i,o=new Map){if(e.winner)return e.winner===oe?1:-1;if(t===0)return Mf(e)-Rl(e);const r=xl(e)+"@"+t,a=o.get(r);if(a!==void 0)return a;const l=Ie(e),s=Me(e);let c=!1;if(l===oe){let u=-1/0;for(const p of s)if(u=Math.max(u,Ro(Je(e,p),t-1,n,i,o)),n=Math.max(n,u),n>=i){c=!0;break}return c||o.set(r,u),u}let d=1/0;for(const u of s)if(d=Math.min(d,Ro(Je(e,u),t-1,n,i,o)),i=Math.min(i,d),i<=n){c=!0;break}return c||o.set(r,d),d}function Pi(e,t){return e[Math.floor(t()*e.length)]}function Ef(e,t){return Pi(Me(e),t)}function Cf(e,t){const n=Ie(e);let i=-1/0,o=[];for(const r of Me(e)){const a=Je(e,r);if(a.winner===n)return r;let l;if(a.winner)l=-1e9;else{const c=Me(a).reduce((u,p)=>u+(Je(a,p).winner===n?0:1),0),d=Rl(a);l=n===oe?-c-d:-c+d}l>i?(i=l,o=[r]):l===i&&o.push(r)}return Pi(o,t)}function Bo(e,t,n=5){const i=Ie(e),r=Me(e).map(l=>({m:l,v:Ro(Je(e,l),n-1,-1/0,1/0)})),a=i===oe?Math.max(...r.map(l=>l.v)):Math.min(...r.map(l=>l.v));return Pi(r.filter(l=>l.v===a).map(l=>l.m),t)}const sa=2e6;function Af(e){const t=e.config.n-e.word.length;if(t<=0)return!1;const n=e.config.alpha;let i=1;for(let o=0;o<t;o++){const r=e.word.length+1+o;if(i*=r*n,i>sa)return!0}return i>sa}function If(e,t){if(Af(e))return Bo(e,t,6);const n=Ie(e),i=new Map,o={n:0};try{const r=Me(e).map(s=>({m:s,v:Ll(Je(e,s),i,o)})),a=n===oe?1:-1,l=r.filter(s=>s.v===a).map(s=>s.m);return Pi(l.length?l:r.map(s=>s.m),t)}catch(r){if(r instanceof Bl)return Bo(e,t,6);throw r}}function Sl(e,t,n){switch(t){case 1:return Cf(e,n);case 2:return Bo(e,n);case 3:return If(e,n);default:return Ef(e,n)}}const b=e=>document.getElementById(e),gr="abcdefghijklmnopqrstuvwxyz",ca=["#2a9d6b","#e5a32a","#6e56cf","#e5484d"],Pf=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="alphaRange">Alphabet |A| <span class="hint-num" id="alphaLabel">4</span></label>
      <input type="range" id="alphaRange" min="2" max="4" value="4" />
    </div>
    <div class="field">
      <label for="lRange">Block length l <span class="hint-num" id="lLabel">2</span></label>
      <input type="range" id="lRange" min="1" max="3" value="2" />
    </div>
    <div class="field">
      <label for="cRange">Colours c <span class="hint-num" id="cLabel">4</span></label>
      <input type="range" id="cRange" min="2" max="4" value="4" />
    </div>
    <div class="field">
      <label for="nRange">Target length n <span class="hint-num" id="nLabel">8</span></label>
      <input type="range" id="nRange" min="4" max="24" value="8" />
    </div>
    <div class="field span2">
      <label for="presetSel">Colouring χ</label>
      <select id="presetSel">
        <option value="">Random (seeded)</option>
      </select>
    </div>
    <div class="field">
      <label for="seedField">Seed <span class="hint-num" id="seedLabel">1</span></label>
      <input type="number" id="seedField" min="0" value="1" />
    </div>
    <div class="field">
      <label>&nbsp;</label>
      <button id="rerollBtn" class="btn">Reroll χ</button>
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Constructor (blue)</option>
        <option value="B">Avoider (red)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Constructor AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Avoider AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,Hf=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Blue to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="wordbox">
    <div class="word" id="word"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 8</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,Nf=`
<section class="card">
  <div id="legend" class="legend"></div>
</section>

<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Constructor (blue)</b> clicks a <b>caret</b> (a gap) to point at where the next letter goes.</li>
    <li><b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.</li>
    <li>Every length-<b id="howtoL">2</b> block has a fixed colour (the <b>underline</b> shows it). <b class="blue-text">Constructor</b> wins the instant two <b>adjacent</b> blocks share a colour.</li>
    <li><b class="red-text">Avoider</b> wins by reaching length <b id="howtoN">8</b> with no such monochromatic adjacent pair.</li>
    <li>On a Constructor win the two matching adjacent blocks <b>pulse</b> in their shared colour.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>A Ramsey-type colouring game on words.</b> A colouring <code>χ : Aˡ → {0…c-1}</code> is fixed
    in advance (random-from-seed or a preset). The Constructor tries to force two adjacent length-<i>l</i>
    blocks of equal colour; the Avoider dodges to length <i>n</i>.</p>
  <p><b>Forcing is conditional — not guaranteed.</b> Whether long words are <i>forced</i> to contain
    two same-coloured adjacent blocks <b>depends on (|A|, l, c)</b>. Counter-example: <code>l=1</code>,
    <code>c=|A|</code>, χ = identity makes "same-coloured adjacent blocks" mean "two equal adjacent
    letters", which <code>abab…</code> avoids forever — the Avoider survives every <i>n</i>. The game
    explores exactly the boundary between forceable and avoidable; termination is guaranteed only by the
    hard <i>n</i> cap, not by inevitability.</p>
  <p><b>The AI.</b> "Strong" is depth-limited alpha-beta (leaf eval = length minus near-miss pressure);
    "Solver" searches exactly on small instances (memoised on the word, since χ is immutable), falling
    back to Strong when the tree is too large.</p>
  <p class="muted small">The colour count is written <code>c</code> here. The survivable-<i>n</i>
    distribution over random χ is a genuine reportable finding.</p>
  <p class="muted small">Reference: Ramsey, <i>On a problem of formal logic</i> (1930).</p>
</section>`;let x,Bt=[],Wt=null,mr=_(1),Ki=1,Cn,_t=!1;const Ff=430;function qf(){let e=+b("alphaRange").value,t=+b("lRange").value;for(;Math.pow(e,t)>256&&t>1;)t--;const n=+b("cRange").value,i=+b("nRange").value,o=+b("seedField").value|0,r=b("presetSel").value||void 0,a=b("roleSel").value;return{alpha:e,l:t,c:n,n:i,seed:o,preset:r,humanRole:a==="R"?We:a==="B"?oe:a,aiLevel:{C:+b("aiR").value,A:+b("aiB").value}}}function Hi(e){const t=x.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const Un=()=>!lt(x)&&Hi(Ie(x)),Ml=()=>!lt(x)&&!Hi(Ie(x));function Oe(){window.clearTimeout(Cn),Ki=Ki+1|0,mr=_(2654435761^Ki*2654435761),x=Bf(qf()),Bt=[],Wt=null,x.config.humanRole!=="none"&&(_t=!1),Xn(),vr()}function br(e){if(lt(x))return;const t=Je(x,e);t!==x&&(Bt.push(x),x=t,Wt=null,Xn(),vr())}function vr(){window.clearTimeout(Cn),Ml()&&(x.config.humanRole==="none"&&!_t||(Cn=window.setTimeout(Gf,Ff)))}function Gf(){Ml()&&(x.config.humanRole==="none"&&!_t||br(Sl(x,x.config.aiLevel[Ie(x)],mr)))}function zf(e){!Un()||x.phase!=="point"||br(e)}function Of(e){!Un()||x.phase!=="insert"||Me(x).includes(e)&&br(e)}function jf(){Un()&&(Wt=Sl(x,2,mr),Xn())}function Wf(){if(!Bt.length)return;x=Bt.pop();const e=x.config.humanRole;if(e===We||e===oe)for(;Bt.length&&!Hi(Ie(x))&&!lt(x);)x=Bt.pop();Wt=null,_t=!1,Xn()}function _f(){if(!lt(x)||!x.witness)return null;const{i:e,color:t}=x.witness,n=x.config.l,i=new Set;for(let o=0;o<2*n;o++)i.add(e+o);return{set:i,color:t}}function Vf(){const e=b("word");e.innerHTML="";const t=x,{alpha:n,l:i,c:o}=t.config,r=_f();if(t.word.length===0){const a=da(0);a.classList.add("empty");const l=document.createElement("span");l.className="empty-hint",l.textContent=t.phase==="point"?"Constructor: click anywhere here to point at the first gap.":"Avoider: pick a letter to insert.",a.appendChild(l),e.appendChild(a);return}for(let a=0;a<=t.word.length;a++)if(e.appendChild(da(a)),a<t.word.length){let l=null;a+i<=t.word.length&&(l=xo(t.word,a,i,t.coloring,n));const s=(r==null?void 0:r.set.has(a))??!1;e.appendChild(Df(t.word[a],a,l,o,s,(r==null?void 0:r.color)??null))}}function da(e){const t=x.phase==="point"&&!lt(x)&&Un(),n=x.phase==="insert"?x.gap===e:x.phase==="point"&&Wt===e,i=document.createElement("button");i.className="caret"+(t?"":" disabled")+(n?" sel":""),i.dataset.gap=String(e);const o=document.createElement("span");return o.className="bar",i.appendChild(o),t||(i.tabIndex=-1),i}function Lo(e){return ca[e%ca.length]}function Df(e,t,n,i,o,r){const a=document.createElement("span");a.className="tile"+(o?" mono":"");const l=document.createElement("span");if(l.className="val",l.textContent=gr[e],a.appendChild(l),n!==null){const s=document.createElement("span");s.className="blockline",s.style.background=Lo(n),a.appendChild(s)}return o&&r!==null&&a.style.setProperty("--mono-hue",Lo(r)),a}function Yf(){const e=b("palette");e.innerHTML="";const t=x,n=lt(t),i=t.phase==="insert"&&!n&&(Hi(oe)||t.config.humanRole==="none"),o=new Set(Me(t));for(let a=0;a<t.config.alpha;a++)e.appendChild(Uf(a,i&&o.has(a)));const r=document.createElement("span");r.className="palette-hint",n?r.textContent="":t.phase==="point"?r.textContent="Constructor points at a gap first.":r.textContent="Insert a letter.",e.appendChild(r)}function Uf(e,t){const n=document.createElement("button");n.dataset.sym=String(e),n.disabled=!t,Wt!==null&&x.phase==="insert"&&Wt===e&&t&&(n.style.borderColor="var(--violet)",n.style.boxShadow="0 0 0 2px rgba(110,86,207,.25)");const i=document.createElement("span");return i.textContent=gr[e],n.appendChild(i),n}function Xf(){const e=b("legend");e.innerHTML="";const t=x,{alpha:n,l:i}=t.config,o=Math.pow(n,i),r=document.createElement("div");r.className="legend-title",r.textContent="Current colouring χ:",e.appendChild(r);const a=Math.min(o,8);for(let l=0;l<a;l++){const s=[];let c=l;for(let v=i-1;v>=0;v--)s[v]=c%n,c=Math.floor(c/n);const d=t.coloring[l],u=document.createElement("span");u.className="legend-chip";const p=document.createElement("span");p.className="legend-sw",p.style.background=Lo(d),u.appendChild(p);const f=document.createElement("span");f.textContent=s.map(v=>gr[v]).join(""),u.appendChild(f),e.appendChild(u)}if(o>a){const l=document.createElement("span");l.className="legend-more",l.textContent=`+${o-a} more`,e.appendChild(l)}}function Xn(){const e=x.config,t=lt(x);Vf(),Yf(),Xf();const n=b("turnPill");if(t)n.textContent=`${x.winner===We?"Constructor (blue)":"Avoider (red)"} wins`,n.className="turn-pill done";else{const a=Ie(x);n.textContent=a===We?"Constructor to point":"Avoider to insert",n.className=`turn-pill ${a===We?"blue":""}`.trim()}b("goalText").textContent=Sf(e);const i=x.word.length;b("meterFill").style.width=`${e.n?Math.min(i/e.n,1)*100:0}%`,b("meterValue").textContent=`${i} / ${e.n}`,b("meterLabel").textContent="Length toward target";const o=b("banner");if(t)if(o.hidden=!1,x.winner===We){o.className="banner blue";const a=x.witness,l=a?` (blocks at positions ${a.i+1}–${a.i+e.l} and ${a.i+e.l+1}–${a.i+2*e.l}, colour ${a.color}).`:".";o.textContent=`Constructor wins — two adjacent same-coloured blocks appeared${l}`}else o.className="banner red",o.textContent=`Avoider wins — reached length ${e.n} with no monochromatic adjacent pair. 🎉`;else o.hidden=!0;b("hintBtn").disabled=!Un(),b("undoBtn").disabled=Bt.length===0;const r=b("runBtn");e.humanRole==="none"?(r.hidden=!1,r.textContent=_t?"Pause":"Run",r.disabled=t):r.hidden=!0}function ft(){const e=b("alphaRange"),t=b("lRange");let n=+e.value,i=+t.value;for(;Math.pow(n,i)>256&&i>1;)i--,t.value=String(i);b("alphaLabel").textContent=e.value,b("lLabel").textContent=t.value,b("cLabel").textContent=b("cRange").value,b("nLabel").textContent=b("nRange").value,b("seedLabel").textContent=b("seedField").value,b("howtoL").textContent=t.value,b("howtoN").textContent=b("nRange").value}function ua(){const e=b("presetSel").value,t=e?hr(e):void 0;t&&(b("alphaRange").value=String(t.alpha),b("lRange").value=String(t.l),b("cRange").value=String(t.c),ft())}function fa(){const e=b("roleSel").value;b("aiRField").style.display=e==="B"||e==="none"?"":"none",b("aiBField").style.display=e==="R"||e==="none"?"":"none"}const pa="contest";function Kf(){const e=b("presetSel");for(const t of kl){const n=document.createElement("option");n.value=t.name,n.textContent=t.label,e.appendChild(n)}hr(pa)&&(e.value=pa)}function Zf(){b("presetSel").value="";const e=b("seedField");e.value=String(((+e.value|0)+1)%1e6),ft(),Oe()}function Jf(e){e.settings.innerHTML=Pf,e.board.innerHTML=Hf,e.sidebar.innerHTML=Nf,Kf(),b("word").addEventListener("click",t=>{const n=t.target.closest("[data-gap]");n&&zf(+n.dataset.gap)}),b("palette").addEventListener("click",t=>{const n=t.target.closest("[data-sym]");n&&!n.disabled&&Of(+n.dataset.sym)});for(const t of["alphaRange","lRange","cRange","nRange"])b(t).addEventListener("input",ft),b(t).addEventListener("change",()=>{ft(),Oe()});b("seedField").addEventListener("input",ft),b("seedField").addEventListener("change",()=>{ft(),Oe()}),b("presetSel").addEventListener("change",()=>{ua(),Oe()}),b("rerollBtn").addEventListener("click",Zf),b("roleSel").addEventListener("change",()=>{fa(),Oe()});for(const t of["aiR","aiB"])b(t).addEventListener("change",Oe);return b("newBtn").addEventListener("click",Oe),b("hintBtn").addEventListener("click",jf),b("undoBtn").addEventListener("click",Wf),b("runBtn").addEventListener("click",()=>{_t=!_t,Xn(),vr()}),ua(),ft(),fa(),Oe(),{destroy(){window.clearTimeout(Cn),Cn=void 0}}}const Qf={id:"ramsey-words",title:"Ramsey Words",tagline:"Force two same-coloured adjacent blocks",blurb:"Every length-l block has a fixed colour. One player forces two same-coloured blocks side by side; the other dodges to the target length.",topic:"Ramsey on words online",family:"Ramsey",mechanic:"insertion",tags:["colourings","online"],icon:`<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3"  y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="16" y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="29" y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="42" y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="4"  y="22" width="9" height="3" rx="1.5" fill="#6e56cf"/>
            <rect x="17" y="22" width="9" height="3" rx="1.5" fill="#2a9d6b"/>
            <rect x="30" y="22" width="9" height="3" rx="1.5" fill="#2a9d6b"/>
            <rect x="43" y="22" width="9" height="3" rx="1.5" fill="#e5a32a"/>
          </svg>`,mount:Jf},ep=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="sizeRange">Vertices <span class="hint-num" id="sizeLabel">8</span></label>
      <input type="range" id="sizeRange" min="4" max="9" value="8" />
    </div>
    <div class="field">
      <label for="targetRange">Clique q <span class="hint-num" id="targetLabel">4</span></label>
      <input type="range" id="targetRange" min="3" max="5" value="4" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Maker (red)</option>
        <option value="B">Breaker (blue)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field">
      <label for="modeSel">Mode</label>
      <select id="modeSel">
        <option value="maker-breaker" selected>Maker–Breaker</option>
        <option value="scoring">Scoring duel</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Potential</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Potential</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,tp=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to move</span>
    <span class="goal" id="goalText"></span>
  </div>
  <div class="board-wrap">
    <svg id="board" class="board" role="img" aria-label="game board"></svg>
  </div>
  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Best red clique (edges)</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 4</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,np=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b>Click an empty edge</b> to claim it in your colour.</li>
    <li id="howtoGoal">You are <b class="red-text">Maker (red)</b>.</li>
    <li><b class="blue-text">Breaker (blue)</b> claims edges too, to block you.</li>
    <li>Maker always moves first. Maker wins the instant a clique is complete; otherwise Breaker wins when the graph fills.</li>
  </ol>
</section>

<section class="card explainer" id="legend">
  <h2>The clique game</h2>
  <div class="legend-grid">
    <figure class="legend-item">
      <svg viewBox="0 0 90 40" class="mini" aria-hidden="true">
        <g class="m-edge"><line x1="20" y1="10" x2="70" y2="10"/><line x1="20" y1="10" x2="45" y2="34"/><line x1="70" y1="10" x2="45" y2="34"/></g>
        <circle cx="20" cy="10" r="3.6" class="m-v"/><circle cx="70" cy="10" r="3.6" class="m-v"/><circle cx="45" cy="34" r="3.6" class="m-v"/>
      </svg>
      <figcaption><b>Ramsey</b><span>3 red edges forming a triangle (a clique)</span></figcaption>
    </figure>
  </div>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Maker–Breaker.</b> A positional game (Beck, <i>Tic-Tac-Toe Theory</i>): Maker claims
    edges to occupy a whole <i>winning set</i> — here all edges of a q-clique — while Breaker just
    blocks. Maker, moving first, has the initiative.</p>
  <p><b>Erdős–Selfridge threshold.</b> If the winning sets are many and large enough
    (<i>Σ 2<sup>−|A|</sup> &lt; ½</i>), <b>Breaker wins</b>. So there's a sharp boundary between
    a Maker-competitive clique size and one Breaker can always block — that boundary is the whole
    point. Slide the clique size against the vertex count to feel it flip.</p>
  <p><b>The AI.</b> “Potential” is the Erdős–Selfridge weighting itself; “Solver” searches
    exactly on small boards. Lower the AI level if you want to win more easily.</p>
  <p class="muted small">References: Ramsey, <i>On a problem of formal logic</i> (1930);
    Erdős &amp; Selfridge, <i>On a combinatorial game</i> (1973);
    Beck, <i>Combinatorial Games: Tic-Tac-Toe Theory</i> (2008).</p>
</section>`,q=e=>document.getElementById(e);let G,Lt=[],Kn=null,wr=_(1),ip=1,sn,Vt=!1;const op=430;function rp(e){const t=+q("sizeRange").value;let n=+q("targetRange").value;return n=Math.min(n,t),{kind:"ramsey",boardSize:t,target:n,mode:q("modeSel").value,humanRole:q("roleSel").value,aiLevel:{R:+q("aiR").value,B:+q("aiB").value},seed:e}}function yr(e){const t=G.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const $r=()=>!ce(G)&&yr(G.turn),Tl=()=>!ce(G)&&!yr(G.turn);function Zt(){window.clearTimeout(sn);const e=ip++;wr=_(2654435761^e*2654435761),G=vl(rp(e)),Lt=[],Kn=null,G.config.humanRole!=="none"&&(Vt=!1),Zn(),Ni()}function El(e){if(ce(G))return;const t=an(G,e);t!==G&&(Lt.push(G),G=t,Kn=null,Zn(),Ni())}function Ni(){window.clearTimeout(sn),Tl()&&(G.config.humanRole==="none"&&!Vt||(sn=window.setTimeout(ap,op)))}function ap(){Tl()&&(G.config.humanRole==="none"&&!Vt||El(Ai(G,G.config.aiLevel[G.turn],wr)))}function lp(e){!$r()||G.owner[e]!==null||El(e)}function sp(){$r()&&(Kn=Ai(G,2,wr),Zn())}function cp(){if(!Lt.length)return;window.clearTimeout(sn),G=Lt.pop();const e=G.config.humanRole;if(e==="R"||e==="B")for(;Lt.length&&!yr(G.turn)&&!ce(G);)G=Lt.pop();Kn=null,Vt=!1,Zn(),Ni()}function dp(e){return e===W?"r":e==="B"?"b":"free"}function up(e){const t=e.config.boardSize,n=340,i=n/2,o=n/2-34,r=13,a=Zu(t),l=ce(e),s=new Set(l?e.witness??[]:[]),c=p=>{const f=-Math.PI/2+p*2*Math.PI/t;return[i+o*Math.cos(f),i+o*Math.sin(f)]},d=new Set;for(const p of s)d.add(a[p][0]),d.add(a[p][1]);const u=[];a.forEach(([p,f],v)=>{const[$,z]=c(p),[C,D]=c(f),st=["edge",dp(e.owner[v])];s.has(v)&&st.push("win"),u.push(`<line x1="${$}" y1="${z}" x2="${C}" y2="${D}" class="${st.join(" ")}" />`),Kn===v&&!l&&u.push(`<line x1="${$}" y1="${z}" x2="${C}" y2="${D}" class="edge hint-dot" />`)}),a.forEach(([p,f],v)=>{const[$,z]=c(p),[C,D]=c(f),st=e.owner[v]!==null?" taken":"";u.push(`<line x1="${$}" y1="${z}" x2="${C}" y2="${D}" class="edge-hit${st}" data-cell="${v}" />`)});for(let p=0;p<t;p++){const[f,v]=c(p);u.push(`<circle cx="${f}" cy="${v}" r="${r}" class="vertex${d.has(p)?" win":""}" />`),u.push(`<text x="${f}" y="${v}" class="vlabel">${p+1}</text>`)}return{viewBox:`0 0 ${n} ${n}`,body:u.join("")}}function Zn(){const e=G.config,t=dr(G),n=ce(G),{viewBox:i,body:o}=up(G),r=q("board");r.setAttribute("viewBox",i),r.innerHTML=o;const a=q("turnPill");n?(a.textContent=`${G.winner===W?"Red":"Blue"} wins`,a.className="turn-pill done"):(a.textContent=G.turn===W?"Red to move":"Blue to move",a.className=`turn-pill ${G.turn===W?"":"blue"}`.trim()),q("goalText").textContent=wl(e);const l=t.need||e.target;q("meterFill").style.width=`${l?Math.min(t.size/l,1)*100:0}%`,q("meterValue").textContent=`${t.size} / ${l}`;const s=q("banner");if(n){s.hidden=!1;const d=e.mode==="scoring",u=G.score??t.size;G.winner===W?(s.className="banner red",s.textContent=d?`Maker scored ${u}/${l} — a full ${e.target}-clique! 🎉`:`Maker wins — a red ${e.target}-clique! 🎉`):(s.className="banner blue",s.textContent=d?`Breaker wins — Maker scored only ${u}/${l}.`:`Breaker wins — Maker blocked (best ${t.size}/${l}).`)}else s.hidden=!0;q("hintBtn").disabled=!$r(),q("undoBtn").disabled=Lt.length===0;const c=q("runBtn");e.humanRole==="none"?(c.hidden=!1,c.textContent=Vt?"Pause":"Run",c.disabled=n):c.hidden=!0}function Zi(){const e=q("sizeRange"),t=q("targetRange");+t.value>+e.value&&(t.value=e.value),q("sizeLabel").textContent=e.value,q("targetLabel").textContent=t.value,q("howtoGoal").innerHTML=`You are <b class="red-text">Maker (red)</b> — claim all edges among some <b>${t.value}</b> vertices (a red clique).`}function ha(){const e=q("roleSel").value;q("aiRField").style.display=e==="B"||e==="none"?"":"none",q("aiBField").style.display=e==="R"||e==="none"?"":"none"}function fp(e){e.settings.innerHTML=ep,e.board.innerHTML=tp,e.sidebar.innerHTML=np,q("board").addEventListener("click",t=>{const n=t.target.closest("[data-cell]");n&&lp(+n.getAttribute("data-cell"))});for(const t of["sizeRange","targetRange"])q(t).addEventListener("input",Zi),q(t).addEventListener("change",()=>{Zi(),Zt()});q("modeSel").addEventListener("change",Zt),q("roleSel").addEventListener("change",()=>{ha(),Zt()});for(const t of["aiR","aiB"])q(t).addEventListener("change",Zt);return q("newBtn").addEventListener("click",Zt),q("hintBtn").addEventListener("click",sp),q("undoBtn").addEventListener("click",cp),q("runBtn").addEventListener("click",()=>{Vt=!Vt,Zn(),Ni()}),Zi(),ha(),Zt(),{destroy(){window.clearTimeout(sn),sn=void 0}}}const pp={id:"mb-ramsey",title:"MB Ramsey",tagline:"Maker–Breaker: cliques on a graph",blurb:"Claim edges of a complete graph to complete a red clique while your opponent blocks. The Erdős–Selfridge threshold decides who is favoured.",topic:"Maker–Breaker Ramsey clique game",family:"Ramsey",mechanic:"Maker–Breaker",tags:["cliques","Erdős–Selfridge"],icon:`<svg viewBox="0 0 48 28" width="48" height="28">
            <g stroke="var(--line)" stroke-width="1.5"><line x1="12" y1="6" x2="36" y2="6"/><line x1="12" y1="6" x2="24" y2="24"/><line x1="36" y1="6" x2="24" y2="24"/></g>
            <circle cx="12" cy="6" r="3" fill="var(--red)"/><circle cx="36" cy="6" r="3" fill="var(--red)"/><circle cx="24" cy="24" r="3" fill="var(--blue)"/>
          </svg>`,mount:fp},j="R",ke="B";function Fi(e,t,n){const i=[];for(let o=0;o<n;o++)i.push(e+o*t);return i}function hp(e){return Fi(e.start,e.d,e.len)}function gp(e,t,n){return e+(n-1)*t}function nn(e,t,n,i){const o=e.length;if(i<1||n<1||t<0||gp(t,n,i)>=o)return!1;for(let a=0;a<i;a++)if(e[t+a*n]!==null)return!1;return!0}function Ji(e,t,n){const i=e.slice();for(const o of hp(t))i[o]=n;return i}function Cl(e,t,n){const i=e.length,o=[],r=i-1-(n-1)*t;for(let a=0;a<=r;a++)nn(e,a,t,n)&&o.push(a);return o}function hi(e,t){return Cl(e.occupied,t.d,t.len).map(n=>({start:n,d:t.d,len:t.len}))}function mp(e,t,n){const i=[];for(const o of t)for(const r of n)for(const a of Cl(e,o,r))i.push({start:a,d:o,len:r});return i}function kr(e){let t=-1,n=-1;for(let i=0;i<e.length;i++)e[i]!==null&&(t<0&&(t=i),n=i);return t<0?0:n-t+1}function ga(e){let t=0;for(const n of e)n!==null&&t++;return t}function Qe(e){return e.len<=0?0:(e.len-1)*e.d+1}function Al(e){return e.reduce((t,n)=>t+Math.max(0,n.len),0)}function Il(e){return e.reduce((t,n)=>Math.max(t,Qe(n)),0)}function bp(e){let t=0;for(const n of e)t+=Qe(n);return Math.max(1,t)}function vp(e,t){if(t<Il(e)||Al(e)>t)return!1;const n=new Array(t).fill(!1),i=o=>{if(o===e.length)return!0;const{d:r,len:a}=e[o],l=t-1-(a-1)*r;for(let s=0;s<=l;s++){const c=Fi(s,r,a);let d=!0;for(const u of c)if(n[u]){d=!1;break}if(d){for(const u of c)n[u]=!0;if(i(o+1))return!0;for(const u of c)n[u]=!1}}return!1};return i(0)}function wp(e,t=64){const n=e.filter(a=>a.len>0&&a.d>0);if(n.length===0)return 0;const i=[...n].sort((a,l)=>Qe(l)-Qe(a)),o=Math.max(Il(i),Al(i)),r=Math.min(t,bp(i));for(let a=o;a<=r;a++)if(vp(i,a))return a;return-1}function yp(e,t,n=2e5){const i=t.filter(d=>d.len>0&&d.d>0);if(i.length===0)return!0;const o=e.length,r=e.map(d=>d!==null),a=[...i].sort((d,u)=>Qe(u)-Qe(d));let l=0,s=!1;const c=d=>{if(d===a.length)return!0;if(l++>n)return s=!0,!0;const{d:u,len:p}=a[d],f=o-1-(p-1)*u;for(let v=0;v<=f;v++){const $=Fi(v,u,p);let z=!0;for(const D of $)if(r[D]){z=!1;break}if(!z)continue;for(const D of $)r[D]=!0;const C=c(d+1);for(const D of $)r[D]=!1;if(C||s)return!0}return!1};return c(0)}function $p(e,t,n=4e5){const i=e.length,o=t.map((C,D)=>({m:C,i:D})).filter(C=>C.m.len>0&&C.m.d>0);let r=-1,a=-1;for(let C=0;C<i;C++)e[C]!==null&&(r<0&&(r=C),a=C);if(o.length===0)return{starts:new Array(t.length).fill(-1),used:r<0?0:a-r+1};o.sort((C,D)=>Qe(D.m)-Qe(C.m));const l=o.map(C=>C.m),s=e.map(C=>C!==null),c=new Array(l.length).fill(-1);let d=1/0,u=null,p=0,f=!1;const v=(C,D,st)=>{if(f)return;if(p++>n){f=!0;return}if(C===l.length){const ct=st-D+1;ct<d&&(d=ct,u=c.slice());return}const{d:Er,len:Cr}=l[C],ns=i-1-(Cr-1)*Er;for(let ct=0;ct<=ns;ct++){const Qn=Fi(ct,Er,Cr);let Ar=!0;for(const he of Qn)if(s[he]){Ar=!1;break}if(!Ar)continue;let bn=D,ei=st;for(const he of Qn)(bn<0||he<bn)&&(bn=he),he>ei&&(ei=he);if(!(ei-bn+1>=d)){for(const he of Qn)s[he]=!0;c[C]=ct,v(C+1,bn,ei);for(const he of Qn)s[he]=!1;c[C]=-1}}};v(0,r,a);const $=u;if($===null)return null;const z=new Array(t.length).fill(-1);return $.forEach((C,D)=>{z[o[D].i]=C}),{starts:z,used:d}}function kp(e){const t=e.L,n=new Array(t).fill(null),i=e.family??[];return{config:e,L:t,occupied:n,placed:[],remaining:e.mode==="two-player"?[]:i.map(o=>({...o})),turn:j}}function ma(e){return e.remaining.some(t=>hi(e,t).length===0)?!0:!yp(e.occupied,e.remaining)}function Te(e){if(e.winner||e.done)return[];const t=e.config;if(t.mode==="solo"){const i=[];return e.remaining.forEach((o,r)=>{for(const a of hi(e,o))i.push({kind:"place",start:a.start,d:a.d,len:a.len,specIndex:r})}),i}if(t.mode==="two-player"){const i=t.diffs??[1],o=t.lengths??[2];return mp(e.occupied,i,o).map(r=>({kind:"place",start:r.start,d:r.d,len:r.len}))}if(e.turn===j){const i=[];return e.remaining.forEach((o,r)=>{for(const a of hi(e,o))i.push({kind:"place",start:a.start,d:a.d,len:a.len,specIndex:r})}),i}const n=[];for(let i=0;i<e.L;i++)e.occupied[i]===null&&n.push({kind:"block",cell:i});return n}function ba(e,t,n){const i=e.slice();if(t!==void 0&&t>=0&&t<i.length&&i[t].d===n.d&&i[t].len===n.len)return i.splice(t,1),i;const o=i.findIndex(r=>r.d===n.d&&r.len===n.len);return o>=0&&i.splice(o,1),i}function qe(e,t){if(e.winner||e.done)return e;const n=e.config;if(n.mode==="solo"){if(t.kind!=="place"||!nn(e.occupied,t.start,t.d,t.len))return e;const r={start:t.start,d:t.d,len:t.len,color:j},a=Ji(e.occupied,r,j),l=ba(e.remaining,t.specIndex,{d:t.d,len:t.len}),s={...e,occupied:a,placed:[...e.placed,r],remaining:l,turn:j};return l.length===0&&(s.done=!0,s.winner=j),s}if(n.mode==="two-player"){if(t.kind!=="place"||!nn(e.occupied,t.start,t.d,t.len))return e;const r=e.turn,a={start:t.start,d:t.d,len:t.len,color:r},l=Ji(e.occupied,a,r),s=r===j?ke:j,c={...e,occupied:l,placed:[...e.placed,a],turn:s};return Te(c).length===0&&(c.winner=r),c}if(e.turn===j){if(t.kind!=="place"||!nn(e.occupied,t.start,t.d,t.len))return e;const r={start:t.start,d:t.d,len:t.len,color:j},a=Ji(e.occupied,r,j),l=ba(e.remaining,t.specIndex,{d:t.d,len:t.len}),s={...e,occupied:a,placed:[...e.placed,r],remaining:l,turn:ke};return l.length===0?(s.winner=j,s.done=!0,s):(ma(s)&&(s.winner=ke),s)}if(t.kind!=="block"||t.cell<0||t.cell>=e.L||e.occupied[t.cell]!==null)return e;const i=e.occupied.slice();i[t.cell]="x";const o={...e,occupied:i,turn:j};return ma(o)&&(o.winner=ke),o}function gn(e){return!!e.winner||!!e.done}function xp(e){switch(e.mode){case"solo":return"Place every comb tile without overlap — minimise the used length toward m(F).";case"two-player":return"Drop AP tiles in turn. The player who cannot move loses (last to place wins).";case"pack-vs-block":return"Maker (red) places the whole family; Breaker (blue) blocks one cell per turn."}}function me(e,t){const n=Te(e);return n.length===0?null:n[Math.floor(t()*n.length)]}function Rp(e){let t=0,n=0;for(const i of e)i===null?(n++,n>t&&(t=n)):n=0;return t}function Et(e,t){const n=Te(e).filter(r=>r.kind==="place");if(n.length===0)return null;let i=n[0],o=1/0;for(const r of n){const a=e.occupied.slice();for(let d=0;d<r.len;d++)a[r.start+d*r.d]=j;const l=kr(a),s=Rp(a),c=l*1e3-s+(t()-.5)*.001;c<o&&(o=c,i=r)}return i}function So(e,t){const n=new Array(e.L).fill(0);let i=!1;for(const a of e.remaining)for(const l of hi(e,a))for(let s=0;s<l.len;s++)n[l.start+s*l.d]++,i=!0;if(!i)return me(e,t);let o=-1,r=-1/0;for(let a=0;a<e.L;a++){if(e.occupied[a]!==null)continue;const l=n[a]+(t()-.5)*.001;l>r&&(r=l,o=a)}return o<0?me(e,t):{kind:"block",cell:o}}function Mo(e,t){const n=Te(e);if(n.length===0)return null;let i=n[0],o=-1/0;for(const r of n){const a=qe(e,r);if(a.winner===e.turn)return r;const s=-Te(a).length+(t()-.5)*.001;s>o&&(o=s,i=r)}return i}function Bp(e){return e.occupied.map(t=>t===null?".":t==="x"?"x":t).join("")+e.turn}function Pl(e,t,n){if(e.winner)return e.winner===j?1:-1;if(n.n<=0)return 0;const i=Bp(e),o=t.get(i);if(o!==void 0)return o;n.n--;const r=Te(e),a=e.turn===j;let l=a?-1/0:1/0;for(const s of r){const c=Pl(qe(e,s),t,n);if(l=a?Math.max(l,c):Math.min(l,c),n.n<=0||a&&l===1||!a&&l===-1)break}return(l===1/0||l===-1/0)&&(l=0),t.set(i,l),l}function Lp(e,t){const n=Te(e);if(n.length===0)return null;if(e.L>22||n.length>60)return Mo(e,t);const i=new Map,o=e.turn===j?1:-1,r={n:4e5};let a=n[0],l=null;for(const s of n){const c=qe(e,s);if(c.winner===e.turn)return s;const d=Pl(c,i,r);if(d===o)return s;d===0&&l===null&&(l=s)}return l??Mo(e,t)??a}function Sp(e,t){if(Te(e).filter(l=>l.kind==="place").length===0||e.remaining.length===0)return null;const i=$p(e.occupied,e.remaining);if(!i)return Et(e,t);let o=-1,r=1/0;for(let l=0;l<e.remaining.length;l++){const s=i.starts[l];if(s<0)continue;const c=e.remaining[l];nn(e.occupied,s,c.d,c.len)&&s<r&&(r=s,o=l)}if(o<0)return Et(e,t);const a=e.remaining[o];return{kind:"place",start:i.starts[o],d:a.d,len:a.len,specIndex:o}}function Mp(e){const t=e.occupied.map(i=>i===null?".":i==="x"?"x":i).join(""),n=e.remaining.map(i=>`${i.d}:${i.len}`).sort().join(",");return`${t}|${n}|${e.turn}`}function Hl(e,t,n){if(e.winner)return e.winner===j?1:-1;if(n.n<=0)return 0;const i=Mp(e),o=t.get(i);if(o!==void 0)return o;n.n--;const r=Te(e);if(r.length===0){const s=e.turn===j?-1:1;return t.set(i,s),s}const a=e.turn===j;let l=a?-1/0:1/0;for(const s of r){const c=Hl(qe(e,s),t,n);if(l=a?Math.max(l,c):Math.min(l,c),n.n<=0||a&&l===1||!a&&l===-1)break}return(l===1/0||l===-1/0)&&(l=0),t.set(i,l),l}function Tp(e,t){const n=Te(e);if(n.length===0)return null;if(e.L>16||n.length>40)return e.turn===j?Et(e,t):So(e,t);const i=new Map,o=e.turn===j?1:-1,r={n:5e5};let a=null;for(const l of n){const s=qe(e,l);if(s.winner===e.turn)return l;const c=Hl(s,i,r);if(c===o)return l;c===0&&a===null&&(a=l)}return a??(e.turn===j?Et(e,t):So(e,t))??n[0]}function Nl(e,t,n){if(gn(e))return null;const i=e.config.mode;return t===0?me(e,n):i==="solo"?t>=3?Sp(e,n)??Et(e,n)??me(e,n):Et(e,n)??me(e,n):i==="two-player"?t>=2?Lp(e,n)??me(e,n):Mo(e,n)??me(e,n):t>=3?Tp(e,n)??me(e,n):e.turn===j?Et(e,n)??me(e,n):So(e,n)??me(e,n)}const w=e=>document.getElementById(e),Ep=`
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field span2">
      <label for="modeSel">Mode</label>
      <select id="modeSel">
        <option value="solo" selected>Solo puzzle — pack a family tightly</option>
        <option value="two-player">Two-player — last to place wins</option>
        <option value="pack-vs-block">Pack vs Block — Maker–Breaker</option>
      </select>
    </div>
    <div class="field">
      <label for="sizeRange">Strip length L <span class="hint-num" id="sizeLabel">20</span></label>
      <input type="range" id="sizeRange" min="8" max="40" value="20" />
    </div>
    <div class="field" id="famField">
      <label for="famSel">Family</label>
      <select id="famSel"></select>
    </div>
    <div class="field span2" id="diffsField" style="display:none">
      <label>Allowed differences d</label>
      <div class="chips" id="diffChips"></div>
    </div>
    <div class="field span2" id="lensField" style="display:none">
      <label>Allowed lengths &#8467;</label>
      <div class="chips" id="lenChips"></div>
    </div>
    <div class="field" id="roleField">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Red (first / Maker)</option>
        <option value="B">Blue (other side)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`,Cp=`
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to move</span>
    <span class="goal" id="goalText"></span>
  </div>
  <div class="board-wrap">
    <svg id="board" class="board" role="img" aria-label="packing strip"></svg>
  </div>
  <div id="trayWrap">
    <div class="meter-label" id="trayLabel" style="margin-bottom:8px">Tiles to place</div>
    <div class="tray" id="tray"></div>
  </div>
  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Used length</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 0</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`,Ap=`
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list" id="howtoList"></ol>
</section>
<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>AP "comb" tiles.</b> A tile <i>(start, d, &#8467;)</i> covers cells
    <i>start, start+d, &#8230;, start+(&#8467;&#8722;1)d</i> &mdash; an arithmetic progression.
    A packing places shifted copies pairwise disjointly on the strip.</p>
  <p><b>The optimum m(F).</b> For a family <i>F</i>, <i>m(F)</i> is the shortest interval that
    holds all members disjointly. Alon, D&#281;bski, Grytczuk &amp; Przyby&#322;o prove
    <i>m(F) = &Theta;(n<sup>3/2</sup>/ln n)</i> when the differences are bounded by <i>n</i>
    (and <i>&Theta;(n<sup>3</sup>/ln n)</i> when every member has size <i>n</i>). The solver
    finds <i>m(F)</i> exactly by branch-and-bound on small instances; the meter scores your
    used length against it.</p>
  <p><b>Maker&ndash;Breaker.</b> In Pack&nbsp;vs&nbsp;Block, Maker must place the whole family
    while Breaker deletes one cell per turn &mdash; a positional game (Beck,
    <i>Tic-Tac-Toe Theory</i>): can the packer still fit everything?</p>
  <p><b>The AI.</b> <i>Greedy</i> uses best-fit packing; <i>Strong</i> runs alpha&ndash;beta
    on the two-player game; <i>Solver</i> computes the exact optimum / game value on small
    boards.</p>
  <p class="muted small">References: Alon, D&#281;bski, Grytczuk &amp; Przyby&#322;o,
    <i>Packing arithmetic progressions</i> (2026),
    <a href="https://arxiv.org/abs/2603.02786" target="_blank" rel="noopener">arXiv:2603.02786</a>;
    Beck, <i>Combinatorial Games: Tic-Tac-Toe Theory</i> (2008).</p>
</section>`,Fl=[{name:"A: {2×len2}",family:[{d:1,len:2},{d:2,len:2}]},{name:"B: line + skip",family:[{d:1,len:3},{d:2,len:3}]},{name:"C: three combs",family:[{d:1,len:2},{d:2,len:3},{d:3,len:2}]},{name:"D: combs 1..3",family:[{d:1,len:3},{d:2,len:2},{d:3,len:3}]},{name:"E: dense",family:[{d:1,len:4},{d:2,len:3},{d:3,len:3},{d:1,len:2}]}],ql=[1,2,3,4],Gl=[2,3,4];let h,St=[],xr=_(1),Ip=1,An,Dt=!1;const Pp=430;let U=null,Z=null,Qt=0,cn=1,dn=2,pt=new Set([1,2,3]),ht=new Set([2,3]);function Rr(){return w("modeSel").value}function Hp(e){const t=Rr(),n=+w("sizeRange").value,i={mode:t,L:n,humanRole:w("roleSel").value,aiLevel:{R:+w("aiR").value,B:+w("aiB").value},seed:e};if(t==="two-player")i.diffs=ql.filter(o=>pt.has(o)),i.lengths=Gl.filter(o=>ht.has(o)),i.diffs.length===0&&(i.diffs=[1]),i.lengths.length===0&&(i.lengths=[2]);else{const o=+w("famSel").value;i.family=Fl[o].family.map(r=>({...r}))}return i}function qi(e){const t=h.config.humanRole;return h.config.mode==="solo"?t!=="none":t==="both"?!0:t==="none"?!1:t===e}const mn=()=>!gn(h)&&qi(h.turn),zl=()=>!gn(h)&&!qi(h.turn);function He(){window.clearTimeout(An);const e=Ip++;if(xr=_(2654435761^e*2654435761),h=kp(Hp(e)),St=[],Z=null,U=h.config.mode==="two-player"?null:0,h.config.humanRole!=="none"&&(Dt=!1),h.config.mode==="solo"&&h.config.family){const t=wp(h.config.family,60);Qt=t>0?t:kr(h.occupied)}else Qt=0;Np(),ve(),Br()}function Np(){if(h.config.mode!=="two-player")return;const e=h.config.diffs??[1],t=h.config.lengths??[2];e.includes(cn)||(cn=e[0]),t.includes(dn)||(dn=t[0])}function ai(e){if(e===h){Ol();return}St.push(h),h=e,Z=null,h.config.mode!=="two-player"&&(U===null||U>=h.remaining.length)&&(U=h.remaining.length?0:null),ve(),Br()}function Ol(){const e=w("board");e.classList.remove("shake"),e.offsetWidth,e.classList.add("shake")}function Br(){window.clearTimeout(An),zl()&&(h.config.humanRole==="none"&&!Dt||(An=window.setTimeout(Fp,Pp)))}function Fp(){if(!zl()||h.config.humanRole==="none"&&!Dt)return;const e=Nl(h,h.config.aiLevel[h.turn],xr);e?ai(qe(h,e)):ve()}function qp(e){if(!mn())return;const t=h.config.mode;if(t==="two-player"){ai(qe(h,{kind:"place",start:e,d:cn,len:dn}));return}if(h.turn===ke&&t==="pack-vs-block"){ai(qe(h,{kind:"block",cell:e}));return}if(U===null||U>=h.remaining.length){Ol();return}const n=h.remaining[U],i={kind:"place",start:e,d:n.d,len:n.len,specIndex:U};ai(qe(h,i))}function Gp(){if(!mn())return;const e=Math.max(2,h.config.aiLevel[h.turn]);Z=Nl(h,e,xr),Z&&Z.kind==="place"&&Z.specIndex!==void 0&&(U=Z.specIndex),ve()}function zp(){if(!St.length)return;h=St.pop();const e=h.config.humanRole;if((e==="R"||e==="B")&&h.config.mode!=="solo")for(;St.length&&!qi(h.turn)&&!gn(h);)h=St.pop();Z=null,Dt=!1,h.config.mode!=="two-player"&&(U===null||U>=h.remaining.length)&&(U=h.remaining.length?0:null),ve()}function Op(e){const t=h.config.mode;if(!mn())return null;let n,i;if(t==="two-player")n=cn,i=dn;else{if(t==="pack-vs-block"&&h.turn===ke)return{cells:[e],ok:h.occupied[e]===null};if(U===null||U>=h.remaining.length)return null;n=h.remaining[U].d,i=h.remaining[U].len}const o=[];for(let a=0;a<i;a++)o.push(e+a*n);const r=nn(h.occupied,e,n,i);return{cells:o,ok:r}}let en=null;function jp(e){return e===j?"r":e===ke?"b":e==="x"?"x":"free"}function Wp(e){const t=e.L,n=8,i=4,o=8,r=600,a=Math.max(8,(r-2*n-(t-1)*i)/t),l=Math.min(34,Math.max(18,a*1.1)),s=o+l+16,c=$=>n+$*(a+i),d=mn();let u=new Set,p=!0;if(d&&en!==null){const $=Op(en);$&&(u=new Set($.cells.filter(z=>z>=0&&z<t)),p=$.ok)}const f=new Set;if(Z)if(Z.kind==="place")for(let $=0;$<Z.len;$++)f.add(Z.start+$*Z.d);else f.add(Z.cell);const v=[];for(let $=0;$<t;$++){const z=["scell",jp(e.occupied[$])];e.occupied[$]===null&&d&&z.push("armed"),u.has($)&&(p?z.push("preview",e.turn===ke?"preview-b":"preview-r"):z.push("bad")),f.has($)&&!gn(e)&&z.push("hint"),v.push(`<rect x="${c($).toFixed(1)}" y="${o}" width="${a.toFixed(1)}" height="${l.toFixed(1)}" rx="4" class="${z.join(" ")}" data-cell="${$}" />`),t<=28&&v.push(`<text x="${(c($)+a/2).toFixed(1)}" y="${o+l+11}" class="scell-label">${$}</text>`)}return{viewBox:`0 0 ${r} ${s}`,body:v.join("")}}function Qi(e,t){4*2+(e.len-1)*e.d*11+0;const r=(e.len-1)*e.d,a=4*2+r*11,l=16,s=d=>4+d*11,c=[];c.push(`<line x1="4" y1="8" x2="${(4+r*11).toFixed(1)}" y2="8" class="comb-line"/>`);for(let d=0;d<e.len;d++)c.push(`<circle cx="${s(d*e.d).toFixed(1)}" cy="8" r="${3.2}" class="comb-mark"/>`);return`<svg viewBox="0 0 ${Math.max(a,14)} ${l}" width="${Math.min(120,Math.max(20,a)).toFixed(0)}" height="${l}">${c.join("")}</svg>`}function _p(e){const t=w("trayWrap"),n=w("tray"),i=w("trayLabel");if(e.config.mode==="two-player"){t.style.display="",i.textContent="Pick a tile (difference d × length ℓ), then click a cell to place it";const r=e.config.diffs??[1],a=e.config.lengths??[2],l=[];for(const s of r)for(const c of a){const d={d:s,len:c},u=s===cn&&c===dn?" selected":"";l.push(`<figure class="combtile${u}" data-d="${s}" data-len="${c}" tabindex="0">${Qi(d)}<figcaption>d=${s}, ℓ=${c}</figcaption></figure>`)}n.innerHTML=l.join("");return}t.style.display="",e.config.mode==="pack-vs-block"&&e.turn===ke&&qi(ke)?i.textContent="Breaker: click any free cell to block it":i.textContent="Click a comb tile to select it, then click a strip cell for its start",e.placed.map(r=>`${r.d}:${r.len}`);const o=[];e.remaining.forEach((r,a)=>{const l=a===U?" selected":"";o.push(`<figure class="combtile${l}" data-spec="${a}" tabindex="0">${Qi(r)}<figcaption>d=${r.d}, ℓ=${r.len}</figcaption></figure>`)});for(const r of e.placed)o.push(`<figure class="combtile placed">${Qi({d:r.d,len:r.len})}<figcaption>placed</figcaption></figure>`);n.innerHTML=o.join("")}function ve(){var p;const e=h.config,t=gn(h),{viewBox:n,body:i}=Wp(h),o=w("board");o.setAttribute("viewBox",n),o.innerHTML=i,_p(h);const r=w("turnPill");t?e.mode==="solo"?(r.textContent="Packed",r.className="turn-pill done"):(r.textContent=`${h.winner===j?"Red":"Blue"} wins`,r.className="turn-pill done"):e.mode==="solo"?(r.textContent=`${h.remaining.length} tile${h.remaining.length===1?"":"s"} left`,r.className="turn-pill"):(r.textContent=h.turn===j?"Red to move":"Blue to move",r.className=`turn-pill ${h.turn===j?"":"blue"}`.trim()),w("goalText").textContent=xp(e);const a=kr(h.occupied),l=w("meterLabel"),s=w("meterFill"),c=w("meterValue");if(e.mode==="solo"){l.textContent="Used length vs m(F)";const f=Qt||a||1;s.style.width=`${Math.min(a/f,1.5)/1.5*100}%`,c.textContent=`${a} / ${Qt||"?"}`}else if(e.mode==="two-player")l.textContent="Cells covered",s.style.width=`${ga(h.occupied)/h.L*100}%`,c.textContent=`${ga(h.occupied)} / ${h.L}`;else{l.textContent="Family placed";const f=((p=e.family)==null?void 0:p.length)??0,v=f-h.remaining.length;s.style.width=`${f?v/f*100:0}%`,c.textContent=`${v} / ${f}`}const d=w("banner");if(t)if(d.hidden=!1,e.mode==="solo"){const f=a===Qt;d.className=f?"banner violet":"banner red",d.textContent=f?`Optimal! Used length ${a} = m(F). 🎉`:`Packed in length ${a}. Optimum m(F) = ${Qt}. Try to match it!`}else h.winner===j?(d.className="banner red",d.textContent=e.mode==="pack-vs-block"?"Maker wins — the whole family is packed! 🎉":"Red wins — Blue cannot move. 🎉"):(d.className="banner blue",d.textContent=e.mode==="pack-vs-block"?"Breaker wins — a tile can no longer be placed.":"Blue wins — Red cannot move.");else d.hidden=!0;w("hintBtn").disabled=!mn(),w("undoBtn").disabled=St.length===0;const u=w("runBtn");e.humanRole==="none"?(u.hidden=!1,u.textContent=Dt?"Pause":"Run",u.disabled=t):u.hidden=!0}function eo(){const e=Rr(),t=e==="two-player";w("famField").style.display=t?"none":"",w("diffsField").style.display=t?"":"none",w("lensField").style.display=t?"":"none";const n=w("roleSel"),i=["B","both"];for(const r of Array.from(n.options)){const a=e==="solo"&&i.includes(r.value);r.hidden=a,r.disabled=a}e==="solo"&&i.includes(n.value)&&(n.value="R");const o=n.value;w("aiRField").style.display=(o==="B"||o==="none")&&e!=="solo"?"":"none",w("aiBField").style.display=(o==="R"||o==="none")&&e!=="solo"?"":"none",e==="solo"&&(w("aiRField").style.display=o==="none"?"":"none",w("aiBField").style.display="none"),w("sizeLabel").textContent=w("sizeRange").value}function va(){const e=Rr(),t=w("howtoList");e==="solo"?t.innerHTML=`
      <li><b>Click a comb tile</b> in the tray to select it.</li>
      <li><b>Click a strip cell</b> to set the tile's <i>start</i>; it fills cells <i>start, start+d, …</i></li>
      <li>All tiles must be <b>pairwise disjoint</b>. Illegal drops flash red.</li>
      <li>Pack every tile to <b>minimise the used length</b> — match <b>m(F)</b> for a perfect score.</li>`:e==="two-player"?t.innerHTML=`
      <li>Pick a tile <b>(d × ℓ)</b>, then click a cell to drop a shifted AP copy.</li>
      <li>No overlaps; <b class="red-text">Red</b> moves first, then <b class="blue-text">Blue</b>.</li>
      <li><b>Normal play:</b> the player who cannot move loses (last to place wins).</li>`:t.innerHTML=`
      <li><b class="red-text">Maker</b> places the whole family of comb tiles, all disjoint.</li>
      <li><b class="blue-text">Breaker</b> blocks <b>one free cell</b> each turn.</li>
      <li>Maker wins by placing everything; Breaker wins if a tile can no longer fit.</li>`}function to(){const e=w("diffChips");e.innerHTML=ql.map(n=>`<button class="chip${pt.has(n)?" on":""}" data-diff="${n}">d=${n}</button>`).join("");const t=w("lenChips");t.innerHTML=Gl.map(n=>`<button class="chip${ht.has(n)?" on":""}" data-len="${n}">ℓ=${n}</button>`).join("")}function Vp(){const e=w("famSel");e.innerHTML=Fl.map((t,n)=>`<option value="${n}"${n===0?" selected":""}>${t.name}</option>`).join("")}function Dp(e){e.settings.innerHTML=Ep,e.board.innerHTML=Cp,e.sidebar.innerHTML=Ap,Vp(),to(),w("board").addEventListener("click",t=>{const n=t.target.closest("[data-cell]");n&&qp(+n.getAttribute("data-cell"))}),w("board").addEventListener("mousemove",t=>{const n=t.target.closest("[data-cell]"),i=n?+n.getAttribute("data-cell"):null;i!==en&&(en=i,mn()&&ve())}),w("board").addEventListener("mouseleave",()=>{en!==null&&(en=null,ve())}),w("tray").addEventListener("click",t=>{const n=t.target.closest(".combtile");!n||n.classList.contains("placed")||(n.dataset.spec!==void 0?(U=+n.dataset.spec,ve()):n.dataset.d!==void 0&&(cn=+n.dataset.d,dn=+n.dataset.len,ve()))}),w("diffChips").addEventListener("click",t=>{const n=t.target.closest("[data-diff]");if(!n)return;const i=+n.dataset.diff;pt.has(i)?pt.delete(i):pt.add(i),pt.size===0&&pt.add(i),to(),He()}),w("lenChips").addEventListener("click",t=>{const n=t.target.closest("[data-len]");if(!n)return;const i=+n.dataset.len;ht.has(i)?ht.delete(i):ht.add(i),ht.size===0&&ht.add(i),to(),He()}),w("modeSel").addEventListener("change",()=>{eo(),va(),He()}),w("sizeRange").addEventListener("input",()=>{w("sizeLabel").textContent=w("sizeRange").value}),w("sizeRange").addEventListener("change",He),w("famSel").addEventListener("change",He),w("roleSel").addEventListener("change",()=>{eo(),He()});for(const t of["aiR","aiB"])w(t).addEventListener("change",He);return w("newBtn").addEventListener("click",He),w("hintBtn").addEventListener("click",Gp),w("undoBtn").addEventListener("click",zp),w("runBtn").addEventListener("click",()=>{Dt=!Dt,ve(),Br()}),eo(),va(),He(),{destroy(){window.clearTimeout(An),An=void 0}}}const Yp={id:"ap-pack",title:"AP-Pack",tagline:"Pack arithmetic progressions",blurb:"Place evenly-spaced “combs” on a strip without overlaps. Reach the optimal packing m(F) in solo mode, or out-pack / block your opponent in the two-player game.",topic:"AP packing",family:"Packing",mechanic:"packing",tags:["m(F)","strip packing"],icon:`<svg viewBox="0 0 48 28" width="48" height="28">
            <line x1="6" y1="14" x2="42" y2="14" stroke="var(--line)" stroke-width="1.5"/>
            <circle cx="6" cy="14" r="3" fill="var(--red)"/><circle cx="16" cy="14" r="3" fill="var(--red)"/>
            <circle cx="26" cy="14" r="3" fill="var(--red)"/>
            <circle cx="36" cy="14" r="3" fill="var(--blue)"/><circle cx="42" cy="14" r="3" fill="var(--blue)"/>
          </svg>`,mount:Dp},V="R",on="B";function jl(e){const t=e.length,n=[],i=new Array(t).fill(-1);for(let a=0;a<t;a++){let l=0,s=n.length;for(;l<s;){const c=l+s>>1;e[n[c]]<e[a]?l=c+1:s=c}l>0&&(i[a]=n[l-1]),l===n.length?n.push(a):n[l]=a}const o=[];let r=n.length?n[n.length-1]:-1;for(;r!==-1;)o.push(r),r=i[r];return o.reverse()}function Wl(e){if(e.length===0)return{size:0,witness:[]};let t=0;for(const i of e)i.hi>t&&(t=i.hi);let n=[];for(let i=1;i<t;i++){const o=e.filter(a=>a.lo<=i&&a.hi>i).sort((a,l)=>a.lo-l.lo);if(o.length<=n.length)continue;const r=jl(o.map(a=>a.hi));r.length>n.length&&(n=r.map(a=>o[a]))}return{size:n.length,witness:n}}function _l(e){if(e.length===0)return{size:0,witness:[]};const t=[...e].sort((i,o)=>i.lo-o.lo),n=jl(t.map(i=>-i.hi));return{size:n.length,witness:n.map(i=>t[i])}}function Vl(e){const t=[...e].sort((o,r)=>o.hi-r.hi),n=[];let i=-1/0;for(const o of t)o.lo>i&&(n.push(o),i=o.hi);return{size:n.length,witness:n}}function Dl(e,t){return t==="crossing"?Wl(e):t==="nesting"?_l(e):Vl(e)}function Up(e){const t=[{type:"crossing",result:Wl(e)},{type:"nesting",result:_l(e)},{type:"alignment",result:Vl(e)}];return t.sort((n,i)=>i.result.size-n.result.size),t[0]}function Gi(e){return e.n*2}function Xp(e){return{config:e,edges:[],used:new Array(Gi(e)+1).fill(!1),turn:V}}function zi(e){const t=[];for(let n=1;n<=Gi(e.config);n++)e.used[n]||t.push(n);return t}function Oi(e){if(e.winner)return[];const t=zi(e),n=[];for(let i=0;i<t.length;i++)for(let o=i+1;o<t.length;o++)n.push([t[i],t[o]]);return n}function Yl(e,t){return e.edges.filter(n=>n.color===t)}function Re(e){const t=Yl(e,V);if(e.config.type==="any"){const{type:i,result:o}=Up(t);return{size:o.size,witness:o.witness,type:i}}const n=Dl(t,e.config.type);return{size:n.size,witness:n.witness,type:e.config.type}}function Kp(e){for(let t=1;t<e.length;t++)if(!e[t])return!1;return!0}function In(e,t,n){if(t>n&&([t,n]=[n,t]),e.winner||t===n||t<1||n>Gi(e.config)||e.used[t]||e.used[n])return e;const i=e.turn,o=[...e.edges,{lo:t,hi:n,color:i}],r=e.used.slice();r[t]=!0,r[n]=!0;const a={...e,edges:o,used:r,turn:i===V?on:V};if(e.config.mode==="maker-breaker"&&i===V){const l=Re(a);if(l.size>=e.config.k)return a.winner=V,a.witness=l.witness,a.witnessType=l.type,a}if(Kp(r)){const l=Re(a);a.witness=l.witness,a.witnessType=l.type,e.config.mode==="scoring"&&(a.score=l.size),a.winner=l.size>=e.config.k?V:on}return a}function Jn(e){return!!e.winner}function Zp(e){const t=e.type==="any"?"mutually crossing, nesting, or aligned":`mutually ${e.type}`;return e.mode==="scoring"?`Scoring duel: fill the board — Maker maximises, Breaker minimises the largest set of ${t} red arcs (par ${e.k}).`:`Maker (red) wants ${e.k} arcs that are ${t}.`}const un=1e6,Jp=10;function Qp(e){return e.config.type==="any"?Re(e).type:e.config.type}function wa(e){return e.config.mode==="scoring"?e.winner?Re(e).size*1e3:Re(e).size*100:e.winner===V?un:e.winner===on?-un:Re(e).size*100}function Ul(e){const t=Re(e).size,n=Yl(e,V),i=zi(e),o=Qp(e);let r=0,a=t;for(let l=0;l<i.length;l++)for(let s=l+1;s<i.length;s++){const c=Dl([...n,{lo:i[l],hi:i[s],color:V}],o).size;c>t&&r++,c>a&&(a=c)}return{base:t,threats:r,bestExtended:a}}function eh(e){if(e.config.mode!=="scoring"){if(e.winner===V)return un;if(e.winner===on)return-un}else if(e.winner)return Re(e).size*1e3;const{base:t,threats:n,bestExtended:i}=Ul(e);return t*1e3+i*50+n}function Lr(e){if(e.config.mode==="scoring"){if(e.winner)return Re(e).size*1e3}else{if(e.winner===V)return un;if(e.winner===on)return-un}const{base:t,threats:n,bestExtended:i}=Ul(e);return t*1e3+i*50+n-(e.config.k-t)*10}function To(e,t,n){const i=Oi(e),o=e.turn===V;let r=i[0],a=o?-1/0:1/0;for(const[l,s]of i){const c=t(In(e,l,s))+(n()-.5)*.001;(o?c>a:c<a)&&(a=c,r=[l,s])}return r}function th(e){const t=Gi(e.config),n=r=>e.edges.map(a=>{const l=r?t+1-a.hi:a.lo,s=r?t+1-a.lo:a.hi;return`${a.color}${l},${s}`}).sort().join("|"),i=n(!1),o=n(!0);return(i<o?i:o)+"#"+e.turn}function Eo(e,t,n,i,o,r){if(e.winner||t===0||r.nodes<=0)return e.winner?wa(e):Lr(e);r.nodes--;const a=th(e)+"@"+t,l=o.get(a);if(l!==void 0)return l;const s=Oi(e);if(s.length===0)return wa(e);let c,d=!1;if(e.turn===V){c=-1/0;for(const[u,p]of s)if(c=Math.max(c,Eo(In(e,u,p),t-1,n,i,o,r)),n=Math.max(n,c),n>=i){d=!0;break}}else{c=1/0;for(const[u,p]of s)if(c=Math.min(c,Eo(In(e,u,p),t-1,n,i,o,r)),i=Math.min(i,c),n>=i){d=!0;break}}return d||o.set(a,c),c}function nh(e){return Math.floor(zi(e).length/2)}function ih(e,t){if(zi(e).length>Jp)return To(e,Lr,t);const i=Oi(e),o=nh(e),r=e.turn===V,a=new Map,l={nodes:2e6};let s=i[0],c=r?-1/0:1/0;for(const[d,u]of i){const p=Eo(In(e,d,u),o-1,-1/0,1/0,a,l)+(t()-.5)*.001;if((r?p>c:p<c)&&(c=p,s=[d,u]),l.nodes<=0)break}return s}function Xl(e,t,n){switch(t){case 1:return To(e,eh,n);case 2:return To(e,Lr,n);case 3:return ih(e,n);default:{const i=Oi(e);return i[Math.floor(n()*i.length)]}}}const oh=`
  <section class="card">
    <h2>Settings</h2>
    <div class="controls">
      <div class="field">
        <label for="nRange">Points <span class="hint-num" id="nLabel">14</span></label>
        <input type="range" id="nRange" min="3" max="12" value="7" />
      </div>
      <div class="field">
        <label for="kRange">Target k <span class="hint-num" id="kLabel">3</span> <span class="muted small" id="kCap"></span></label>
        <input type="range" id="kRange" min="2" max="6" value="3" />
      </div>
      <div class="field">
        <label for="typeSel">Pattern</label>
        <select id="typeSel">
          <option value="crossing" selected>Crossing — the competitive game</option>
          <option value="nesting">Nesting</option>
          <option value="alignment">Alignment</option>
          <option value="any">Any homogeneous</option>
        </select>
      </div>
      <div class="field">
        <label for="roleSel">You play</label>
        <select id="roleSel">
          <option value="R" selected>Maker (red)</option>
          <option value="B">Breaker (blue)</option>
          <option value="both">Hotseat (both)</option>
          <option value="none">Watch AI vs AI</option>
        </select>
      </div>
      <div class="field" id="aiRField">
        <label for="aiR">Red AI</label>
        <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Potential</option><option value="3">Solver</option></select>
      </div>
      <div class="field" id="aiBField">
        <label for="aiB">Blue AI</label>
        <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Potential</option><option value="3">Solver</option></select>
      </div>
      <div class="field">
        <label for="modeSel">Mode</label>
        <select id="modeSel">
          <option value="maker-breaker" selected>Maker–Breaker</option>
          <option value="scoring">Scoring duel</option>
        </select>
      </div>
    </div>
    <div class="buttons">
      <button id="newBtn" class="btn btn-primary">New game</button>
      <button id="hintBtn" class="btn">Hint</button>
      <button id="undoBtn" class="btn">Undo</button>
      <button id="runBtn" class="btn" hidden>Run</button>
    </div>
  </section>
`,rh=`
  <section class="card board-card">
    <div class="status" id="status">
      <span class="turn-pill" id="turnPill">Red to move</span>
      <span class="goal" id="goalText"></span>
    </div>
    <div class="board-wrap">
      <svg id="board" class="board" role="img" aria-label="Arc match board"></svg>
    </div>
    <div class="meterrow">
      <div class="meter" id="meter">
        <div class="meter-label">Largest red structure</div>
        <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
        <div class="meter-value" id="meterValue">0 / 3</div>
      </div>
    </div>
    <div class="banner" id="banner" hidden></div>
  </section>
`,ah=`
  <section class="card explainer" id="howto">
    <h2>How to play</h2>
    <ol class="howto-list">
      <li><b>Click two dots</b> to draw an arc between them in your colour.</li>
      <li>You are <b class="red-text">Maker (red)</b> by default — try to build
        <b id="howtoK">3</b> red arcs that <b id="howtoType">all cross each other</b>.</li>
      <li><b class="blue-text">Breaker (blue)</b> draws arcs too, using up dots so you can't.</li>
      <li>Each dot is used once. Maker always moves first.</li>
      <li><b>Maker–Breaker</b> (default): a race — Maker wins the instant the target is reached, otherwise Breaker wins when the board fills.</li>
      <li><b>Scoring duel</b>: no early win — the board is <i>always</i> played to the end. Maker maximises, Breaker minimises the largest red set; the final size is the score (compared to par <b>k</b>).</li>
    </ol>
  </section>

  <section class="card explainer" id="legend">
    <h2>The three patterns</h2>
    <p class="muted">Any two arcs relate as exactly one of these. This game is about forcing a family
      of <b>crossings</b>; nesting and alignment are shown for contrast.</p>
    <div class="legend-grid">
      <figure class="legend-item">
        <svg viewBox="0 0 80 34" class="mini" aria-hidden="true"><g class="mini-pts"><circle cx="10" cy="28" r="2.4"/><circle cx="30" cy="28" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="70" cy="28" r="2.4"/></g><path d="M10 28 C 22 4, 38 4, 50 28" class="mini-r"/><path d="M30 28 C 42 4, 58 4, 70 28" class="mini-b"/></svg>
        <figcaption><b>Crossing</b><span>arcs interleave</span></figcaption>
      </figure>
      <figure class="legend-item">
        <svg viewBox="0 0 80 34" class="mini" aria-hidden="true"><g class="mini-pts"><circle cx="10" cy="28" r="2.4"/><circle cx="30" cy="28" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="70" cy="28" r="2.4"/></g><path d="M10 28 C 28 0, 52 0, 70 28" class="mini-r"/><path d="M30 28 C 38 10, 42 10, 50 28" class="mini-b"/></svg>
        <figcaption><b>Nesting</b><span>one inside the other</span></figcaption>
      </figure>
      <figure class="legend-item">
        <svg viewBox="0 0 80 34" class="mini" aria-hidden="true"><g class="mini-pts"><circle cx="10" cy="28" r="2.4"/><circle cx="30" cy="28" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="70" cy="28" r="2.4"/></g><path d="M10 28 C 16 12, 24 12, 30 28" class="mini-r"/><path d="M50 28 C 56 12, 64 12, 70 28" class="mini-b"/></svg>
        <figcaption><b>Alignment</b><span>side by side</span></figcaption>
      </figure>
    </div>
  </section>

  <section class="card explainer" id="maths">
    <h2>The maths behind it</h2>
    <p><b>Unavoidable patterns.</b> Any two arcs relate as exactly one of <i>crossing</i>,
      <i>nesting</i>, or <i>alignment</i>; a sub-matching is <i>homogeneous</i> if every pair shares one
      type. Every ordered matching of size <i>n</i> contains a homogeneous sub-matching of size at least
      <i>n<sup>1/3</sup></i> (an Erdős–Szekeres-type theorem of Dudek, Grytczuk &amp; Ruciński). So
      <i>some</i> structure is unavoidable — but that is about the <b>whole</b> matching (both colours
      mixed), so it only motivates the game; it gives no direct bound on what <b>Maker</b> can force
      with her own arcs.</p>
    <p><b>Maker–Breaker, almost.</b> Compared with Beck's positional games (<i>Tic-Tac-Toe Theory</i>),
      the winning sets are the <i>k</i>-crossings of one type, and there are
      <i>C(2n, 2k)</i> of them — any <i>2k</i> endpoints determine exactly one canonical
      <i>k</i>-crossing. The Erdős–Selfridge criterion would then suggest Breaker wins when
      <i>C(2n,2k)·2<sup>−k</sup> &lt; ½</i>.</p>
    <p><b>But the arcs aren't independent.</b> Drawing arc <i>(i,j)</i> <i>uses up</i> endpoints
      <i>i, j</i>, so Breaker can kill a red target <b>without taking any of its arcs</b> — just by
      grabbing an arc that shares an endpoint. The independent-cell model (and hence Erdős–Selfridge)
      does <b>not</b> apply directly; the “Potential” AI uses it only as a <b>threat heuristic</b>, not
      a verdict. “Solver” instead searches the game tree exactly on small boards.</p>
    <p><b>The threshold <i>k*(n)</i>.</b> The largest <i>k ≥ 2</i> Maker can force under optimal play.
      Maker draws only <b>⌈n/2⌉</b> arcs, so <i>k*(n) ≤ ⌈n/2⌉</i>; its general growth is an
      <b>open problem</b> (the <i>n<sup>1/3</sup></i> curve is only a reference). Exact minimax for
      crossing gives <i>k* = 0, 2, 2, 2, 3, 3</i> at <i>n = 3…8</i> — above <i>n<sup>1/3</sup></i> yet
      below the ⌈n/2⌉ ceiling (at <i>n=3</i> a 2-crossing exists but can't be forced).</p>
    <p class="muted small">References: Dudek, Grytczuk &amp; Ruciński, <i>Ordered unavoidable
      sub-structures in matchings and random matchings</i>, EJC 31(2) (2024),
      <a href="https://arxiv.org/abs/2210.14042" target="_blank" rel="noopener">arXiv:2210.14042</a>;
      <i>Erdős–Szekeres type theorems for ordered uniform matchings</i>, JCTB 170 (2025),
      <a href="https://arxiv.org/abs/2301.02936" target="_blank" rel="noopener">arXiv:2301.02936</a>;
      Beck, <i>Tic-Tac-Toe Theory</i> (2008).</p>
  </section>
`,B=e=>document.getElementById(e);let R,Mt=[],ee=null,J=null,Ct=null,ya=0,Sr=_(1),lh=1,Pn,et=!1;const sh=430,yn=40,Co=26,ch=14,dh=24,Kl=.55,no=7,uh=yn/2-1;function fh(e){const t=e*2,n=(t-1)*yn*Kl,i=ch+n,o=Co*2+(t-1)*yn,r=i+dh;return{P:t,baselineY:i,width:o,height:r,x:l=>Co+(l-1)*yn}}function $a(e){try{const t=B("board");if(typeof t.getScreenCTM!="function")return null;const n=t.getScreenCTM();if(!n)return null;const i=new DOMPoint(e.clientX,e.clientY).matrixTransform(n.inverse()),o=R.config.n*2;return Math.max(1,Math.min(o,Math.round((i.x-Co)/yn)+1))}catch{return null}}function ph(e){const t=+B("nRange").value;let n=+B("kRange").value;return n=Math.max(2,Math.min(n,Math.ceil(t/2))),{n:t,k:n,type:B("typeSel").value,mode:B("modeSel").value,humanRole:B("roleSel").value,aiLevel:{R:+B("aiR").value,B:+B("aiB").value},seed:e}}function Mr(e){const t=R.config.humanRole;return t==="both"?!0:t==="none"?!1:t===e}const ji=()=>!Jn(R)&&Mr(R.turn),Zl=()=>!Jn(R)&&!Mr(R.turn);function Jt(){window.clearTimeout(Pn);const e=lh++;Sr=_(2654435761^e*2654435761),R=Xp(ph(e)),Mt=[],ee=null,J=null,Ct=null,et=R.config.humanRole==="none"?et:!1,xe(),Tr()}function Jl(e,t){if(Jn(R))return;const n=In(R,e,t);n!==R&&(Mt.push(R),R=n,ee=null,J=null,Ct=null,xe(),Tr())}function Tr(){window.clearTimeout(Pn),Zl()&&(R.config.humanRole==="none"&&!et||(Pn=window.setTimeout(hh,sh)))}function hh(){if(!Zl()||R.config.humanRole==="none"&&!et)return;const[e,t]=Xl(R,R.config.aiLevel[R.turn],Sr);Jl(e,t)}function gh(e){if(!(!ji()||R.used[e])){if(ee===null){ee=e,xe();return}if(ee===e){ee=null,xe();return}Jl(ee,e)}}function mh(){ji()&&(Ct=Xl(R,2,Sr),xe())}function bh(){if(!Mt.length)return;R=Mt.pop();const e=R.config.humanRole;if(e==="R"||e==="B")for(;Mt.length&&!Mr(R.turn)&&!Jn(R);)R=Mt.pop();ee=null,J=null,Ct=null,et=!1,xe()}function io(e,t,n){const o=Math.abs(t-e)*Kl;return`M ${e} ${n} C ${e} ${n-o}, ${t} ${n-o}, ${t} ${n}`}function xe(){const e=R.config,t=fh(e.n),n=Re(R),i=new Set((R.witness??[]).map(f=>`${f.lo}-${f.hi}`)),o=Jn(R),r=[],a=R.turn===V?"r":"b",l=new Map;for(const f of R.edges)l.set(f.lo,f.color),l.set(f.hi,f.color);Ct&&!o&&r.push(`<path d="${io(t.x(Ct[0]),t.x(Ct[1]),t.baselineY)}" class="arc arc-hint" />`);const s=R.edges.length>ya;R.edges.forEach((f,v)=>{const $=["arc",f.color===V?"arc-r":"arc-b"];s&&v===R.edges.length-1&&$.push("arc-new");const z=`${f.lo}-${f.hi}`;o&&i.size&&$.push(i.has(z)?"arc-win":"arc-dim"),r.push(`<path d="${io(t.x(f.lo),t.x(f.hi),t.baselineY)}" class="${$.join(" ")}" />`)}),!o&&ee!==null&&J!==null&&J!==ee&&!R.used[J]&&r.push(`<path d="${io(t.x(ee),t.x(J),t.baselineY)}" class="arc arc-preview arc-${a}" />`);for(let f=1;f<=t.P;f++){const v=t.x(f),$=R.used[f],z=["pt"];if($){z.push("used");const D=l.get(f);D&&z.push(D===V?"r":"b")}ee===f&&z.push("sel",`sel-${a}`);const C=[];ee===f?C.push(`<circle cx="${v}" cy="${t.baselineY}" r="${no+4}" class="pt-ring on ${a}" />`):!o&&J===f&&!$&&C.push(`<circle cx="${v}" cy="${t.baselineY}" r="${no+3}" class="pt-ring on hover ${a}" />`),C.push(`<circle cx="${v}" cy="${t.baselineY}" r="${no}" class="${z.join(" ")}" />`),C.push(`<text x="${v}" y="${t.baselineY+18}" class="pt-label">${f}</text>`),C.push(`<circle cx="${v}" cy="${t.baselineY}" r="${uh}" class="pt-hit" data-p="${f}" />`),r.push(`<g class="pt-group${$?" used":""}">${C.join("")}</g>`)}B("board").setAttribute("viewBox",`0 0 ${t.width} ${t.height}`),B("board").innerHTML=r.join(""),ya=R.edges.length;const c=B("turnPill");if(o){const f=R.winner===V?"Red":"Blue";c.textContent=`${f} wins`,c.className="turn-pill done"}else{const f=R.turn===V?"Red to move":"Blue to move";c.textContent=e.mode==="scoring"?`${f} · play to fill the board`:f,c.className=`turn-pill ${R.turn===V?"":"blue"}`.trim()}B("goalText").textContent=Zp(e);const d=B("meter").querySelector(".meter-label");e.mode==="scoring"?(B("meterFill").style.width=`${Math.min(n.size/e.k,1)*100}%`,B("meterValue").textContent=`${n.size}  ·  par ${e.k}`,d.textContent=`Red score — largest ${e.type}`):(B("meterFill").style.width=`${Math.min(n.size/e.k,1)*100}%`,B("meterValue").textContent=`${n.size} / ${e.k}`,d.textContent=`Largest red ${e.type}`);const u=B("banner");if(o)if(u.hidden=!1,e.mode==="scoring"){const f=R.score??n.size;R.winner===V?(u.className="banner red",u.textContent=`Final score: largest red ${e.type} = ${f} — Maker beats par (${e.k}). 🎉`):(u.className="banner blue",u.textContent=`Final score: largest red ${e.type} = ${f} — Breaker held Maker below par (${e.k}).`)}else R.winner===V?(u.className="banner red",u.textContent=`Maker wins — ${n.size} red arcs ${e.type}! 🎉`):(u.className="banner blue",u.textContent=`Breaker wins — Maker stuck at ${n.size}/${e.k}.`);else u.hidden=!0;B("hintBtn").disabled=!ji(),B("undoBtn").disabled=Mt.length===0;const p=B("runBtn");e.humanRole==="none"?(p.hidden=!1,p.textContent=et?"Pause":"Run",p.disabled=o):p.hidden=!0}function ri(){const e=+B("nRange").value,t=B("kRange"),n=Math.ceil(e/2);t.max=String(n),+t.value>n&&(t.value=String(n)),B("nLabel").textContent=String(e*2),B("kLabel").textContent=t.value,B("kCap").textContent=`(max ${n})`,B("howtoK").textContent=t.value;const i={crossing:"all cross each other",nesting:"are all nested",alignment:"are all aligned (side by side)",any:"are all the same type"},o=B("typeSel").value;B("howtoType").textContent=i[o]??"all cross each other"}function ka(){const e=B("roleSel").value,t=e==="B"||e==="none",n=e==="R"||e==="none";B("aiRField").style.display=t?"":"none",B("aiBField").style.display=n?"":"none"}function vh(e){e.settings.innerHTML=oh,e.board.innerHTML=rh,e.sidebar.innerHTML=ah,B("board").addEventListener("click",t=>{let n=$a(t);if(n===null){const i=t.target.closest("[data-p]");n=i?+i.getAttribute("data-p"):null}n!==null&&gh(n)}),B("board").addEventListener("mousemove",t=>{if(!ji()){J!==null&&(J=null,xe());return}const n=$a(t),i=n!==null&&!R.used[n]?n:null;i!==J&&(J=i,xe())}),B("board").addEventListener("mouseleave",()=>{J!==null&&(J=null,xe())});for(const t of["nRange","kRange"])B(t).addEventListener("input",ri),B(t).addEventListener("change",()=>{ri(),Jt()});for(const t of["modeSel","typeSel"])B(t).addEventListener("change",()=>{ri(),Jt()});B("roleSel").addEventListener("change",()=>{ka(),Jt()});for(const t of["aiR","aiB"])B(t).addEventListener("change",Jt);return B("newBtn").addEventListener("click",Jt),B("hintBtn").addEventListener("click",mh),B("undoBtn").addEventListener("click",bh),B("runBtn").addEventListener("click",()=>{et=!et,xe(),Tr()}),ri(),ka(),Jt(),{destroy(){window.clearTimeout(Pn),Pn=void 0}}}const wh={id:"arc-match",title:"Arc Match",tagline:"Force crossing arcs on an ordered matching",blurb:"Draw arcs between points on a line and force a family of mutually-crossing arcs — a Maker–Breaker / Erdős–Szekeres game on ordered matchings.",topic:"Ordered matchings",family:"Ordered matchings",mechanic:"Maker–Breaker",tags:["chord diagrams","Erdős–Szekeres"],icon:`<svg viewBox="0 0 48 28" width="48" height="28">
            <path d="M4 24 C 10 2, 26 2, 32 24" fill="none" stroke="var(--red)" stroke-width="3" stroke-linecap="round"/>
            <path d="M16 24 C 24 4, 40 4, 44 24" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>
          </svg>`,mount:vh},Ql=[Ws,dc,jc,md,Kd,Su,Xu,vf,Qf,pp,Yp,wh],Ao=`<svg viewBox="0 0 40 28" width="40" height="28" aria-hidden="true">
  <circle cx="9" cy="14" r="4" fill="var(--red)"/><circle cx="20" cy="8" r="4" fill="var(--violet)"/>
  <circle cx="31" cy="14" r="4" fill="var(--blue)"/><circle cx="20" cy="20" r="4" fill="var(--blue)"/></svg>`,xa=["Repetitions & Thue","Twins & shuffle squares","Van der Waerden","Ramsey","Packing","Ordered matchings"],yh={"Repetitions & Thue":"thue","Twins & shuffle squares":"twins","Van der Waerden":"vdw",Ramsey:"ramsey",Packing:"packing","Ordered matchings":"matchings"};let li=null;function es(){if(li){try{li.destroy()}catch{}li=null}}function $h(e){return Ql.find(t=>t.id===e)}const si="/gk-arena/";function kh(){let e=location.pathname;return e===si.slice(0,-1)?"":(e.startsWith(si)&&(e=e.slice(si.length)),e.replace(/^\/+|\/+$/g,"").trim())}function ts(e){const t=si+e;location.pathname!==t&&history.pushState({},"",t),Io()}function xh(e){es(),document.title="GK Arena",document.body.classList.remove("explain-on");const t=i=>`
    <button class="game-card" data-id="${i.id}">
      <span class="gc-head">
        <span class="gc-icon" aria-hidden="true">${i.icon??Ao}</span>
        <span><h3>${i.title}</h3><p class="gc-tagline">${i.tagline}</p></span>
      </span>
      <p class="gc-blurb">${i.blurb}</p>
      <span class="gc-tags">
        <span class="gc-tag fam fam-${yh[i.family]}">${i.family}</span>
        <span class="gc-tag mech">${i.mechanic}</span>
        ${(i.tags??[]).map(o=>`<span class="gc-tag">${o}</span>`).join("")}
      </span>
    </button>`,n=Ql.map((i,o)=>({g:i,i:o})).sort((i,o)=>xa.indexOf(i.g.family)-xa.indexOf(o.g.family)||i.i-o.i).map(i=>i.g);e.innerHTML=`
    <header class="topbar">
      <div class="brand">
        <span class="logo" aria-hidden="true">${Ao}</span>
        <div><h1>GK Games</h1><p class="tagline">A combinatorial-game arena · pick a game</p></div>
      </div>
    </header>
    <main class="picker-grid">${n.map(t).join("")}</main>
    <footer class="foot">
      <span>GK Games · combinatorial games on words &amp; coloured structures</span>
      <span class="muted small">TypeScript · Vite</span>
    </footer>`,e.querySelectorAll(".game-card").forEach(i=>{i.addEventListener("click",()=>ts(i.dataset.id??""))})}function Rh(e,t){es(),document.title=`${t.title} | GK Arena`,document.body.classList.add("explain-on"),e.innerHTML=`
    <header class="topbar">
      <div class="topbar-left">
        <button id="hub-back" class="btn hub-back">← Games</button>
        <div class="brand">
          <span class="logo" aria-hidden="true">${t.icon??Ao}</span>
          <div><h1>${t.title}</h1><p class="tagline">${t.tagline}</p></div>
        </div>
      </div>
    </header>
    <main class="arena2 game-${t.id}">
      <div id="hub-settings"></div>
      <section id="hub-board"></section>
      <div id="hub-sidebar"></div>
    </main>
    <footer class="foot">
      <span>${t.title} · ${t.topic}</span>
      <span class="muted small">part of GK Games</span>
    </footer>`;const n=e.querySelector("#hub-settings"),i=e.querySelector("#hub-board"),o=e.querySelector("#hub-sidebar");li=t.mount({settings:n,board:i,sidebar:o}),e.querySelectorAll("#hub-settings .card, #hub-sidebar .card").forEach(r=>{const a=r.querySelector(":scope > h2");if(!a)return;r.classList.add("collapsible"),a.setAttribute("role","button"),a.setAttribute("tabindex","0"),a.setAttribute("aria-expanded","true");const l=()=>{const s=r.classList.toggle("collapsed");a.setAttribute("aria-expanded",String(!s))};a.addEventListener("click",l),a.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),l())})}),e.querySelector("#hub-back").addEventListener("click",()=>ts(""))}function Bh(){const e=document.scrollingElement??document.documentElement;e&&(e.scrollTop=0)}function Io(){const e=document.getElementById("app");if(!e)return;const t=$h(kh());t?Rh(e,t):xh(e),Bh()}function Lh(){window.addEventListener("popstate",Io),Io()}Lh();

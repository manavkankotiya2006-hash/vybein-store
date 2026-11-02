import{i as e,n as t}from"./products.C8vFeATp.js";import{a as n,c as r,d as i,i as a,l as o,n as s,o as c,s as l,u}from"./site.DVvFCXqS.js";var d=JSON.parse(document.getElementById(`bag-thumbs`)?.textContent||`{}`),f=document.querySelector(`[data-lines]`),p=document.querySelector(`[data-summary]`),m=document.querySelector(`[data-line-count]`),h=document.querySelector(`[data-checkout]`),g=document.querySelector(`[data-form-error]`),_=e=>e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),v=(e,t)=>`${e} ${t}${e===1?``:`s`}`;function y(){let t=u(c()),{offer:n,itemQuantity:r,itemSubtotal:a,total:l,savings:g}=i(t);if(m&&(m.textContent=v(r,`item`)),h.hidden=!t.length,!t.length){f.innerHTML=`<div class="empty"><span class="empty-mark">V</span><h3>Your bag awaits.</h3><p>Find the extrait that feels like you.</p><a class="btn btn-ink" href="/shop">Discover the collection</a></div>`,p.innerHTML=`<p class="row"><span>Subtotal</span><strong>${o(0)}</strong></p>`;return}f.innerHTML=t.map(({id:t,quantity:r,product:i})=>{let a=n.freeByProduct.get(t)||0,s=r-a,c=_(i.code);return`
        <article class="line" data-reveal>
          <a class="line-image arch" href="${e(i)}"><img src="${d[t]||``}" alt="" width="240" height="240" loading="lazy" /></a>
          <div class="line-copy">
            <h3><a href="${e(i)}">${c}</a></h3>
            <p>Inspired by ${_(i.inspiredBy)} · ${_(i.volume)}</p>
            <div class="line-controls">
              <div class="stepper" role="group" aria-label="Quantity of ${c}">
                <button type="button" data-step="-1" data-id="${t}" aria-label="One fewer ${c}" ${r<=1?`disabled`:``}>−</button>
                <span>${r}</span>
                <button type="button" data-step="1" data-id="${t}" aria-label="One more ${c}">+</button>
              </div>
              <button class="remove" type="button" data-remove="${t}">Remove</button>
            </div>
          </div>
          <div class="line-price">
            ${s?`<span class="price">${o(s*i.price)}</span>`:``}
            ${a?`<span class="gift">${a} × Diwali gift</span>`:``}
          </div>
        </article>`}).join(``),s(f);let y=n.active?n.freeQuantity?`<p class="row gift-row"><span>Diwali gift · ${v(n.freeQuantity,`bottle`)}</span><strong>−${o(n.discountAmount)}</strong></p>`:`<p class="hint">Add ${v(n.itemsToNextFree,`more extrait`)} and the next one is our Diwali gift.</p>`:``;p.innerHTML=`
      <p class="row"><span>Items (${r})</span><strong>${o(a)}</strong></p>
      ${y}
      <p class="row muted"><span>You save</span><strong>${o(g)}</strong></p>
      <p class="row muted"><span>Delivery</span><strong>Confirmed on WhatsApp</strong></p>
      <p class="row total"><span>Total</span><strong>${o(l)}</strong></p>`}f.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-step]`);if(n){let e=c().find(e=>e.id===n.dataset.id);e&&r(e.id,e.quantity+Number(n.dataset.step));return}let i=t.closest(`[data-remove]`);i&&l(i.dataset.remove)});var b=h.elements.namedItem(`phone`),x=h.elements.namedItem(`pincode`),S=e=>{let t=e.replace(/\D/g,``);return t.length>10&&t.startsWith(`91`)&&(t=t.slice(2)),t.length>10&&t.startsWith(`0`)&&(t=t.slice(1)),t.slice(0,10)};b.addEventListener(`input`,()=>{b.value=S(b.value)}),x.addEventListener(`input`,()=>{x.value=x.value.replace(/\D/g,``).slice(0,6)}),h.addEventListener(`submit`,e=>{e.preventDefault();let n=new FormData(h),r=e=>String(n.get(e)||``).trim(),s=[[!r(`name`),`name`,`Please add your name.`],[S(r(`phone`)).length!==10,`phone`,`Please enter a 10-digit mobile number.`],[!r(`address`),`address`,`Please add your delivery address.`],[!/^\d{6}$/.test(r(`pincode`)),`pincode`,`Please enter your 6-digit PIN code.`]].find(([e])=>e);if(s){g.textContent=s[2],h.elements.namedItem(s[1]).focus();return}g.textContent=``;let l=u(c());if(!l.length)return a(`Your bag is empty.`);let{offer:d,total:f}=i(l),p=l.map(({id:e,quantity:t,product:n})=>{let r=d.freeByProduct.get(e)||0,i=t-r,a=r?` (${i?`${i} paid, `:``}${r} FREE)`:``;return`• ${n.code} × ${t}${a} — ${i?o(i*n.price):`FREE · Diwali offer`}`}).join(`
`),m=d.itemsToNextFree===1?``:`s`,_=d.active?d.freeQuantity?[`Diwali offer applied: Buy ${d.buyQuantity}, get 1 FREE.`,`Free perfume(s): ${d.freeItems.map(e=>`${e.product.code} × ${e.quantity}`).join(`, `)}.`,`Diwali discount: −${o(d.discountAmount)}.`]:[`Diwali offer: Buy ${d.buyQuantity}, get 1 free. Add ${d.itemsToNextFree} more perfume${m} to unlock it.`]:[],v=[`Hi VYBEIN, I’d like to place this order:`,``,p,``,..._,..._.length?[``]:[],`Order total: ${o(f)}`,``,`Name: ${r(`name`)}`,`Phone: ${S(r(`phone`))}`,`Delivery address: ${r(`address`)}`,`PIN code: ${r(`pincode`)}`,``,`Please confirm delivery details and share your UPI QR code for payment.`].join(`
`),y=`https://wa.me/${t.whatsappNumber}?text=${encodeURIComponent(v)}`,b=window.open(y,`_blank`);b?b.opener=null:window.location.assign(y)}),window.addEventListener(n,y),window.addEventListener(`pageshow`,e=>{e.persisted&&y()}),y();
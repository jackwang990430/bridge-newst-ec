// ====== 設定（あなたのGoogleフォームに差し替え） ======
const FORM_ACTION = "https://docs.google.com/forms/d/e/REPLACE_WITH_YOUR_FORM_ID/formResponse"; // ←差し替え
const FORM_FIELDS = {
  name: "entry.123456",     // お名前
  email: "entry.234567",    // メール
  address: "entry.345678",  // 住所
  phone: "entry.456789",    // 電話
  note: "entry.567890",     // 備考
  orderJson: "entry.678901" // 注文データ(JSON)
};
// ===============================================

// 商品データ取得
async function loadProducts(){
  const res = await fetch('products.json');
  if(!res.ok) throw new Error('products.json が読み込めません');
  return res.json();
}

const fmtJPY = n => new Intl.NumberFormat('ja-JP', { style:'currency', currency:'JPY' }).format(n);

// カート（localStorage）
const CART_KEY = 'mvp-cart-v1';
const Cart = {
  load(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } },
  save(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); },
  add(item){ const items = Cart.load(); items.push(item); Cart.save(items); renderCart(); },
  remove(idx){ const items = Cart.load(); items.splice(idx,1); Cart.save(items); renderCart(); },
  clear(){ Cart.save([]); renderCart(); },
  subtotal(){ return Cart.load().reduce((s,i)=> s + i.price * i.qty, 0); }
};

// 商品一覧
async function renderProducts(){
  const list = document.getElementById('product-list');
  const products = await loadProducts();
  list.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}" loading="lazy"/>
      <div class="body">
        <div class="title">${p.title}</div>
        <div class="muted">${fmtJPY(p.price)}</div>
        <div class="row">
          ${p.sizes?.length ? `<select class="size">
            ${p.sizes.map(s=>`<option value="${'${s}'}">${'${s}'}</option>`).join('')}
          </select>` : ''}
          <input class="qty" type="number" min="1" value="1" style="width:72px" />
        </div>
        <div class="row">
          <button class="add">カートに入れる</button>
        </div>
      </div>
    `;
    const sizeEl = card.querySelector('.size');
    const qtyEl = card.querySelector('.qty');
    card.querySelector('.add').addEventListener('click', ()=>{
      const item = {
        id: p.id,
        title: p.title,
        price: p.price,
        size: sizeEl ? sizeEl.value : null,
        qty: Math.max(1, parseInt(qtyEl.value||'1',10)),
      };
      Cart.add(item);
    });
    list.appendChild(card);
  });
}

// カート描画
function renderCart(){
  const wrap = document.getElementById('cart');
  const items = Cart.load();
  wrap.innerHTML = '';
  if(items.length===0){
    wrap.innerHTML = '<p class="muted">カートは空です</p>';
  } else {
    items.forEach((it, idx)=>{
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <div><strong>${'${it.title}'}</strong>${'${it.size?` / ${it.size}`:''}'} </div>
          <div class="muted">${'${fmtJPY(it.price)}'} × ${'${it.qty}'}</div>
        </div>
        <div><button data-idx="${'${idx}'}" class="rm">削除</button></div>
      `;
      row.querySelector('.rm').addEventListener('click', (e)=>{
        const i = parseInt(e.target.getAttribute('data-idx'),10);
        Cart.remove(i);
      });
      wrap.appendChild(row);
    });
  }
  document.getElementById('subtotal').textContent = fmtJPY(Cart.subtotal());
}

// Googleフォームへ
function toGoogleForm(){
  const items = Cart.load();
  if(items.length===0){ alert('カートが空です'); return; }
  const order = {
    items,
    subtotal: Cart.subtotal(),
    currency: 'JPY',
    createdAt: new Date().toISOString()
  };
  const params = new URLSearchParams();
  params.set(FORM_FIELDS.orderJson, JSON.stringify(order));
  const url = `${FORM_ACTION}?${params.toString()}&submit=Submit`;
  window.open(url, '_blank');
}

// 初期化
renderProducts().then(renderCart);

// イベント
addEventListener('click', (e)=>{
  if(e.target && e.target.id==='checkout-btn') toGoogleForm();
});

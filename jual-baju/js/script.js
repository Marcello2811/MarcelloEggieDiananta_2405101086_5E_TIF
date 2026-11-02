const $ = s => document.querySelector(s);
const VER = 2;
const SZ = ['S', 'M', 'L', 'XL'];
const KAT = ['Kaos', 'Kemeja', 'Batik', 'Jaket', 'Sweater', 'Celana', 'Rok', 'Dress'];
const EMO = { Kaos: '👕', Kemeja: '👔', Batik: '👘', Jaket: '🧥', Sweater: '🧶', Celana: '👖', Rok: '👗', Dress: '👗' };
const ST = ['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Diproses', 'Selesai', 'Ditolak', 'Dibatalkan'];
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
const today = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const show = h => { $('#app').innerHTML = h; };
const badge = s => `<span class="tag s${ST.indexOf(s)}">${s}</span>`;
const F = { q: '', kat: '', st: '', sort: 'baru' };
const R = {};

function seed() {
  const P = [
    ['Kaos Polos Katun', 'Kaos', 65000, '#9DB4CE', 'Katun combed yang adem dan lembut, potongan klasik untuk dipakai sehari-hari.'],
    ['Kaos Oversize Grafis', 'Kaos', 89000, '#E8AE2F', 'Potongan longgar dengan sablon grafis awet, nyaman untuk gaya santai.'],
    ['Kemeja Flanel Kotak', 'Kemeja', 145000, '#C9583C', 'Flanel tebal berkotak yang hangat, bisa dipakai tertutup maupun sebagai luaran.'],
    ['Kemeja Linen Putih', 'Kemeja', 159000, '#DDE3EA', 'Linen ringan dan sejuk, tampil rapi untuk kuliah, kerja, atau acara santai.'],
    ['Jaket Denim', 'Jaket', 249000, '#2F4A6B', 'Denim washed dengan kancing logam, padanan mudah untuk berbagai kaos.'],
    ['Hoodie Fleece', 'Sweater', 199000, '#5A6B7B', 'Fleece tebal lembut dengan kantong depan dan tali serut yang kuat.'],
    ['Celana Chino', 'Celana', 175000, '#B89B72', 'Chino stretch yang tidak mudah kusut, cocok untuk gaya formal santai.'],
    ['Celana Jeans Slim', 'Celana', 215000, '#34495E', 'Jeans slim fit dengan bahan sedikit melar agar nyaman dipakai seharian.'],
    ['Kemeja Batik Lengan Panjang', 'Batik', 189000, '#8A5A2B', 'Batik cap motif parang, bahan katun halus untuk acara resmi dan kantor.'],
    ['Kemeja Batik Slim Fit', 'Batik', 175000, '#4B3F72', 'Batik modern berpotongan slim, motif kontemporer yang tetap sopan.'],
    ['Sweater Rajut Crewneck', 'Sweater', 169000, '#A8B5A2', 'Rajut halus berkerah bulat, hangat tetapi tidak gerah dipakai di dalam ruangan.'],
    ['Jaket Bomber Hitam', 'Jaket', 229000, '#2B2F36', 'Bomber ringan dengan kerah rib dan resleting kuat, tampilan kasual yang tegas.'],
    ['Jaket Parka Anti Air', 'Jaket', 279000, '#6B7A4F', 'Parka berbahan water-repellent dengan tudung, andalan saat musim hujan.'],
    ['Celana Jogger Katun', 'Celana', 135000, '#7C8795', 'Jogger katun dengan karet di pergelangan, ringan untuk santai maupun olahraga.'],
    ['Celana Kargo Panjang', 'Celana', 189000, '#8C8062', 'Celana kargo dengan banyak kantong, bahan kuat dan potongan lurus yang rapi.'],
    ['Rok Plisket Midi', 'Rok', 119000, '#C98B9B', 'Rok plisket panjang sebetis dengan pinggang karet, jatuh cantik dan mudah dipadukan.'],
    ['Dress Floral Casual', 'Dress', 205000, '#E2A4A0', 'Dress motif bunga berbahan rayon adem, cocok untuk jalan-jalan dan acara santai.'],
    ['Kaos Polo Pique', 'Kaos', 99000, '#3F6B5A', 'Polo berbahan pique yang menyerap keringat, kerahnya tetap rapi setelah dicuci.']
  ];
  return {
    ver: VER, seq: 100, me: null, orders: [],
    users: [{ id: 1, nama: 'Admin Toko', email: 'admin@toko.com', hp: '081200000000', pass: 'admin123', role: 'admin', aktif: true }],
    products: P.map((p, i) => ({
      id: i + 1, nama: p[0], kat: p[1], harga: p[2], emoji: EMO[p[1]], warna: p[3], desk: p[4],
      stok: { S: 3 + (i % 4) * 2, M: 6 + (i % 3) * 2, L: 6 + (i % 4), XL: 2 + (i % 3) }, aktif: true
    }))
  };
}

function save(d = db) {
  try { localStorage.setItem('db', JSON.stringify(d)); }
  catch (e) { toast('Penyimpanan browser penuh. Gunakan foto yang lebih kecil.'); }
}
let db = JSON.parse(localStorage.getItem('db') || 'null');
if (!db || db.ver !== VER) { // data lama: pengguna dan pesanan dipertahankan, katalog diperbarui
  const n = seed();
  db = db ? { ...db, products: n.products, ver: VER } : n;
  save();
}

const me = () => db.users.find(u => u.id === db.me);
const prod = id => db.products.find(p => p.id == id);
const stokTotal = p => SZ.reduce((s, z) => s + p.stok[z], 0);
function toast(m) { const t = $('#toast'); t.textContent = m; t.className = 'show'; setTimeout(() => t.className = '', 2400); }
function need(role) {
  const u = me();
  if (!u) { location.hash = '#/login'; return null; }
  if (role && u.role !== role) { location.hash = '#/'; return null; }
  return u;
}
function expire() { // pesanan lewat batas bayar dibatalkan otomatis
  db.orders.forEach(o => { if (o.status === ST[0] && Date.now() > o.batas) { prod(o.pid).stok[o.uk] += o.qty; o.status = ST[5]; } });
  save();
}

function nav() {
  const u = me(); let h = '<a href="#/">Beranda</a><a href="#/katalog">Katalog</a>';
  if (!u) h += '<a href="#/login">Masuk</a><a class="btn" href="#/daftar">Daftar</a>';
  else {
    if (u.role === 'admin') h += '<a href="#/admin">Dashboard</a><a href="#/admin/produk">Produk</a><a href="#/admin/transaksi">Transaksi</a><a href="#/admin/laporan">Laporan</a><a href="#/admin/pembayaran">Pembayaran</a><a href="#/admin/user">Pengguna</a>';
    else h += '<a href="#/riwayat">Riwayat</a>';
    h += '<a href="#/profil">Profil</a><a href="#" onclick="return logout()">Keluar</a>';
  }
  $('#menu').innerHTML = h;
}
function go() {
  expire(); nav();
  const p = location.hash.slice(2).split('/');
  const key = p[0] === 'admin' && p[1] ? 'admin/' + p[1] : p[0] || 'home';
  (R[key] || R.home)(p[0] === 'admin' ? p[2] : p[1]);
  window.scrollTo(0, 0);
}
addEventListener('hashchange', go);


function logout() { db.me = null; save(); location.hash = '#/login'; return false; }
R.daftar = () => show(`<div class="panel narrow"><h1>Daftar akun</h1><form onsubmit="return daftar(this)">
  <label>Nama<input name="nama"></label><label>Email<input name="email" type="email"></label>
  <label>Nomor HP<input name="hp" placeholder="08xxxxxxxxxx"></label><label>Kata sandi<input name="pass" type="password"></label>
  <button class="btn">Buat akun</button></form><p>Sudah punya akun? <a href="#/login">Masuk</a></p></div>`);
function daftar(f) {
  if (f.nama.value.trim().length < 3) return toast('Nama minimal 3 karakter'), false;
  if (!/^\S+@\S+\.\S+$/.test(f.email.value)) return toast('Format email tidak valid'), false;
  if (!/^08\d{8,11}$/.test(f.hp.value)) return toast('Nomor HP tidak valid. Contoh: 081234567890'), false;
  if (f.pass.value.length < 6) return toast('Kata sandi minimal 6 karakter'), false;
  if (db.users.some(u => u.email === f.email.value)) return toast('Email sudah terdaftar'), false;
  db.users.push({ id: db.seq++, nama: f.nama.value.trim(), email: f.email.value, hp: f.hp.value, pass: f.pass.value, role: 'pelanggan', aktif: true });
  save(); toast('Akun dibuat. Silakan masuk.'); location.hash = '#/login'; return false;
}
R.login = () => show(`<div class="panel narrow"><h1>Masuk</h1><form onsubmit="return login(this)">
  <label>Email<input name="email" type="email"></label><label>Kata sandi<input name="pass" type="password"></label>
  <button class="btn">Masuk</button></form><p>Belum punya akun? <a href="#/daftar">Daftar</a></p>
  <small>Admin demo: admin@toko.com / admin123</small></div>`);
function login(f) {
  const u = db.users.find(x => x.email === f.email.value && x.pass === f.pass.value);
  if (!u) return toast('Email atau kata sandi salah'), false;
  if (!u.aktif) return toast('Akun dinonaktifkan oleh admin'), false;
  db.me = u.id; save(); location.hash = u.role === 'admin' ? '#/admin' : '#/'; return false;
}
R.profil = () => {
  const u = need(); if (!u) return;
  show(`<h1>Profil</h1><div class="panel narrow"><form onsubmit="return simpanProfil(this)">
  <label>Nama<input name="nama" value="${esc(u.nama)}"></label><label>Email<input value="${esc(u.email)}" disabled></label>
  <label>Nomor HP<input name="hp" value="${esc(u.hp)}"></label><button class="btn">Simpan profil</button></form></div>
  <div class="panel narrow"><h2>Ganti kata sandi</h2><form onsubmit="return gantiPass(this)">
  <label>Kata sandi lama<input name="lama" type="password"></label><label>Kata sandi baru<input name="baru" type="password"></label>
  <button class="btn">Ganti kata sandi</button></form></div>`);
};
function simpanProfil(f) {
  if (f.nama.value.trim().length < 3) return toast('Nama minimal 3 karakter'), false;
  if (!/^08\d{8,11}$/.test(f.hp.value)) return toast('Nomor HP tidak valid'), false;
  const u = me(); u.nama = f.nama.value.trim(); u.hp = f.hp.value; save(); toast('Profil disimpan'); return false;
}
function gantiPass(f) {
  const u = me();
  if (f.lama.value !== u.pass) return toast('Kata sandi lama salah'), false;
  if (f.baru.value.length < 6) return toast('Kata sandi baru minimal 6 karakter'), false;
  u.pass = f.baru.value; save(); f.reset(); toast('Kata sandi diganti'); return false;
}

const EXT = ['jpg', 'jpeg', 'png', 'webp'];
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const kandidat = p => ['img/produk-' + p.id, 'img/' + slug(p.nama)].flatMap(b => EXT.map(e => b + '.' + e));
function nx(i) { // coba nama dan format gambar lain jika yang pertama tidak ada
  const c = i.dataset.c.split('|'), n = +i.dataset.i + 1;
  if (n >= c.length) return i.remove();
  i.dataset.i = n; i.src = c[n];
}
const thumb = (p, big) => {
  const c = kandidat(p);
  const img = p.gambar
    ? `<img src="${esc(p.gambar)}" alt="${esc(p.nama)}" onerror="this.remove()">`
    : `<img src="${c[0]}" data-c="${c.join('|')}" data-i="0" alt="${esc(p.nama)}" onerror="nx(this)">`;
  return `<div class="thumb${big ? ' big' : ''}" style="background:${p.warna}">${img}${p.emoji}</div>`;
};
const card = p => `<a class="card" href="#/produk/${p.id}">${thumb(p)}
  <h3>${esc(p.nama)}</h3><small>${p.kat}</small><b>${rp(p.harga)}</b>${stokTotal(p) ? '' : '<em>Stok habis</em>'}</a>`;
R.home = () => show(`
  <section class="hero">
    <div class="hero-text">
      <span class="eyebrow">Koleksi 2026</span>
      <h1>Baju nyaman, gaya tetap rapi.</h1>
      <p>${db.products.filter(p => p.aktif).length} model pilihan dari kaos, batik, jaket sampai dress. Pilih ukuran, pesan, dan bayar kapan saja.</p>
      <form class="search" onsubmit="F.q=this.q.value;F.kat='';location.hash='#/katalog';return false">
        <input name="q" placeholder="Cari baju, misalnya kemeja"><button class="btn">Cari</button></form>
    </div>
    <div class="hero-art" aria-hidden="true"><span>👕</span><span>🧥</span><span>👗</span><span>👖</span></div>
  </section>
  <section class="fitur">
    <div><b>Ukuran lengkap</b><span>S sampai XL, stok terlihat jelas</span></div>
    <div><b>Bayar mudah</b><span>Transfer bank atau QRIS</span></div>
    <div><b>Pesanan terlacak</b><span>Pantau status sampai nomor resi</span></div>
  </section>
  <h2>Belanja per kategori</h2>
  <div class="kat-grid">${KAT.map(k => `<a class="kat-tile" href="#/katalog" onclick="F.kat='${k}';F.q=''"><span>${EMO[k]}</span><b>${k}</b><small>${db.products.filter(p => p.aktif && p.kat === k).length} produk</small></a>`).join('')}</div>
  <h2>Produk terbaru</h2>
  <div class="grid">${db.products.filter(p => p.aktif).slice(-8).reverse().map(card).join('')}</div>
  <p class="more"><a class="btn" href="#/katalog" onclick="F.kat='';F.q=''">Lihat semua produk</a></p>`);

R.katalog = () => {
  const opt = (v, t) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${t}</option>`;
  show(`<div class="page-head"><h1>Katalog</h1><p id="jml"></p></div>
  <div class="chips">${['', ...KAT].map(k => `<button class="chip ${F.kat === k ? 'on' : ''}" onclick="F.kat='${k}';R.katalog()">${k || 'Semua'}</button>`).join('')}</div>
  <div class="bar"><input placeholder="Cari nama baju" value="${esc(F.q)}" oninput="F.q=this.value;list()">
  <select onchange="F.sort=this.value;list()">${opt('baru', 'Terbaru')}${opt('murah', 'Harga terendah')}${opt('mahal', 'Harga tertinggi')}</select></div>
  <div id="list" class="grid"></div>`);
  list();
};
function list() {
  const r = db.products.filter(p => p.aktif && (!F.kat || p.kat === F.kat) && p.nama.toLowerCase().includes(F.q.toLowerCase()));
  if (F.sort === 'murah') r.sort((a, b) => a.harga - b.harga); else if (F.sort === 'mahal') r.sort((a, b) => b.harga - a.harga); else r.reverse();
  $('#jml').textContent = r.length + ' produk' + (F.kat ? ' di kategori ' + F.kat : '');
  $('#list').innerHTML = r.map(card).join('') || '<p class="empty">Tidak ada baju yang cocok. Coba kata kunci lain.</p>';
}

R.produk = id => {
  const p = prod(id); if (!p || !p.aktif) return show('<p class="empty">Produk tidak ditemukan.</p>');
  const rel = db.products.filter(x => x.aktif && x.kat === p.kat && x.id !== p.id).slice(0, 4);
  show(`<p class="crumb"><a href="#/">Beranda</a> / <a href="#/katalog" onclick="F.kat='${p.kat}';F.q=''">${p.kat}</a> / ${esc(p.nama)}</p>
  <div class="detail">${thumb(p, true)}<div class="panel">
  <span class="tag">${p.kat}</span><h1>${esc(p.nama)}</h1><p class="price">${rp(p.harga)}</p><p class="desk">${esc(p.desk)}</p>
  <form onsubmit="return pesan(this,${p.id})">
  <div class="row2"><label>Ukuran<select name="uk">${SZ.map(z => `<option value="${z}" ${p.stok[z] ? '' : 'disabled'}>${z} (stok ${p.stok[z]})</option>`).join('')}</select></label>
  <label>Jumlah<input type="number" name="qty" value="1" min="1"></label></div>
  <label>Nomor HP penerima<input name="hp" placeholder="08xxxxxxxxxx"></label>
  <label>Alamat pengiriman<textarea name="alamat" rows="3" placeholder="Jalan, nomor rumah, kecamatan, kota"></textarea></label>
  <button class="btn block" ${stokTotal(p) ? '' : 'disabled'}>${stokTotal(p) ? 'Buat pesanan' : 'Stok habis'}</button></form></div></div>
  ${rel.length ? `<h2>Produk terkait</h2><div class="grid">${rel.map(card).join('')}</div>` : ''}`);
};


function pesan(f, pid) {
  const u = me();
  if (!u) { toast('Masuk dulu untuk memesan'); location.hash = '#/login'; return false; }
  const p = prod(pid), uk = f.uk.value, q = +f.qty.value;
  if (!/^08\d{8,11}$/.test(f.hp.value)) return toast('Nomor HP tidak valid. Contoh: 081234567890'), false;
  if (f.alamat.value.trim().length < 10) return toast('Alamat minimal 10 karakter'), false;
  if (!(q >= 1) || q > p.stok[uk]) return toast('Jumlah melebihi stok ukuran ' + uk), false;
  p.stok[uk] -= q;
  const o = { id: db.seq++, uid: u.id, pid, uk, qty: q, total: q * p.harga, hp: f.hp.value, alamat: f.alamat.value.trim(), status: ST[0], tgl: today(), batas: Date.now() + 864e5 };
  db.orders.push(o); save(); location.hash = '#/transaksi/' + o.id; return false;
}
R.transaksi = id => {
  const u = need(); if (!u) return;
  const o = db.orders.find(x => x.id == id);
  if (!o || (u.role !== 'admin' && o.uid !== u.id)) return show('<p class="empty">Transaksi tidak ditemukan.</p>');
  const p = prod(o.pid);
  show(`<h1>Transaksi #${o.id}</h1><div class="panel"><p>${badge(o.status)} &nbsp;${o.tgl}</p>
  <table><tr><td>Produk</td><td>${esc(p.nama)} (${o.uk}) x ${o.qty}</td></tr><tr><td>Total</td><td><b>${rp(o.total)}</b></td></tr>
  <tr><td>Penerima</td><td>${esc(o.hp)}<br>${esc(o.alamat)}</td></tr>
  ${o.metode ? `<tr><td>Pembayaran</td><td>${esc(o.metode)}<br>Bukti: ${esc(o.bukti)}</td></tr>` : ''}
  ${o.resi ? `<tr><td>No. resi</td><td>${esc(o.resi)}</td></tr>` : ''}</table>
  ${o.status === ST[0] ? `<p class="warn">Bayar sebelum ${new Date(o.batas).toLocaleString('id-ID')}. Pesanan batal otomatis jika lewat batas.</p>
  <form onsubmit="return bayar(this,${o.id})"><label>Metode pembayaran<select name="m" onchange="infoBayar(this.value,${o.total})"><option>QRIS</option><option>Transfer BCA 123-456-7890</option><option>Transfer BRI 0987-65-4321</option></select></label>
  <div id="infobayar"></div>
  <label>Bukti bayar<input type="file" name="b" accept="image/*"></label>
  <button class="btn">Kirim bukti bayar</button> <button type="button" class="ghost" onclick="batal(${o.id})">Batalkan pesanan</button></form>` : ''}</div>
  <a href="${u.role === 'admin' ? '#/admin/transaksi' : '#/riwayat'}">Kembali</a>`);
  if (o.status === ST[0]) infoBayar($('[name=m]').value, o.total);
};
function bayar(f, id) {
  if (!f.b.files[0]) return toast('Pilih file bukti bayar dulu'), false;
  const o = db.orders.find(x => x.id == id); o.metode = f.m.value; o.bukti = f.b.files[0].name; o.status = ST[1];
  save(); toast('Bukti bayar terkirim. Menunggu verifikasi admin.'); go(); return false;
}
function batal(id) {
  const o = db.orders.find(x => x.id == id);
  if (o.status !== ST[0]) return toast('Hanya pesanan yang belum dibayar yang bisa dibatalkan');
  prod(o.pid).stok[o.uk] += o.qty; o.status = ST[5]; save(); toast('Pesanan dibatalkan'); go();
}
R.riwayat = () => {
  const u = need(); if (!u) return;
  const r = db.orders.filter(o => o.uid === u.id && (!F.st || o.status === F.st)).reverse();
  show(`<h1>Riwayat transaksi</h1><div class="bar"><select onchange="F.st=this.value;go()"><option value="">Semua status</option>${ST.map(s => `<option ${F.st === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
  <div class="scroll"><table><tr><th>No</th><th>Tanggal</th><th>Produk</th><th>Total</th><th>Status</th><th></th></tr>
  ${r.map(o => `<tr><td>#${o.id}</td><td>${o.tgl}</td><td>${esc(prod(o.pid).nama)} (${o.uk}) x${o.qty}</td><td>${rp(o.total)}</td><td>${badge(o.status)}</td><td><a href="#/transaksi/${o.id}">Detail</a></td></tr>`).join('')}</table></div>
  ${r.length ? '' : '<p class="empty">Belum ada transaksi. <a href="#/katalog">Lihat katalog</a></p>'}`);
};

const omzet = list => list.filter(o => o.status === ST[2] || o.status === ST[3]).reduce((s, o) => s + o.total, 0);
R.admin = () => {
  if (!need('admin')) return;
  const t = today(), O = db.orders;
  show(`<h1>Dashboard admin</h1><div class="stats">
  <div>Transaksi hari ini<b>${O.filter(o => o.tgl === t).length}</b></div><div>Omzet hari ini<b>${rp(omzet(O.filter(o => o.tgl === t)))}</b></div>
  <div>Menunggu verifikasi<b>${O.filter(o => o.status === ST[1]).length}</b></div>
  <div>Produk stok menipis (5 atau kurang)<b>${db.products.filter(p => p.aktif && stokTotal(p) <= 5).length}</b></div></div>`);
};
R['admin/produk'] = () => {
  if (!need('admin')) return;
  show(`<h1>Kelola produk</h1><form id="pf" class="panel grid2" onsubmit="return simpanP(this)"><input type="hidden" name="id">
  <label>Nama<input name="nama"></label><label>Kategori<select name="kat">${KAT.map(k => `<option>${k}</option>`).join('')}</select></label>
  <label>Harga (Rp)<input type="number" name="harga" min="1000"></label>
  <label>Gambar (URL atau path, opsional)<input name="gambar" placeholder="img/kaos.jpg"></label>
  <label>Unggah foto dari komputer<input type="file" name="file" accept="image/*" onchange="pilihFoto(this)"></label>
  <input type="hidden" name="foto"><img id="prev" class="prev" alt="Pratinjau foto">
  ${SZ.map(z => `<label>Stok ${z}<input type="number" name="s${z}" min="0" value="0"></label>`).join('')}
  <label><input type="checkbox" name="aktif" checked> Aktif</label><button class="btn">Simpan produk</button></form>
  <div class="scroll"><table><tr><th>Nama</th><th>Harga</th><th>Stok</th><th>Status</th><th></th></tr>
  ${db.products.map(p => `<tr><td>${esc(p.nama)}<br><small>${p.kat}</small></td><td>${rp(p.harga)}</td><td>${SZ.map(z => z + ':' + p.stok[z]).join(' ')}</td><td>${p.aktif ? 'Aktif' : 'Nonaktif'}</td>
  <td><button class="ghost" onclick="editP(${p.id})">Ubah</button> <button class="ghost" onclick="togP(${p.id})">${p.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button> <button class="ghost" onclick="hapusP(${p.id})">Hapus</button></td></tr>`).join('')}</table></div>`);
};
function simpanP(f) {
  if (f.nama.value.trim().length < 3 || !(+f.harga.value >= 1000)) return toast('Isi nama (min 3 huruf) dan harga (min Rp1.000)'), false;
  const stok = {}; SZ.forEach(z => stok[z] = Math.max(0, +f['s' + z].value || 0));
  const d = { nama: f.nama.value.trim(), kat: f.kat.value, harga: +f.harga.value, gambar: f.foto.value || f.gambar.value.trim(), stok, aktif: f.aktif.checked };
  const p = f.id.value && prod(f.id.value);
  if (p) Object.assign(p, d); else db.products.push({ id: db.seq++, emoji: EMO[d.kat], warna: '#9DB4CE', desk: 'Bahan nyaman dan nyaman dipakai.', ...d });
  save(); toast('Produk disimpan'); go(); return false;
}
function editP(id) {
  const p = prod(id), f = $('#pf');
  f.id.value = p.id; f.nama.value = p.nama; f.kat.value = p.kat; f.harga.value = p.harga; const dataUrl = (p.gambar || '').startsWith('data:');
  f.gambar.value = dataUrl ? '' : p.gambar || ''; f.foto.value = dataUrl ? p.gambar : ''; f.file.value = '';
  const pv = $('#prev'); pv.style.display = 'block'; pv.onerror = () => pv.style.display = 'none'; pv.src = p.gambar || `img/produk-${p.id}.jpg`; f.aktif.checked = p.aktif;
  SZ.forEach(z => f['s' + z].value = p.stok[z]); f.scrollIntoView({ behavior: 'smooth' });
}
function pilihFoto(inp) { // foto dikecilkan (maks 700px) lalu disimpan di browser
  const file = inp.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 700 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const d = c.toDataURL('image/jpeg', 0.8);
      inp.form.foto.value = d; const pv = $('#prev'); pv.src = d; pv.style.display = 'block';
      toast('Foto dipilih. Klik "Simpan produk" untuk menyimpan.');
    };
    im.onerror = () => toast('File itu bukan gambar yang valid');
    im.src = e.target.result;
  };
  r.readAsDataURL(file);
}
function togP(id) { const p = prod(id); p.aktif = !p.aktif; save(); go(); }
function hapusP(id) {
  if (db.orders.some(o => o.pid == id)) return toast('Produk sudah punya pesanan. Nonaktifkan saja.');
  if (!confirm('Hapus produk ini?')) return;
  db.products = db.products.filter(p => p.id !== id); save(); go();
}
R['admin/transaksi'] = () => {
  if (!need('admin')) return;
  const act = o => o.status === ST[1] ? `<button class="ghost" onclick="aksi(${o.id},'ok')">Terima</button> <button class="ghost" onclick="aksi(${o.id},'no')">Tolak</button>`
    : o.status === ST[2] ? `<button class="ghost" onclick="aksi(${o.id},'kirim')">Isi resi</button>` : '';
  show(`<h1>Transaksi & verifikasi pembayaran</h1><div class="scroll"><table><tr><th>No</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Bukti</th><th>Status</th><th>Aksi</th></tr>
  ${db.orders.slice().reverse().map(o => `<tr><td><a href="#/transaksi/${o.id}">#${o.id}</a></td><td>${esc(db.users.find(u => u.id === o.uid).nama)}</td>
  <td>${esc(prod(o.pid).nama)} (${o.uk}) x${o.qty}</td><td>${rp(o.total)}</td><td>${o.bukti ? esc(o.bukti) : '-'}</td><td>${badge(o.status)}</td><td>${act(o)}</td></tr>`).join('')}</table></div>
  ${db.orders.length ? '' : '<p class="empty">Belum ada transaksi masuk.</p>'}`);
};
function aksi(id, a) {
  const o = db.orders.find(x => x.id == id);
  if (a === 'ok') o.status = ST[2];
  if (a === 'no') { o.status = ST[4]; prod(o.pid).stok[o.uk] += o.qty; }
  if (a === 'kirim') { const r = prompt('Masukkan nomor resi pengiriman:'); if (!r) return; o.resi = r; o.status = ST[3]; }
  save(); go();
}
R['admin/laporan'] = () => {
  if (!need('admin')) return;
  show(`<h1>Laporan penjualan</h1><div class="bar"><label>Dari<input type="date" id="d1"></label><label>Sampai<input type="date" id="d2"></label></div><div id="lap"></div>`);
  $('#d1').value = F.d1 || today().slice(0, 8) + '01'; $('#d2').value = F.d2 || today();
  $('#d1').onchange = $('#d2').onchange = () => { F.d1 = $('#d1').value; F.d2 = $('#d2').value; laporan(); };
  laporan();
};
function laporan() {
  const a = $('#d1').value, b = $('#d2').value;
  const r = db.orders.filter(o => o.tgl >= a && o.tgl <= b && (o.status === ST[2] || o.status === ST[3]));
  const cnt = {}; r.forEach(o => cnt[o.pid] = (cnt[o.pid] || 0) + o.qty);
  const top = Object.entries(cnt).sort((x, y) => y[1] - x[1])[0];
  $('#lap').innerHTML = `<div class="stats"><div>Total omzet<b>${rp(omzet(r))}</b></div><div>Jumlah transaksi<b>${r.length}</b></div>
  <div>Produk terlaris<b>${top ? esc(prod(top[0]).nama) : '-'}</b></div></div><h2>Rincian</h2><div class="scroll"><table><tr><th>Tanggal</th><th>Produk</th><th>Jumlah</th><th>Total</th></tr>
  ${r.map(o => `<tr><td>${o.tgl}</td><td>${esc(prod(o.pid).nama)} (${o.uk})</td><td>${o.qty}</td><td>${rp(o.total)}</td></tr>`).join('')}</table></div>
  ${r.length ? '' : '<p class="empty">Tidak ada penjualan pada periode ini.</p>'}`;
}
R['admin/user'] = () => {
  if (!need('admin')) return;
  show(`<h1>Kelola pengguna</h1><div class="scroll"><table><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr>
  ${db.users.map(u => `<tr><td>${esc(u.nama)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${u.aktif ? 'Aktif' : 'Nonaktif'}</td>
  <td>${u.role === 'admin' ? '' : `<button class="ghost" onclick="togU(${u.id})">${u.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button>`}</td></tr>`).join('')}</table></div>`);
};
function togU(id) { const u = db.users.find(x => x.id === id); u.aktif = !u.aktif; save(); go(); }


const qrisSrc = () => db.qris || 'img/qris.png';
function infoBayar(m, total) {
  $('#infobayar').innerHTML = m === 'QRIS'
    ? `<div class="qris"><b>Scan QRIS untuk membayar</b>
       <img src="${esc(qrisSrc())}" alt="QRIS ${esc(db.merchant || 'BajuKu')}" onerror="this.outerHTML='<p class=warn>Gambar QRIS belum dipasang. Admin: menu Pembayaran.</p>'">
       <p>Merchant: <b>${esc(db.merchant || 'BajuKu')}</b><br>Nominal: <b>${rp(total)}</b></p>
       <ol><li>Buka aplikasi bank atau e-wallet, pilih Scan QR.</li><li>Scan kode di atas dan pastikan nominal sama dengan ${rp(total)}.</li><li>Simpan tangkapan layar bukti bayar, lalu unggah di bawah.</li></ol></div>`
    : `<div class="qris"><b>Transfer ke rekening</b><p>${esc(m.replace('Transfer ', ''))}<br>a.n. ${esc(db.merchant || 'BajuKu')}<br>Nominal: <b>${rp(total)}</b></p></div>`;
}
let qTmp = '';
R['admin/pembayaran'] = () => {
  if (!need('admin')) return;
  qTmp = '';
  show(`<h1>Pengaturan pembayaran</h1><div class="panel narrow"><form onsubmit="return simpanQris(this)">
  <label>Nama merchant QRIS<input name="nm" value="${esc(db.merchant || 'BajuKu')}"></label>
  <label>Gambar QRIS toko<input type="file" accept="image/*" onchange="pilihQris(this)"></label>
  <img id="prevq" class="prev" style="display:block" src="${esc(qrisSrc())}" alt="QRIS" onerror="this.style.display='none'">
  <button class="btn block">Simpan</button></form>
  <p class="warn">Unggah gambar QRIS milik toko dari aplikasi bank atau e-wallet. Pelanggan akan melihat gambar ini saat memilih QRIS.</p></div>`);
};
function pilihQris(inp) {
  const file = inp.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 800 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      qTmp = c.toDataURL('image/png'); const pv = $('#prevq'); pv.src = qTmp; pv.style.display = 'block';
    };
    im.onerror = () => toast('File itu bukan gambar yang valid');
    im.src = e.target.result;
  };
  r.readAsDataURL(file);
}
function simpanQris(f) {
  db.merchant = f.nm.value.trim() || 'BajuKu'; if (qTmp) db.qris = qTmp;
  save(); toast('Pengaturan pembayaran disimpan'); return false;
}

go();
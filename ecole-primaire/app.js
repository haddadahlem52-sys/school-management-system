// ---------- Données (démo : stockées dans le navigateur) ----------
let TARIF = 900, KEY = 'ecole-v2'; const AN = '2026-2027';
const seed = () => ({
  n: 40,
  classes: [{id:1,nom:'CP – A',cap:25,annee:AN},{id:2,nom:'CE1 – B',cap:25,annee:AN}],
  matieres: [{id:3,nom:'Arabe',coef:3,niveau:'CP'},{id:4,nom:'Français',coef:3,niveau:'CP'},{id:5,nom:'Mathématiques',coef:2,niveau:'CP'}],
  eleves: [{id:6,nom:'Yassine Ben Salah',classe:1,parent:'Mme Ben Salah'},{id:7,nom:'Lina Trabelsi',classe:1,parent:'M. Trabelsi'},{id:8,nom:'Amir Gharbi',classe:2,parent:'Mme Gharbi'}],
  notes: [{id:9,eleve:6,matiere:3,note:16},{id:10,eleve:6,matiere:4,note:14},{id:11,eleve:6,matiere:5,note:18}],
  paiements: [{id:12,eleve:6,montant:300,mode:'Espèces',date:'2026-09-15'}],
  devoirs: [{id:13,titre:'Copier la lettre « b »',matiere:3,classe:1,date:'2026-11-02',rendus:[]}],
  messages: [{id:14,de:'admin',a:'tous',objet:'Rentrée scolaire',corps:'Bienvenue à tous pour la nouvelle année.',date:'2026-09-14',masque:[]}],
  enseignants:[{id:20,nom:'Mme Hamdi',matiere:3,classe:1,annee:AN},{id:21,nom:'M. Jaziri',matiere:5,classe:2,annee:AN}],
  salles:[{id:22,nom:'Salle 1',cap:25,dispo:'Oui'},{id:23,nom:'Salle 2',cap:25,dispo:'Oui'}],
  creneaux:[{id:24,classe:1,matiere:3,ens:20,salle:22,jour:'Lundi',debut:'08:00',fin:'09:00',annee:AN}],
  absences:[{id:25,eleve:6,date:'2026-10-12',just:'Non',annee:AN}],
  preins:[],
  log: []
});
let db; try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch (e) { db = seed(); }
if (db.tarif) TARIF = db.tarif;
if (!db.users) db.users = [{id:30,u:'admin',p:'admin123',r:'admin'}]; // un seul compte au départ : l’administrateur
// ---------- SaaS : offres d’abonnement et école courante (chaque école a ses propres données) ----------
const PLANS = {Gratuit:{prix:0, max:30}, Standard:{prix:50, max:300}, Premium:{prix:120, max:1000}};
let CUR = {id: 1, nom: '', plan: 'Standard'};
const blank = () => ({n:40, classes:[], matieres:[], eleves:[], notes:[], paiements:[], devoirs:[], messages:[], enseignants:[], salles:[], creneaux:[], absences:[], preins:[], users:[{id:30,u:'admin',p:'admin123',r:'admin'}], log:[]});
const regDefault = () => ({n:40, ecoles:[{id:1,nom:'École Abou el Kacem Chebbi',ville:'Sousse',plan:'Standard',statut:'Actif',date:'2026-09-01'}], users:[{id:30,u:'superadmin',p:'super123',r:'superadmin'}], log:[]});
function load(key, def) { KEY = key; TARIF = 900; try { db = JSON.parse(localStorage.getItem(key)) || def(); } catch (e) { db = def(); } if (db.tarif) TARIF = db.tarif; if (!db.users) db.users = [{id:30,u:'admin',p:'admin123',r:'admin'}]; }
function enter(ec) { load(ec.id == 1 ? 'ecole-v2' : 'ecole-v2-' + ec.id, ec.id == 1 ? seed : blank); CUR = ec; $('#ttl').textContent = '🎒 ' + ec.nom; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };

// ---------- Rôles (RBAC) ----------
const ROLES = {admin:'Administrateur', enseignant:'Enseignant', parent:'Parent', eleve:'Élève', comptable:'Comptable', superadmin:'Super administrateur'};
const TABS = {
  dash:['Tableau de bord','admin enseignant parent eleve comptable superadmin'],
  eleves:['Élèves','admin comptable'], classes:['Classes','admin'], matieres:['Matières','admin enseignant'],
  notes:['Notes et bulletin','admin enseignant parent'], paiements:['Paiements','admin comptable parent'],
  enseignants:['Enseignants','admin'], salles:['Salles','admin'], edt:['Emploi du temps','admin enseignant parent eleve'], absences:['Absences','admin enseignant parent'], preins:['Pré-inscription','admin parent'], users:['Utilisateurs','admin'], ecoles:['Écoles clientes','superadmin'],
  devoirs:['Devoirs','admin enseignant parent eleve'], messages:['Messagerie','admin enseignant parent eleve comptable']
};
const WRITE = {eleves:'admin',classes:'admin',matieres:'admin',notes:'admin enseignant',paiements:'admin comptable',devoirs:'admin enseignant',enseignants:'admin',salles:'admin',creneaux:'admin',absences:'admin enseignant',preins:'admin parent',users:'admin',ecoles:'superadmin'};
let role = 'admin', tab = 'dash', ME = null;
const can = e => (WRITE[e] || '').split(' ').includes(role);

// ---------- Entités : champs des formulaires ----------
const E = {
  eleves:[['nom','Nom complet','text'],['classe','Classe','classes'],['parent','Parent / tuteur','text'],['medical','Antécédents médicaux (facultatif)','text']],
  classes:[['nom','Niveau et section','text'],['cap','Capacité maximale','number'],['annee','Année scolaire','text']],
  matieres:[['nom','Nom','text'],['coef','Coefficient','number'],['niveau','Niveau concerné','text']],
  notes:[['eleve','Élève','eleves'],['matiere','Matière','matieres'],['note','Note sur 20','number'],['type','Évaluation','Contrôle continu,Examen trimestriel']],
  paiements:[['eleve','Élève','eleves'],['montant','Montant (DT)','number'],['mode','Mode de paiement','Espèces,Virement,Mobile money']],
  devoirs:[['titre','Titre','text'],['matiere','Matière','matieres'],['classe','Classe','classes'],['date','Date de remise','date'],['correction','Correction (facultatif)','text']],
  enseignants:[['nom','Nom','text'],['matiere','Matière','matieres'],['classe','Classe','classes']],
  salles:[['nom','Nom de la salle','text'],['cap','Capacité','number'],['dispo','Disponible','Oui,Non']],
  creneaux:[['classe','Classe','classes'],['matiere','Matière','matieres'],['ens','Enseignant','enseignants'],['salle','Salle','salles'],['jour','Jour','Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi'],['debut','Début','time'],['fin','Fin','time']],
  absences:[['eleve','Élève','eleves'],['date','Date','date'],['just','Justifiée','Non,Oui']],
  preins:[['nom','Nom de l’enfant','text'],['classe','Classe souhaitée','classes'],['parent','Parent / tuteur','text']],
  users:[['u','Identifiant','text'],['p','Mot de passe (6 caractères minimum)','text'],['r','Rôle','admin,enseignant,parent,eleve,comptable'],['par','Parent ou élève lié (rôles parent et élève)','text']],
  ecoles:[['nom','Nom de l’école','text'],['ville','Ville','text'],['tel','Téléphone (8 chiffres)','tel'],['email','E-mail de contact','email'],['plan','Abonnement','Gratuit,Standard,Premium'],['statut','Statut','Actif,Suspendu'],['au','Identifiant de l’administrateur de l’école (création)','text'],['ap','Mot de passe de l’administrateur (création)','password'],['ap2','Confirmer le mot de passe','password']]
};
const SEL = ['classes','eleves','matieres','enseignants','salles'];
const OPT = ['correction','medical','par','au','ap','ap2']; // champs facultatifs
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Un parent ne voit que les données de ses propres enfants
const vis = (k, x) => { if (ME && role == 'eleve') { const me = db.eleves.find(e => e.id == ME.el); return ['devoirs','creneaux'].includes(k) ? !!me && me.classe == x.classe : k == 'eleves' ? x.id == ME.el : true; }
  if (!ME || role != 'parent') return true; const mine = db.eleves.filter(e => e.parent == ME.par); const ids = mine.map(e => e.id);
  return k == 'eleves' ? ids.includes(x.id) : ['notes','paiements','absences'].includes(k) ? ids.includes(x.eleve) : ['devoirs','creneaux'].includes(k) ? mine.some(e => e.classe == x.classe) : true; };
const live = k => db[k].filter(x => !x.del && vis(k, x));
const nom = (k, id) => (db[k].find(x => x.id == id) || {}).nom || '—';
const $ = s => document.querySelector(s);
const today = () => new Date().toISOString().slice(0, 10);
function toast(t) { const el = $('#toast'); el.textContent = t; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 3200); }
const journal = (u, ent, avant, apres) => db.log.unshift({d: new Date().toLocaleString('fr-FR'), u: ROLES[role], ent, avant, apres});

// ---------- Calculs ----------
function moyenne(id) {
  let s = 0, c = 0;
  live('notes').filter(n => n.eleve == id).forEach(n => { const m = db.matieres.find(x => x.id == n.matiere); if (m) { s += n.note * m.coef; c += +m.coef; } });
  return c ? (s / c).toFixed(2) : '—';
}
const paye = id => live('paiements').filter(p => p.eleve == id).reduce((a, p) => a + +p.montant, 0);
const solde = id => TARIF - paye(id);

// ---------- Contrôle de saisie ----------
const NOM = /^[\p{L}][\p{L}\s'’.\-]{1,59}$/u;            // noms de personnes
const LIB = /^[\p{L}\p{N}][\p{L}\p{N}\s'’.\-–]{1,59}$/u;  // libellés (classe, matière, salle)
const M_NOM = 'Lettres uniquement (espaces, tiret et apostrophe autorisés).', M_LIB = 'Lettres, chiffres, espaces et tirets uniquement.';
function check(ent, d, id) {
  const e = {};
  const txt = (k, re, m) => { if (!d[k]) e[k] = 'Ce champ est obligatoire.'; else if (d[k].length < 2) e[k] = 'Minimum 2 caractères.'; else if (!re.test(d[k])) e[k] = m; };
  const nb = (k, min, max, int) => { if (isNaN(d[k])) e[k] = 'Saisissez un nombre.'; else if (d[k] < min || d[k] > max) e[k] = `Valeur comprise entre ${min} et ${max}.`; else if (int && !Number.isInteger(d[k])) e[k] = 'Saisissez un nombre entier.'; };
  const sel = k => { if (isNaN(d[k])) e[k] = 'Faites un choix dans la liste.'; };
  const dup = f => live(ent).some(x => x.id != id && f(x));
  const same = (a, b) => String(a).toLowerCase() == String(b).toLowerCase();
  const eff = c => live('eleves').filter(x => x.classe == c).length;
  if (ent == 'eleves') { txt('nom', NOM, M_NOM); txt('parent', NOM, M_NOM); sel('classe');
    if (!e.nom && dup(x => same(x.nom, d.nom) && x.classe == d.classe)) e.nom = 'Cet élève existe déjà dans cette classe.';
    if (!e.nom && !id && live('eleves').length >= PLANS[CUR.plan].max) e.nom = `Limite de l’offre ${CUR.plan} atteinte (${PLANS[CUR.plan].max} élèves). Passez à une offre supérieure.`; }
  if (ent == 'classes') { txt('nom', LIB, M_LIB); nb('cap', 1, 40, true);
    const m = /^(\d{4})-(\d{4})$/.exec(d.annee || ''); if (!m || +m[2] != +m[1] + 1) e.annee = 'Format attendu : 2026-2027.';
    if (!e.nom && dup(x => same(x.nom, d.nom) && x.annee == d.annee)) e.nom = 'Cette classe existe déjà pour cette année.';
    if (id && !e.cap && d.cap < eff(id)) e.cap = `Capacité inférieure à l’effectif actuel (${eff(id)}).`; }
  if (ent == 'matieres') { txt('nom', LIB, M_LIB); txt('niveau', LIB, M_LIB); nb('coef', 0.5, 10, false);
    if (!e.nom && !e.niveau && dup(x => same(x.nom, d.nom) && same(x.niveau, d.niveau))) e.nom = 'Cette matière existe déjà pour ce niveau.'; }
  if (ent == 'notes') { sel('eleve'); sel('matiere'); nb('note', 0, 20, false);
    if (!e.note && Math.round(d.note * 4) != d.note * 4) e.note = 'Utilisez des pas de 0,25 (ex. 14 ou 14,5).';
    if (!e.eleve && !e.matiere && dup(x => x.eleve == d.eleve && x.matiere == d.matiere && (x.type || 'Contrôle continu') == d.type)) e.note = 'Une note existe déjà pour cette évaluation.'; }
  if (ent == 'paiements') { sel('eleve'); nb('montant', 1, 100000, false);
    if (!e.eleve && !e.montant) { const reste = solde(d.eleve) + (id ? +db.paiements.find(x => x.id == id).montant : 0);
      if (reste <= 0) e.eleve = 'Cet élève a déjà tout payé.'; else if (d.montant > reste) e.montant = `Le montant dépasse le solde restant (${reste} DT).`; } }
  if (ent == 'devoirs') { if (!d.titre) e.titre = 'Ce champ est obligatoire.'; else if (d.titre.length < 3) e.titre = 'Minimum 3 caractères.'; sel('matiere'); sel('classe');
    if (!d.date) e.date = 'Ce champ est obligatoire.'; else if (!id && d.date < today()) e.date = 'La date de remise ne peut pas être dans le passé.'; }
  if (ent == 'enseignants') { txt('nom', NOM, M_NOM); sel('matiere'); sel('classe');
    if (!e.nom && dup(x => same(x.nom, d.nom))) e.nom = 'Cet enseignant existe déjà.'; }
  if (ent == 'salles') { txt('nom', LIB, M_LIB); nb('cap', 1, 60, true);
    if (!e.nom && dup(x => same(x.nom, d.nom))) e.nom = 'Cette salle existe déjà.'; }
  if (ent == 'creneaux') { ['classe','matiere','ens','salle'].forEach(sel);
    if (!d.debut) e.debut = 'Ce champ est obligatoire.'; if (!d.fin) e.fin = 'Ce champ est obligatoire.';
    if (d.debut && d.fin) { if (d.debut < '07:30' || d.fin > '18:00') e.debut = 'Les cours ont lieu entre 07:30 et 18:00.'; else if (d.debut >= d.fin) e.fin = 'L’heure de fin doit suivre le début.';
      else { const c = live('creneaux').filter(x => x.id != id && x.jour == d.jour && x.debut < d.fin && d.debut < x.fin);
        if (c.some(x => x.ens == d.ens)) e.ens = 'Cet enseignant a déjà un cours sur ce créneau.';
        if (c.some(x => x.salle == d.salle)) e.salle = 'Cette salle est déjà occupée sur ce créneau.';
        if (c.some(x => x.classe == d.classe)) e.classe = 'Cette classe a déjà un cours à cette heure.'; } }
    const s = db.salles.find(x => x.id == d.salle);
    if (s && !e.salle) { if (s.dispo != 'Oui') e.salle = 'Cette salle n’est pas disponible.'; else if (s.cap < eff(d.classe)) e.salle = 'Capacité de la salle insuffisante pour cette classe.'; } }
  if (ent == 'absences') { sel('eleve');
    if (!d.date) e.date = 'Ce champ est obligatoire.'; else if (d.date > today()) e.date = 'La date ne peut pas être dans le futur.'; else if (d.date < '2026-09-01') e.date = 'Date antérieure à la rentrée scolaire.';
    if (!e.eleve && !e.date && dup(x => x.eleve == d.eleve && x.date == d.date)) e.date = 'Cette absence est déjà enregistrée.'; }
  if (ent == 'preins') { txt('nom', NOM, M_NOM); txt('parent', NOM, M_NOM); sel('classe');
    if (!e.nom && dup(x => same(x.nom, d.nom) && x.classe == d.classe)) e.nom = 'Une pré-inscription existe déjà pour cet enfant.'; }
  if (ent == 'ecoles') { txt('nom', LIB, M_LIB); txt('ville', NOM, M_NOM);
    if (!e.nom && (d.nom.length < 3 || !/\p{L}/u.test(d.nom))) e.nom = 'Le nom doit contenir au moins 3 caractères dont des lettres.';
    d.tel = (d.tel || '').replace(/\s/g, ''); if (!/^\d{8}$/.test(d.tel)) e.tel = 'Saisissez exactement 8 chiffres.';
    d.email = (d.email || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Adresse e-mail invalide (ex. contact@ecole.tn).'; else if (dup(x => x.email == d.email)) e.email = 'Cet e-mail est déjà utilisé par une autre école.';
    if (!e.nom && dup(x => same(x.nom, d.nom))) e.nom = 'Cette école existe déjà.';
    if (!id) { d.au = (d.au || '').toLowerCase(); if (!/^[a-z0-9._-]{3,20}$/.test(d.au)) e.au = '3 à 20 caractères : lettres minuscules, chiffres, point, tiret.';
      if (!d.ap || d.ap.length < 6 || !/[A-Za-z]/.test(d.ap) || !/\d/.test(d.ap)) e.ap = 'Minimum 6 caractères, avec lettres et chiffres.'; else if (d.ap != d.ap2) e.ap2 = 'Les deux mots de passe sont différents.'; } }
  if (ent == 'users') { d.u = (d.u || '').toLowerCase();
    if (!d.u) e.u = 'Ce champ est obligatoire.'; else if (!/^[a-z0-9._-]{3,20}$/.test(d.u)) e.u = '3 à 20 caractères : lettres, chiffres, point, tiret.'; else if (dup(x => x.u == d.u)) e.u = 'Cet identifiant existe déjà.';
    if (!d.p || d.p.length < 6) e.p = 'Minimum 6 caractères.'; else if (!/[A-Za-z]/.test(d.p) || !/\d/.test(d.p)) e.p = 'Le mot de passe doit contenir des lettres et des chiffres.';
    if (d.r == 'parent') { const m = live('eleves').find(x => same(x.parent, d.par || ''));
      if (!d.par) e.par = 'Indiquez le parent lié à ses enfants.'; else if (!m) e.par = 'Aucun élève n’a ce parent : vérifiez le nom exact.'; else d.par = m.parent; } else if (d.r == 'eleve') { const m = live('eleves').find(x => same(x.nom, d.par || '')); if (!m) e.par = 'Aucun élève ne porte ce nom : vérifiez l’orthographe.'; else d.par = m.nom; } else d.par = '';
    if (id && db.users.find(x => x.id == id).u == ME.u && d.r != 'admin') e.r = 'Vous ne pouvez pas retirer votre propre rôle administrateur.'; }
  return e;
}
// ---------- Formulaire Ajouter / Modifier ----------
function form(ent, id) {
  const it = id ? db[ent].find(x => x.id == id) : {};
  $('#frm').noValidate = true; // les messages d’erreur sont gérés par check()
  $('#frm').innerHTML = `<h3>${id ? 'Modifier' : 'Ajouter'}</h3>` + E[ent].filter(([k]) => !(id && ['au','ap','ap2'].includes(k))).map(([k, l, t]) => {
    let inp;
    if (SEL.includes(t)) inp = `<select name="${k}" required>${live(t).map(o => `<option value="${o.id}" ${it[k] == o.id ? 'selected' : ''}>${esc(o.nom)}</option>`).join('')}</select>`;
    else if (t.includes(',')) inp = `<select name="${k}">${t.split(',').map(o => `<option ${it[k] == o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    else inp = `<input name="${k}" type="${t}" value="${esc(it[k] ?? '')}" ${OPT.includes(k) ? '' : 'required'} ${t == 'number' ? 'step="any"' : 'maxlength="80"'}>`;
    return `<label>${l}${inp}<small class="err" id="e-${k}" role="alert"></small></label>`;
  }).join('') + `<div class="bar"><button class="btn alt" value="x" formnovalidate>Annuler</button><button class="btn" id="ok" value="ok">Enregistrer</button></div>`;
  $('#dlg').showModal();
  $('#ok').onclick = ev => {
    const f = $('#frm'); ev.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    E[ent].forEach(([k,, t]) => { if (t == 'text' && d[k] != null) d[k] = d[k].trim().replace(/\s+/g, ' '); if (t == 'number' || SEL.includes(t)) d[k] = d[k] === '' ? NaN : +d[k]; });
    const errs = check(ent, d, id); f.querySelectorAll('.err').forEach(s => s.textContent = '');
    const first = Object.keys(errs)[0];
    if (first) { Object.entries(errs).forEach(([k, m]) => { const s = f.querySelector('#e-' + k); if (s) s.textContent = '⚠ ' + m; }); if (f.elements[first]) f.elements[first].focus(); return toast('Corrigez les champs signalés.'); }
    d.annee = d.annee || it.annee || AN;
    if (ent == 'notes' && (d.note > 20)) return toast('La note doit être comprise entre 0 et 20.');
    if (ent == 'creneaux') { if (d.debut >= d.fin) return toast('L’heure de fin doit suivre l’heure de début.');
      if (live('creneaux').find(x => x.id != id && x.jour == d.jour && x.debut < d.fin && d.debut < x.fin && (x.ens == d.ens || x.salle == d.salle))) return toast('Conflit : l’enseignant ou la salle est déjà occupé(e) sur ce créneau.'); }
    if (ent == 'eleves') { const eff = live('eleves').filter(e => e.classe == d.classe && e.id != id).length, c = db.classes.find(c => c.id == d.classe); if (c && eff >= c.cap) return toast('Effectif maximal atteint pour cette classe.'); }
    if (id) { journal(0, ent, JSON.stringify(it), JSON.stringify(d)); Object.assign(it, d); delete it.au; delete it.ap; delete it.ap2; }
    else {
      const o = {id: ++db.n, ...d}; if (ent == 'devoirs') o.rendus = []; if (ent == 'paiements') o.date = today(); if (ent == 'ecoles') o.date = today(); if (ent == 'preins') o.statut = 'En attente';
      db[ent].push(o); journal(0, ent, '', ent == 'ecoles' ? d.nom : JSON.stringify(d));
      if (ent == 'ecoles') { const nd = blank(); nd.users[0] = {id:30, u:d.au, p:d.ap, r:'admin'}; try { localStorage.setItem('ecole-v2-' + o.id, JSON.stringify(nd)); } catch (x) {} delete o.au; delete o.ap; delete o.ap2; }
      if (ent == 'paiements') notifPaiement(o);
    }
    save(); $('#dlg').close(); go(tab);
  };
}
// Notification automatique après paiement (§8.2)
function notifPaiement(p) {
  db.messages.push({id: ++db.n, de:'admin', a:'parent', objet:'Paiement reçu – ' + nom('eleves', p.eleve),
    corps:`Montant payé : ${p.montant} DT\nDate : ${p.date} – Mode : ${p.mode}\nSolde restant : ${solde(p.eleve)} DT\nReçu n° REC-${p.id} disponible dans le dossier de l’élève.`, date: p.date, masque: []});
  journal(0, 'messages', '', 'Message de paiement envoyé (statut : envoyé)');
  toast('Paiement enregistré, message envoyé au parent.');
}
// Suppression contrôlée + suppression logique (§3)
function suppr(ent, id) {
  const bloque = {classes: () => live('eleves').some(e => e.classe == id) && 'Cette classe contient encore des élèves : réaffectez-les d’abord.',
    matieres: () => live('notes').some(n => n.matiere == id) && 'Des notes sont rattachées à cette matière.',
    devoirs: () => db.devoirs.find(d => d.id == id).rendus.length && 'Des travaux ont déjà été déposés.',
    users: () => db.users.find(x => x.id == id).u == ME.u && 'Vous ne pouvez pas supprimer votre propre compte.',
    ecoles: () => db.ecoles.find(x => x.id == id).statut == 'Actif' && 'Suspendez l’école avant de la supprimer.'}[ent];
  const r = bloque && bloque(); if (r) return toast(r);
  if (!confirm('Confirmer la suppression ?')) return;
  const it = db[ent].find(x => x.id == id); it.del = true; journal(0, ent, JSON.stringify(it), 'supprimé (logique)'); save(); go(tab);
}

// ---------- Tableaux ----------
function table(ent, cols, extra) {
  const w = can(ent);
  const rows = live(ent).map(r => `<tr>${cols.map(c => `<td>${c(r)}</td>`).join('')}<td class="act">${extra ? extra(r) : ''}${w ? `<button class="btn alt" data-e="${r.id}">Modifier</button><button class="btn del" data-d="${r.id}">Supprimer</button>` : ''}</td></tr>`).join('');
  return rows || '<tr><td>Aucun enregistrement. Utilisez « Ajouter » pour commencer.</td></tr>';
}
function page(ent, titre, heads, cols, extra) {
  $('#main').innerHTML = `<div class="bar"><h2>${titre}</h2>${can(ent) ? '<button class="btn" id="add">Ajouter</button>' : ''}</div>
  <div class="wrap"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${table(ent, cols, extra)}</tbody></table></div>`;
  if ($('#add')) $('#add').onclick = () => form(ent);
  document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => form(ent, b.dataset.e));
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => suppr(ent, b.dataset.d));
}

// ---------- Pages ----------
const VIEWS = {
  dash() {
    if (role == 'superadmin') return VIEWS.saas();
    const imp = live('eleves').filter(e => solde(e.id) > 0);
    $('#main').innerHTML = `<h2>Tableau de bord</h2><div class="stats">
      <div class="stat"><b>${live('eleves').length}</b><span>élèves inscrits</span></div>
      <div class="stat"><b>${live('classes').length}</b><span>classes</span></div>
      <div class="stat"><b>${live('paiements').reduce((a, p) => a + +p.montant, 0)} DT</b><span>encaissés</span></div>
      <div class="stat"><b>${imp.length}</b><span>soldes à régler</span></div></div>
      ${role == 'admin' || role == 'comptable' ? `<h3>Impayés</h3><div class="wrap"><table><tbody>${imp.map(e => `<tr><td>${esc(e.nom)}</td><td>${esc(e.parent)}</td><td class="ko">${solde(e.id)} DT</td><td><button class="btn alt" data-rl="${e.id}">Relancer</button></td></tr>`).join('') || '<tr><td>Aucun impayé.</td></tr>'}</tbody></table></div>` : ''}
      ${role == 'admin' ? `<h3>Journal des modifications</h3><div class="wrap"><table><tbody>${db.log.slice(0, 6).map(l => `<tr><td>${l.d}</td><td>${l.u}</td><td>${l.ent}</td></tr>`).join('') || '<tr><td>Aucune modification pour le moment.</td></tr>'}</tbody></table></div>` : ''}
      <p class="note">Démo : les données restent dans ce navigateur. ${role == 'admin' ? `<button class="btn alt" id="tf">Modifier le tarif (${TARIF} DT)</button> ` : ''}<button class="btn alt" id="rst">Réinitialiser la démo</button></p>`;
    if ($('#tf')) $('#tf').onclick = () => { const v = +prompt('Nouveau tarif de scolarité (DT) :', TARIF); if (v >= 100 && v <= 5000) { TARIF = db.tarif = v; journal(0, 'tarif', '', v + ' DT'); save(); go('dash'); } else if (v) toast('Tarif invalide : saisissez un montant entre 100 et 5000 DT.'); };
    $('#rst').onclick = () => { if (confirm('Effacer les données de démonstration ?')) { db = seed(); save(); go('dash'); } };
  },
  eleves() {
    page('eleves', 'Dossiers élèves', ['Nom','Classe','Parent','Solde'], [r => esc(r.nom), r => esc(nom('classes', r.classe)), r => esc(r.parent), r => solde(r.id) + ' DT']);
    if (role != 'admin') return;
    $('.bar').insertAdjacentHTML('beforeend', '<button class="btn alt" id="csv">Import / export CSV</button>');
    $('#csv').onclick = () => {
      $('#frm').innerHTML = `<h3>Import / export CSV</h3><p class="note">Format : nom;classe;parent (une ligne par élève). Copiez le contenu pour exporter, ou collez des lignes pour importer.</p><textarea id="cv" rows="8" style="width:100%">${esc(live('eleves').map(e => [e.nom, nom('classes', e.classe), e.parent].join(';')).join('\n'))}</textarea><div class="bar"><button class="btn alt" value="x" formnovalidate>Fermer</button><button class="btn" type="button" id="imp">Importer</button></div>`;
      $('#dlg').showModal();
      $('#imp').onclick = () => { let n = 0; $('#cv').value.split('\n').forEach(l => { const [a, c, p] = l.split(';').map(s => s.trim()); const cl = db.classes.find(x => x.nom == c && !x.del); if (a && NOM.test(a) && cl && NOM.test(p || '') && !db.eleves.some(e => !e.del && e.nom == a)) { db.eleves.push({id: ++db.n, nom: a, classe: cl.id, parent: p || ''}); n++; } }); journal(0, 'eleves', '', n + ' élève(s) importé(s)'); save(); const tot = $('#cv').value.split('\n').filter(s => s.trim()).length; $('#dlg').close(); toast(`${n} importé(s), ${tot - n} ligne(s) rejetée(s) (format, classe inconnue ou doublon).`); go('eleves'); };
    };
  },
  classes: () => page('classes', 'Classes', ['Classe','Effectif','Année'], [r => esc(r.nom), r => live('eleves').filter(e => e.classe == r.id).length + ' / ' + r.cap, r => r.annee]),
  matieres: () => page('matieres', 'Matières', ['Matière','Coefficient','Niveau'], [r => esc(r.nom), r => r.coef, r => esc(r.niveau)]),
  notes() {
    page('notes', 'Notes et bulletin', ['Élève','Matière','Note /20','Évaluation'], [r => esc(nom('eleves', r.eleve)), r => esc(nom('matieres', r.matiere)), r => r.note, r => r.type || 'Contrôle continu']);
    $('#main').insertAdjacentHTML('beforeend', `<h3>Moyennes pondérées (coefficients)</h3><div class="wrap"><table><tbody>${live('eleves').map(e => `<tr><td>${esc(e.nom)}</td><td class="ok">${moyenne(e.id)} / 20</td><td><button class="btn alt" data-b="${e.id}">Bulletin PDF</button></td></tr>`).join('')}</tbody></table></div>`);
  },
  paiements() {
    page('paiements', 'Paiements', ['Élève','Montant','Mode','Date','Solde restant','Reçu'], [r => esc(nom('eleves', r.eleve)), r => r.montant + ' DT', r => r.mode, r => r.date, r => solde(r.eleve) + ' DT', r => `<button class="btn alt" data-rc="${r.id}">REC-${r.id} (PDF)</button>`]);
    $('#main').insertAdjacentHTML('beforeend', `<p class="note">Grille tarifaire ${AN} : scolarité ${TARIF} DT. Chaque paiement enregistré envoie automatiquement un message au parent.</p>`);
  },
  devoirs() {
    const me = ME.el || db.eleves[0].id;
    page('devoirs', 'Devoirs', ['Titre','Matière','Classe','Remise','Statut','Correction'], [r => esc(r.titre), r => esc(nom('matieres', r.matiere)), r => esc(nom('classes', r.classe)), r => r.date,
      r => r.rendus.length ? `<span class="ok">${r.rendus.length} rendu(s)</span>` : r.date < today() ? '<span class="ko">En retard</span>' : '<span class="ko">Non rendu</span>', r => r.date <= today() ? esc(r.correction || '—') : 'Visible après la remise'],
      r => role == 'eleve' ? `<button class="btn" data-r="${r.id}">${r.rendus.includes(me) ? 'Retirer mon dépôt' : 'Déposer mon travail'}</button>` : role == 'parent' ? (r.vu ? '<span class="ok">Vu</span>' : `<button class="btn" data-vu="${r.id}">Marquer vu</button>`) : '');
    document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const d = db.devoirs.find(x => x.id == b.dataset.r); d.rendus = d.rendus.includes(me) ? [] : [me];
      if (d.rendus.length) db.messages.push({id: ++db.n, de:'eleve', a:'enseignant', objet:'Travail déposé', corps:`Nouveau dépôt pour « ${d.titre} ».`, date: today(), masque: []}); save(); go('devoirs'); });
  },
  saas() {
    const ec = live('ecoles'), act = ec.filter(x => x.statut == 'Actif'), mrr = act.reduce((a, x) => a + PLANS[x.plan].prix, 0);
    $('#main').innerHTML = `<h2>Plateforme SaaS</h2><div class="stats"><div class="stat"><b>${ec.length}</b><span>écoles clientes</span></div><div class="stat"><b>${act.length}</b><span>écoles actives</span></div><div class="stat"><b>${mrr} DT</b><span>revenu mensuel</span></div><div class="stat"><b>${ec.length - act.length}</b><span>suspendues</span></div></div><h3>Offres d’abonnement</h3><div class="wrap"><table><thead><tr><th>Offre</th><th>Prix / mois</th><th>Élèves max</th><th>Écoles</th></tr></thead><tbody>${Object.entries(PLANS).map(([n, p]) => `<tr><td>${n}</td><td>${p.prix} DT</td><td>${p.max}</td><td>${ec.filter(x => x.plan == n).length}</td></tr>`).join('')}</tbody></table></div><p class="note">Chaque école cliente a sa propre base de données, isolée des autres.</p>`;
  },
  ecoles: () => page('ecoles', 'Écoles clientes', ['École','Ville','Offre','Prix / mois','Statut','Création'], [r => esc(r.nom), r => esc(r.ville), r => r.plan, r => PLANS[r.plan].prix + ' DT', r => r.statut == 'Actif' ? '<span class="ok">Actif</span>' : '<span class="ko">Suspendu</span>', r => r.date || '—']),
  users() {
    page('users', 'Utilisateurs', ['Identifiant','Rôle','Mot de passe','Lié à','Statut'], [r => esc(r.u), r => ROLES[r.r], r => '••••••', r => esc(r.par || '—'), r => r.statut || 'Actif'],
      r => r.statut == 'En attente' ? `<button class="btn" data-ok="${r.id}">Valider</button>` : '');
    document.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { delete db.users.find(x => x.id == b.dataset.ok).statut; save(); toast('Compte validé.'); go('users'); });
  },
  enseignants: () => page('enseignants', 'Enseignants', ['Nom','Matière','Classe','Année'], [r => esc(r.nom), r => esc(nom('matieres', r.matiere)), r => esc(nom('classes', r.classe)), r => r.annee || AN]),
  salles: () => page('salles', 'Salles', ['Salle','Capacité','Disponible'], [r => esc(r.nom), r => r.cap, r => r.dispo]),
  edt() {
    page('creneaux', 'Emploi du temps', ['Jour','Horaire','Classe','Matière','Enseignant','Salle'], [r => r.jour, r => r.debut + ' – ' + r.fin, r => esc(nom('classes', r.classe)), r => esc(nom('matieres', r.matiere)), r => esc(nom('enseignants', r.ens)), r => esc(nom('salles', r.salle))]);
    const J = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    $('#main').insertAdjacentHTML('beforeend', `<h3>Vue semaine</h3><div class="week">${J.map(j => `<div><h4>${j}</h4>${live('creneaux').filter(c => c.jour == j).sort((a, b) => a.debut.localeCompare(b.debut)).map(c => `<p><b>${c.debut}–${c.fin}</b><br>${esc(nom('matieres', c.matiere))} · ${esc(nom('classes', c.classe))}<br>${esc(nom('salles', c.salle))}</p>`).join('') || '<small>Libre</small>'}</div>`).join('')}</div>`);
  },
  absences() {
    page('absences', 'Absences', ['Élève','Date','Justifiée'], [r => esc(nom('eleves', r.eleve)), r => r.date, r => r.just == 'Oui' ? '<span class="ok">Oui</span>' : '<span class="ko">Non</span>'],
      r => role == 'parent' && r.just != 'Oui' ? `<button class="btn" data-j="${r.id}">Justifier</button>` : '');
    document.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { db.absences.find(x => x.id == b.dataset.j).just = 'Oui'; save(); go('absences'); });
  },
  preins() {
    page('preins', 'Pré-inscriptions', ['Enfant','Classe souhaitée','Parent','Statut'], [r => esc(r.nom), r => esc(nom('classes', r.classe)), r => esc(r.parent), r => r.statut],
      r => role == 'admin' && r.statut != 'Validée' ? `<button class="btn" data-v="${r.id}">Valider</button>` : '');
    document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const p = db.preins.find(x => x.id == b.dataset.v); p.statut = 'Validée'; db.eleves.push({id: ++db.n, nom: p.nom, classe: p.classe, parent: p.parent}); journal(0, 'eleves', '', 'Pré-inscription validée'); save(); go('preins'); });
  },
  messages() {
    const inbox = db.messages.filter(m => !m.brouillon && (m.a == role || m.a == 'tous' || m.de == role) && !m.masque.includes(role)).reverse();
    $('#main').innerHTML = `<h2>Messagerie</h2><form id="mf" class="msg"><label>Destinataire<select name="a">${role == 'admin' ? '<option value="tous">Tous (annonce)</option>' : ''}${Object.entries(ROLES).filter(([k]) => k != role).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>Objet<input name="objet" required maxlength="100"></label><label>Message<textarea name="corps" rows="3" required maxlength="1000"></textarea></label><button class="btn">Envoyer</button> <button class="btn alt" type="button" id="dr">Enregistrer en brouillon</button>
      <p class="note">Un message envoyé ne peut plus être modifié ni supprimé. Le destinataire peut seulement le masquer de sa boîte. Un brouillon reste modifiable avant l’envoi.</p></form>${db.messages.filter(m => m.brouillon && m.de == role).map(m => `<div class="msg"><small>Brouillon → ${m.a == 'tous' ? 'Tous' : ROLES[m.a]}</small><h3 style="margin:2px 0">${esc(m.objet)}</h3><p>${esc(m.corps)}</p><button class="btn" data-ds="${m.id}">Envoyer</button> <button class="btn alt" data-de="${m.id}">Modifier</button> <button class="btn del" data-dd="${m.id}">Supprimer</button></div>`).join('')}
      ${inbox.map(m => `<div class="msg"><small>${ROLES[m.de]} → ${m.a == 'tous' ? 'Tous' : ROLES[m.a]} · ${m.date}</small><h3 style="margin:2px 0">${esc(m.objet)}</h3><p>${esc(m.corps)}</p>${m.a == role ? `<button class="btn alt" data-m="${m.id}">Masquer</button>` : ''}</div>`).join('') || '<p>Aucun message.</p>'}`;
    $('#mf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); if (msgErr(d, e.target)) return; db.messages.push({id: ++db.n, de: role, ...d, date: today(), masque: []}); save(); toast('Message envoyé.'); go('messages'); };
    document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { db.messages.find(m => m.id == b.dataset.m).masque.push(role); save(); go('messages'); });
    $('#dr').onclick = () => { const f = $('#mf'); if (!f.checkValidity()) return f.reportValidity(); const d = Object.fromEntries(new FormData(f)); if (msgErr(d, f)) return; db.messages.push({id: ++db.n, de: role, ...d, date: today(), masque: [], brouillon: true}); save(); toast('Brouillon enregistré.'); go('messages'); };
    document.querySelectorAll('[data-ds]').forEach(b => b.onclick = () => { const m = db.messages.find(x => x.id == b.dataset.ds); m.brouillon = false; m.date = today(); save(); toast('Message envoyé.'); go('messages'); });
    document.querySelectorAll('[data-dd]').forEach(b => b.onclick = () => { db.messages = db.messages.filter(x => x.id != b.dataset.dd); save(); go('messages'); });
    document.querySelectorAll('[data-de]').forEach(b => b.onclick = () => { const m = db.messages.find(x => x.id == b.dataset.de), f = $('#mf'); f.a.value = m.a; f.objet.value = m.objet; f.corps.value = m.corps; db.messages = db.messages.filter(x => x !== m); save(); f.objet.focus(); });
  }
};

// ---------- Navigation ----------
const IC = {dash:'🏠',eleves:'🧒',classes:'🏫',matieres:'📚',notes:'⭐',paiements:'💰',devoirs:'✏️',messages:'💌',enseignants:'👩‍🏫',salles:'🚪',edt:'🗓️',absences:'📝',preins:'🎒'};
IC.users = '🔑';
IC.ecoles = '🏢';
function go(t) {
  if (!TABS[t][1].split(' ').includes(role)) t = 'dash';
  tab = t;
  $('#nav').innerHTML = Object.entries(TABS).filter(([, v]) => v[1].split(' ').includes(role)).map(([k, v]) => `<button data-t="${k}" aria-current="${k == t}">${IC[k] || ''} ${v[0]}</button>`).join('');
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => go(b.dataset.t));
  VIEWS[t]();
}
// ---------- Documents imprimables (bulletin, reçu) ----------
function doc(html) { $('#frm').innerHTML = `<div>${html}</div><div class="bar noprint"><button class="btn alt" value="x" formnovalidate>Fermer</button><button class="btn" type="button" onclick="window.print()">Imprimer / enregistrer en PDF</button></div>`; $('#dlg').showModal(); }
function bulletin(id) {
  const e = db.eleves.find(x => x.id == id);
  const rows = live('notes').filter(n => n.eleve == id).map(n => { const m = db.matieres.find(x => x.id == n.matiere) || {}; return `<tr><td>${esc(m.nom)}</td><td>${m.coef}</td><td>${n.note} / 20</td></tr>`; }).join('');
  doc(`<h3>Bulletin – ${esc(e.nom)}</h3><p>${esc(nom('classes', e.classe))} · ${AN}</p><table><thead><tr><th>Matière</th><th>Coef.</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table><p><b>Moyenne générale : ${moyenne(id)} / 20</b><br>Absences : ${live('absences').filter(a => a.eleve == id).length}</p>`);
}
// Contrôle de saisie des messages : objet 3-100 caractères, message 5-1000 caractères
function msgErr(d, f) {
  d.objet = d.objet.trim().replace(/\s+/g, ' '); d.corps = d.corps.trim();
  const m = d.objet.length < 3 ? ['objet', 'L’objet doit contenir au moins 3 caractères.'] : d.corps.length < 5 ? ['corps', 'Le message doit contenir au moins 5 caractères.'] : null;
  if (m) { f.elements[m[0]].focus(); toast(m[1]); return true; }
}
function relance(id) { db.messages.push({id: ++db.n, de:'admin', a:'parent', objet:'Relance de paiement – ' + nom('eleves', id), corps:`Solde restant à régler : ${solde(id)} DT.`, date: today(), masque: []}); journal(0, 'messages', '', 'Relance envoyée'); save(); toast('Relance envoyée au parent.'); }
function recu(id) {
  const p = db.paiements.find(x => x.id == id);
  doc(`<h3>Reçu REC-${p.id}</h3><p>École Abou el Kacem Chebbi</p><p>Élève : ${esc(nom('eleves', p.eleve))}<br>Montant : ${p.montant} DT<br>Mode : ${p.mode}<br>Date : ${p.date}<br>Solde restant : ${solde(p.eleve)} DT</p>`);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-b]'), r = e.target.closest('[data-rc]'); if (b) bulletin(b.dataset.b); if (r) recu(r.dataset.rc);
  const v = e.target.closest('[data-vu]'), rl = e.target.closest('[data-rl]');
  if (v) { db.devoirs.find(x => x.id == v.dataset.vu).vu = true; save(); go('devoirs'); }
  if (rl) relance(rl.dataset.rl); });

// ---------- Connexion (démo : comptes fixes côté navigateur) ----------
const USERS_SUPPRIME = 0; // les comptes sont maintenant dans db.users (module Utilisateurs)
function showLogin(choice) {
  ME = null; $('#who').innerHTML = ''; $('#nav').innerHTML = '';
  $('#main').innerHTML = `<h2>${(ESP[choice] || ESP_SA)[0]} Espace ${(ESP[choice] || ESP_SA)[1]}</h2><form id="lf" class="msg"><label>Identifiant<input name="u" required autocomplete="username"></label><label>Mot de passe<input name="p" type="password" required autocomplete="current-password"></label><button class="btn">Se connecter</button></form><p class="note">${choice == 'admin' && CUR.id == 1 ? 'Compte administrateur de démonstration : admin / admin123.' : choice == 'superadmin' ? 'Compte propriétaire de la plateforme : superadmin / super123.' : ''}</p><p><button type="button" class="btn alt" id="back">← Changer d’espace</button> ${choice != 'admin' && choice != 'superadmin' ? '<button type="button" class="btn alt" id="reg">Créer un compte</button>' : ''}</p>`;
  $('#lf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.u = d.u.trim().toLowerCase(); const u = db.users.find(x => !x.del && x.u == d.u && x.p == d.p);
    if (d.p.length < 6) return toast('Le mot de passe doit contenir au moins 6 caractères.');
    if (!u) return toast('Identifiant ou mot de passe incorrect.');
    if (u.r != choice) return toast('Ce compte n’appartient pas à cet espace.');
    if (u.statut == 'En attente') return toast('Compte en attente de validation par l’administration.');
    ME = {...u, el: ((db.eleves || []).find(e => !e.del && e.nom == u.par) || {}).id}; role = u.r; $('#who').innerHTML = `${ROLES[role]} <button class="btn alt" id="out" style="background:#fff">Déconnexion</button>`; $('#out').onclick = showEcoles; go('dash'); };
  $('#back').onclick = choice == 'superadmin' ? showEcoles : showChoice; if ($('#reg')) $('#reg').onclick = () => showSignup(choice);
}
// ---------- Choix de l’espace et création de compte ----------
const ESP = {admin:['👑','Administration'],enseignant:['👩‍🏫','Enseignant'],parent:['👨‍👩‍👧','Parent'],eleve:['🧒','Élève'],comptable:['💰','Comptable']};
function showChoice() {
  ME = null; role = 'admin'; $('#who').innerHTML = ''; $('#nav').innerHTML = '';
  $('#main').innerHTML = `<h2>${esc(CUR.nom)} – choisissez votre espace</h2><div class="stats">${Object.entries(ESP).map(([k, v]) => `<button class="stat" data-esp="${k}" style="cursor:pointer;font:inherit;color:inherit;text-align:center"><b>${v[0]}</b><span>${v[1]}</span></button>`).join('')}</div>`;
  document.querySelectorAll('[data-esp]').forEach(b => b.onclick = () => showLogin(b.dataset.esp));
  $('#main').insertAdjacentHTML('beforeend', '<p><button class="btn alt" id="chg">← Changer d’école</button></p>'); $('#chg').onclick = showEcoles;
}
function showSignup(choice) {
  const lab = {parent: 'Votre nom tel qu’il figure dans le dossier de l’école (ex. Mme Ben Salah)', eleve: 'Nom complet de l’élève'}[choice];
  const fld = (n, l, t) => `<label>${l}<input name="${n}" type="${t || 'text'}" maxlength="60"><small class="err" id="e-${n}" role="alert"></small></label>`;
  $('#main').innerHTML = `<h2>${ESP[choice][0]} Créer un compte ${ESP[choice][1].toLowerCase()}</h2><form id="sf" class="msg" novalidate>${fld('u', 'Identifiant')}${fld('p', 'Mot de passe', 'password')}${fld('p2', 'Confirmer le mot de passe', 'password')}${lab ? fld('par', lab) : ''}<button class="btn">Créer mon compte</button> <button type="button" class="btn alt" id="bk">Retour</button></form><p class="note">${lab ? 'Votre compte est créé tout de suite si le nom correspond au dossier de l’école.' : 'Ce compte doit être validé par l’administration avant la première connexion.'}</p>`;
  $('#bk').onclick = () => showLogin(choice);
  $('#sf').onsubmit = ev => {
    ev.preventDefault(); const f = ev.target, raw = Object.fromEntries(new FormData(f));
    const d = {u: raw.u.trim(), p: raw.p, r: choice, par: (raw.par || '').trim().replace(/\s+/g, ' ')};
    const errs = check('users', d, null);
    if (raw.p2 != raw.p) errs.p2 = 'Les deux mots de passe sont différents.';
    f.querySelectorAll('.err').forEach(s => s.textContent = '');
    if (Object.keys(errs).length) { Object.entries(errs).forEach(([k, m]) => { const s = f.querySelector('#e-' + k); if (s) s.textContent = '⚠ ' + m; }); return toast('Corrigez les champs signalés.'); }
    const o = {id: ++db.n, ...d}; if (!lab) o.statut = 'En attente';
    db.users.push(o); save();
    toast(lab ? 'Compte créé : vous pouvez vous connecter.' : 'Demande envoyée : attendez la validation de l’administration.'); showLogin(choice);
  };
}
// ---------- Page d’accueil SaaS : choix de l’école cliente ----------
const ESP_SA = ['🏢', 'Plateforme SaaS'];
function showEcoles() {
  ME = null; role = 'admin'; $('#who').innerHTML = ''; $('#nav').innerHTML = ''; $('#ttl').textContent = '🎒 Plateforme de gestion scolaire';
  let r; try { r = JSON.parse(localStorage.getItem('saas-reg')) || regDefault(); } catch (e) { r = regDefault(); }
  const act = r.ecoles.filter(x => !x.del && x.statut == 'Actif'), st = 'cursor:pointer;font:inherit;color:inherit;text-align:center';
  $('#main').innerHTML = `<h2>Choisissez votre école</h2><div class="stats">${act.map(x => `<button class="stat" data-ec="${x.id}" style="${st}"><b>🏫</b><span>${esc(x.nom)}<br><small>${esc(x.ville)}</small></span></button>`).join('')}<button class="stat" id="sa" style="${st}"><b>🏢</b><span>Plateforme SaaS</span></button></div><p class="note">Chaque école dispose de ses propres données, séparées de celles des autres écoles.</p>`;
  document.querySelectorAll('[data-ec]').forEach(b => b.onclick = () => { enter(act.find(x => x.id == b.dataset.ec)); showChoice(); });
  $('#sa').onclick = () => { load('saas-reg', regDefault); CUR = {id: 0, nom: 'Plateforme SaaS', plan: ''}; showLogin('superadmin'); };
}
showEcoles();

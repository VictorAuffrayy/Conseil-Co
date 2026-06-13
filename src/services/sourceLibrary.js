// ════════════════════════════════════════════════════════════════════════════
// BIBLIOTHÈQUE DE SOURCES RSS — Organisée par catégories avec mots-clés de matching
// Utilisée pour matcher automatiquement des sources pertinentes à partir
// d'une description libre saisie par l'utilisateur.
// ════════════════════════════════════════════════════════════════════════════

export const SOURCE_LIBRARY = [

  // ─── SPORTS ──────────────────────────────────────────────────────────────
  {
    category: 'Sport — Généraliste',
    matchKeywords: ['sport', 'sportif', 'compétition', 'athlète', 'championnat', 'olympique', 'jo', 'jeux olympiques'],
    sources: [
      { name: "L'Équipe", url: 'https://www.lequipe.fr/rss/une.xml' },
      { name: 'RMC Sport', url: 'https://rmcsport.bfmtv.com/rss/' },
      { name: 'Eurosport', url: 'https://www.eurosport.fr/rss.xml' },
      { name: 'France Info Sport', url: 'https://www.francetvinfo.fr/sports.rss' },
    ],
  },
  {
    category: 'Football',
    matchKeywords: ['football', 'foot', 'ligue 1', 'ligue 2', 'champions league', 'mercato', 'transfert', 'psg', 'om', 'fff', 'coupe de france', 'ballon d\'or'],
    sources: [
      { name: "L'Équipe - Football", url: 'https://www.lequipe.fr/rss/actu_rubrique-Football.xml' },
      { name: 'RMC Sport Football', url: 'https://rmcsport.bfmtv.com/rss/football/' },
      { name: 'Foot Mercato', url: 'https://www.footmercato.net/rss' },
      { name: 'Maxifoot', url: 'https://www.maxifoot.fr/rss.xml' },
    ],
  },
  {
    category: 'Rugby',
    matchKeywords: ['rugby', 'top 14', 'six nations', 'ffr', 'mêlée', 'ovalie'],
    sources: [
      { name: "L'Équipe - Rugby", url: 'https://www.lequipe.fr/rss/actu_rubrique-Rugby.xml' },
      { name: 'Midi Olympique', url: 'https://www.midi-olympique.fr/rss' },
    ],
  },
  {
    category: 'Tennis',
    matchKeywords: ['tennis', 'roland garros', 'wimbledon', 'atp', 'wta', 'open'],
    sources: [
      { name: "L'Équipe - Tennis", url: 'https://www.lequipe.fr/rss/actu_rubrique-Tennis.xml' },
      { name: 'Eurosport Tennis', url: 'https://www.eurosport.fr/tennis/rss.xml' },
    ],
  },
  {
    category: 'Judo & Arts martiaux',
    matchKeywords: ['judo', 'ijf', 'tatami', 'ippon', 'judoka', 'karaté', 'taekwondo', 'arts martiaux', 'mma', 'jiu-jitsu', 'ceinture noire', 'grand slam judo'],
    sources: [
      { name: "L'Équipe - Judo", url: 'https://www.lequipe.fr/rss/actu_rubrique-Judo.xml' },
      { name: 'FFJudo', url: 'https://www.ffjudo.com/feed' },
    ],
  },
  {
    category: 'Cyclisme',
    matchKeywords: ['cyclisme', 'vélo', 'tour de france', 'cycliste', 'uci', 'peloton'],
    sources: [
      { name: "L'Équipe - Cyclisme", url: 'https://www.lequipe.fr/rss/actu_rubrique-Cyclisme.xml' },
      { name: 'Vélo 101', url: 'https://www.velo101.com/rss/news.xml' },
    ],
  },
  {
    category: 'Basketball',
    matchKeywords: ['basket', 'basketball', 'nba', 'euroligue', 'ffbb'],
    sources: [
      { name: "L'Équipe - Basket", url: 'https://www.lequipe.fr/rss/actu_rubrique-Basket.xml' },
      { name: 'Basket USA', url: 'https://www.basketusa.com/feed/' },
    ],
  },
  {
    category: 'Sports mécaniques',
    matchKeywords: ['f1', 'formule 1', 'moto gp', 'motogp', 'rallye', 'course automobile', 'wrc', 'nascar'],
    sources: [
      { name: "L'Équipe - F1", url: 'https://www.lequipe.fr/rss/actu_rubrique-Formule-1.xml' },
      { name: 'Motorsport.com', url: 'https://fr.motorsport.com/rss/f1/news/' },
    ],
  },
  {
    category: 'Sports d\'hiver',
    matchKeywords: ['ski', 'snowboard', 'biathlon', 'sports d\'hiver', 'coupe du monde de ski', 'patinage'],
    sources: [
      { name: "L'Équipe - Ski", url: 'https://www.lequipe.fr/rss/actu_rubrique-Ski-Alpin.xml' },
    ],
  },
  {
    category: 'Natation & sports aquatiques',
    matchKeywords: ['natation', 'nageur', 'piscine', 'water-polo', 'plongeon', 'ffn'],
    sources: [
      { name: "L'Équipe - Natation", url: 'https://www.lequipe.fr/rss/actu_rubrique-Natation.xml' },
    ],
  },
  {
    category: 'Esport & Gaming compétitif',
    matchKeywords: ['esport', 'e-sport', 'league of legends', 'lol', 'csgo', 'cs2', 'valorant', 'esl', 'tournoi gaming', 'lck', 'lec', 'lcs', 't1', 'gen.g', 'worlds', 'overwatch', 'starcraft', 'faker', 'riot games'],
    sources: [
      { name: 'Esport Mag', url: 'https://www.esportmag.fr/feed' },
      { name: 'Millenium', url: 'https://www.millenium.org/rss' },
      { name: 'The Esports Advocate', url: 'https://esportsadvocate.com/feed' },
      { name: 'Dot Esports', url: 'https://dotesports.com/feed' },
      { name: 'Esports Insider', url: 'https://esportsinsider.com/feed' },
    ],
  },
  {
    category: 'Corée du Sud — Actualités & Culture',
    matchKeywords: ['corée', 'coréen', 'coréenne', 'séoul', 'corée du sud', 'k-pop', 'kpop', 'k-drama', 'samsung', 'lg', 'hyundai'],
    sources: [
      { name: 'Korea Herald', url: 'https://www.koreaherald.com/rss/020000000000.xml' },
      { name: 'Korea JoongAng Daily', url: 'https://koreajoongangdaily.joins.com/section/rss/feed.xml' },
      { name: 'Yonhap News', url: 'https://en.yna.co.kr/RSS/news.xml' },
    ],
  },

  // ─── TECH / NUMÉRIQUE ────────────────────────────────────────────────────
  {
    category: 'Intelligence artificielle',
    matchKeywords: ['ia', 'intelligence artificielle', 'llm', 'gpt', 'chatgpt', 'mistral', 'claude', 'machine learning', 'deep learning', 'openai', 'anthropic', 'agent ia', 'deepseek'],
    sources: [
      { name: 'Le Monde IA', url: 'https://www.lemonde.fr/intelligence-artificielle/rss_full.xml' },
      { name: 'Actu IA', url: 'https://www.actuia.com/feed/' },
      { name: 'Le Big Data', url: 'https://www.lebigdata.fr/feed' },
    ],
  },
  {
    category: 'High-tech & Gadgets',
    matchKeywords: ['high-tech', 'smartphone', 'iphone', 'android', 'gadget', 'objet connecté', 'technologie', 'tech news'],
    sources: [
      { name: '01net', url: 'https://www.01net.com/rss/info/flux-rss/flux-toutes-les-actualites/' },
      { name: 'Frandroid', url: 'https://www.frandroid.com/feed' },
      { name: 'Les Numériques', url: 'https://www.lesnumeriques.com/rss.xml' },
    ],
  },
  {
    category: 'Cybersécurité',
    matchKeywords: ['cybersécurité', 'sécurité informatique', 'ransomware', 'piratage', 'vulnérabilité', 'cyberattaque', 'phishing', 'malware', 'hacker', 'cnil', 'rgpd', 'nis2'],
    sources: [
      { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
      { name: 'CERT-FR', url: 'https://www.cert.ssi.gouv.fr/feed/' },
      { name: 'Silicon.fr', url: 'https://www.silicon.fr/feed' },
    ],
  },
  {
    category: 'Développement & Programmation',
    matchKeywords: ['développeur', 'programmation', 'code', 'javascript', 'python', 'open source', 'github', 'devops', 'logiciel'],
    sources: [
      { name: 'Developpez.com', url: 'https://www.developpez.com/index/rss' },
      { name: 'Korben', url: 'https://korben.info/feed' },
    ],
  },
  {
    category: 'Jeux vidéo',
    matchKeywords: ['jeux vidéo', 'gaming', 'playstation', 'xbox', 'nintendo', 'steam', 'jeu vidéo', 'console'],
    sources: [
      { name: 'Jeuxvideo.com', url: 'https://www.jeuxvideo.com/rss/rss.xml' },
      { name: 'JV Tech', url: 'https://www.jeuxvideo.com/rss/rss-news-jvtech.xml' },
    ],
  },
  {
    category: 'Espace & Astronomie',
    matchKeywords: ['espace', 'astronomie', 'nasa', 'spacex', 'fusée', 'satellite', 'astrophysique', 'planète', 'galaxie'],
    sources: [
      { name: 'Futura Sciences - Espace', url: 'https://www.futura-sciences.com/rss/espace/actualites.xml' },
      { name: 'Ciel et Espace', url: 'https://www.cieletespace.fr/feed' },
    ],
  },

  // ─── ÉCONOMIE / FINANCE / ENTREPRISE ────────────────────────────────────
  {
    category: 'Finance & Marchés',
    matchKeywords: ['bourse', 'marché financier', 'action', 'cac 40', 'investissement', 'finance', 'taux d\'intérêt', 'wall street', 'obligations', 'crypto', 'bitcoin'],
    sources: [
      { name: 'Les Echos Finance', url: 'https://www.lesechos.fr/rss/rss_finance_marches.xml' },
      { name: 'Boursorama', url: 'https://www.boursorama.com/rss/actualites/economie.xml' },
    ],
  },
  {
    category: 'Économie générale',
    matchKeywords: ['économie', 'pib', 'inflation', 'croissance', 'récession', 'politique économique', 'banque centrale', 'bce'],
    sources: [
      { name: 'Les Echos', url: 'https://www.lesechos.fr/rss/rss_une.xml' },
      { name: 'La Tribune', url: 'https://www.latribune.fr/rss/rubriques/economie.html' },
    ],
  },
  {
    category: 'Startups & Innovation',
    matchKeywords: ['startup', 'innovation', 'levée de fonds', 'french tech', 'licorne', 'incubateur', 'entrepreneur', 'venture capital'],
    sources: [
      { name: 'Maddyness', url: 'https://www.maddyness.com/feed/' },
      { name: 'Frenchweb', url: 'https://www.frenchweb.fr/feed' },
    ],
  },
  {
    category: 'Immobilier',
    matchKeywords: ['immobilier', 'logement', 'loyer', 'achat immobilier', 'crédit immobilier', 'foncier', 'notaire'],
    sources: [
      { name: 'Business Immo', url: 'https://www.businessimmo.com/rss' },
      { name: 'SeLoger Actu', url: 'https://edito.seloger.com/feed' },
    ],
  },
  {
    category: 'RH & Emploi',
    matchKeywords: ['rh', 'ressources humaines', 'recrutement', 'emploi', 'télétravail', 'formation professionnelle', 'management', 'travail'],
    sources: [
      { name: 'Focus RH', url: 'https://www.focusrh.com/feed/' },
      { name: 'RH Info', url: 'https://www.rh-info.fr/feed/' },
    ],
  },
  {
    category: 'Droit & Juridique',
    matchKeywords: ['droit', 'juridique', 'loi', 'tribunal', 'avocat', 'justice', 'jurisprudence', 'réglementation'],
    sources: [
      { name: 'Village de la Justice', url: 'https://www.village-justice.com/articles/rss.php' },
    ],
  },
  {
    category: 'E-commerce & Retail',
    matchKeywords: ['e-commerce', 'commerce en ligne', 'retail', 'marketplace', 'amazon', 'vente en ligne'],
    sources: [
      { name: 'JDN E-commerce', url: 'https://www.journaldunet.com/ebusiness/commerce/rss/' },
    ],
  },
  {
    category: 'Marketing & Communication',
    matchKeywords: ['marketing', 'publicité', 'communication', 'seo', 'growth', 'brand', 'campagne marketing'],
    sources: [
      { name: 'Blog du Modérateur', url: 'https://www.blogdumoderateur.com/feed/' },
    ],
  },

  // ─── SOCIÉTÉ / ACTUALITÉ GÉNÉRALE ────────────────────────────────────────
  {
    category: 'Actualité France',
    matchKeywords: ['politique française', 'gouvernement', 'élections', 'assemblée nationale', 'sénat', 'premier ministre', 'président de la république', 'matignon', 'élysée'],
    sources: [
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss' },
      { name: 'Le Monde - Une', url: 'https://www.lemonde.fr/rss/une.xml' },
    ],
  },
  {
    category: 'International & Géopolitique',
    matchKeywords: ['géopolitique', 'international', 'guerre', 'diplomatie', 'union européenne', 'ue', 'otan', 'sanctions', 'relations internationales'],
    sources: [
      { name: 'Les Echos Monde', url: 'https://www.lesechos.fr/rss/rss_monde.xml' },
      { name: 'France Info Monde', url: 'https://www.francetvinfo.fr/monde.rss' },
    ],
  },
  {
    category: 'Environnement & Climat',
    matchKeywords: ['environnement', 'climat', 'réchauffement climatique', 'biodiversité', 'écologie', 'pollution', 'cop'],
    sources: [
      { name: 'Novethic', url: 'https://www.novethic.fr/rss.xml' },
      { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend' },
    ],
  },
  {
    category: 'ESG & RSE',
    matchKeywords: ['esg', 'rse', 'développement durable', 'carbone', 'csrd', 'responsabilité sociale', 'green', 'durabilité'],
    sources: [
      { name: 'Novethic', url: 'https://www.novethic.fr/rss.xml' },
    ],
  },
  {
    category: 'Énergie',
    matchKeywords: ['énergie', 'électricité', 'nucléaire', 'solaire', 'éolien', 'hydrogène', 'transition énergétique', 'gaz', 'pétrole'],
    sources: [
      { name: 'Connaissance des Énergies', url: 'https://www.connaissancedesenergies.org/feed' },
      { name: 'Révolution Énergétique', url: 'https://www.revolution-energetique.com/feed/' },
    ],
  },

  // ─── CULTURE / LOISIRS ───────────────────────────────────────────────────
  {
    category: 'Cinéma & Séries',
    matchKeywords: ['cinéma', 'film', 'série', 'netflix', 'box office', 'acteur', 'réalisateur', 'streaming', 'sortie cinéma'],
    sources: [
      { name: 'Allociné', url: 'https://www.allocine.fr/rss/news.xml' },
      { name: 'Première', url: 'https://www.premiere.fr/rss' },
    ],
  },
  {
    category: 'Musique',
    matchKeywords: ['musique', 'album', 'concert', 'chanteur', 'artiste musical', 'streaming musical', 'spotify'],
    sources: [
      { name: 'Les Inrocks Musique', url: 'https://www.lesinrocks.com/musique/feed/' },
    ],
  },
  {
    category: 'Littérature & Livres',
    matchKeywords: ['livre', 'roman', 'littérature', 'auteur', 'édition', 'best-seller', 'prix littéraire'],
    sources: [
      { name: 'ActuaLitté', url: 'https://actualitte.com/feed' },
    ],
  },
  {
    category: 'Gastronomie & Restaurants',
    matchKeywords: ['restaurant', 'chef', 'gastronomie', 'cuisine', 'recette', 'étoile michelin', 'food'],
    sources: [
      { name: '750g', url: 'https://www.750g.com/les_actus.rss' },
    ],
  },
  {
    category: 'Voyage & Tourisme',
    matchKeywords: ['voyage', 'tourisme', 'destination', 'vol', 'hôtel', 'aventure', 'séjour', 'vacances'],
    sources: [
      { name: 'Géo Voyage', url: 'https://www.geo.fr/voyage/rss.xml' },
    ],
  },
  {
    category: 'Mode & Luxe',
    matchKeywords: ['mode', 'luxe', 'fashion', 'lvmh', 'hermès', 'défilé', 'créateur', 'haute couture'],
    sources: [
      { name: 'Fashion Network', url: 'https://fr.fashionnetwork.com/rss/news.xml' },
    ],
  },
  {
    category: 'Design & UX',
    matchKeywords: ['design', 'ux', 'ui', 'expérience utilisateur', 'interface', 'figma', 'graphisme'],
    sources: [
      { name: 'Journal du CM', url: 'https://www.journalducm.com/feed/' },
    ],
  },

  // ─── SCIENCES / SANTÉ ────────────────────────────────────────────────────
  {
    category: 'Santé & Médecine',
    matchKeywords: ['santé', 'médecine', 'hôpital', 'médical', 'maladie', 'traitement', 'patient', 'biotech', 'pharmaceutique'],
    sources: [
      { name: "What's Up Doc", url: 'https://www.whatsupdoc-lemag.fr/rss.xml' },
      { name: 'Futura Sciences - Santé', url: 'https://www.futura-sciences.com/rss/sante/actualites.xml' },
    ],
  },
  {
    category: 'Sciences générales',
    matchKeywords: ['science', 'recherche scientifique', 'découverte', 'laboratoire', 'physique', 'biologie', 'chimie'],
    sources: [
      { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml' },
      { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml' },
    ],
  },
  {
    category: 'Psychologie & Bien-être',
    matchKeywords: ['psychologie', 'bien-être', 'développement personnel', 'santé mentale', 'méditation', 'thérapie'],
    sources: [
      { name: 'Psychologies.com', url: 'https://www.psychologies.com/rss.xml' },
    ],
  },

  // ─── INDUSTRIE / LOGISTIQUE ──────────────────────────────────────────────
  {
    category: 'Industrie & Manufacturing',
    matchKeywords: ['industrie', 'usine', 'manufacturing', 'production industrielle', 'robot', 'automatisation', 'lean'],
    sources: [
      { name: "L'Usine Nouvelle", url: 'https://www.usinenouvelle.com/rss/all' },
    ],
  },
  {
    category: 'Logistique & Supply Chain',
    matchKeywords: ['logistique', 'supply chain', 'transport', 'entrepôt', 'livraison', 'chaîne d\'approvisionnement'],
    sources: [
      { name: 'Voxlog', url: 'https://www.voxlog.fr/rss.xml' },
    ],
  },
  {
    category: 'Agriculture',
    matchKeywords: ['agriculture', 'agricole', 'agriculteur', 'exploitation agricole', 'élevage', 'agroalimentaire'],
    sources: [
      { name: 'La France Agricole', url: 'https://www.lafranceagricole.fr/rss' },
    ],
  },
  {
    category: 'Automobile',
    matchKeywords: ['automobile', 'voiture', 'véhicule électrique', 'constructeur automobile', 'tesla', 'renault', 'peugeot'],
    sources: [
      { name: 'Caradisiac', url: 'https://www.caradisiac.com/rss/actualite.xml' },
    ],
  },

  // ─── DIVERS / NICHE ──────────────────────────────────────────────────────
  {
    category: 'Animaux & Nature',
    matchKeywords: ['animaux', 'faune', 'nature', 'biodiversité animale', 'zoo', 'espèce protégée'],
    sources: [
      { name: 'Futura Sciences - Animaux', url: 'https://www.futura-sciences.com/rss/planete/actualites.xml' },
    ],
  },
  {
    category: 'Photographie',
    matchKeywords: ['photographie', 'photo', 'appareil photo', 'objectif', 'reflex'],
    sources: [
      { name: 'Phototrend', url: 'https://www.phototrend.fr/feed/' },
    ],
  },
  {
    category: 'Bricolage & Maison',
    matchKeywords: ['bricolage', 'diy', 'rénovation', 'décoration', 'maison', 'jardinage'],
    sources: [
      { name: 'Système D', url: 'https://www.systemed.fr/rss' },
    ],
  },

  // ═══ SPORTS — DISCIPLINES SUPPLÉMENTAIRES ════════════════════════════════
  {
    category: 'Handball',
    matchKeywords: ['handball', 'hand', 'lnh', 'ffhandball', 'ehf'],
    sources: [
      { name: "L'Équipe - Handball", url: 'https://www.lequipe.fr/rss/actu_rubrique-Hand.xml' },
    ],
  },
  {
    category: 'Volleyball',
    matchKeywords: ['volleyball', 'volley', 'ligue a volley', 'fivb'],
    sources: [
      { name: "L'Équipe - Volley", url: 'https://www.lequipe.fr/rss/actu_rubrique-Volley.xml' },
    ],
  },
  {
    category: 'Athlétisme',
    matchKeywords: ['athlétisme', 'sprint', 'marathon', 'course à pied', 'iaaf', 'world athletics', '100m', 'décathlon'],
    sources: [
      { name: "L'Équipe - Athlétisme", url: 'https://www.lequipe.fr/rss/actu_rubrique-Athletisme.xml' },
    ],
  },
  {
    category: 'Golf',
    matchKeywords: ['golf', 'pga', 'ryder cup', 'masters golf', 'golfeur'],
    sources: [
      { name: "L'Équipe - Golf", url: 'https://www.lequipe.fr/rss/actu_rubrique-Golf.xml' },
    ],
  },
  {
    category: 'Boxe',
    matchKeywords: ['boxe', 'boxeur', 'boxing', 'wbc', 'wba', 'combat de boxe'],
    sources: [
      { name: "L'Équipe - Boxe", url: 'https://www.lequipe.fr/rss/actu_rubrique-Boxe.xml' },
    ],
  },
  {
    category: 'Voile & Nautisme',
    matchKeywords: ['voile', 'régate', 'vendée globe', 'skipper', 'course au large', 'america\'s cup'],
    sources: [
      { name: "L'Équipe - Voile", url: 'https://www.lequipe.fr/rss/actu_rubrique-Voile.xml' },
    ],
  },
  {
    category: 'Équitation',
    matchKeywords: ['équitation', 'cheval', 'dressage', 'saut d\'obstacles', 'concours hippique', 'ffe'],
    sources: [
      { name: "L'Équipe - Équitation", url: 'https://www.lequipe.fr/rss/actu_rubrique-Equitation.xml' },
    ],
  },
  {
    category: 'Escalade & Sports outdoor',
    matchKeywords: ['escalade', 'grimpe', 'trail', 'ultra-trail', 'randonnée', 'alpinisme', 'outdoor'],
    sources: [
      { name: 'Outdoor.fr', url: 'https://www.outdoor.fr/feed' },
    ],
  },
  {
    category: 'Surf & Sports de glisse',
    matchKeywords: ['surf', 'skateboard', 'skate', 'bmx', 'wsl', 'planche à voile', 'kitesurf'],
    sources: [
      { name: 'Surf Session', url: 'https://www.surfsession.com/feed/' },
    ],
  },

  // ═══ PAYS / RÉGIONS ══════════════════════════════════════════════════════
  {
    category: 'États-Unis — Actualités',
    matchKeywords: ['états-unis', 'etats-unis', 'usa', 'amérique', 'washington', 'maison blanche', 'congrès américain', 'trump', 'biden'],
    sources: [
      { name: 'France Info Monde', url: 'https://www.francetvinfo.fr/monde/usa.rss' },
      { name: 'Reuters US', url: 'https://feeds.reuters.com/Reuters/PoliticsNews' },
    ],
  },
  {
    category: 'Royaume-Uni — Actualités',
    matchKeywords: ['royaume-uni', 'angleterre', 'londres', 'brexit', 'downing street', 'uk'],
    sources: [
      { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    ],
  },
  {
    category: 'Allemagne — Actualités',
    matchKeywords: ['allemagne', 'berlin', 'bundestag', 'allemand', 'deutschland'],
    sources: [
      { name: 'Deutsche Welle FR', url: 'https://rss.dw.com/rdf/rss-fr-all' },
    ],
  },
  {
    category: 'Chine — Actualités',
    matchKeywords: ['chine', 'chinois', 'pékin', 'shanghai', 'pcc', 'xi jinping'],
    sources: [
      { name: 'RFI Asie', url: 'https://www.rfi.fr/fr/asie-pacifique/rss' },
    ],
  },
  {
    category: 'Japon — Actualités & Culture',
    matchKeywords: ['japon', 'japonais', 'tokyo', 'japan', 'manga', 'anime', 'otaku', 'yen'],
    sources: [
      { name: 'NHK World', url: 'https://www3.nhk.or.jp/nhkworld/en/news/rss/all.xml' },
      { name: 'Nippon.com FR', url: 'https://www.nippon.com/fr/feed/' },
    ],
  },
  {
    category: 'Afrique — Actualités',
    matchKeywords: ['afrique', 'africain', 'sénégal', 'côte d\'ivoire', 'maroc', 'algérie', 'tunisie', 'nigeria', 'sahel'],
    sources: [
      { name: 'RFI Afrique', url: 'https://www.rfi.fr/fr/afrique/rss' },
      { name: 'Jeune Afrique', url: 'https://www.jeuneafrique.com/feed/' },
    ],
  },
  {
    category: 'Moyen-Orient — Actualités',
    matchKeywords: ['moyen-orient', 'israël', 'palestine', 'gaza', 'liban', 'syrie', 'iran', 'arabie saoudite', 'golfe persique'],
    sources: [
      { name: 'France Info Monde', url: 'https://www.francetvinfo.fr/monde/proche-orient.rss' },
    ],
  },
  {
    category: 'Amérique latine — Actualités',
    matchKeywords: ['amérique latine', 'brésil', 'argentine', 'mexique', 'colombie', 'chili', 'venezuela', 'amérique du sud'],
    sources: [
      { name: 'RFI Amériques', url: 'https://www.rfi.fr/fr/ameriques/rss' },
    ],
  },
  {
    category: 'Inde — Actualités',
    matchKeywords: ['inde', 'indien', 'new delhi', 'mumbai', 'bollywood', 'cricket indien'],
    sources: [
      { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
    ],
  },
  {
    category: 'Belgique — Actualités',
    matchKeywords: ['belgique', 'belge', 'bruxelles', 'wallonie', 'flandre'],
    sources: [
      { name: 'RTBF Info', url: 'https://rss.rtbf.be/article/rss/highlight_rtbfinfo.xml' },
    ],
  },
  {
    category: 'Suisse — Actualités',
    matchKeywords: ['suisse', 'genève', 'zurich', 'lausanne', 'helvétique'],
    sources: [
      { name: 'RTS Info', url: 'https://www.rts.ch/info/rss/' },
    ],
  },
  {
    category: 'Canada & Québec — Actualités',
    matchKeywords: ['canada', 'québec', 'montréal', 'ontario', 'canadien', 'québécois'],
    sources: [
      { name: 'Radio-Canada', url: 'https://ici.radio-canada.ca/rss/4159' },
    ],
  },

  // ═══ ÉCONOMIE / SECTEURS SUPPLÉMENTAIRES ═════════════════════════════════
  {
    category: 'Banques & Assurance',
    matchKeywords: ['banque', 'assurance', 'crédit', 'bancaire', 'fintech', 'assureur', 'bnp paribas', 'société générale'],
    sources: [
      { name: 'L\'Argus de l\'Assurance', url: 'https://www.argusdelassurance.com/rss' },
    ],
  },
  {
    category: 'Cryptomonnaies & Blockchain',
    matchKeywords: ['crypto', 'cryptomonnaie', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'web3', 'token', 'altcoin', 'defi'],
    sources: [
      { name: 'Cointribune', url: 'https://www.cointribune.com/feed/' },
      { name: 'Journal du Coin', url: 'https://journalducoin.com/feed/' },
    ],
  },
  {
    category: 'Aviation & Aéronautique',
    matchKeywords: ['aviation', 'avion', 'aéronautique', 'airbus', 'boeing', 'aéroport', 'compagnie aérienne', 'pilote'],
    sources: [
      { name: 'Air Journal', url: 'https://www.air-journal.fr/feed' },
    ],
  },
  {
    category: 'Défense & Armée',
    matchKeywords: ['défense', 'armée', 'militaire', 'otan', 'forces armées', 'ministère des armées', 'armement'],
    sources: [
      { name: 'Opex360', url: 'https://www.opex360.com/feed/' },
    ],
  },
  {
    category: 'Construction & BTP',
    matchKeywords: ['construction', 'btp', 'chantier', 'bâtiment', 'travaux publics', 'génie civil'],
    sources: [
      { name: 'Le Moniteur', url: 'https://www.lemoniteur.fr/rss/une.xml' },
    ],
  },
  {
    category: 'Télécoms',
    matchKeywords: ['télécom', 'opérateur mobile', 'orange', 'sfr', 'bouygues telecom', 'free mobile', '5g', 'fibre'],
    sources: [
      { name: 'Univers Freebox', url: 'https://www.universfreebox.com/feed' },
    ],
  },
  {
    category: 'Pharmacie & Industrie pharmaceutique',
    matchKeywords: ['pharmacie', 'pharmaceutique', 'médicament', 'laboratoire pharmaceutique', 'sanofi', 'big pharma', 'vaccin'],
    sources: [
      { name: 'Le Quotidien du Pharmacien', url: 'https://www.lequotidiendupharmacien.fr/rss' },
    ],
  },
  {
    category: 'Distribution & Grande consommation',
    matchKeywords: ['grande distribution', 'supermarché', 'hypermarché', 'carrefour', 'leclerc', 'fmcg', 'grande consommation'],
    sources: [
      { name: 'LSA Conso', url: 'https://www.lsa-conso.fr/rss' },
    ],
  },

  // ═══ CULTURE / LOISIRS SUPPLÉMENTAIRES ═══════════════════════════════════
  {
    category: 'Théâtre & Spectacle vivant',
    matchKeywords: ['théâtre', 'spectacle vivant', 'pièce de théâtre', 'comédie musicale', 'opéra', 'danse contemporaine'],
    sources: [
      { name: 'La Terrasse', url: 'https://www.journal-laterrasse.fr/feed/' },
    ],
  },
  {
    category: 'Art & Expositions',
    matchKeywords: ['art contemporain', 'exposition', 'musée', 'galerie d\'art', 'artiste peintre', 'biennale', 'sculpture'],
    sources: [
      { name: 'Connaissance des Arts', url: 'https://www.connaissancedesarts.com/feed/' },
    ],
  },
  {
    category: 'BD & Manga',
    matchKeywords: ['bande dessinée', 'bd', 'manga', 'comics', 'angoulême', 'dessinateur bd'],
    sources: [
      { name: 'ActuaBD', url: 'https://www.actuabd.com/spip.php?page=backend' },
    ],
  },
  {
    category: 'Vin & Œnologie',
    matchKeywords: ['vin', 'œnologie', 'vigneron', 'vignoble', 'sommelier', 'appellation', 'champagne', 'bordeaux vin'],
    sources: [
      { name: 'Terre de Vins', url: 'https://www.terredevins.com/feed' },
    ],
  },
  {
    category: 'Bière & Spiritueux',
    matchKeywords: ['bière', 'brasserie', 'whisky', 'spiritueux', 'cocktail', 'craft beer'],
    sources: [
      { name: 'L\'Amateur de Bière', url: 'https://www.lamateurdebiere.com/feed' },
    ],
  },
  {
    category: 'Astrologie & Spiritualité',
    matchKeywords: ['astrologie', 'horoscope', 'spiritualité', 'méditation spirituelle', 'yoga', 'bouddhisme', 'tarot'],
    sources: [
      { name: 'Psychologies.com Spiritualité', url: 'https://www.psychologies.com/rss.xml' },
    ],
  },
  {
    category: 'Festivals & Événements culturels',
    matchKeywords: ['festival', 'cannes', 'fête de la musique', 'avignon', 'événement culturel'],
    sources: [
      { name: 'Les Inrocks', url: 'https://www.lesinrocks.com/feed/' },
    ],
  },
  {
    category: 'Podcasts & Audio',
    matchKeywords: ['podcast', 'audio digital', 'baladodiffusion', 'émission audio'],
    sources: [
      { name: 'Le Monde Podcasts', url: 'https://www.lemonde.fr/podcasts/rss_full.xml' },
    ],
  },

  // ═══ SCIENCES / SANTÉ SUPPLÉMENTAIRES ═════════════════════════════════════
  {
    category: 'Nutrition & Alimentation',
    matchKeywords: ['nutrition', 'alimentation saine', 'régime alimentaire', 'diététique', 'nutritionniste', 'aliment'],
    sources: [
      { name: 'Doctissimo Nutrition', url: 'https://www.doctissimo.fr/rss/nutrition.xml' },
    ],
  },
  {
    category: 'Sommeil & Médecine du sommeil',
    matchKeywords: ['sommeil', 'insomnie', 'apnée du sommeil', 'troubles du sommeil', 'chronobiologie'],
    sources: [
      { name: 'Réseau Morphée', url: 'https://reseau-morphee.fr/feed' },
    ],
  },
  {
    category: 'Climatologie & Météo',
    matchKeywords: ['météo', 'météorologie', 'climatologie', 'prévisions météo', 'tempête', 'canicule', 'météo france'],
    sources: [
      { name: 'Météo France Actu', url: 'https://meteofrance.com/rss/vigilance.xml' },
    ],
  },
  {
    category: 'Biologie & Génétique',
    matchKeywords: ['biologie', 'génétique', 'adn', 'génome', 'biotechnologie', 'cellule', 'crispr'],
    sources: [
      { name: 'Futura Sciences - Biologie', url: 'https://www.futura-sciences.com/rss/biologie/actualites.xml' },
    ],
  },
  {
    category: 'Physique & Chimie',
    matchKeywords: ['physique quantique', 'chimie', 'particule', 'cern', 'réaction chimique', 'physicien'],
    sources: [
      { name: 'Futura Sciences - Physique', url: 'https://www.futura-sciences.com/rss/physique/actualites.xml' },
    ],
  },
  {
    category: 'Archéologie & Histoire',
    matchKeywords: ['archéologie', 'fouille archéologique', 'histoire ancienne', 'antiquité', 'égyptologie', 'préhistoire'],
    sources: [
      { name: 'Sciences et Avenir Archéo', url: 'https://www.sciencesetavenir.fr/rss/archeo.xml' },
    ],
  },
  {
    category: 'Robotique',
    matchKeywords: ['robotique', 'robot humanoïde', 'cobot', 'drone', 'automate'],
    sources: [
      { name: 'Futura Sciences - Robotique', url: 'https://www.futura-sciences.com/rss/tech/actualites.xml' },
    ],
  },

  // ═══ NICHES DIVERSES ═══════════════════════════════════════════════════════
  {
    category: 'Mariage & Événementiel',
    matchKeywords: ['mariage', 'wedding planner', 'organisation de mariage', 'événementiel'],
    sources: [
      { name: 'Mariage.com', url: 'https://www.mariages.net/blog/feed' },
    ],
  },
  {
    category: 'Parentalité & Famille',
    matchKeywords: ['parentalité', 'enfant', 'grossesse', 'bébé', 'éducation des enfants', 'famille', 'crèche'],
    sources: [
      { name: 'Magicmaman', url: 'https://www.magicmaman.com/rss.xml' },
    ],
  },
  {
    category: 'Retraite & Seniors',
    matchKeywords: ['retraite', 'senior', 'pension de retraite', 'personnes âgées', 'ehpad'],
    sources: [
      { name: 'Notre Temps', url: 'https://www.notretemps.com/rss' },
    ],
  },
  {
    category: 'Associations & Bénévolat',
    matchKeywords: ['association', 'bénévolat', 'ong', 'caritatif', 'humanitaire', 'don'],
    sources: [
      { name: 'Carenews', url: 'https://www.carenews.com/fr/rss' },
    ],
  },
  {
    category: 'Éducation & Enseignement supérieur',
    matchKeywords: ['éducation', 'enseignement supérieur', 'université', 'école', 'étudiant', 'baccalauréat', 'grande école', 'professeur'],
    sources: [
      { name: 'Le Monde Campus', url: 'https://www.lemonde.fr/campus/rss_full.xml' },
    ],
  },
  {
    category: 'Médias & Journalisme',
    matchKeywords: ['médias', 'journalisme', 'presse écrite', 'audiovisuel', 'chaîne de télévision', 'rédaction'],
    sources: [
      { name: 'La Lettre', url: 'https://www.lalettre.com/feed' },
    ],
  },
  {
    category: 'Animaux de compagnie',
    matchKeywords: ['animal de compagnie', 'chien', 'chat', 'vétérinaire', 'animalerie', 'adoption animal'],
    sources: [
      { name: 'Wamiz', url: 'https://www.wamiz.com/feed' },
    ],
  },
  {
    category: 'Pêche & Chasse',
    matchKeywords: ['pêche', 'chasse', 'chasseur', 'pêcheur', 'gibier', 'permis de chasse'],
    sources: [
      { name: 'Pêche Mag', url: 'https://www.peche-mag.fr/feed' },
    ],
  },
  {
    category: 'Fitness & Musculation',
    matchKeywords: ['fitness', 'musculation', 'salle de sport', 'bodybuilding', 'crossfit', 'entraînement physique'],
    sources: [
      { name: 'All Musculation', url: 'https://www.all-musculation.com/blog/feed' },
    ],
  },
  {
    category: 'Mobilier & Décoration intérieure',
    matchKeywords: ['mobilier', 'décoration intérieure', 'design d\'intérieur', 'ameublement', 'architecte d\'intérieur'],
    sources: [
      { name: 'Côté Maison', url: 'https://www.cotemaison.fr/rss.xml' },
    ],
  },
  {
    category: 'Horlogerie & Bijouterie',
    matchKeywords: ['horlogerie', 'montre de luxe', 'bijouterie', 'joaillerie', 'horloger'],
    sources: [
      { name: 'Worldtempus FR', url: 'https://www.worldtempus.com/fr/feed/' },
    ],
  },
  {
    category: 'Vélo électrique & Mobilités douces',
    matchKeywords: ['vélo électrique', 'trottinette électrique', 'mobilité douce', 'micro-mobilité', 'vae'],
    sources: [
      { name: 'Mobilité Douce', url: 'https://www.mobilite-douce.fr/feed' },
    ],
  },
  {
    category: 'Drones & Modélisme',
    matchKeywords: ['drone civil', 'modélisme', 'avion télécommandé', 'fpv'],
    sources: [
      { name: 'Drone Passion', url: 'https://dronepassion.fr/feed' },
    ],
  },
]

// ── FONCTION DE MATCHING ──────────────────────────────────────────────────────
// Prend une description libre + mots-clés utilisateur, retourne les catégories
// pertinentes triées par score de correspondance.
// Utilise des frontières de mots pour éviter les faux positifs
// (ex: "esport" ne doit pas matcher "sport").
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function textContainsKeyword(text, keyword) {
  const kw = keyword.toLowerCase().trim()
  // Pour les expressions multi-mots (ex: "tour de france"), on cherche tel quel
  if (kw.includes(' ') || kw.includes('-') || kw.includes("'")) {
    return text.includes(kw)
  }
  // Pour un mot simple, on impose des frontières de mot pour éviter
  // que "sport" matche dans "esport", "transport", etc.
  const regex = new RegExp(`(?:^|[^a-zàâçéèêëîïôûùüÿñæœ0-9])${escapeRegExp(kw)}(?:[^a-zàâçéèêëîïôûùüÿñæœ0-9]|$)`, 'i')
  return regex.test(text)
}

export function matchCategories(description, userKeywords = []) {
  const text = (description + ' ' + userKeywords.join(' ')).toLowerCase()

  const scored = SOURCE_LIBRARY.map(cat => {
    let score = 0
    cat.matchKeywords.forEach(kw => {
      if (textContainsKeyword(text, kw)) score += 1
    })
    return { ...cat, matchScore: score }
  })

  return scored
    .filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
}

// ── SUGGESTION DE MOTS-CLÉS DE SCORING ────────────────────────────────────────
// Combine les mots-clés des catégories matchées + ceux fournis par l'utilisateur.
export function suggestKeywords(matchedCategories, userKeywords = []) {
  const fromCategories = matchedCategories
    .slice(0, 3) // top 3 catégories seulement
    .flatMap(c => c.matchKeywords)

  const all = [...new Set([...userKeywords, ...fromCategories])]
  return all.slice(0, 12)
}

// ── SUGGESTION DE SOURCES ──────────────────────────────────────────────────────
export function suggestSources(matchedCategories, maxSources = 8) {
  const sources = matchedCategories
    .slice(0, 3) // top 3 catégories
    .flatMap(c => c.sources)

  // Dédupliquer par URL
  const seen = new Set()
  const unique = sources.filter(s => {
    if (seen.has(s.url)) return false
    seen.add(s.url); return true
  })

  return unique.slice(0, maxSources)
}
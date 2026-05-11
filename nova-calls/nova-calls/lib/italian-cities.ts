
export type CityType = 'city' | 'municipality' | 'district' | 'province' | 'area';

export type ItalianCity = {
  name: string;
  slug: string;
  region: string;
  province: string;
  country: 'Italia';
  type: CityType;
  status: 'approved';
  isPublic: true;
  isOfficial: true;
  populationRank: number;
  wallStats: {
    postsToday: number;
    audioToday: number;
    localEvents: number;
    onlineNow: number;
  };
};

export const officialItalianCities: ItalianCity[] = [
  { name: 'Roma', slug: 'roma', region: 'Lazio', province: 'Roma', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 1, wallStats: { postsToday: 342, audioToday: 76, localEvents: 18, onlineNow: 1248 } },
  { name: 'Milano', slug: 'milano', region: 'Lombardia', province: 'Milano', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 2, wallStats: { postsToday: 288, audioToday: 41, localEvents: 22, onlineNow: 1104 } },
  { name: 'Napoli', slug: 'napoli', region: 'Campania', province: 'Napoli', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 3, wallStats: { postsToday: 211, audioToday: 39, localEvents: 14, onlineNow: 826 } },
  { name: 'Torino', slug: 'torino', region: 'Piemonte', province: 'Torino', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 4, wallStats: { postsToday: 184, audioToday: 31, localEvents: 12, onlineNow: 702 } },
  { name: 'Palermo', slug: 'palermo', region: 'Sicilia', province: 'Palermo', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 5, wallStats: { postsToday: 161, audioToday: 24, localEvents: 10, onlineNow: 624 } },
  { name: 'Genova', slug: 'genova', region: 'Liguria', province: 'Genova', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 6, wallStats: { postsToday: 148, audioToday: 22, localEvents: 9, onlineNow: 577 } },
  { name: 'Bologna', slug: 'bologna', region: 'Emilia-Romagna', province: 'Bologna', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 7, wallStats: { postsToday: 139, audioToday: 21, localEvents: 13, onlineNow: 546 } },
  { name: 'Firenze', slug: 'firenze', region: 'Toscana', province: 'Firenze', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 8, wallStats: { postsToday: 124, audioToday: 19, localEvents: 9, onlineNow: 488 } },
  { name: 'Bari', slug: 'bari', region: 'Puglia', province: 'Bari', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 9, wallStats: { postsToday: 116, audioToday: 18, localEvents: 8, onlineNow: 452 } },
  { name: 'Catania', slug: 'catania', region: 'Sicilia', province: 'Catania', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 10, wallStats: { postsToday: 108, audioToday: 17, localEvents: 8, onlineNow: 431 } },
  { name: 'Verona', slug: 'verona', region: 'Veneto', province: 'Verona', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 11, wallStats: { postsToday: 98, audioToday: 15, localEvents: 7, onlineNow: 392 } },
  { name: 'Venezia', slug: 'venezia', region: 'Veneto', province: 'Venezia', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 12, wallStats: { postsToday: 94, audioToday: 14, localEvents: 7, onlineNow: 374 } },
  { name: 'Messina', slug: 'messina', region: 'Sicilia', province: 'Messina', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 13, wallStats: { postsToday: 89, audioToday: 13, localEvents: 6, onlineNow: 352 } },
  { name: 'Padova', slug: 'padova', region: 'Veneto', province: 'Padova', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 14, wallStats: { postsToday: 86, audioToday: 13, localEvents: 8, onlineNow: 344 } },
  { name: 'Trieste', slug: 'trieste', region: 'Friuli-Venezia Giulia', province: 'Trieste', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 15, wallStats: { postsToday: 82, audioToday: 12, localEvents: 6, onlineNow: 332 } },
  { name: 'Brescia', slug: 'brescia', region: 'Lombardia', province: 'Brescia', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 16, wallStats: { postsToday: 78, audioToday: 12, localEvents: 7, onlineNow: 314 } },
  { name: 'Prato', slug: 'prato', region: 'Toscana', province: 'Prato', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 17, wallStats: { postsToday: 74, audioToday: 11, localEvents: 5, onlineNow: 296 } },
  { name: 'Taranto', slug: 'taranto', region: 'Puglia', province: 'Taranto', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 18, wallStats: { postsToday: 70, audioToday: 10, localEvents: 5, onlineNow: 281 } },
  { name: 'Parma', slug: 'parma', region: 'Emilia-Romagna', province: 'Parma', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 19, wallStats: { postsToday: 68, audioToday: 10, localEvents: 6, onlineNow: 274 } },
  { name: 'Modena', slug: 'modena', region: 'Emilia-Romagna', province: 'Modena', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 20, wallStats: { postsToday: 66, audioToday: 10, localEvents: 6, onlineNow: 263 } },
  { name: 'Reggio Calabria', slug: 'reggio-calabria', region: 'Calabria', province: 'Reggio Calabria', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 21, wallStats: { postsToday: 62, audioToday: 9, localEvents: 5, onlineNow: 247 } },
  { name: 'Reggio Emilia', slug: 'reggio-emilia', region: 'Emilia-Romagna', province: 'Reggio Emilia', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 22, wallStats: { postsToday: 60, audioToday: 9, localEvents: 5, onlineNow: 239 } },
  { name: 'Perugia', slug: 'perugia', region: 'Umbria', province: 'Perugia', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 23, wallStats: { postsToday: 58, audioToday: 8, localEvents: 5, onlineNow: 226 } },
  { name: 'Ravenna', slug: 'ravenna', region: 'Emilia-Romagna', province: 'Ravenna', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 24, wallStats: { postsToday: 55, audioToday: 8, localEvents: 5, onlineNow: 214 } },
  { name: 'Livorno', slug: 'livorno', region: 'Toscana', province: 'Livorno', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 25, wallStats: { postsToday: 52, audioToday: 8, localEvents: 4, onlineNow: 206 } },
  { name: 'Cagliari', slug: 'cagliari', region: 'Sardegna', province: 'Cagliari', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 26, wallStats: { postsToday: 50, audioToday: 7, localEvents: 5, onlineNow: 201 } },
  { name: 'Foggia', slug: 'foggia', region: 'Puglia', province: 'Foggia', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 27, wallStats: { postsToday: 48, audioToday: 7, localEvents: 4, onlineNow: 194 } },
  { name: 'Rimini', slug: 'rimini', region: 'Emilia-Romagna', province: 'Rimini', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 28, wallStats: { postsToday: 47, audioToday: 7, localEvents: 6, onlineNow: 188 } },
  { name: 'Salerno', slug: 'salerno', region: 'Campania', province: 'Salerno', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 29, wallStats: { postsToday: 45, audioToday: 7, localEvents: 4, onlineNow: 181 } },
  { name: 'Ferrara', slug: 'ferrara', region: 'Emilia-Romagna', province: 'Ferrara', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 30, wallStats: { postsToday: 43, audioToday: 6, localEvents: 4, onlineNow: 174 } },
  { name: 'Sassari', slug: 'sassari', region: 'Sardegna', province: 'Sassari', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 31, wallStats: { postsToday: 41, audioToday: 6, localEvents: 4, onlineNow: 168 } },
  { name: 'Latina', slug: 'latina', region: 'Lazio', province: 'Latina', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 32, wallStats: { postsToday: 39, audioToday: 6, localEvents: 4, onlineNow: 161 } },
  { name: 'Giugliano in Campania', slug: 'giugliano-in-campania', region: 'Campania', province: 'Napoli', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 33, wallStats: { postsToday: 38, audioToday: 6, localEvents: 3, onlineNow: 154 } },
  { name: 'Monza', slug: 'monza', region: 'Lombardia', province: 'Monza e Brianza', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 34, wallStats: { postsToday: 37, audioToday: 5, localEvents: 4, onlineNow: 149 } },
  { name: 'Siracusa', slug: 'siracusa', region: 'Sicilia', province: 'Siracusa', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 35, wallStats: { postsToday: 36, audioToday: 5, localEvents: 4, onlineNow: 143 } },
  { name: 'Bergamo', slug: 'bergamo', region: 'Lombardia', province: 'Bergamo', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 36, wallStats: { postsToday: 35, audioToday: 5, localEvents: 4, onlineNow: 139 } },
  { name: 'Pescara', slug: 'pescara', region: 'Abruzzo', province: 'Pescara', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 37, wallStats: { postsToday: 34, audioToday: 5, localEvents: 4, onlineNow: 136 } },
  { name: 'Trento', slug: 'trento', region: 'Trentino-Alto Adige', province: 'Trento', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 38, wallStats: { postsToday: 33, audioToday: 5, localEvents: 4, onlineNow: 131 } },
  { name: 'Forlì', slug: 'forli', region: 'Emilia-Romagna', province: 'Forlì-Cesena', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 39, wallStats: { postsToday: 32, audioToday: 4, localEvents: 3, onlineNow: 126 } },
  { name: 'Vicenza', slug: 'vicenza', region: 'Veneto', province: 'Vicenza', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 40, wallStats: { postsToday: 31, audioToday: 4, localEvents: 3, onlineNow: 121 } },
  { name: 'Terni', slug: 'terni', region: 'Umbria', province: 'Terni', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 41, wallStats: { postsToday: 30, audioToday: 4, localEvents: 3, onlineNow: 117 } },
  { name: 'Bolzano', slug: 'bolzano', region: 'Trentino-Alto Adige', province: 'Bolzano', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 42, wallStats: { postsToday: 29, audioToday: 4, localEvents: 3, onlineNow: 113 } },
  { name: 'Novara', slug: 'novara', region: 'Piemonte', province: 'Novara', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 43, wallStats: { postsToday: 28, audioToday: 4, localEvents: 3, onlineNow: 108 } },
  { name: 'Piacenza', slug: 'piacenza', region: 'Emilia-Romagna', province: 'Piacenza', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 44, wallStats: { postsToday: 27, audioToday: 4, localEvents: 3, onlineNow: 104 } },
  { name: 'Ancona', slug: 'ancona', region: 'Marche', province: 'Ancona', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 45, wallStats: { postsToday: 26, audioToday: 4, localEvents: 3, onlineNow: 101 } },
  { name: 'Andria', slug: 'andria', region: 'Puglia', province: 'Barletta-Andria-Trani', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 46, wallStats: { postsToday: 25, audioToday: 3, localEvents: 3, onlineNow: 96 } },
  { name: 'Arezzo', slug: 'arezzo', region: 'Toscana', province: 'Arezzo', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 47, wallStats: { postsToday: 24, audioToday: 3, localEvents: 3, onlineNow: 92 } },
  { name: 'Udine', slug: 'udine', region: 'Friuli-Venezia Giulia', province: 'Udine', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 48, wallStats: { postsToday: 23, audioToday: 3, localEvents: 3, onlineNow: 89 } },
  { name: 'Cesena', slug: 'cesena', region: 'Emilia-Romagna', province: 'Forlì-Cesena', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 49, wallStats: { postsToday: 22, audioToday: 3, localEvents: 3, onlineNow: 86 } },
  { name: 'Lecce', slug: 'lecce', region: 'Puglia', province: 'Lecce', country: 'Italia', type: 'city', status: 'approved', isPublic: true, isOfficial: true, populationRank: 50, wallStats: { postsToday: 21, audioToday: 3, localEvents: 3, onlineNow: 82 } },
];

export function getCityBySlug(slug: string) {
  return officialItalianCities.find((city) => city.slug === slug);
}

export function getFeaturedCities() {
  return officialItalianCities.slice(0, 12);
}

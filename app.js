const { useState, useEffect, useMemo, useRef } = React;

/* ══════════════════════════════════════════════════════════════════
   REGOLE DELLA LEGA
   Unico punto da toccare. Le decidiamo in chat, io le scrivo qui.
   Cambiare questo blocco azzera l'asta salvata: e' voluto, perche'
   con rosa o crediti diversi i conti precedenti non valgono piu'.
   ══════════════════════════════════════════════════════════════════ */
const REGOLE = {
  squadre: 6,
  crediti: 1000,
  slot: { P: 3, D: 8, C: 8, A: 6 },

  // punteggio
  modDifesa: true,         // ATTIVO: portiere e difesa diventano il reparto che vince
  assist: true,
  portaInviolata: true,
  golSubito: true,
  capitano: false,
  maxAtt: 3,
  minDif: 3,

  // asta per reparti, a turno, partendo da 1 credito
  perReparto: true,
  ordineReparti: ["P", "D", "C", "A"],
  apertura: 1,

  // gennaio: i crediti avanzati si portano dietro, piu' 150 a testa,
  // e si puo' fare cassa rivendendo giocatori
  riparazione: "residuo",
  riparazioneCrediti: 150,
  rivendita: true,
  riserva: 70,             // crediti da tenere per gennaio
  svincolatiLiberi: false,

  // chi c'e' al tavolo e per chi tifa
  sedie: [
    ["Io", "ROM"], ["Squadra 2", "ROM"],
    ["Squadra 3", "LAZ"], ["Squadra 4", "LAZ"],
    ["Squadra 5", "JUV"], ["Squadra 6", "JUV"],
  ],
};


/* ------------------------------------------------------------------
   Listone. Formato: "Nome|SQ|R|FVM su 1000|titolare(1/0)"
   FVM = Fanta Valore di Mercato fantacalcio.it, scala 1000 crediti.
   I valori contrassegnati stimati (~) non erano nel listone scaricato:
   sono ricavati dalla quotazione su scala 500 e vanno verificati.
   Titolare = presente nella formazione tipo al 1 settembre 2026.
------------------------------------------------------------------- */
const RAW = `
Svilar|ROM|P|85|1
Vicario|JUV|P|70|1
Martinez Jo.|INT|P|68|1
Carnesecchi|ATA|P|55|1
Maignan|MIL|P|52|1
Butez|COM|P|50|1
Meret|NAP|P|48|1
Mandas|LAZ|P|36|1
Skorupski|BOL|P|32|1
De Gea|FIO|P|30|1
Okoye|UDI|P|28|1
Perri|TOR|P|26|1
Falcone|LEC|P|26|1
Caprile|CAG|P|25|1
Stankovic|VEN|P|18|1
Muric|SAS|P|15|1
Bijlow|GEN|P|15|1
Palmisani|FRO|P|15|1
Thiam|MON|P|14|1
Paleari|TOR|P|8|0
Daffara|PAR|P|8|1
Corvi|PAR|P|5|0
Montipo|VEN|P|5|0
Milinkovic|NAP|P|5|0
Provedel|INT|P|5|0
Dimarco|INT|D|240|1
Wesley|ROM|D|87|1
Molina N.|ROM|D|78|0
Bremer|JUV|D|60|1
Rrahmani|NAP|D|51|1
Mancini|ROM|D|50|1
Pavlovic|MIL|D|49|1
Akanji|INT|D|47|1
Kalulu|JUV|D|47|1
Solet|UDI|D|46|1
Bastoni|INT|D|43|1
Ndicka|ROM|D|42|1
Ostigard|GEN|D|41|1
Di Lorenzo|NAP|D|39|1
Spence|INT|D|37|1
Bisseck|INT|D|36|0
Chalobah|COM|D|32|1
Gila|MIL|D|31|1
Ramon|COM|D|31|1
Vasquez|GEN|D|30|1
Scalvini|ATA|D|28|1
Hermoso|ROM|D|26|1
Diego Carlos|PAR|D|26|0
Buongiorno|NAP|D|25|1
Spinazzola|NAP|D|25|1
Couto|COM|D|25|1
Stones|INT|D|25|1
Tavares N.|LAZ|D|25|0
Miranda J.|BOL|D|23|1
Bartesaghi|MIL|D|22|1
Valeri|PAR|D|22|0
Del Prato|PAR|D|21|1
Valle|COM|D|21|1
Theate|BOL|D|20|1
Mina|CAG|D|20|1
Marusic|LAZ|D|20|1
Dragusin|FIO|D|20|1
Tiago Gabriel|LEC|D|20|1
Romagnoli|LAZ|D|20|0
Belghali|TOR|D|20|0
Zappacosta|ATA|D|19|1
Zortea|BOL|D|19|1
Idzes|SAS|D|19|1
Sutalo J.|LAZ|D|19|1
Vojvoda|UDI|D|19|1
Bernasconi|ATA|D|18|1
Jimenez A.|FIO|D|18|1
Badiashile|NAP|D|18|0
Gallo|LEC|D|18|1
Lucumi|JUV|D|17|0
Doekhi|LAZ|D|16|1
Celik|JUV|D|16|1
Heggem|BOL|D|15|1
Obert|CAG|D|15|1
Gabbia|MIL|D|15|1
Mangas|MON|D|15|1
Bracaglia|FRO|D|15|1
Koulierakis|ROM|D|15|0
Doig|SAS|D|14|1
Coco|TOR|D|14|1
Pavard|INT|D|14|0
Marcandalli|GEN|D|14|1
Pedraza|LAZ|D|14|1
Monterisi|FRO|D|13|1
Comuzzo|TOR|D|13|1
Ismajli|TOR|D|13|1
Kaiki|COM|D|13|0
Holm|BOL|D|13|0
Kamara H.|UDI|D|12|1
Viery|FIO|D|12|1
Pongracic|FIO|D|12|1
Martin|GEN|D|12|1
Veiga|LEC|D|11|1
Oyono A.|FRO|D|10|1
Gaspar|LEC|D|10|1
Kabasele|UDI|D|10|1
Kristensen|ATA|D|10|1
Bertola|UDI|D|9|1
Britschgi|PAR|D|9|1
Valenti|PAR|D|9|1
Troilo|PAR|D|9|1
Ze Pedro|CAG|D|9|1
Rodriguez J.|CAG|D|9|1
Obrador|SAS|D|8|1
Leysen|SAS|D|8|1
Van Der Brempt|SAS|D|8|1
Kolasinac|ATA|D|8|0
Akpoguma|FRO|D|8|1
Carboni A.|MON|D|8|1
Ziolkowski|MON|D|8|1
Bella-Kotchap|VEN|D|8|1
Correia|VEN|D|8|1
Haps|VEN|D|8|1
Cacciamani|TOR|D|7|1
Hien|ATA|D|7|0
Moreno M.|VEN|D|5|1
Mazzocchi|VEN|D|5|1
Lulli|ROM|D|3|1
Paz N.|COM|C|245|1
Calhanoglu|INT|C|243|1
McTominay|NAP|C|220|1
Orsolini|BOL|C|177|1
Pulisic|MIL|C|150|1
Rabiot|MIL|C|145|1
De Bruyne|NAP|C|108|1
Baturina|COM|C|105|1
Mora|ROM|C|100|0
Yildiz|JUV|C|100|1
Dybala|ROM|C|100|1
De Ketelaere|ATA|C|95|1
Da Cunha|COM|C|87|1
Zaccagni|LAZ|C|87|1
Lauriente|SAS|C|83|1
Barella|INT|C|81|1
Zaniolo|UDI|C|80|1
Atta|FIO|C|78|1
Frattesi|LAZ|C|75|1
Vlasic|TOR|C|73|1
McKennie|JUV|C|70|1
Conceicao|JUV|C|68|1
Santos A.|NAP|C|61|1
Ekkelenkamp|UDI|C|57|1
Taylor K.|LAZ|C|53|1
Diao|COM|C|50|1
Mastantuono|FIO|C|50|1
Soule|ROM|C|48|1
Kessie|ATA|C|47|1
Jones C.|INT|C|47|0
Ederson|ATA|C|46|1
Modric|MIL|C|45|1
Moreira|MIL|C|45|1
Zielinski|INT|C|45|1
Gonzalez N.|JUV|C|45|0
Samardzic|ATA|C|44|0
Kone M.|ROM|C|42|1
Alajbegovic|JUV|C|42|1
Zambo Anguissa|NAP|C|41|0
Varela G.|MON|C|40|1
Gudmundsson A.|LAZ|C|40|0
Rowe|ATA|C|40|0
Thorstvedt|SAS|C|39|1
Politano|NAP|C|37|1
Toure E.|PAR|C|37|1
Romero D.|PAR|C|37|1
Saelemaekers|MIL|C|35|1
Vergara|NAP|C|35|0
Bernabe|PAR|C|34|1
Perrone|COM|C|34|1
Locatelli|JUV|C|33|1
Gaetano|ATA|C|30|0
Milla|COM|C|30|0
Cristante|ROM|C|29|1
Baldanzi|GEN|C|28|1
Bernardeschi|BOL|C|27|1
Calo|FRO|C|27|1
Casadei|TOR|C|27|1
Boga|JUV|C|27|0
Sanchez Ro.|COM|C|25|0
Hutchinson|MIL|C|25|0
Sarr P.|JUV|C|25|0
Volpato|SAS|C|25|0
Cambiaghi|BOL|C|25|0
Gnonto|FIO|C|25|0
Schmid|FRO|C|25|1
Ghedjemis|FRO|C|23|1
Fazzini|CAG|C|23|1
Lobotka|NAP|C|23|1
Ferguson L.|BOL|C|23|1
Mandragora|TOR|C|23|0
Monteiro J.|LEC|C|23|1
Kvernadze|FRO|C|24|0
Pasalic|ATA|C|22|1
Isaksen|LAZ|C|22|1
Ndour|FIO|C|22|0
Elmas|ATA|C|22|0
Chukwueze|MIL|C|22|0
Liberali|COM|C|21|0
Sucic P.|INT|C|21|0
Romano|CAG|C|21|1
Kone I.|SAS|C|20|0
Pellegrini Lo.|ROM|C|20|0
Karlstrom|UDI|C|20|1
Fagioli|FIO|C|20|1
Frendrup|GEN|C|19|1
Pisilli|ROM|C|19|0
Zalewski|ATA|C|18|0
Oulai|FIO|C|18|0
Odgaard|BOL|C|17|0
Caqueret|COM|C|17|0
Zhegrova|JUV|C|17|0
Coulibaly L.|LEC|C|17|1
Rovella|LAZ|C|16|1
Unai Gomez|UDI|C|16|0
Ellertsson|GEN|C|16|0
Winks|CAG|C|15|1
Sow|GEN|C|15|1
Colpani|MON|C|15|1
Koopmeiners|JUV|C|15|0
El Aynaoui|ROM|C|14|0
Adopo|CAG|C|13|1
Piotrowski|UDI|C|13|1
Pobega|BOL|C|12|1
Zerbin|FRO|C|12|1
Akinsanmiro|MON|C|11|1
Grillitsch|FRO|C|11|1
Matic|SAS|C|10|1
Adzic|SAS|C|10|1
Maldini|CAG|C|10|1
Pessina|MON|C|10|1
Ilic|LEC|C|10|1
Pierotti|LEC|C|10|1
Keita|PAR|C|10|1
Gineitis|TOR|C|9|1
Fitz-Jim|TOR|C|9|1
Oristanio|TOR|C|9|1
Busio|VEN|C|9|1
Basic|VEN|C|9|1
Sohm|VEN|C|9|1
Folorunsho|MON|C|9|1
Birindelli|MON|C|8|1
Yeboah J.|VEN|C|27|0
Malen|ROM|A|450|1
Martinez L.|INT|A|361|1
Hojlund|NAP|A|260|1
Thuram|INT|A|249|1
Ramos G.|MIL|A|237|1
Douvikas|COM|A|185|1
Kean|COM|A|183|1
Kolo Muani|JUV|A|165|1
Woltemade|JUV|A|160|0
Scamacca|ATA|A|110|1
Davis K.|UDI|A|108|1
Berardi|SAS|A|106|1
Esposito F.P.|INT|A|105|0
Krstovic|ATA|A|98|0
Simeone|TOR|A|80|1
Raspadori|ATA|A|73|1
Castro S.|ROM|A|70|0
Pinamonti|LAZ|A|53|1
Colombo|GEN|A|52|1
Dovbyk|BOL|A|51|1
Beto|FIO|A|50|0
Lukaku|NAP|A|45|0
Pellegrino M.|FIO|A|40|1
Esposito Se.|SAS|A|40|1
Kevin Carlos|CAG|A|36|1
Adams A.|VEN|A|35|1
Adams C.|TOR|A|33|0
Bowie|SAS|A|32|0
Bobcek|FRO|A|31|0
Piccoli|BOL|A|29|0
Osmajic|GEN|A|28|0
Raimondo|FRO|A|27|1
Cutrone|MON|A|23|1
Geubbels|LEC|A|23|1
Thuram K.|JUV|A|25|0
Stulic|LEC|A|20|1
Frigan|PAR|A|18|1
Robinson|MON|A|15|1
Bonny|INT|A|15|0
Vitinha O.|GEN|A|13|1
Rrahmani Al.|VEN|A|13|1
Sulemana K.|ATA|A|8|0
Noslin|LAZ|A|8|0
Mutandwa|CAG|A|7|0
Dany Mota|MON|A|7|0
Cambiaso|JUV|D|18|1
Carlos Augusto|INT|D|20|0
Cancellieri|LAZ|C|25|0
Rodriguez Je.|COM|C|31|0
Leao|MIL|A|75|0
Nkunku|MIL|A|20|0
David|JUV|A|25|0
Dia|LAZ|A|20|0
Ratkov|LAZ|A|22|0
Dallinga|BOL|A|10|0
Di Gregorio|JUV|P|10|0
Perin|JUV|P|5|0
Suzuki|PAR|P|20|0
Gutierrez|NAP|D|26|0
Norton-Cuffy|GEN|C|15|0
Djimsiti|ATA|D|16|0
Ahanor|ATA|D|13|0
`;

/* ------------------------------------------------------------------
   ARRICCHIMENTO. Segnali che cambiano davvero una decisione d'asta,
   caricati qui e non chiesti in rete: durante l'asta ogni lettura
   e' istantanea.
   nome: [bonus attesi (gol+assist), gol attesi su rigore x10,
          movimento quotazione dopo 2 giornate, schierabilita %, fuori]
   "fuori" = segnato con asterisco sul listone: ha lasciato la Serie A
   o e' indisponibile. Va verificato, non comprato al buio.
------------------------------------------------------------------- */
const PIU = {
  "Martinez L.": [24, 0, -2, 0, 0], Malen: [17, 49, 4, 0, 0], Hojlund: [16, 0, 0, 0, 0],
  Thuram: [16, 0, -1, 0, 0], "Ramos G.": [13, 0, 0, 0, 0], Yildiz: [13, 0, -1, 0, 0],
  Dimarco: [13, 0, -1, 0, 0], Kean: [12, 0, -1, 0, 0], Lauriente: [12, 0, 0, 0, 0],
  "Kolo Muani": [11, 26, -1, 0, 0], Pulisic: [11, 35, -1, 0, 0], Berardi: [11, 30, 1, 0, 0],
  Calhanoglu: [9, 46, 1, 0, 0], Barella: [9, 0, 1, 0, 0], Orsolini: [9, 30, -1, 0, 0],
  "De Bruyne": [8, 32, 2, 0, 0], "Toure E.": [8, 0, -1, 0, 0], "Ferguson L.": [8, 0, 0, 0, 0],
  Scamacca: [8, 24, 0, 0, 0], "Paz N.": [8, 0, -1, 0, 0], McTominay: [8, 0, -1, 0, 0],
  Frattesi: [7, 0, 3, 0, 0], Ederson: [7, 0, 0, 0, 0], Bernabe: [7, 14, 0, 0, 0],
  "Santos A.": [7, 0, 0, 0, 0], Zaccagni: [6, 23, 0, 0, 0], "Di Lorenzo": [6, 0, 0, 85, 0],
  "Adams A.": [6, 15, -1, 0, 0], Colombo: [6, 27, 0, 0, 0], "Da Cunha": [5, 20, 0, 0, 0],
  Vlasic: [5, 20, -1, 0, 0], Rovella: [5, 0, 1, 0, 0], Frendrup: [5, 0, 0, 0, 0],
  "El Aynaoui": [5, 0, 0, 0, 0], "Davis K.": [5, 19, 0, 0, 0], Calo: [4, 23, 1, 0, 0],
  Pessina: [4, 21, 0, 0, 0], Stulic: [3, 13, 0, 0, 0], Mina: [3, 16, -1, 0, 0],
  "Miranda J.": [4, 0, 0, 0, 0], Mancini: [4, 0, 1, 0, 0], Valeri: [4, 0, 0, 0, 0],
  Bartesaghi: [4, 0, 0, 0, 0], Vojvoda: [4, 0, 1, 0, 0], Bastoni: [3, 0, 0, 0, 0],
  Gallo: [3, 0, 0, 0, 0], Bremer: [3, 0, 1, 0, 0], Rrahmani: [3, 0, 1, 0, 0],
  Marusic: [3, 0, 0, 0, 0], Doig: [3, 0, 0, 0, 0], Keita: [3, 0, 0, 0, 0],
  Douvikas: [7, 0, 2, 0, 0], Dybala: [7, 0, 2, 0, 0], Mora: [5, 0, 1, 0, 0],
  Soule: [5, 0, 1, 0, 0], Wesley: [4, 0, 1, 0, 0], Svilar: [0, 0, 1, 85, 0],
  Maignan: [0, 0, 0, 90, 0], Caprile: [0, 0, 1, 85, 0], Falcone: [0, 0, 0, 85, 0],
  Vicario: [0, 0, 1, 85, 0], Thiam: [0, 0, 0, 80, 0], Stankovic: [0, 0, 0, 80, 0],
  Bijlow: [0, 0, 0, 80, 0], Okoye: [0, 0, 0, 80, 0], Skorupski: [0, 0, 0, 80, 0],
  "De Gea": [0, 0, -2, 80, 0], Butez: [0, 0, -1, 80, 0], Carnesecchi: [0, 0, 1, 80, 0],
  Palmisani: [0, 0, 0, 75, 0], Muric: [0, 0, 0, 75, 0], Mandas: [0, 0, 1, 75, 0],
  "Martinez Jo.": [0, 0, 0, 75, 0], Meret: [0, 0, 0, 70, 0], Daffara: [0, 0, 0, 65, 0],
  Paleari: [0, 0, 0, 60, 0],
  "Varela G.": [0, 0, 4, 0, 0], "Kamara H.": [0, 0, 3, 0, 0], Ekkelenkamp: [4, 0, 2, 0, 0],
  Zielinski: [0, 0, 2, 0, 0], Vergara: [0, 0, 2, 0, 0], Comuzzo: [0, 0, 2, 0, 0],
  Volpato: [0, 0, 2, 0, 0], Pisilli: [0, 0, 2, 0, 0], Raimondo: [0, 0, 2, 0, 0],
  Bracaglia: [0, 0, 2, 0, 0], Romano: [0, 0, 2, 0, 0], Chukwueze: [0, 0, 2, 0, 0],
  Koopmeiners: [0, 0, 2, 0, 0], Kvernadze: [0, 0, 2, 0, 0], Atta: [0, 0, -2, 0, 0],
  Baturina: [6, 0, 1, 0, 0], "Esposito F.P.": [0, 0, 1, 0, 0], Cristante: [0, 0, 1, 0, 0],

  "Leao": [0, 0, 0, 0, 1], "Nkunku": [0, 0, 0, 0, 1], "David": [0, 0, 0, 0, 1], "Dia": [0, 0, 0, 0, 1], "Ratkov": [0, 0, 0, 0, 1], "Dallinga": [0, 0, 0, 0, 1], "Di Gregorio": [0, 0, 0, 0, 1], "Perin": [0, 0, 0, 0, 1], "Suzuki": [0, 0, 0, 0, 1], "Gutierrez": [0, 0, 0, 0, 1], "Norton-Cuffy": [0, 0, 0, 0, 1], "Djimsiti": [0, 0, 0, 0, 1], "Ahanor": [0, 0, 0, 0, 1], "Lukaku": [0, 0, 0, 0, 1],
  "Gudmundsson A.": [0, 0, -1, 0, 0],
};


/* ------------------------------------------------------------------
   STORICO. Fonte: fantacalcio.dev, stagioni 2025-26 e 2024-25.
   [pres26, mv26, fm26, gol26, ass26, pres25, mv25, fm25, gol25, ass25]
   0 = dato non disponibile (non era in Serie A, o sotto le 6 presenze).
   Le ammonizioni non sono in queste tabelle: non le invento.
   La stagione piu' recente pesa 70%, quella prima 30%; poche presenze
   riducono la fiducia nel dato (Malen: fantamedia 9.49 ma in 18 gare).
------------------------------------------------------------------- */
const STORICO = {
  // portieri
  Carnesecchi:[37,7.34,6.55,0,0,34,7.20,6.19,0,0], Maignan:[37,7.23,6.39,0,0,0,0,0,0,0],
  Butez:[38,7.23,6.53,0,0,0,0,0,0,0], Provedel:[27,7.17,6.26,0,0,0,0,0,0,0],
  Muric:[32,7.17,5.85,0,0,0,0,0,0,0], Paleari:[29,7.09,5.52,0,0,0,0,0,0,0],
  Svilar:[38,7.07,6.25,0,0,38,7.19,6.26,0,0], Suzuki:[20,7.06,5.91,0,0,0,0,0,0,0],
  Caprile:[38,7.04,5.62,0,0,22,7.17,6.13,0,0], "De Gea":[37,6.99,5.73,0,0,35,7.23,6.33,0,0],
  Bijlow:[16,6.99,5.71,0,0,0,0,0,0,0], Falcone:[38,6.98,5.79,0,0,0,0,0,0,0],
  Okoye:[30,6.98,5.96,0,0,0,0,0,0,0], Corvi:[17,6.95,5.86,0,0,0,0,0,0,0],
  "Di Gregorio":[30,6.95,6.20,0,0,0,0,0,0,0], Meret:[11,6.80,5.75,0,0,0,0,0,0,0],
  Skorupski:[19,6.80,5.93,0,0,0,0,0,0,0], Milinkovic:[27,6.79,6.27,0,0,37,7.35,6.49,0,0],
  Montipo:[35,6.73,5.47,0,0,0,0,0,0,0], Mandas:[0,0,0,0,0,9,7.19,6.41,0,0],
  Stankovic:[0,0,0,0,0,16,7.33,6.04,0,0],
  // difensori
  Dimarco:[35,7.42,8.44,7,16,32,7.28,7.83,4,7], Bastoni:[28,7.27,7.41,1,4,33,7.25,7.39,1,5],
  Rrahmani:[21,7.26,7.55,2,1,38,7.30,7.38,1,3], Ostigard:[30,7.23,7.64,5,1,0,0,0,0,0],
  Solet:[35,7.21,7.43,3,1,19,7.24,7.40,1,2], Gila:[31,7.21,7.11,0,0,0,0,0,0,0],
  Ramon:[32,7.18,7.16,2,0,0,0,0,0,0], Bisseck:[23,7.15,7.54,3,1,0,0,0,0,0],
  Akanji:[33,7.15,7.27,2,0,0,0,0,0,0], Bremer:[26,7.13,7.61,4,3,6,7.60,7.43,0,0],
  Scalvini:[24,7.08,7.46,3,1,0,0,0,0,0], Pavlovic:[34,7.05,7.46,5,1,0,0,0,0,0],
  Wesley:[30,7.02,7.35,5,0,0,0,0,0,0], Lucumi:[29,7.00,7.02,1,0,0,0,0,0,0],
  Mancini:[36,7.00,7.26,4,2,0,0,0,0,0], Spinazzola:[31,6.99,7.35,3,3,0,0,0,0,0],
  Bernasconi:[23,6.99,7.06,0,3,0,0,0,0,0], Mina:[26,6.98,7.09,2,0,0,0,0,0,0],
  "Miranda J.":[32,6.98,7.07,1,3,31,7.15,7.25,0,6], Ndicka:[31,6.97,7.18,3,0,0,0,0,0,0],
  Romagnoli:[32,6.97,6.84,0,0,0,0,0,0,0], Gabbia:[30,6.95,6.88,0,0,0,0,0,0,0],
  Martin:[32,6.94,7.08,1,5,0,0,0,0,0], Kalulu:[37,6.93,7.14,2,4,0,0,0,0,0],
  Kristensen:[28,6.92,7.17,3,0,0,0,0,0,0], Hermoso:[27,6.91,7.16,3,2,0,0,0,0,0],
  Troilo:[21,6.91,6.82,1,0,0,0,0,0,0], Djimsiti:[34,6.91,6.85,0,0,34,7.14,7.14,1,2],
  Bartesaghi:[31,6.91,6.99,2,0,0,0,0,0,0], Cambiaso:[36,6.91,7.11,3,4,0,0,0,0,0],
  "Carlos Augusto":[32,6.90,6.93,1,1,0,0,0,0,0], "Tiago Gabriel":[37,6.90,6.91,2,0,0,0,0,0,0],
  Ismajli:[25,6.89,6.83,0,1,0,0,0,0,0], "Di Lorenzo":[26,6.88,7.13,2,1,37,7.21,7.42,3,2],
  Valeri:[34,6.88,6.91,0,2,0,0,0,0,0], Valenti:[27,6.88,6.75,0,0,0,0,0,0,0],
  Buongiorno:[0,0,0,0,0,22,7.18,7.27,1,0], Gaspar:[0,0,0,0,0,24,7.13,7.11,0,1],
  // centrocampisti (ruolo Classic del listone, non quello del sito)
  Locatelli:[36,7.73,7.66,1,2,36,7.30,7.40,2,2], Modric:[34,7.55,7.76,2,3,0,0,0,0,0],
  Calhanoglu:[22,7.51,8.63,9,4,29,7.41,7.94,5,6], "Paz N.":[35,7.31,8.26,12,6,35,7.22,7.79,6,8],
  Fagioli:[33,7.25,7.44,2,3,0,0,0,0,0], Barella:[34,7.18,7.58,3,8,32,7.24,7.65,3,6],
  Baturina:[29,7.14,7.86,6,3,0,0,0,0,0], "Da Cunha":[36,7.12,7.68,6,4,36,7.18,7.43,3,2],
  Zielinski:[34,7.08,7.59,6,3,0,0,0,0,0], Rovella:[11,7.07,7.03,0,1,33,7.13,7.02,0,3],
  McTominay:[33,7.06,7.96,10,3,34,7.25,8.39,12,4], Bernabe:[32,7.05,7.36,3,1,0,0,0,0,0],
  Cristante:[37,7.04,7.15,2,1,0,0,0,0,0], "Kone M.":[29,7.04,7.32,2,3,0,0,0,0,0],
  "De Bruyne":[18,7.04,7.96,5,2,0,0,0,0,0], "Kone I.":[35,7.03,7.45,6,0,0,0,0,0,0],
  Mandragora:[34,7.02,7.63,7,3,29,7.14,7.53,4,3], Ederson:[30,7.00,7.18,2,1,37,7.16,7.43,4,1],
  Perrone:[36,6.99,7.24,3,4,0,0,0,0,0], Pulisic:[30,6.99,7.83,8,4,34,7.25,8.38,11,9],
  Zaccagni:[26,6.98,7.05,3,0,34,7.41,8.14,8,6], Zalewski:[33,6.98,7.23,2,4,0,0,0,0,0],
  "Thuram K.":[35,6.97,7.29,3,3,0,0,0,0,0], Matic:[34,6.95,6.94,1,1,0,0,0,0,0],
  Keita:[37,6.94,6.98,1,1,0,0,0,0,0], Lobotka:[32,6.93,7.01,1,1,0,0,0,0,0],
  Frendrup:[36,6.93,6.94,1,0,0,0,0,0,0], Vlasic:[37,6.92,7.50,8,3,0,0,0,0,0],
  Vergara:[11,6.90,7.26,1,2,0,0,0,0,0], Thorstvedt:[32,6.89,7.25,4,4,0,0,0,0,0],
  Atta:[32,6.89,7.41,5,3,0,0,0,0,0], "Sucic P.":[33,6.88,7.05,2,2,0,0,0,0,0],
  Pasalic:[33,6.88,7.23,3,4,0,0,0,0,0], Ekkelenkamp:[31,6.87,7.44,5,3,0,0,0,0,0],
  McKennie:[34,6.87,7.39,5,5,0,0,0,0,0],
  Yildiz:[36,7.39,8.28,10,6,35,7.25,7.91,7,4], "Santos A.":[14,7.32,8.14,4,0,0,0,0,0,0],
  "De Ketelaere":[31,7.25,7.63,3,5,0,0,0,0,0], Rabiot:[29,7.24,7.88,6,4,0,0,0,0,0],
  Saelemaekers:[35,7.17,7.44,3,3,23,7.25,8.19,7,3], Soule:[33,7.10,7.78,6,5,27,7.24,7.92,5,5],
  Boga:[14,7.06,7.88,4,0,0,0,0,0,0], Conceicao:[31,7.00,7.40,3,5,0,0,0,0,0],
  Lauriente:[38,6.99,7.72,7,9,0,0,0,0,0], Cambiaghi:[28,6.94,7.32,3,4,0,0,0,0,0],
  Bernardeschi:[29,6.91,7.34,4,2,0,0,0,0,0], Politano:[34,6.90,7.16,2,5,0,0,0,0,0],
  Dybala:[22,6.90,7.30,2,6,23,7.40,8.27,6,3], Cancellieri:[30,6.87,7.24,4,2,0,0,0,0,0],
  "Rodriguez Je.":[31,6.86,7.27,2,9,0,0,0,0,0],
  Rowe:[28,6.80,7.16,3,2,0,0,0,0,0], Isaksen:[30,6.80,7.33,5,1,0,0,0,0,0],
  Mora:[0,0,0,0,0,0,0,0,0,0],
  // attaccanti
  Malen:[18,7.24,9.49,14,2,0,0,0,0,0], "Martinez L.":[30,7.08,8.92,17,6,31,7.20,8.45,12,3],
  Thuram:[29,7.04,8.56,13,6,32,7.31,8.73,14,4], Berardi:[26,7.02,7.91,8,4,0,0,0,0,0],
  "Davis K.":[30,7.01,8.06,10,4,0,0,0,0,0], "Esposito Se.":[36,7.00,7.64,7,5,0,0,0,0,0],
  Douvikas:[38,6.84,7.97,14,1,0,0,0,0,0], Raspadori:[13,6.82,7.59,3,1,0,0,0,0,0],
  "Vitinha O.":[35,6.80,7.19,5,1,0,0,0,0,0], Noslin:[29,6.77,7.13,4,2,0,0,0,0,0],
  Bowie:[14,6.76,7.59,4,0,0,0,0,0,0], Simeone:[32,6.76,7.78,11,0,0,0,0,0,0],
  Bonny:[32,6.76,7.34,5,4,0,0,0,0,0],
  Hojlund:[33,6.57,7.80,12,5,0,0,0,0,0], Scamacca:[24,6.69,7.94,10,1,0,0,0,0,0],
  Kean:[26,6.68,7.57,8,1,32,7.02,8.70,19,3], Krstovic:[33,6.68,7.68,10,5,37,7.15,8.01,11,5],
  "Zambo Anguissa":[18,6.87,7.56,4,1,0,0,0,0,0],
  "Kolo Muani":[0,0,0,0,0,16,7.03,8.59,8,1], Diao:[17,6.76,7.11,2,1,15,7.11,8.71,8,1],
  Lukaku:[0,0,0,0,0,36,7.00,8.31,14,10],
  Orsolini:[35,6.87,7.55,10,1,29,7.20,8.86,15,4],
};

/* Le tabelle statiche coprono i primi 50 per ruolo del 2025-26 piu' i primi
   50 assoluti del 2024-25: oltre quella soglia la fonte non e' paginabile.
   Per tutti gli altri le statistiche si recuperano a runtime e restano in
   cache: STORICO_LIVE viene riempito dalla preparazione pre-asta e, se
   serve, da una singola richiesta sul giocatore chiamato. */
const STORICO_LIVE = {};

const FM_BASE = { P: 6.0, D: 7.1, C: 7.3, A: 7.6 };   // fantamedia "normale" per ruolo

// Un numero solo che riassume lo storico: quanto rende sopra la media del
// ruolo, pesando piu' l'ultima stagione e meno chi ha giocato poco.
function resaStorica(g) {
  const s = STORICO[g.nome] || STORICO_LIVE[g.nome];
  if (!s) return null;
  const [p1, mv1, fm1, gol1, as1, p2, mv2, fm2, gol2, as2] = s;
  const rec = p1 >= 6, old = p2 >= 6;
  if (!rec && !old) return null;
  const w1 = rec && old ? 0.7 : rec ? 1 : 0;
  const w2 = 1 - w1;
  const fm = fm1 * w1 + fm2 * w2;
  const mv = mv1 * w1 + mv2 * w2;
  const pres = p1 * w1 + p2 * w2;
  const bonusGara = ((gol1 * 3 + as1) * w1 + (gol2 * 3 + as2) * w2) / Math.max(1, pres);
  /* Due cose diverse che prima confondevo.
     AFFIDABILITA': quanto e' solido il dato di rendimento. La fantamedia e'
     un tasso, non un totale: 18 partite sono gia' un campione discreto.
     DISPONIBILITA': quante partite giochera' quest'anno. Questa NON si deduce
     dalle presenze passate — un giocatore arrivato a gennaio ne ha poche ma
     gioca sempre. Si deduce dall'essere titolare adesso, che e' un dato del
     2026-27 e non del passato. Malen: 18 presenze, ma titolare fisso. */
  const fiducia = pres >= 28 ? 1 : pres >= 18 ? 0.92 : pres >= 11 ? 0.8 : pres >= 6 ? 0.62 : 0.4;
  const parziale = pres >= 10 && pres <= 22;
  return {
    fm: +fm.toFixed(2), mv: +mv.toFixed(2), pres: Math.round(pres),
    bonusGara: +bonusGara.toFixed(2), fiducia,
    parziale,
    sopraMedia: +(fm - FM_BASE[g.ruolo]).toFixed(2),
    riga: `${rec ? `25-26: ${p1} gare, MV ${mv1}, FM ${fm1}, ${gol1}g ${as1}a` : "25-26: non in A"}${old ? ` | 24-25: ${p2} gare, MV ${mv2}, FM ${fm2}, ${gol2}g ${as2}a` : ""}${parziale && g.tit ? " — poche gare ma titolare adesso: stagione parziale, non panchina" : ""}`,
  };
}

const RUOLI = ["P", "D", "C", "A"];
const SLOT = { P: 3, D: 8, C: 8, A: 6 };   // riscritto da applicaRegole()
const RUOLO_NOME = { P: "portieri", D: "difensori", C: "centrocampisti", A: "attaccanti" };
const RUOLO_SING = { P: "portiere", D: "difensore", C: "centrocampista", A: "attaccante" };
const COL_RUOLO = { P: "#F2A93B", D: "#58B368", C: "#4B8FD6", A: "#E2564F" };

// I nomi del listone hanno accenti e apostrofi (Laurientè, Konè, N'Dicka,
// Esposito F.P.): normalizzo tutto cosi' si trovano scrivendo di corsa.
const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['`.]/g, "").trim();

const LISTONE = RAW.trim().split("\n").map((r, i) => {
  const [nome, sq, ruolo, fvm, tit] = r.split("|");
  const p = PIU[nome] || [0, 0, 0, 0, 0];
  return {
    id: i, nome, sq, ruolo, fvm: +fvm, tit: tit === "1", cerca: norm(nome),
    bon: p[0], rig: p[1] / 10, trend: p[2], sch: p[3], fuori: p[4] === 1,
  };
});

/* ---------------- motore prezzi ----------------
   Tutto deterministico e locale: nessuna chiamata in rete nel
   momento in cui devi decidere.
------------------------------------------------- */

function prezzoBase(fvm, crediti = 1000) {
  const k = crediti / 1000;   // il listone e' tarato su 1000
  let p;
  if (fvm >= 150) p = fvm;
  else if (fvm >= 60) p = fvm * 0.85;
  else if (fvm >= 25) p = fvm * 0.6;
  else p = fvm * 0.4;
  return Math.max(1, p * k);
}

// Quanto vale davvero, oltre al prezzo di mercato.
function utilita(g, opz) {
  const r = opz.regole || REGOLE_BASE;
  let u = g.fvm + (g.tit ? 45 : 0) + g.bon * 12 + g.trend * 8;
  u += g.rig * (r.assist === false ? 18 : 15);        // senza assist il rigore pesa di piu'
  if (g.sch) u += (g.sch - 70) * (r.portaInviolata ? 2 : 1.2);
  if (r.modDifesa && (g.ruolo === "D" || g.ruolo === "P")) u *= 1.45;
  if (!r.assist && g.bon > 0) u -= g.bon * 4;          // meno bonus in circolazione
  // lo storico: rendere sopra la media del ruolo vale, giocare sempre vale
  const st = resaStorica(g);
  if (st) {
    u += st.sopraMedia * 40 * st.fiducia;         // +1 di fantamedia = +40 di valore
    u += st.bonusGara * 25 * st.fiducia;
    // quante partite fara' quest'anno lo dice la formazione tipo 2026-27,
    // non il conteggio dello scorso campionato
    if (!g.tit && st.pres < 20) u -= 12;
  }
  /* Col modificatore di difesa il blocco vale piu' dei singoli: il bonus
     scatta solo se portiere e difensori vanno a voto insieme, quindi tre
     difensori della stessa squadra piu' il suo portiere rendono molto piu'
     di quattro buoni presi da quattro squadre diverse. */
  if (r.modDifesa && (g.ruolo === "D" || g.ruolo === "P") && opz.mieiDifensori) {
    const stessi = opz.mieiDifensori[g.sq] || 0;
    if (stessi >= 1) u += 30 * Math.min(stessi, 3);
  }
  if (opz.premioRoma && g.sq === "ROM") u += 25;
  return u;
}

/* Asta per reparti: portieri, poi difesa, poi centrocampo, poi attacco.
   Il reparto in corso e' il primo dell'ordine in cui qualcuno ha ancora
   slot liberi. Cambia tutto: non c'e' piu' da scegliere su quale reparto
   muoversi, c'e' da non sbagliare il budget della fase in cui sei. */
function repartoCorrente(squadre) {
  for (const r of REGOLE.ordineReparti)
    if (squadre.some((s) => SLOT[r] - s.rosa[r].length > 0)) return r;
  return null;
}

// Quanti crediti riservare ai reparti che devono ancora arrivare.
function budgetFasiFuture(io, reparto, riserva = 0) {
  const ord = REGOLE.ordineReparti;
  const dopo = ord.slice(ord.indexOf(reparto) + 1);
  const totQuote = ord.reduce((a, r) => a + (SLOT[r] - io.rosa[r].length > 0 ? QUOTE[r] : 0), 0) || 1;
  const disponibile = Math.max(0, io.crediti - riserva);   // la riserva e' gia' fuori
  return dopo.reduce((a, r) => a + (SLOT[r] - io.rosa[r].length > 0
    ? disponibile * (QUOTE[r] / totQuote) : 0), 0);
}

function slotRimasti(sq) {
  return RUOLI.reduce((s, r) => s + (SLOT[r] - sq.rosa[r].length), 0);
}

function offertaMassimaLegale(sq) {
  const n = slotRimasti(sq);
  if (n <= 0) return 0;
  return Math.max(1, sq.crediti - (n - 1));
}

function consiglia(g, squadre, ioIdx, opz, venduti) {
  const io = squadre[ioIdx];
  const legale = offertaMassimaLegale(io);
  if (g.fuori) return { max: 0, legale, note: [], nota: "il listone lo segna fuori dalla Serie A", allarme: true };
  if (SLOT[g.ruolo] - io.rosa[g.ruolo].length <= 0)
    return { max: 0, legale, note: [], nota: `hai gia' 8 ${RUOLO_NOME[g.ruolo]}` };

  const reg = opz.regole || REGOLE_BASE;
  let p = prezzoBase(g.fvm, reg.crediti);
  const note = [];

  // Le regole di punteggio cambiano quanto vale un reparto, non solo il budget.
  if (reg.modDifesa && (g.ruolo === "P" || g.ruolo === "D")) {
    p *= 1.4;
    const stessi = (opz.mieiDifensori || {})[g.sq] || 0;
    if (stessi >= 1) { p *= 1 + Math.min(stessi, 3) * 0.09; note.push(`hai gia' ${stessi} della ${g.sq}: il blocco vale di piu'`); }
    note.push("modificatore di difesa attivo");
  }
  if (reg.maxAtt <= 2 && g.ruolo === "A") { p *= 0.85; note.push("se ne schierano al massimo 2, gli attaccanti valgono meno"); }
  if (reg.assist === false && g.ruolo === "C" && g.bon >= 5) { p *= 0.88; note.push("senza bonus assist rende meno"); }
  if (reg.portaInviolata === false && g.ruolo === "P") { p *= 0.8; note.push("senza porta inviolata il portiere conta poco"); }
  const daRegole = p;   // base dopo le regole, prima delle correzioni di mercato

  const rivali = squadre.filter((s, i) =>
    i !== ioIdx && SLOT[g.ruolo] - s.rosa[g.ruolo].length > 0 && offertaMassimaLegale(s) >= p * 0.7
  ).length;

  if (rivali === 0) { p = Math.min(p, 3); note.push("nessuno puo' rilanciare: apri a 1"); }
  else if (rivali === 1) { p *= 0.7; note.push("un solo rivale in gioco"); }
  else if (rivali >= 4) { p *= 1.15; note.push(`${rivali} rivali possono rilanciare`); }

  const presi = new Set(venduti.map((v) => v.gid));
  const offerta = LISTONE.filter((x) => x.ruolo === g.ruolo && x.tit && !x.fuori && !presi.has(x.id)).length;
  const domanda = squadre.reduce((s, sq) => s + (SLOT[g.ruolo] - sq.rosa[g.ruolo].length), 0);
  if (domanda > 0) {
    const r = offerta / domanda;
    if (r < 0.5) { p *= 1.25; note.push(`restano ${offerta} titolari per ${domanda} slot`); }
    else if (r > 2) { p *= 0.8; note.push(`${offerta} titolari liberi: c'e' abbondanza`); }
  }

  if (g.rig >= 2) { p *= 1.12; note.push(`rigorista, ${g.rig.toFixed(1)} gol attesi dal dischetto`); }
  if (g.trend >= 2) { p *= 1.08; note.push("quotazione in salita dopo due giornate"); }
  if (g.trend <= -2) { p *= 0.92; note.push("quotazione in calo"); }
  if (opz.premioRoma && g.sq === "ROM") { p *= 1.15; note.push("premio tifoso tuo"); }

  // Quanto costera' davvero, col tifo degli altri dentro il prezzo.
  const ft = fattoreTifo(g.sq, squadre);
  // prima chiudo le correzioni di mercato dentro una banda, calcolata pero'
  // sul prezzo gia' corretto dalle regole della lega: il modificatore di
  // difesa e il blocco non sono rumore, sono il regolamento.
  p = Math.min(Math.max(p, daRegole * 0.55), daRegole * 1.35);

  // ...poi applico quello che il tavolo sta davvero pagando, senza limiti
  const k = (opz.infl || 1) * (opz.press || 1);
  p *= k;
  if ((opz.press || 1) >= 1.25) note.push("hai piu' crediti di quanti te ne servano: puoi spingere");
  if (k >= 1.15) note.push(`il tavolo paga il ${Math.round((k - 1) * 100)}% sopra i valori`);
  if (k <= 0.85) note.push(`il tavolo paga il ${Math.round((1 - k) * 100)}% sotto i valori`);
  const atteso = Math.max(1, Math.round(p * ft));
  const nRiv = tifosiRivali(g.sq, squadre);
  if (nRiv >= 2) note.push(`due tifosi ${g.sq} al tavolo: se lo contendono`);
  else if (nRiv === 1) note.push(`un tifoso ${g.sq} al tavolo`);
  else if (tifosiTotali(g.sq, squadre) === 0) note.push("nessuno tifa per loro: si compra scontato");

  const max = Math.max(1, Math.min(Math.round(p), legale));
  return { max, atteso, ft, legale, rivali, note, stop: max >= legale && legale > 0 };
}

/* ---------------- agente ----------------
   Dentro l'artifact la chiamata e' gia' autenticata: nessuna API key nel
   codice. Fuori di qui la chiave va su un proxy, mai nel frontend.
   L'agente lavora PRIMA dell'asta (dossier sugli obiettivi) e nelle pause.
   Mai sul numero: quello deve uscire in zero secondi.
----------------------------------------- */

/* Nessuna API key: dentro l'artifact la chiamata e' gia' autenticata.
   Servirebbe una chiave solo portando l'app fuori di qui, e in quel caso
   andrebbe su un proxy lato server, mai nel codice della pagina. */
const MODELLI = [
  { id: "claude-sonnet-5", n: "Sonnet 5", d: "equilibrato, buono durante l'asta" },
  { id: "claude-opus-5", n: "Opus 5", d: "ragiona meglio, piu' lento: usalo nelle pause" },
];
/* Stima del tempo di attesa.
   Le prime volte uso questi valori di partenza; da li' in poi misuro le
   chiamate vere e uso la mediana delle ultime, cosi' la stima si taglia
   sulla tua connessione invece che su una media inventata.
   La ricerca web raddoppia abbondantemente i tempi. */
const SEC_BASE = { "claude-sonnet-5": 14, "claude-opus-5": 38 };

function stimaSecondi(modello, conRicerca, misure) {
  const m = (misure && misure[modello]) || [];
  let base;
  if (m.length >= 2) {
    const ord = [...m].sort((a, b) => a - b);
    base = ord[Math.floor(ord.length / 2)];          // mediana delle misurate
  } else {
    base = SEC_BASE[modello] || 20;
  }
  return Math.round(base * (conRicerca ? 2.4 : 1));
}

const formattaAttesa = (sec) => {
  if (sec < 50) return `circa ${Math.round(sec / 5) * 5} secondi`;
  const min = sec / 60;
  if (min < 1.6) return "circa un minuto";
  return `circa ${Math.round(min)} minuti`;
};

const VERSIONE = "11 — esca coerente fra le due schermate";

const VELOCE_DEFAULT = "claude-sonnet-5";
const PROFONDO_DEFAULT = "claude-opus-5";

/* Indirizzo del proxy che custodisce la chiave API. Si imposta dalle
   impostazioni dell'app: cosi' funziona anche sul telefono, senza console. */
let PROXY = (() => { try { return localStorage.getItem("banco-proxy") || ""; } catch (e) { return ""; } })();
const USA_PROXY = true;

const impostaProxy = (url) => {
  PROXY = (url || "").trim().replace(/\/+$/, "");
  try { localStorage.setItem("banco-proxy", PROXY); } catch (e) {}
  return PROXY;
};

const endpoint = () => (USA_PROXY ? PROXY : "https://api.anthropic.com/v1/messages");

async function unaChiamata(modello, prompt, conRicerca) {
  if (USA_PROXY && !PROXY) throw new Error("proxy non impostato");
  const body = { model: modello, max_tokens: 1000, messages: [{ role: "user", content: prompt }] };
  if (conRicerca) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const r = await fetch(endpoint(), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (r.status === 403) throw new Error("403: il dominio nel worker non combacia, oppure non hai ridistribuito dopo la modifica");
  if (r.status === 401) throw new Error("401: la chiave manca o il Secret non si chiama ANTHROPIC_API_KEY");
  if (r.status === 404) throw new Error("404: indirizzo del proxy sbagliato");
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || "modello non disponibile");
  const t = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  if (!t) throw new Error("risposta vuota");
  return t;
}

// Se il modello scelto non e' abilitato in questo runtime provo gli altri
// della lista, invece di lasciarti senza risposta a meta' asta.
async function chiediAgente(prompt, conRicerca, modello = VELOCE_DEFAULT, onDurata) {
  const catena = [modello, ...MODELLI.map((m) => m.id).filter((id) => id !== modello)];
  let ultimo;
  for (const id of catena) {
    const t0 = Date.now();
    try {
      const t = await unaChiamata(id, prompt, conRicerca);
      if (onDurata) onDurata(id, (Date.now() - t0) / 1000 / (conRicerca ? 2.4 : 1));
      return id === modello ? t : t + `\n\n(${modello} non e' disponibile qui: ho risposto con ${id}.)`;
    } catch (e) { ultimo = e; }
  }
  throw ultimo || new Error("nessun modello disponibile");
}

/* I modelli ogni tanto incorniciano il JSON con una frase di cortesia.
   Invece di arrendermi ritaglio dal primo graffa all'ultima. */
function leggiJSON(t) {
  const pulito = t.replace(/```json|```/g, "").trim();
  try { return JSON.parse(pulito); } catch (e) {}
  const a = pulito.indexOf("{"), b = pulito.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(pulito.slice(a, b + 1));
  throw new Error("JSON non leggibile");
}

const CONTESTO = `Lega Classic a ${REGOLE.squadre} squadre, ${REGOLE.crediti} crediti a testa, rosa ${REGOLE.slot.P} portieri ${REGOLE.slot.D} difensori ${REGOLE.slot.C} centrocampisti ${REGOLE.slot.A} attaccanti, asta a chiamata libera, in campo minimo ${REGOLE.minDif} difensori e massimo ${REGOLE.maxAtt} attaccanti.${REGOLE.modDifesa ? " Modificatore di difesa ATTIVO: portiere e difensori valgono molto di piu' del solito." : ""}${REGOLE.assist ? "" : " Niente bonus assist."} Si comprano ${REGOLE.squadre * 25} giocatori su ~580: la fascia bassa vale 1-2 crediti. Il proprietario tifa Roma.
Il tuo addestramento non copre il mercato estivo 2026: non fidarti della memoria su squadre, titolarita' o infortuni, cerca sul web. Rispondi in italiano, asciutto, senza preamboli.`;

/* Il valutatore.
   Gira DOPO ogni aggiudicazione, nel tempo morto fra un lotto e l'altro:
   rilegge il tavolo, ricalibra sui prezzi di chiusura reali e decide in
   anticipo i tetti per i prossimi obiettivi probabili. Cosi' quando un nome
   viene chiamato la valutazione dell'AI e' gia' pronta e compare subito.
   Il motore locale resta sotto come rete: se l'AI e' lenta o non risponde,
   un numero ce l'hai comunque. */
function promptValutazione(squadre, io, liberi, venduti, piano, opz, riserva) {
  const rep = (s2) => RUOLI.map((r) => `${r} ${s2.rosa[r].length}/${SLOT[r]}`).join(" ");
  const fede = { ROM: "romanista", LAZ: "laziale", JUV: "juventino" };

  const chiusure = venduti.slice(-10).map((v) =>
    `${v.nome} (${v.ruolo}) a ${v.prezzo} -> ${squadre[v.a].nome}${v.previsto ? `, io stimavo ${v.previsto}` : ""}`
  ).join("\n") || "nessuna ancora";

  const cand = RUOLI.flatMap((r) => {
    if (SLOT[r] - io.rosa[r].length <= 0) return [];
    return liberi.filter((g) => g.ruolo === r && !g.fuori)
      .sort((a, b) => b.fvm - a.fvm).slice(0, 5)
      .map((g) => {
        const c = consiglia(g, squadre, 0, opz, venduti);
        const st = resaStorica(g);
        const extra = [g.tit ? "titolare" : "riserva", g.rig >= 2 ? `rigorista ${g.rig}` : "",
          g.trend ? `quotazione ${g.trend > 0 ? "+" : ""}${g.trend} dopo 2 giornate` : ""]
          .filter(Boolean).join(", ");
        return `${g.nome} | ${g.sq} | ${r} | mercato ${g.fvm} | ${extra} | ${st ? st.riga : "storico: nessun dato in Serie A"} | mio calcolo: tetto ${c.max}, chiusura ${c.atteso}`;
      });
  }).join("\n");

  const fase = repartoCorrente(squadre);
  const futuro = Math.round(budgetFasiFuture(io, fase || "A", riserva));
  const blocchi = Object.entries(["P", "D"].reduce((c, r) => {
    io.rosa[r].forEach((g) => { c[g.sq] = (c[g.sq] || 0) + 1; }); return c;
  }, {})).filter(([, n]) => n >= 2).map(([sq, n]) => `${n} della ${sq}`).join(", ");

  return `Sei il direttore sportivo di una fantasquadra, in diretta durante l'asta. Decidi tu i prezzi.

REGOLE: ${REGOLE.squadre} squadre, ${REGOLE.crediti} crediti, rosa ${REGOLE.slot.P}-${REGOLE.slot.D}-${REGOLE.slot.C}-${REGOLE.slot.A}, in campo min ${REGOLE.minDif} difensori e max ${REGOLE.maxAtt} attaccanti. Ogni giocatore parte da 1 credito.
MODIFICATORE DI DIFESA ATTIVO. E' la regola che decide il campionato: il bonus scatta sulla media dei voti di portiere e difensori schierati insieme, quindi un blocco di 3-4 difensori della STESSA squadra col suo portiere rende molto piu' di quattro buoni presi da quattro squadre diverse. Conta la solidita' difensiva della squadra reale, non solo il singolo.${blocchi ? ` Ho gia' ${blocchi}.` : ""}
ASTA PER REPARTI, in ordine: portieri, difensori, centrocampisti, attaccanti. Si chiama a turno, uno alla volta. ADESSO SI FANNO I ${fase ? RUOLO_NOME[fase].toUpperCase() : "—"}: consigliami solo giocatori di questo reparto.
Attenzione al budget di fase: mi restano ${io.crediti} crediti, ma ${futuro} servono ai reparti che devono ancora arrivare e ${riserva} li tengo per gennaio. Se sfondo adesso, nei reparti dopo non compro piu' niente. All'inizio dell'asta sono tutti pieni di crediti e i prezzi del primo reparto si gonfiano: e' li' che si perde l'asta.
Si comprano ${REGOLE.squadre * 25} giocatori su ~580 quotati: chi resta invenduto e' spesso un titolare, quindi la fascia bassa vale 1-3 crediti e la coda della rosa non va pagata.
A gennaio i crediti avanzati si portano dietro, piu' ${REGOLE.riparazioneCrediti} a testa, e si puo' fare cassa rivendendo giocatori. Quindi avanzare crediti vale qualcosa, ma non troppo: tutti ricevono comunque i ${REGOLE.riparazioneCrediti} e si puo' vendere per rifarsi. Ne tengo ${riserva} da parte.

AL TAVOLO (il tifo gonfia i prezzi delle proprie squadre):
${squadre.map((s2, i) => `${i === 0 ? "IO" : s2.nome} — ${s2.crediti} crediti, ${rep(s2)}, puo' offrire max ${offertaMassimaLegale(s2)}${s2.tifo ? `, ${fede[s2.tifo] || s2.tifo}` : ""}`).join("\n")}

LA MIA ROSA:
${RUOLI.map((r) => `${RUOLO_NOME[r]}: ${io.rosa[r].map((g) => `${g.nome} ${g.prezzo}`).join(", ") || "vuoto"}`).join("\n")}

ULTIME CHIUSURE (confrontale con le mie stime e ricalibra):
${chiusure}

CANDIDATI ANCORA LIBERI:
${cand}

COME PESARE LO STORICO: la stagione 25-26 vale piu' della 24-25. La fantamedia dice quanto rende a partita, gol e assist sono il bonus reale, la media voto sotto 6.5 su un titolare e' un malus che il prezzo di mercato spesso ignora.
ATTENZIONE ALLE PRESENZE: poche presenze NON significano automaticamente che gioca poco. Distingui tre casi diversi, se serve cercando sul web quando e' arrivato in Serie A:
1) arrivato a mercato di gennaio o durante la stagione — le presenze sono poche ma il rendimento e' pieno: vale come un titolare, non scontarlo (esempio: Malen alla Roma da gennaio 2026, 18 gare ma sempre titolare);
2) infortunato a lungo — rischio reale, sconta;
3) in rotazione o in panchina — sconta di piu', perche' il problema si ripetera'.
Incrocia sempre con la formazione tipo 2026-27 che ti do sopra: se e' titolare adesso, quello conta piu' del conteggio dello scorso anno.
Un giocatore senza storico in Serie A e' un'incognita: prezzalo sotto il mercato salvo evidenze dalle prime due giornate.

Rispondi SOLO con questo JSON, niente altro, niente backtick. Massimo 12 tetti. Frasi brevissime, in italiano.
{"calibrazione":numero fra 0.6 e 1.8 (quanto il tavolo paga sopra o sotto le mie stime),
"lettura":"due frasi su dove siamo e cosa cambia adesso",
"chiamare":{"nome":"chi chiamare al mio turno","tetto":numero,"perche":"una frase"},
"tetti":[{"nome":"esatto come sopra","max":numero massimo che devo offrire,"perche":"max 10 parole"}]}`;
}

function riassuntoStato(squadre, io, liberi) {
  const rep = (s) => RUOLI.map((r) => `${r} ${s.rosa[r].length}/${SLOT[r]}`).join(" ");
  return `LA MIA SITUAZIONE
${io.crediti} crediti, ${rep(io)}, tetto massimo ${offertaMassimaLegale(io)}.
${RUOLI.map((r) => `${RUOLO_NOME[r]}: ${io.rosa[r].map((g) => `${g.nome} (${g.prezzo})`).join(", ") || "nessuno"}`).join("\n")}

AVVERSARI
${squadre.slice(1).map((s) => `- ${s.nome}: ${s.crediti} crediti, ${rep(s)}`).join("\n")}

ANCORA LIBERI (valore su 1000, * titolare)
${RUOLI.map((r) => `${RUOLO_NOME[r]}: ${liberi.filter((g) => g.ruolo === r).sort((a, b) => b.fvm - a.fvm).slice(0, 8).map((g) => `${g.nome} ${g.sq} ${g.fvm}${g.tit ? "*" : ""}`).join(", ")}`).join("\n")}`;
}

/* ---------------- il piano ---------------- */

let QUOTE = { P: 0.09, D: 0.15, C: 0.33, A: 0.43 };

const REGOLE_BASE = REGOLE;
applicaRegole(REGOLE);

/* Le regole riscrivono il motore, non solo le etichette.
   Il modificatore di difesa e' quello che sposta di piu': senza, la difesa
   e' quasi gratis; con, portiere e blocco arretrato diventano il reparto
   dove si vince, e il budget va spostato li'. */
function applicaRegole(r) {
  Object.assign(SLOT, r.slot);
  if (r.modDifesa) QUOTE = { P: 0.13, D: 0.26, C: 0.30, A: 0.31 };
  else if (r.maxAtt <= 2) QUOTE = { P: 0.09, D: 0.17, C: 0.40, A: 0.34 };
  else QUOTE = { P: 0.09, D: 0.15, C: 0.33, A: 0.43 };
}

function costruisciPiano(squadre, ioIdx, opz, venduti) {
  const io = squadre[ioIdx];
  const presi = new Set(venduti.map((v) => v.gid));
  const piano = {};
  for (const r of RUOLI) {
    const daPrendere = SLOT[r] - io.rosa[r].length;
    if (daPrendere <= 0) { piano[r] = { obiettivi: [], riempitivi: [], budget: 0 }; continue; }
    const altriSlot = RUOLI.reduce((s, x) => s + (x === r ? 0 : SLOT[x] - io.rosa[x].length), 0);
    const disponibile = Math.max(0, io.crediti - altriSlot);
    const quotaTot = RUOLI.reduce((s, x) => s + (SLOT[x] - io.rosa[x].length > 0 ? QUOTE[x] : 0), 0);
    const budget = Math.round(disponibile * (QUOTE[r] / (quotaTot || 1)));

    const candidati = LISTONE.filter((g) => g.ruolo === r && !presi.has(g.id) && !g.fuori)
      .map((g) => {
        const reg = opz.regole || REGOLE_BASE;
        let base = prezzoBase(g.fvm, reg.crediti);
        if (reg.modDifesa && (g.ruolo === "P" || g.ruolo === "D")) base *= 1.4;
        if (reg.maxAtt <= 2 && g.ruolo === "A") base *= 0.85;
        const tetto = Math.max(1, Math.round(base * (opz.premioRoma && g.sq === "ROM" ? 1.15 : 1)));
        // Il rapporto si misura su quanto costera', non su quanto vale:
        // cosi' i giocatori delle squadre senza tifosi al tavolo salgono
        // nel piano e quelli di Lazio e Juve ne escono da soli.
        const costo = Math.max(1, Math.round(tetto * fattoreTifo(g.sq, squadre)));
        return { ...g, tetto, costo, val: utilita(g, opz) / costo };
      })
      .sort((a, b) => b.val - a.val);

    /* Il piano non e' "compra i migliori rapporti qualita'/prezzo": quelli sono
       sempre i giocatori da 5 crediti, e comprando solo quelli finiresti l'asta
       con la rosa piena e il portafoglio pieno. Il piano deve SPENDERE il budget
       del reparto sui giocatori giusti.
       Parto quindi da una base di titolari economici e poi miglioro uno slot alla
       volta, scegliendo ogni volta l'upgrade che rende di piu' per credito speso,
       finche' il budget regge. Cosi' escono i due o tre pilastri piu' il riempimento. */
    const perCosto = [...candidati].sort((a, b) => a.costo - b.costo);
    const base = [];
    for (const g of perCosto) {
      if (base.length >= daPrendere) break;
      if (g.tit || base.length < daPrendere) base.push(g);
    }
    let scelti = base.slice(0, daPrendere);
    let speso = scelti.reduce((a, g) => a + g.costo, 0);

    for (let giro = 0; giro < daPrendere * 3; giro++) {
      let migliore = null;
      for (let i = 0; i < scelti.length; i++) {
        for (const g of candidati) {
          if (scelti.some((x) => x.id === g.id)) continue;
          const delta = g.costo - scelti[i].costo;
          if (delta <= 0 || speso + delta > budget) continue;
          const guadagno = utilita(g, opz) - utilita(scelti[i], opz);
          if (guadagno <= 0) continue;
          const resa = guadagno / delta;
          if (!migliore || resa > migliore.resa) migliore = { i, g, delta, resa };
        }
      }
      if (!migliore) break;
      speso += migliore.delta;
      scelti[migliore.i] = migliore.g;
    }

    scelti.sort((a, b) => b.costo - a.costo);
    const obiettivi = scelti.filter((g) => g.costo > 4);
    const riempitivi = scelti.filter((g) => g.costo <= 4);

    piano[r] = { obiettivi, riempitivi, budget };
  }
  return piano;
}

/* ---------------- il fattore tifo ----------------
   Al tavolo ci sono 2 romanisti (incluso me), 2 laziali, 2 juventini.
   Due conseguenze opposte, e la seconda vale piu' della prima:
   1) Roma, Lazio e Juve si pagano sopra il valore;
   2) i giocatori delle altre diciassette squadre restano scoperti,
      perche' i crediti del tavolo sono finiti e vanno tutti li'.
   L'app tiene percio' separati "quanto vale per me" e "quanto costera'".
------------------------------------------------- */

const TIFI = [
  { k: "", n: "nessuna in particolare" },
  { k: "ROM", n: "Roma" }, { k: "LAZ", n: "Lazio" }, { k: "JUV", n: "Juventus" },
  { k: "INT", n: "Inter" }, { k: "MIL", n: "Milan" }, { k: "NAP", n: "Napoli" },
];

const tifosiRivali = (sigla, squadre) => squadre.slice(1).filter((s) => s.tifo === sigla).length;
const tifosiTotali = (sigla, squadre) => squadre.filter((s) => s.tifo === sigla).length;

// Quanto sale il prezzo di chiusura per effetto del tifo altrui.
function fattoreTifo(sigla, squadre) {
  const rivali = tifosiRivali(sigla, squadre);
  if (rivali >= 2) return 1.4;
  if (rivali === 1) return 1.22;
  // nessun tifoso al tavolo: i crediti sono altrove, si compra sotto prezzo
  return tifosiTotali(sigla, squadre) === 0 ? 0.88 : 1;
}

// Quanto costa completare il piano, escluso lo slot che sto comprando ora.
function costoResiduo(piano, io, ruoloEscluso) {
  let tot = 0;
  for (const r of RUOLI) {
    const serve = SLOT[r] - io.rosa[r].length - (r === ruoloEscluso ? 1 : 0);
    if (serve <= 0) continue;
    const listaCosti = [...piano[r].obiettivi, ...piano[r].riempitivi]
      .map((g) => g.costo || g.tetto).sort((a, b) => b - a).slice(0, serve);
    tot += listaCosti.reduce((a, b) => a + b, 0);
    tot += Math.max(0, serve - listaCosti.length); // gli slot scoperti a 1
  }
  return tot;
}

/* La riserva per il mercato di riparazione.
   Vale solo se a gennaio i crediti avanzati si portano dietro: se la lega
   riparte con un budget nuovo, tenerne da parte vale zero.
   Anche quando vale, si finanzia dalla coda della rosa (un titolare da 1
   invece della quinta scelta da 40), mai dai pilastri: in fondo alla rosa
   il costo-opportunita' e' quasi nullo, in cima e' enorme.
   La riserva viene sciolta se rischia di lasciarti la rosa incompleta. */
function riservaAttiva(opz, io, piano) {
  if (opz.riparazione !== "residuo") return 0;
  const r = opz.riserva || 0;
  const serve = costoResiduo(piano, io, null);
  // prima si completa la rosa, poi si risparmia
  if (io.crediti - r < serve * 0.75) return Math.max(0, io.crediti - serve);
  return r;
}

// Quanti crediti ho in piu' rispetto a quel che mi serve per finire.
// Sopra 1 sono soldi che rischio di riportare a casa: valgono zero.
function pressioneSpesa(io, piano, riserva = 0) {
  const serve = costoResiduo(piano, io, null);
  if (serve <= 0) return 1;
  const r = Math.max(0, io.crediti - riserva) / serve;
  if (r >= 2.0) return 1.45;
  if (r >= 1.6) return 1.28;
  if (r >= 1.3) return 1.14;
  if (r <= 0.85) return 0.9;
  return 1;
}

// Il tavolo paga sopra o sotto i miei valori? Lo misuro sulle ultime chiusure
// e ricalibro tutti i tetti. Senza questo il modello resta fermo mentre
// l'asta si muove.
function inflazione(venduti) {
  const ultimi = venduti.filter((v) => v.previsto > 3).slice(-8);
  if (ultimi.length < 3) return { k: 1, n: ultimi.length };
  const rapporti = ultimi.map((v) => v.prezzo / v.previsto).sort((a, b) => a - b);
  const mediana = rapporti[Math.floor(rapporti.length / 2)];
  return { k: Math.max(0.6, Math.min(1.8, mediana)), n: ultimi.length };
}

const nuovaSquadra = (nome, tifo = "", persona = "") => ({ nome, tifo, persona, crediti: 1000, rosa: { P: [], D: [], C: [], A: [] } });
function generaSquadre(n, crediti, vecchie) {
  return Array.from({ length: n }, (_, i) => {
    const v = vecchie && vecchie[i];
    const [nome, tifo] = REGOLE.sedie[i] || [`Squadra ${i + 1}`, ""];
    return { ...nuovaSquadra(v ? v.nome : nome, v ? v.tifo : tifo, v ? v.persona : ""), crediti };
  });
}

const statoIniziale = () => ({
  squadre: generaSquadre(REGOLE.squadre, REGOLE.crediti),
  venduti: [],
  opz: { premioRoma: true, riparazione: REGOLE.riparazione, riserva: REGOLE.riserva },
  dossier: {}, stat: {}, preparata: false,
});

// La chiave di salvataggio contiene la firma delle regole: se le cambio,
// l'asta vecchia non viene ricaricata con numeri che non tornano piu'.
const FIRMA = "v4-" + [REGOLE.squadre, REGOLE.crediti, REGOLE.slot.P, REGOLE.slot.D,
  REGOLE.slot.C, REGOLE.slot.A, REGOLE.modDifesa ? "md" : "", REGOLE.riparazione].join("");

const C = {
  bg: "#0A1C12", su: "#12291B", li: "#1E4029", tx: "#E8F0E4",
  mu: "#7B9683", gi: "#F2B335", ro: "#E2564F", gesso: "#C9DBC8",
};

/* ---------------- interfaccia ---------------- */

function Disco({ r, grande }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
      style={{ background: COL_RUOLO[r], color: "#0A1C12", width: grande ? 34 : 22, height: grande ? 34 : 22, fontSize: grande ? 16 : 11 }}>
      {r}
    </span>
  );
}

function Statini({ g }) {
  const v = [];
  if (g.bon > 0) v.push(`+3 e +1 attesi: ${g.bon}`);
  if (g.rig >= 1) v.push(`rigorista ${g.rig.toFixed(1)}`);
  if (g.sch > 0) v.push(`gioca ${g.sch}%`);
  if (g.trend !== 0) v.push(`${g.trend > 0 ? "▲" : "▼"} ${Math.abs(g.trend)}`);
  if (!v.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2" style={{ color: C.mu }}>
      {v.map((x, i) => <span key={i}>{x}</span>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ESPORTAZIONE. Rete di sicurezza: se l'app si pianta, si chiude il
   browser o il telefono muore, le rose sono comunque su un file.
   Il CSV lo genero a mano, senza librerie: e' il formato che non puo'
   fallire. L'xlsx richiede SheetJS, che carico solo se lo chiedi e se
   non arriva ripiego sul CSV.
   ══════════════════════════════════════════════════════════════════ */

const csvCella = (v) => {
  const t = String(v ?? "");
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

function tabelle(stato, regole) {
  const { squadre, venduti } = stato;
  const rose = [["Squadra", "Ruolo", "Giocatore", "Club", "Prezzo"]];
  for (const s of squadre)
    for (const r of RUOLI)
      for (const g of s.rosa[r]) rose.push([s.nome, r, g.nome, g.sq, g.prezzo]);

  const riepilogo = [["Squadra", "Allenatore", "Tifa", "Crediti residui", "Spesi", "Portieri", "Difensori", "Centrocampisti", "Attaccanti", "Totale"]];
  for (const s of squadre)
    riepilogo.push([s.nome, s.persona || "", s.tifo || "", s.crediti, regole.crediti - s.crediti,
      `${s.rosa.P.length}/${SLOT.P}`, `${s.rosa.D.length}/${SLOT.D}`,
      `${s.rosa.C.length}/${SLOT.C}`, `${s.rosa.A.length}/${SLOT.A}`,
      RUOLI.reduce((a, r) => a + s.rosa[r].length, 0)]);

  const cronologia = [["N", "Giocatore", "Ruolo", "Club", "Prezzo", "Comprato da"]];
  venduti.forEach((v, i) => cronologia.push([i + 1, v.nome, v.ruolo, v.sq, v.prezzo, squadre[v.a].nome]));

  return { rose, riepilogo, cronologia };
}

function testoCSV(stato, regole) {
  const t = tabelle(stato, regole);
  const blocco = (titolo, righe) => `${titolo}\n` + righe.map((r) => r.map(csvCella).join(";")).join("\n");
  return [blocco("ROSE", t.rose), blocco("RIEPILOGO", t.riepilogo), blocco("CRONOLOGIA", t.cronologia)].join("\n\n");
}

const chiSei = (s) => (s.persona ? s.persona : s.nome);
const etichetta = (s) => (s.persona && s.persona !== s.nome ? `${s.nome} (${s.persona})` : s.nome);

const oraFile = () => new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");

/* Scarica se il browser lo permette. Dentro un artifact il download puo'
   essere bloccato dal sandbox: in quel caso copio negli appunti, che
   funziona sempre e ti basta incollare in un foglio. */
async function scarica(nome, contenuto, tipo) {
  try {
    const blob = new Blob(["\ufeff" + contenuto], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    return "scaricato";
  } catch (e) {
    try { await navigator.clipboard.writeText(contenuto); return "copiato"; }
    catch (e2) { return "fallito"; }
  }
}

// SheetJS solo su richiesta, e solo se il browser lo lascia caricare
function caricaSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.onload = () => (window.XLSX ? ok(window.XLSX) : no(new Error("non caricato")));
    s.onerror = () => no(new Error("bloccato"));
    document.head.appendChild(s);
    setTimeout(() => no(new Error("troppo lento")), 12000);
  });
}

/* ══════════════════════════════════════════════════════════════════
   PROIEZIONE. Una seconda finestra da trascinare sul proiettore: rose
   e crediti di tutti, aggiornati a ogni aggiudicazione.
   La sincronia passa dal salvataggio che l'app fa gia': quando la
   finestra principale scrive, il browser avvisa le altre finestre
   dello stesso sito e questa si ridisegna. Nessun collegamento in piu'.
   ══════════════════════════════════════════════════════════════════ */
function Proiezione({ stato, regole, chiudi }) {
  const { squadre, venduti } = stato;
  const ultima = venduti[venduti.length - 1];
  const col = squadre.length > 4 ? 3 : 2;

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.tx, fontVariantNumeric: "tabular-nums" }}>
      <div className="flex items-baseline gap-4 px-6 py-3 border-b" style={{ borderColor: C.li }}>
        <span className="text-2xl font-bold" style={{ color: C.gi }}>Asta</span>
        <span className="text-lg" style={{ color: C.mu }}>{venduti.length} assegnati</span>
        {ultima && (
          <span className="ml-auto text-lg">
            <span style={{ color: C.mu }}>ultimo: </span>
            <span className="font-semibold">{ultima.nome}</span>
            <span style={{ color: C.gi }}> {ultima.prezzo}</span>
            <span style={{ color: C.mu }}> a {squadre[ultima.a].nome}</span>
          </span>
        )}
        {chiudi && <button onClick={chiudi} className="ml-4 text-sm" style={{ color: C.mu }}>chiudi</button>}
      </div>

      <div className="grid gap-px p-px" style={{ gridTemplateColumns: `repeat(${col}, minmax(0,1fr))`, background: C.li }}>
        {squadre.map((s2, i) => {
          const vuotiS = RUOLI.reduce((a, r) => a + (SLOT[r] - s2.rosa[r].length), 0);
          return (
            <div key={i} style={{ background: C.bg, padding: "14px 16px" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold truncate" style={{ color: i === 0 ? C.gi : C.tx }}>{s2.nome}</span>
                {s2.persona && <span className="text-sm truncate" style={{ color: C.mu }}>{s2.persona}</span>}
                {s2.tifo && <span className="text-xs" style={{ color: COL_RUOLO.A }}>{s2.tifo}</span>}
                <span className="ml-auto text-3xl font-bold" style={{ color: i === 0 ? C.gi : C.tx }}>{s2.crediti}</span>
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: C.mu }}>
                <span>{25 - vuotiS} presi</span><span>·</span><span>spesi {regole.crediti - s2.crediti}</span>
                <span className="ml-auto">max {offertaMassimaLegale(s2)}</span>
              </div>
              <div className="flex gap-1 mb-2">
                {RUOLI.map((r) => (
                  <div key={r} className="flex-1 h-1.5 rounded-sm"
                    style={{ background: `linear-gradient(to right, ${COL_RUOLO[r]} ${(s2.rosa[r].length / SLOT[r]) * 100}%, ${C.li} ${(s2.rosa[r].length / SLOT[r]) * 100}%)` }} />
                ))}
              </div>
              {RUOLI.map((r) => (
                <div key={r} className="flex gap-1.5 items-start" style={{ lineHeight: 1.5 }}>
                  <span className="font-bold w-3 shrink-0" style={{ color: COL_RUOLO[r], fontSize: 13 }}>{r}</span>
                  <span className="flex-1" style={{ fontSize: 14 }}>
                    {s2.rosa[r].length === 0
                      ? <span style={{ color: C.li }}>—</span>
                      : s2.rosa[r].map((g, k) => (
                          <span key={g.id}>
                            {k > 0 && <span style={{ color: C.li }}>, </span>}
                            {g.nome} <span style={{ color: C.mu }}>{g.prezzo}</span>
                          </span>
                        ))}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SOLO_PROIEZIONE = typeof location !== "undefined" && /vista=proiezione/.test(location.search || "");

function BancoAsta() {
  const [stato, setStato] = useState(statoIniziale);
  const [proietta, setProietta] = useState(false);
  const [esca, setEsca] = useState(null);   // nome chiamato solo per far spendere gli altri
  const [fase, setFase] = useState("attesa");
  const [sul, setSul] = useState(null);
  const [q, setQ] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [dettagli, setDettagli] = useState(false);
  const [caricato, setCaricato] = useState(false);
  const [agente, setAgente] = useState({ attesa: false, testo: "", titolo: "" });
  const [prep, setPrep] = useState({ attivo: false, fatti: 0, totale: 0, che: "" });
  const [extra, setExtra] = useState([]);
  const [veloce, setVeloce] = useState(VELOCE_DEFAULT);
  const [manuale, setManuale] = useState({ sq: "", ruolo: "" });
  const [apriManuale, setApriManuale] = useState(false);
  const SIGLE = ["ATA","BOL","CAG","COM","FIO","FRO","GEN","INT","JUV","LAZ","LEC","MIL","MON","NAP","PAR","ROM","SAS","TOR","UDI","VEN"];

  function aggiungiManuale() {
    const nome = q.trim();
    if (nome.length < 2 || !manuale.sq || !manuale.ruolo) return;
    const g = { id: 20000 + extra.length, nome, sq: manuale.sq, ruolo: manuale.ruolo, fvm: 5, tit: false,
      cerca: norm(nome), bon: 0, rig: 0, trend: 0, sch: 0, fuori: false };
    setExtra((v) => [...v, g]);
    setSul(g); setQ(""); setManuale({ sq: "", ruolo: "" }); setApriManuale(false); setFase("inAsta");
  }
  const [profondo, setProfondo] = useState(PROFONDO_DEFAULT);
  const [ai, setAi] = useState({ tetti: {}, lettura: "", chiamare: null, calibrazione: 1, a: -1, attesa: false, errore: "" });
  const [aiAcceso, setAiAcceso] = useState(true);
  const richiesta = useRef(0);
  const primo = useRef(true);

  // La finestra sul proiettore ricarica quando la principale salva.
  useEffect(() => {
    if (!SOLO_PROIEZIONE) return;
    const su = (e) => {
      if (e.key !== FIRMA || !e.newValue) return;
      try {
        const v = JSON.parse(e.newValue);
        if (v.stat) Object.assign(STORICO_LIVE, v.stat);
        setStato(v);
      } catch (err) {}
    };
    window.addEventListener("storage", su);
    return () => window.removeEventListener("storage", su);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(FIRMA);
        if (raw) {
          const v = JSON.parse(raw);
          if (v.stat) Object.assign(STORICO_LIVE, v.stat);
          setStato(v);
        }
      } catch (e) {}
      setCaricato(true);
    })();
  }, []);

  useEffect(() => {
    if (!caricato) return;
    if (primo.current) { primo.current = false; return; }
    if (SOLO_PROIEZIONE) return;
    try {
      const testo = JSON.stringify(stato);
      localStorage.setItem(FIRMA, testo);
      localStorage.setItem("banco-copia", testo);   // seconda copia di sicurezza
    } catch (e) {}
  }, [stato, caricato]);

  const regole = REGOLE;
  const { squadre, venduti, dossier } = stato;
  const opz = useMemo(() => ({ ...stato.opz, regole }), [stato.opz, regole]);
  const io = squadre[0];
  const presi = useMemo(() => new Set(venduti.map((v) => v.gid)), [venduti]);
  const tutti = useMemo(() => [...LISTONE, ...extra], [extra]);
  const liberi = useMemo(() => tutti.filter((g) => !presi.has(g.id)), [tutti, presi]);
  const fase2 = useMemo(() => repartoCorrente(squadre), [squadre]);
  const mieiDifensori = useMemo(() => {
    const c = {};
    for (const r of ["P", "D"]) for (const g of io.rosa[r]) c[g.sq] = (c[g.sq] || 0) + 1;
    return c;
  }, [io]);

  const infl = useMemo(() => inflazione(venduti), [venduti]);
  const pianoBase = useMemo(() => costruisciPiano(squadre, 0, { ...opz, infl: infl.k, regole, mieiDifensori }, venduti), [squadre, opz, infl, venduti, regole, mieiDifensori]);
  const riserva = useMemo(() => riservaAttiva(opz, squadre[0], pianoBase), [opz, squadre, pianoBase]);
  const press = useMemo(() => pressioneSpesa(squadre[0], pianoBase, riserva), [squadre, pianoBase, riserva]);
  const opzL = useMemo(() => ({ ...opz, infl: infl.k * (aiAcceso ? ai.calibrazione : 1), press, regole, mieiDifensori }), [opz, infl, press, regole, ai.calibrazione, aiAcceso, mieiDifensori]);
  const piano = pianoBase;
  const legale = offertaMassimaLegale(io);
  const vuoti = slotRimasti(io);

  // I piu' probabili alla prossima chiamata: cosi' non devi scrivere
  const probabili = useMemo(() =>
    liberi.filter((g) => !g.fuori && (!REGOLE.perReparto || !fase2 || g.ruolo === fase2)).map((g) => ({ g, a: consiglia(g, squadre, 0, opzL, venduti).atteso }))
      .sort((x, y) => y.a - x.a).slice(0, 6).map((x) => x.g),
    [liberi, squadre, opzL, venduti, fase2]);

  // Chi inizia col testo scritto viene prima di chi lo contiene in mezzo:
  // scrivendo "mal" deve uscire Malen, non un nome con "mal" dentro.
  const risultati = useMemo(() => {
    const t = norm(q);
    if (!t) return [];
    const p = [];
    for (const g of liberi) {
      const n = g.cerca || norm(g.nome);
      let punti = -1;
      if (n.startsWith(t)) punti = 3;
      else if (n.split(" ").some((w) => w.startsWith(t))) punti = 2;
      else if (norm(g.sq).startsWith(t)) punti = 1.5;
      else if (n.includes(t)) punti = 1;
      if (punti >= 0) p.push({ g, punti });
    }
    return p.sort((a, b) => b.punti - a.punti || b.g.fvm - a.g.fvm).slice(0, 8).map((x) => x.g);
  }, [q, liberi]);

  const cons = sul ? consiglia(sul, squadre, 0, opzL, venduti) : null;

  const romanista = useMemo(() => {
    const i = squadre.findIndex((s, j) => j > 0 && s.tifo === "ROM");
    if (i < 0) return null;
    return { nome: squadre[i].nome, max: offertaMassimaLegale(squadre[i]), crediti: squadre[i].crediti };
  }, [squadre]);

  // Esche mirate: i piu' cari delle squadre che hanno tifosi rivali al tavolo.
  // Chiamarli presto costa zero a te e brucia i crediti a chi tifa per loro.
  const esche = useMemo(() => {
    const sigle = [...new Set(squadre.slice(1).map((s) => s.tifo).filter((t) => t && t !== "ROM"))];
    const r = REGOLE.perReparto ? fase2 : null;
    if (r) {
      /* Il confronto giusto non e' con i miei slot ma con quelli di TUTTO il
         tavolo: se restano 20 portieri titolari per 18 posti, buttarne uno in
         pasto agli altri significa restare senza. L'esca ha senso solo dove
         c'e' abbondanza vera. */
      const disponibili = liberi.filter((g) => g.ruolo === r && g.tit && !g.fuori).length;
      const domanda = squadre.reduce((a, s2) => a + (SLOT[r] - s2.rosa[r].length), 0);
      if (disponibili < domanda + 5) return [];
    }
    return liberi
      .filter((g) => sigle.includes(g.sq) && !g.fuori && (!r || g.ruolo === r))
      .map((g) => ({ g, atteso: consiglia(g, squadre, 0, opzL, venduti).atteso }))
      .filter((x) => x.atteso >= 25)          // sotto questa soglia non gli fai male
      .sort((a, b) => b.atteso - a.atteso)
      .slice(0, 3);
  }, [liberi, squadre, opzL, venduti, io, fase2]);

  const tettoAI = sul && aiAcceso ? ai.tetti[sul.nome.trim().toLowerCase()] : null;

  const ordine = useMemo(() => {
    if (!sul || !cons) return null;
    if (esca && esca === sul.nome)
      return { azione: "passa", motivo: "l'hai chiamato tu per far spendere gli altri: non rilanciare" };
    if (REGOLE.perReparto && fase2 && sul.ruolo !== fase2)
      return { azione: "passa", motivo: `si sta facendo il reparto ${RUOLO_NOME[fase2]}` };
    const p = piano[sul.ruolo];
    if (cons.max <= 0) return { azione: "passa", motivo: cons.nota, allarme: cons.allarme };
    // Con l'asta per reparti il vincolo vero e' un altro: quello che spendo
    // adesso non lo avro' per i reparti che devono ancora arrivare.
    const futuro = REGOLE.perReparto ? budgetFasiFuture(io, sul.ruolo, riserva) : 0;
    const budgetLibero = Math.max(1, Math.round(io.crediti - riserva - futuro - (SLOT[sul.ruolo] - io.rosa[sul.ruolo].length - 1)));
    // Se l'AI ha gia' deciso un tetto per questo giocatore uso il suo, ma
    // i vincoli di budget restano invalicabili: non puo' farmi sforare.
    const tettoVero = (n) => Math.max(1, Math.min(tettoAI ? tettoAI.max : n, budgetLibero, legale));
    const caro = cons.atteso > cons.max * 1.15;
    if (p.obiettivi.some((g) => g.id === sul.id))
      return { azione: "offri", tetto: tettoVero(cons.max), atteso: cons.atteso, caro, budgetLibero,
challenge: sul.sq === "ROM" ? romanista : null,
        motivo: caro ? "e' un tuo obiettivo, ma il tifo altrui lo spingera' sopra il tuo tetto" : "e' un tuo obiettivo in questo reparto" };
    if (p.riempitivi.some((g) => g.id === sul.id)) {
      const serve = SLOT[sul.ruolo] - io.rosa[sul.ruolo].length;
      const daCentrare = p.obiettivi.length;
      const slotLiberi = serve - daCentrare;
      if (slotLiberi <= 0 && io.crediti > vuoti * 6)
        return { azione: "passa", motivo: "slot riservato a un obiettivo" };
      return { azione: "offri", tetto: tettoVero(Math.min(cons.max, 4)), atteso: cons.atteso, motivo: "riempitivo" };
    }
    // Non e' fra i miei obiettivi: posso comunque prenderlo, ma non oltre
    // quello che resta al reparto, e con un margine se il tifo lo gonfia.
    const tettoReparto = Math.max(1, p.budget - (caro ? Math.round(p.budget * 0.2) : 0));
    return { azione: "offri", tetto: tettoVero(Math.min(cons.max, tettoReparto)), atteso: cons.atteso, caro,
      motivo: caro ? "gonfiato dal tifo: fermati presto" : "non e' un obiettivo, ma se resta in budget prendilo" };
  }, [sul, cons, piano, legale, romanista, io, riserva, vuoti, tettoAI, fase2, esca]);

  const chiamata = useMemo(() => {
    const daFare = REGOLE.perReparto && fase2 ? [fase2] : RUOLI;
    const urgenza = daFare.map((r) => {
      const serve = SLOT[r] - io.rosa[r].length;
      if (serve <= 0) return null;
      const offerta = liberi.filter((g) => g.ruolo === r && g.tit && !g.fuori).length;
      const domanda = squadre.reduce((s, sq) => s + (SLOT[r] - sq.rosa[r].length), 0);
      return { r, scarsita: domanda > 0 ? offerta / domanda : 9 };
    }).filter(Boolean).sort((a, b) => a.scarsita - b.scarsita);
    for (const u of urgenza) {
      const p = piano[u.r];
      const serve = SLOT[u.r] - io.rosa[u.r].length;
      const soloPilastri = serve <= p.obiettivi.length && io.crediti > vuoti * 6;
      for (const g of [...p.obiettivi, ...(soloPilastri ? [] : p.riempitivi)]) {
        const c = consiglia(g, squadre, 0, opzL, venduti);
        if (c.max > 0 && c.max <= legale) return { g, tetto: Math.min(c.max, legale), reparto: u.r, scarso: u.scarsita < 1 };
      }
    }
    return null;
  }, [piano, squadre, opzL, venduti, legale, liberi, io, vuoti, fase2]);

  // Lettura del tavolo, ricalcolata a ogni registrazione. Tutto locale:
  // compare nell'istante in cui segni chi si e' aggiudicato il giocatore.
  const briefing = useMemo(() => {
    const out = [];
    if (infl.k >= 1.15) out.push({ t: "su", x: `Il tavolo sta pagando il ${Math.round((infl.k - 1) * 100)}% sopra i valori. Ho alzato tutti i tetti: se resti fermo ai prezzi di listino non prendi nessuno.` });
    if (infl.k <= 0.85) out.push({ t: "giu", x: `Si compra il ${Math.round((1 - infl.k) * 100)}% sotto i valori. Sono tutti prudenti: alza la mano piu' spesso.` });

    if (romanista && venduti.length > 3) {
      const mieiRoma = io.rosa.P.concat(io.rosa.D, io.rosa.C, io.rosa.A).filter((g) => g.sq === "ROM").length;
      out.push(romanista.max < 60
        ? { t: "ok", x: `${romanista.nome} e' sceso a ${romanista.crediti} crediti. Da adesso i giallorossi te li prendi senza guerra: chiamali tu.` }
        : { t: "info", x: `${romanista.nome} puo' ancora arrivare a ${romanista.max} sui giocatori della Roma. Ne hai ${mieiRoma}.` });
    }

    // Chi sta per far esplodere un reparto
    for (const r of RUOLI) {
      const affamati = squadre.slice(1).filter((s2) => SLOT[r] - s2.rosa[r].length >= 3 && offertaMassimaLegale(s2) > 150);
      const mieiVuoti = SLOT[r] - io.rosa[r].length;
      if (affamati.length >= 2 && mieiVuoti > 0)
        out.push({ t: "su", x: `${affamati.length} avversari hanno molti ${RUOLO_NOME[r]} da prendere e crediti per farlo. Quel reparto sta per rincarare: muoviti prima.` });
      const rimasti = liberi.filter((g) => g.ruolo === r && g.tit && !g.fuori).length;
      const domanda = squadre.reduce((a, s2) => a + (SLOT[r] - s2.rosa[r].length), 0);
      if (mieiVuoti > 0 && rimasti <= domanda * 0.4 && rimasti < 10)
        out.push({ t: "urg", x: `Restano ${rimasti} ${RUOLO_NOME[r]} titolari per ${domanda} slot. Te ne mancano ${mieiVuoti}: non aspettare oltre.` });
    }

    const spesa = 1000 - io.crediti;
    const attesi = costoResiduo(piano, io, null);
    if (venduti.length > 5 && attesi > io.crediti * 1.25)
      out.push({ t: "urg", x: `Il piano che ti resta costa circa ${attesi} e tu hai ${io.crediti}. Devi accontentarti su un reparto: sto gia' abbassando i tetti.` });
    if (riserva > 0 && riserva < (opz.riserva || 0) && venduti.length > 5)
      out.push({ t: "urg", x: `Ho sciolto la riserva di gennaio: con ${io.crediti} crediti non completeresti la rosa. Prima si finisce la squadra, poi si risparmia.` });
    if (riserva > 0 && vuoti <= 4 && io.crediti > riserva + vuoti + 40)
      out.push({ t: "su", x: `Ti restano ${vuoti} slot e ${io.crediti} crediti: oltre i ${riserva} di riserva ne hai ${io.crediti - riserva - vuoti} che non spenderai mai. Alzali su questi ultimi giocatori.` });
    if (press >= 1.28 && venduti.length > 5)
      out.push({ t: "su", x: `Ti restano ${io.crediti} crediti ma il piano ne costa ${attesi}. Stai avanzando soldi: ho alzato i tetti del ${Math.round((press - 1) * 100)}%, punta piu' in alto o li riporti a casa.` });

    return out.slice(0, 3);
  }, [infl, press, riserva, opz, vuoti, romanista, squadre, io, liberi, piano, venduti]);

  const coperti = useMemo(() =>
    LISTONE.filter((g) => !g.fuori && (STORICO[g.nome] || STORICO_LIVE[g.nome])).length,
    [stato.stat, prep.fatti]);

  const mediaRivali = squadre.slice(1).reduce((s, x) => s + x.crediti, 0) / 5;

  // L'avversario che ti contende i giallorossi, e quanto puo' ancora spendere

  function registra(sqIdx) {
    const p = parseInt(prezzo, 10);
    if (!sul || isNaN(p) || p < 1) return;
    const s = squadre[sqIdx];
    if (SLOT[sul.ruolo] - s.rosa[sul.ruolo].length <= 0) return;
    if (p > offertaMassimaLegale(s)) return;
    setStato((v) => ({
      ...v,
      squadre: v.squadre.map((x, i) => i === sqIdx
        ? { ...x, crediti: x.crediti - p, rosa: { ...x.rosa, [sul.ruolo]: [...x.rosa[sul.ruolo], { ...sul, prezzo: p }] } } : x),
      venduti: [...v.venduti, { gid: sul.id, nome: sul.nome, sq: sul.sq, ruolo: sul.ruolo, prezzo: p, a: sqIdx, previsto: cons ? cons.atteso : 0 }],
    }));
    // ricostruisco lo stato appena scritto e faccio ripartire il valutatore
    const nuoveSquadre = squadre.map((x, i) => i === sqIdx
      ? { ...x, crediti: x.crediti - p, rosa: { ...x.rosa, [sul.ruolo]: [...x.rosa[sul.ruolo], { ...sul, prezzo: p }] } } : x);
    const nuoviVenduti = [...venduti, { gid: sul.id, nome: sul.nome, sq: sul.sq, ruolo: sul.ruolo, prezzo: p, a: sqIdx, previsto: cons ? cons.atteso : 0 }];
    setSul(null); setPrezzo(""); setQ(""); setEsca(null); setFase("attesa"); setAgente({ attesa: false, testo: "", titolo: "" });
    if (aiAcceso) rivaluta(nuoviVenduti, nuoveSquadre);
  }

  /* Flessibilita' sugli acquisti gia' registrati: cancellare uno qualsiasi
     restituendo i crediti, o correggerne prezzo e acquirente. All'asta si
     sbaglia a digitare, e accorgersene dieci lotti dopo non deve essere
     un problema. */
  function rimuovi(gid) {
    const v = venduti.find((x) => x.gid === gid);
    if (!v) return;
    setStato((st) => ({
      ...st,
      squadre: st.squadre.map((x, i) => i === v.a
        ? { ...x, crediti: x.crediti + v.prezzo, rosa: { ...x.rosa, [v.ruolo]: x.rosa[v.ruolo].filter((g) => g.id !== v.gid) } }
        : x),
      venduti: st.venduti.filter((x) => x.gid !== gid),
    }));
    mostra(`${v.nome} rimosso, ${v.prezzo} crediti restituiti a ${chiSei(squadre[v.a])}.`);
  }

  function correggi(gid, nuovoPrezzo, nuovoA) {
    const v = venduti.find((x) => x.gid === gid);
    if (!v) return;
    const p = Math.max(1, parseInt(nuovoPrezzo, 10) || v.prezzo);
    const a = nuovoA ?? v.a;
    const dest = squadre[a];
    if (a !== v.a && SLOT[v.ruolo] - dest.rosa[v.ruolo].length <= 0) { mostra("Quel reparto e' pieno."); return; }
    const giocatore = squadre[v.a].rosa[v.ruolo].find((g) => g.id === v.gid);
    setStato((st) => {
      const sq = st.squadre.map((x, i) => {
        let y = x;
        if (i === v.a) y = { ...y, crediti: y.crediti + v.prezzo, rosa: { ...y.rosa, [v.ruolo]: y.rosa[v.ruolo].filter((g) => g.id !== v.gid) } };
        if (i === a) y = { ...y, crediti: y.crediti - p, rosa: { ...y.rosa, [v.ruolo]: [...y.rosa[v.ruolo].filter((g) => g.id !== v.gid), { ...giocatore, prezzo: p }] } };
        return y;
      });
      return { ...st, squadre: sq, venduti: st.venduti.map((x) => (x.gid === gid ? { ...x, prezzo: p, a } : x)) };
    });
    setModifica(null);
    mostra(`${v.nome}: ${p} crediti a ${chiSei(squadre[a])}.`);
  }

  function annulla() {
    if (!venduti.length) return;
    const u = venduti[venduti.length - 1];
    setStato((v) => ({
      ...v,
      squadre: v.squadre.map((x, i) => i === u.a
        ? { ...x, crediti: x.crediti + u.prezzo, rosa: { ...x.rosa, [u.ruolo]: x.rosa[u.ruolo].filter((g) => g.id !== u.gid) } } : x),
      venduti: v.venduti.slice(0, -1),
    }));
  }

  // Preparazione: una volta sola, prima dell'asta. Riempie i dossier
  // cosi' che durante l'asta la lettura sia immediata.
  /* Copertura completa dello storico.
     Le tabelle statiche arrivano ai primi 50 per ruolo perche' la fonte non
     e' paginabile. Tutto il resto lo completa questa funzione, in blocchi da
     otto, prima dell'asta. I dati si salvano: alla riapertura sono gia' li'
     e non serve rifarlo. */
  async function completaStatistiche() {
    const manca = [...LISTONE, ...extra]
      .filter((g) => !g.fuori && !STORICO[g.nome] && !STORICO_LIVE[g.nome])
      .sort((a, b) => b.fvm - a.fvm || (b.tit ? 1 : 0) - (a.tit ? 1 : 0));
    if (!manca.length) { setPrep({ attivo: false, fatti: 0, totale: 0, che: "" }); return; }
    setPrep({ attivo: true, fatti: 0, totale: manca.length, che: "statistiche" });

    for (let i = 0; i < manca.length; i += 8) {
      const blocco = manca.slice(i, i + 8);
      try {
        const t = await chiediAgente(
          `Statistiche di Serie A di questi calciatori: ${blocco.map((g) => `${g.nome} (${g.sq})`).join(", ")}.
Per ognuno, stagione 2025-26 e stagione 2024-25: presenze, media voto, fantamedia, gol, assist.
Metti 0 se in quella stagione non ha giocato in Serie A (arrivato dall'estero, Serie B, primavera).
Rispondi SOLO con JSON, una chiave per calciatore col nome ESATTO che ti ho dato:
{"Nome":[pres2526,mv2526,fm2526,gol2526,ass2526,pres2425,mv2425,fm2425,gol2425,ass2425]}`, true, veloce, segnaDurata);
        const j = leggiJSON(t);
        for (const [k, v] of Object.entries(j))
          if (Array.isArray(v) && v.length === 10) STORICO_LIVE[k] = v.map((x) => +x || 0);
      } catch (e) {
        blocco.forEach((g) => { if (!STORICO_LIVE[g.nome]) STORICO_LIVE[g.nome] = [0,0,0,0,0,0,0,0,0,0]; });
      }
      setPrep((v) => ({ ...v, fatti: Math.min(v.totale, i + 8) }));
      setStato((v) => ({ ...v, stat: { ...STORICO_LIVE } }));   // salva man mano
    }
    setPrep({ attivo: false, fatti: 0, totale: 0, che: "" });
  }

  async function preparaAsta() {
    const lista = [];
    for (const r of RUOLI) for (const g of [...piano[r].obiettivi, ...piano[r].riempitivi.slice(0, 3)]) lista.push(g);
    const scoperti = liberi.filter((g) => !g.fuori && g.fvm >= 40 && !STORICO[g.nome] && !STORICO_LIVE[g.nome])
      .sort((a, b) => b.fvm - a.fvm).slice(0, 12);
    const da = [...scoperti, ...lista.filter((g) => !scoperti.some((x) => x.id === g.id))]
      .filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i && !dossier[g.nome]).slice(0, 24);
    setPrep({ attivo: true, fatti: 0, totale: da.length, che: "notizie" });
    const nuovi = {};
    for (let i = 0; i < da.length; i += 4) {
      const blocco = da.slice(i, i + 4);
      try {
        const t = await chiediAgente(
          `${CONTESTO}

Cerca sul web la situazione aggiornata di questi giocatori di Serie A 2026/27: ${blocco.map((g) => `${g.nome} (${g.sq})`).join(", ")}.\nPer ognuno: squadra attuale dopo il mercato chiuso l'1 settembre, se e' titolare, infortuni o squalifiche, come sono andate le prime due giornate.\nRispondi SOLO con JSON, una chiave per giocatore col nome esatto che ti ho dato, valore una frase sola di massimo 15 parole:\n{"Nome":"frase"}`, true, veloce, segnaDurata);
        Object.assign(nuovi, leggiJSON(t));
      } catch (e) {
        blocco.forEach((g) => { nuovi[g.nome] = "Non verificato: controlla a mano."; });
      }
      setPrep((p) => ({ ...p, fatti: Math.min(p.totale, i + 4) }));
    }
    setStato((v) => ({ ...v, dossier: { ...v.dossier, ...nuovi }, preparata: true }));
    setPrep({ attivo: false, fatti: 0, totale: 0, che: "" });
  }

  async function agenteIdentifica(nome) {
    setAgente({ attesa: true, testo: "", titolo: nome });
    try {
      const t = await chiediAgente(`${CONTESTO}

Nel listone manca "${nome}". Cerca sul web chi e' in Serie A 2026/27.\nSolo JSON: {"nome":"","sq":"sigla 3 lettere","ruolo":"P|D|C|A","fvm":numero scala 1000,"tit":true|false,"nota":"una riga"}`, true, veloce, segnaDurata);
      const j = leggiJSON(t);
      const g = { id: 10000 + extra.length, nome: j.nome || nome, sq: j.sq || "???", ruolo: RUOLI.includes(j.ruolo) ? j.ruolo : "C", fvm: Math.max(1, +j.fvm || 5), tit: !!j.tit, bon: 0, rig: 0, trend: 0, sch: 0, fuori: false };
      setExtra((v) => [...v, g]); setSul(g); setQ(""); setFase("inAsta");
      setStato((v) => ({ ...v, dossier: { ...v.dossier, [g.nome]: j.nota || "" } }));
      setAgente({ attesa: false, testo: "", titolo: "" });
    } catch (e) {
      setAgente({ attesa: false, testo: "Non trovato. Fuori listone si sta quasi sempre a 1 credito: lascialo andare.", titolo: nome });
    }
  }

  // Rivaluta tutto il tavolo. Parte da sola dopo ogni aggiudicazione.
  async function rivaluta(vendutiOra, squadreOra, aFondo = false) {
    const mio = ++richiesta.current;
    setAi((v) => ({ ...v, attesa: true, aFondo, errore: "" }));
    try {
      const presiOra = new Set(vendutiOra.map((v) => v.gid));
      const liberiOra = [...LISTONE, ...extra].filter((g) => !presiOra.has(g.id));
      const ioOra = squadreOra[0];
      const inflOra = inflazione(vendutiOra);
      const pOra = costruisciPiano(squadreOra, 0, { ...opz, infl: inflOra.k, regole }, vendutiOra);
      const risOra = riservaAttiva({ ...opz, riparazione: REGOLE.riparazione, riserva: REGOLE.riserva }, ioOra, pOra);
      const base = promptValutazione(squadreOra, ioOra, liberiOra, vendutiOra, pOra,
        { ...opz, infl: inflOra.k, regole }, risOra);
      const t = await chiediAgente(
        aFondo ? base + `

Hai tempo: e' una pausa dell'asta. Ragiona a fondo prima di rispondere.
Guarda la partita fino in fondo, non solo il prossimo lotto: quali reparti si stanno svuotando, quali avversari sono ormai fuori gioco su quali ruoli, dove si creera' un buco di offerta fra venti lotti. Considera che chi resta invenduto e' spesso un titolare, quindi la coda della rosa non va pagata.
Dammi fino a 20 tetti invece di 12, includendo anche giocatori che nessuno ha ancora guardato e che diventeranno convenienti piu' avanti.`
          : base,
        false, aFondo ? profondo : veloce, segnaDurata);
      if (mio !== richiesta.current) return;   // arrivata tardi, ne e' partita un'altra
      const j = leggiJSON(t);
      const tetti = {};
      (j.tetti || []).forEach((x) => { if (x && x.nome) tetti[x.nome.trim().toLowerCase()] = { max: Math.max(1, Math.round(+x.max || 1)), perche: x.perche || "" }; });
      setAi({ tetti, lettura: j.lettura || "", chiamare: j.chiamare || null,
        calibrazione: Math.max(0.6, Math.min(1.8, +j.calibrazione || 1)),
        a: vendutiOra.length, attesa: false, aFondo: false, profonda: aFondo, errore: "" });
    } catch (e) {
      if (mio !== richiesta.current) return;
      const causa = /JSON|Unexpected|token/i.test(e.message || "")
        ? "ha risposto in un formato che non riesco a leggere"
        : /429|rate/i.test(e.message || "") ? "troppe richieste ravvicinate, aspetta qualche secondo"
        : /403|401|404/.test(e.message || "") ? e.message
        : (e.message || "non ha risposto");
      setAi((v) => ({ ...v, attesa: false, errore: `AI: ${causa}. I numeri restano quelli locali.` }));
    }
  }

  const [statAttesa, setStatAttesa] = useState(false);
  const cercate = useRef(new Set());
  const [misure, setMisure] = useState({});
  const [passati, setPassati] = useState(0);

  const segnaDurata = (id, sec) =>
    setMisure((v) => ({ ...v, [id]: [...(v[id] || []), sec].slice(-6) }));

  // cronometro mentre l'AI lavora
  useEffect(() => {
    if (!ai.attesa && !prep.attivo) { setPassati(0); return; }
    const t0 = Date.now();
    const h = setInterval(() => setPassati(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(h);
  }, [ai.attesa, prep.attivo]);

  // Statistiche al volo per un giocatore fuori dalle tabelle.
  async function prendiStat(g) {
    setStatAttesa(true);
    try {
      const t = await chiediAgente(
        `Cerca sul web le statistiche di Serie A di ${g.nome} (${g.sq}).\nRispondi SOLO con JSON, niente altro:\n{"pres2526":n,"mv2526":n,"fm2526":n,"gol2526":n,"ass2526":n,"pres2425":n,"mv2425":n,"fm2425":n,"gol2425":n,"ass2425":n}\nMetti 0 dove non ha giocato in Serie A. La fantamedia e' media voto piu' bonus e malus.`, true, veloce, segnaDurata);
      const j = leggiJSON(t);
      STORICO_LIVE[g.nome] = [j.pres2526, j.mv2526, j.fm2526, j.gol2526, j.ass2526,
        j.pres2425, j.mv2425, j.fm2425, j.gol2425, j.ass2425].map((x) => +x || 0);
      setStato((v) => ({ ...v, stat: { ...STORICO_LIVE } }));
      setSul((v) => (v && v.id === g.id ? { ...v } : v));   // ricalcola il tetto
    } catch (e) {}
    setStatAttesa(false);
  }

  // Se compare un nome senza storico lo recupero da solo, in sottofondo:
  // intanto l'ordine c'e' gia' col calcolo locale, e si aggiorna quando arriva.
  useEffect(() => {
    if (!sul || !aiAcceso) return;
    if (STORICO[sul.nome] || STORICO_LIVE[sul.nome] || cercate.current.has(sul.nome)) return;
    cercate.current.add(sul.nome);
    prendiStat(sul);
  }, [sul, aiAcceso]);

  async function agenteStrategia() {
    setAgente({ attesa: true, testo: "", titolo: "Come sta andando" });
    try {
      const t = await chiediAgente(`${CONTESTO}

${riassuntoStato(squadre, io, liberi)}\n\nIn massimo cinque righe: sbaglio l'allocazione? Su quale reparto muovermi subito e perche'? Se un avversario e' a secco, quale reparto posso comprare a poco?`, false, veloce, segnaDurata);
      setAgente({ attesa: false, testo: t, titolo: "Come sta andando" });
    } catch (e) {
      setAgente({ attesa: false, testo: "Non e' partita. Vai avanti col piano.", titolo: "Come sta andando" });
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     INTERFACCIA: un ordine alla volta.
     Niente motivazioni, niente alternative, niente dati.
     Chi usa questa app deve solo leggere ed eseguire.
     ══════════════════════════════════════════════════════════════════ */

  const [esito, setEsito] = useState("");
  const [proxyTesto, setProxyTesto] = useState(PROXY);
  const [modifica, setModifica] = useState(null);
  const [modPrezzo, setModPrezzo] = useState("");
  const [provaInCorso, setProvaInCorso] = useState(false);

  // Salva l'indirizzo e fa subito una chiamata minima per vedere se risponde:
  // meglio scoprirlo adesso che stasera con l'asta partita.
  async function provaProxy() {
    setProvaInCorso(true);
    impostaProxy(proxyTesto);
    try {
      const t = await unaChiamata(veloce, "Rispondi solo con la parola: pronto", false);
      mostra(t.toLowerCase().includes("pronto") ? "Proxy collegato, funzioni AI accese." : "Risponde, ma in modo strano: " + t.slice(0, 60));
    } catch (e) {
      mostra("Non funziona. " + e.message);
    }
    setProvaInCorso(false);
  }
  const mostra = (t) => { setEsito(t); setTimeout(() => setEsito(""), 4000); };

  async function esportaCSV() {
    const r = await scarica(`asta-${oraFile()}.csv`, testoCSV(stato, regole), "text/csv;charset=utf-8");
    mostra(r === "scaricato" ? "Scaricato il CSV, si apre in Excel."
      : r === "copiato" ? "Download bloccato: te l'ho copiato negli appunti, incollalo in un foglio."
      : "Non riesco a esportare qui. Usa la versione installata.");
  }

  async function esportaXLSX() {
    mostra("Preparo il file Excel...");
    try {
      const X = await caricaSheetJS();
      const t = tabelle(stato, regole);
      const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(t.rose), "Rose");
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(t.riepilogo), "Riepilogo");
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(t.cronologia), "Cronologia");
      X.writeFile(wb, `asta-${oraFile()}.xlsx`);
      mostra("Scaricato: tre fogli, rose, riepilogo e cronologia.");
    } catch (e) {
      mostra("Excel non disponibile qui, ti do il CSV.");
      esportaCSV();
    }
  }

  // Backup completo: rimette tutto com'era, statistiche recuperate comprese
  async function salvaBackup() {
    const r = await scarica(`backup-asta-${oraFile()}.json`, JSON.stringify(stato), "application/json");
    mostra(r === "scaricato" ? "Backup salvato. Da qui si ripristina tutto."
      : r === "copiato" ? "Backup copiato negli appunti, incollalo in un file di testo."
      : "Backup non riuscito.");
  }

  function caricaBackup(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const v = JSON.parse(fr.result);
        if (!v.squadre || !v.venduti) throw new Error("non e' un backup");
        if (v.stat) Object.assign(STORICO_LIVE, v.stat);
        setStato(v);
        mostra(`Ripristinati ${v.venduti.length} acquisti.`);
      } catch (e) { mostra("File non valido."); }
    };
    fr.readAsText(file);
  }

  function apriProiezione() {
    try {
      const w = window.open(location.pathname + "?vista=proiezione", "bancoProiezione",
        "width=1280,height=800,menubar=no,toolbar=no");
      if (w) { w.focus(); return; }
    } catch (e) {}
    setProietta(true);   // finestre bloccate: proietto in questa stessa pagina
  }

  const Btn = ({ children, onClick, disabled, forte }) => (
    <button onClick={onClick} disabled={disabled}
      className="w-full rounded font-semibold"
      style={{
        padding: "22px 16px", fontSize: 19,
        background: forte ? C.gi : C.su, color: forte ? C.bg : C.tx,
        border: `1px solid ${forte ? C.gi : C.li}`, opacity: disabled ? 0.35 : 1,
      }}>
      {children}
    </button>
  );

  // L'ordine al mio turno: comprare, oppure far spendere gli altri.
  // La scelta la fa l'app, io leggo un nome solo.
  const ordineTurno = useMemo(() => {
    if (aiAcceso && ai.chiamare && ai.chiamare.nome)
      return { nome: ai.chiamare.nome, tetto: ai.chiamare.tetto || 1, tipo: "compra", g: null };
    const presto = venduti.length < REGOLE.squadre * 8;
    if (presto && mediaRivali > io.crediti * 1.05 && esche.length)
      return { nome: esche[0].g.nome, tetto: 0, tipo: "esca", g: esche[0].g };
    if (chiamata) return { nome: chiamata.g.nome, tetto: chiamata.tetto, tipo: "compra", g: chiamata.g };
    return null;
  }, [ai, aiAcceso, esche, chiamata, mediaRivali, io, venduti]);

  if (SOLO_PROIEZIONE) return <Proiezione stato={stato} regole={regole} />;
  if (proietta) return <Proiezione stato={stato} regole={regole} chiudi={() => setProietta(false)} />;

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.tx, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}>

      <div className="flex items-stretch border-b" style={{ borderColor: C.li }}>
        {[[io.crediti, "crediti"], [vuoti, "da prendere"]].map(([n, l], i) => (
          <div key={i} className="flex-1 px-4 py-2" style={{ borderLeft: i ? `1px solid ${C.li}` : "none" }}>
            <div className="text-xl font-bold leading-none" style={{ color: i === 0 ? C.gi : C.tx }}>{n}</div>
            <div className="text-xs mt-1" style={{ color: C.mu }}>{l}</div>
          </div>
        ))}
        <div className="flex-1 px-4 py-2 flex items-center justify-end" style={{ borderLeft: `1px solid ${C.li}` }}>
          {ai.attesa && <span className="text-xs" style={{ color: ai.aFondo ? C.gi : C.mu }}>{ai.aFondo ? "analisi" : "ricalcolo"}</span>}
          {!ai.attesa && ai.profonda && <span className="text-xs" style={{ color: C.gi }}>analizzato</span>}
          {!ai.attesa && ai.errore && <span className="text-xs" style={{ color: C.ro }}>senza AI</span>}
        </div>
      </div>

      <div className="flex h-1">
        {RUOLI.map((r) => {
          const q1 = io.rosa[r].length / SLOT[r];
          return <div key={r} className="flex-1" style={{ background: `linear-gradient(to right, ${COL_RUOLO[r]} ${q1 * 100}%, ${C.li} ${q1 * 100}%)` }} />;
        })}
      </div>

      {esito && (
        <div className="px-5 py-2 text-sm border-b" style={{ borderColor: C.li, background: C.su, color: C.gi }}>{esito}</div>
      )}

      {fase2 && (
        <div className="flex items-center gap-2 px-5 py-2 border-b" style={{ borderColor: C.li, background: C.su }}>
          <Disco r={fase2} />
          <span className="text-sm font-medium">Si fanno i {RUOLO_NOME[fase2]}</span>
          <span className="ml-auto text-sm" style={{ color: C.mu }}>
            te ne mancano {SLOT[fase2] - io.rosa[fase2].length} · budget fase {Math.max(0, Math.round(io.crediti - riserva - budgetFasiFuture(io, fase2, riserva)))}
          </span>
        </div>
      )}

      {/* ─────────── ATTESA ─────────── */}
      {fase === "attesa" && (
        <div className="p-5">
          <div className="py-14 text-center">
            <div className="text-4xl font-bold" style={{ color: vuoti === 0 ? C.gi : C.tx }}>
              {vuoti === 0 ? "Hai finito." : "Aspetta."}
            </div>
          </div>
          {vuoti > 0 && (
            <div className="space-y-3">
              <Btn onClick={() => { setFase("cerca"); setQ(""); setApriManuale(false); }}>Hanno chiamato uno</Btn>
              <Btn forte onClick={() => setFase("mioTurno")}>Tocca a me</Btn>
            </div>
          )}
          {aiAcceso && ai.errore && !ai.attesa && (
            <button onClick={() => rivaluta(venduti, squadre, false)}
              className="w-full rounded mt-3" style={{ padding: "14px", fontSize: 15,
                background: "transparent", color: C.ro, border: `1px solid ${C.ro}` }}>
              Riprova a collegare l'AI
            </button>
          )}
          {vuoti > 0 && aiAcceso && (() => {
            const nome = MODELLI.find((m) => m.id === profondo)?.n || "il modello lento";
            const stima = stimaSecondi(profondo, false, misure);
            const misurato = (misure[profondo] || []).length >= 2;
            const inCorso = ai.attesa && ai.aFondo;
            const oltre = inCorso && passati > stima + 5;
            return (
              <button onClick={() => rivaluta(venduti, squadre, true)} disabled={ai.attesa}
                className="w-full rounded mt-3 text-left"
                style={{ padding: "16px", background: "transparent",
                  border: `1px dashed ${inCorso ? C.gi : C.li}`, opacity: ai.attesa && !inCorso ? 0.3 : 1 }}>
                <div style={{ fontSize: 15, color: inCorso ? C.gi : C.mu }}>
                  {inCorso ? `${nome} sta ragionando` : `Ho tempo: analisi con ${nome}`}
                </div>
                <div style={{ fontSize: 13, color: oltre ? C.ro : C.li, marginTop: 4 }}>
                  {inCorso
                    ? (oltre
                        ? `${passati}s — piu' del previsto, aspetta ancora un po'`
                        : `${passati}s di ${stima}s stimati`)
                    : `${formattaAttesa(stima)}${misurato ? "" : ", stima da tarare alla prima volta"}`}
                </div>
              </button>
            );
          })()}
          <button onClick={() => setFase("rose")} className="w-full rounded mt-3"
            style={{ padding: "14px", fontSize: 15, background: "transparent", color: C.mu, border: `1px solid ${C.li}` }}>
            Rose e crediti di tutti
          </button>
          {venduti.length > 0 && (
            <button onClick={esportaXLSX} className="w-full py-3 text-sm" style={{ color: C.mu }}>
              Salva le rose in Excel
            </button>
          )}
          <button onClick={() => setDettagli(!dettagli)} className="w-full py-5 text-xs" style={{ color: C.li }}>
            impostazioni
          </button>
        </div>
      )}

      {/* ─────────── CHI HANNO CHIAMATO ─────────── */}
      {fase === "cerca" && (
        <div>
          {!apriManuale && <div className="p-4">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Il nome che hanno detto"
              className="w-full px-4 outline-none rounded"
              style={{ background: C.su, color: C.tx, border: `1px solid ${C.li}`, fontSize: 19, padding: "18px 16px" }} />
          </div>}
          {!apriManuale && (q.trim() ? risultati : probabili).map((g) => (
            <button key={g.id} onClick={() => { setSul(g); setFase("inAsta"); setQ(""); }}
              className="w-full text-left px-4 flex items-center gap-3 border-b"
              style={{ borderColor: C.li, color: C.tx, padding: "18px 16px", fontSize: 18 }}>
              <Disco r={g.ruolo} />
              <span className="font-medium flex-1 truncate">{g.nome}</span>
              <span className="text-xs" style={{ color: C.mu }}>{g.sq}</span>
            </button>
          ))}
          {q.trim().length >= 2 && risultati.length === 0 && !apriManuale && (
            <div className="p-5">
              <div className="text-base mb-4" style={{ color: C.mu }}>Nessun giocatore con questo nome.</div>
              <Btn forte onClick={() => setApriManuale(true)}>Inseriscilo a mano</Btn>
              <button onClick={() => agenteIdentifica(q.trim())} disabled={agente.attesa}
                className="w-full py-4 text-sm mt-2" style={{ color: C.mu }}>
                {agente.attesa ? "Sto cercando..." : "oppure fallo cercare all'AI"}
              </button>
            </div>
          )}

          {apriManuale && (
            <div className="p-5 space-y-4">
              <div className="text-sm" style={{ color: C.mu }}>Nome, squadra e ruolo.</div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome e cognome"
                className="w-full px-4 rounded outline-none"
                style={{ background: C.su, color: C.tx, border: `1px solid ${C.li}`, fontSize: 18, padding: "16px" }} />
              <div className="grid grid-cols-5 gap-1.5">
                {SIGLE.map((x) => (
                  <button key={x} onClick={() => setManuale((m) => ({ ...m, sq: x }))}
                    className="py-2.5 rounded text-sm font-medium"
                    style={{ background: manuale.sq === x ? C.gi : C.su, color: manuale.sq === x ? C.bg : C.tx, border: `1px solid ${C.li}` }}>
                    {x}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {RUOLI.map((r) => (
                  <button key={r} onClick={() => setManuale((m) => ({ ...m, ruolo: r }))}
                    className="py-3 rounded font-bold text-lg"
                    style={{ background: manuale.ruolo === r ? COL_RUOLO[r] : C.su, color: manuale.ruolo === r ? C.bg : COL_RUOLO[r], border: `1px solid ${manuale.ruolo === r ? COL_RUOLO[r] : C.li}` }}>
                    {r}
                  </button>
                ))}
              </div>
              <Btn forte onClick={aggiungiManuale} disabled={!manuale.sq || !manuale.ruolo || q.trim().length < 2}>
                Aggiungi e vai
              </Btn>
              <button onClick={() => { setApriManuale(false); setManuale({ sq: "", ruolo: "" }); }}
                className="w-full py-3 text-sm" style={{ color: C.mu }}>torna alla ricerca</button>
            </div>
          )}
          <div className="p-5"><Btn onClick={() => { setFase("attesa"); setQ(""); }}>Indietro</Btn></div>
        </div>
      )}

      {/* ─────────── L'ORDINE ─────────── */}
      {fase === "inAsta" && sul && ordine && (
        <div>
          <div className="px-5 pt-6 pb-2 flex items-center gap-3">
            <Disco r={sul.ruolo} grande />
            <div className="text-2xl font-bold truncate">{sul.nome}</div>
          </div>

          <div className="px-5 pb-6">
            <div className="px-5 pt-7 pb-8 text-center"
              style={{ borderLeft: `2px solid ${C.gesso}`, borderRight: `2px solid ${C.gesso}`, borderBottom: `2px solid ${C.gesso}` }}>
              {ordine.azione === "offri" ? (
                <>
                  <div style={{ color: C.mu, fontSize: 17 }}>Offri fino a</div>
                  <div className="font-bold leading-none my-2" style={{ color: C.gi, fontSize: 96, letterSpacing: "-0.05em" }}>{ordine.tetto}</div>
                  <div style={{ fontSize: 21 }}>Poi fermati.</div>
                </>
              ) : (
                <>
                  <div className="font-bold leading-none my-4" style={{ color: C.ro, fontSize: 72, letterSpacing: "-0.04em" }}>Passa</div>
                  <div style={{ fontSize: 21 }}>Non offrire niente.</div>
                </>
              )}
            </div>
          </div>

          <div className="px-5 pb-8 space-y-3 border-t pt-5" style={{ borderColor: C.li }}>
            <div className="text-sm" style={{ color: C.mu }}>Chiusa a quanto, e a chi</div>
            <input value={prezzo} onChange={(e) => setPrezzo(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
              placeholder="prezzo" className="w-full px-4 rounded outline-none"
              style={{ background: C.su, color: C.tx, border: `1px solid ${C.li}`, fontSize: 22, padding: "18px 16px" }} />
            <div className="grid grid-cols-2 gap-2">
              {squadre.map((s2, i) => {
                const pieno = SLOT[sul.ruolo] - s2.rosa[sul.ruolo].length <= 0;
                return (
                  <button key={i} disabled={pieno || !prezzo} onClick={() => registra(i)}
                    className="rounded truncate px-2 font-medium"
                    style={{ padding: "20px 8px", fontSize: 16, background: i === 0 ? C.gi : C.su,
                      color: i === 0 ? C.bg : C.tx, border: `1px solid ${C.li}`, opacity: pieno || !prezzo ? 0.3 : 1 }}>
                    {i === 0 ? "L'ho preso io" : chiSei(s2)}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setSul(null); setFase("attesa"); setPrezzo(""); setEsca(null); }}
              className="w-full py-4 text-sm" style={{ color: C.mu }}>Nome sbagliato, torna indietro</button>
          </div>
        </div>
      )}

      {/* ─────────── TOCCA A ME ─────────── */}
      {fase === "mioTurno" && (
        <div className="p-5">
          {ordineTurno ? (
            <>
              <div className="py-6 text-center">
                <div style={{ color: C.mu, fontSize: 17 }}>Chiama</div>
                <div className="font-bold leading-tight my-3" style={{ color: C.gi, fontSize: 44 }}>{ordineTurno.nome}</div>
                <div style={{ fontSize: 21 }}>
                  {ordineTurno.tipo === "esca"
                    ? "Poi non offrire niente."
                    : <>Apri a 1. Non superare <span className="font-bold" style={{ color: C.gi }}>{ordineTurno.tetto}</span>.</>}
                </div>
              </div>
              <div className="space-y-3 mt-6">
                <Btn forte onClick={() => {
                  const g = ordineTurno.g || [...LISTONE, ...extra].find((x) => x.nome.toLowerCase() === ordineTurno.nome.toLowerCase());
                  setEsca(ordineTurno.tipo === "esca" ? ordineTurno.nome : null);
                  if (g) { setSul(g); setFase("inAsta"); } else { setQ(ordineTurno.nome); setFase("cerca"); }
                }}>Fatto</Btn>
                <Btn onClick={() => setFase("attesa")}>Indietro</Btn>
              </div>
            </>
          ) : (
            <>
              <div className="py-14 text-center text-3xl font-bold">Chiama chiunque a 1.</div>
              <Btn onClick={() => setFase("attesa")}>Indietro</Btn>
            </>
          )}
        </div>
      )}

      {/* ─────────── ROSE: la mia e quelle degli altri ─────────── */}
      {fase === "rose" && (
        <div className="pb-8">
          <div className="px-5 pt-5 pb-2 flex items-baseline justify-between">
            <span className="text-xl font-bold" style={{ color: C.gi }}>{io.nome}</span>
            <span className="text-sm" style={{ color: C.mu }}>{io.crediti} crediti · spesi {regole.crediti - io.crediti}</span>
          </div>
          {RUOLI.map((r) => (
            <div key={r} className="px-5 py-2 border-b" style={{ borderColor: C.li }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Disco r={r} />
                <span className="text-sm" style={{ color: C.mu }}>{RUOLO_NOME[r]} {io.rosa[r].length}/{SLOT[r]}</span>
                <span className="text-sm ml-auto" style={{ color: C.mu }}>{io.rosa[r].reduce((a, g) => a + g.prezzo, 0)}</span>
              </div>
              {io.rosa[r].length === 0 && <div className="text-sm pl-8" style={{ color: C.li }}>—</div>}
              {io.rosa[r].map((g) => (
                <button key={g.id} onClick={() => { setModifica(g.id); setModPrezzo(String(g.prezzo)); }}
                  className="w-full flex items-center gap-2 pl-8 py-2 text-left" style={{ color: C.tx }}>
                  <span className="flex-1 truncate">{g.nome}</span>
                  <span className="text-xs" style={{ color: C.mu }}>{g.sq}</span>
                  <span className="font-semibold w-10 text-right" style={{ color: C.gi }}>{g.prezzo}</span>
                  <span className="text-xs w-5 text-right" style={{ color: C.li }}>modifica</span>
                </button>
              ))}
            </div>
          ))}

          {modifica !== null && (() => {
            const v = venduti.find((x) => x.gid === modifica);
            if (!v) return null;
            return (
              <div className="mx-5 my-4 p-4 rounded" style={{ background: C.su, border: `1px solid ${C.gi}` }}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold">{v.nome}</span>
                  <span className="text-sm" style={{ color: C.mu }}>{v.sq} · {v.ruolo}</span>
                  <button onClick={() => setModifica(null)} className="ml-auto text-xs" style={{ color: C.mu }}>chiudi</button>
                </div>
                <div className="text-sm mb-1" style={{ color: C.mu }}>Prezzo</div>
                <input value={modPrezzo} onChange={(e) => setModPrezzo(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
                  className="w-full px-3 py-3 rounded text-lg outline-none mb-3"
                  style={{ background: C.bg, color: C.tx, border: `1px solid ${C.li}` }} />
                <div className="text-sm mb-1" style={{ color: C.mu }}>Comprato da</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {squadre.map((s2, i) => (
                    <button key={i} onClick={() => correggi(v.gid, modPrezzo, i)} className="py-3 rounded text-sm truncate px-2"
                      style={{ background: i === v.a ? C.gi : C.bg, color: i === v.a ? C.bg : C.tx, border: `1px solid ${C.li}` }}>
                      {chiSei(s2)}
                    </button>
                  ))}
                </div>
                <button onClick={() => { rimuovi(v.gid); setModifica(null); }}
                  className="w-full py-3 rounded text-sm" style={{ background: "transparent", color: C.ro, border: `1px solid ${C.ro}` }}>
                  Cancella l'acquisto e ridai i {v.prezzo} crediti
                </button>
              </div>
            );
          })()}

          <div className="px-5 pt-6 pb-2 text-sm" style={{ color: C.mu }}>Gli altri</div>
          {squadre.slice(1).map((s2, i) => {
            const tutti2 = RUOLI.flatMap((r) => s2.rosa[r].map((g) => ({ ...g, r })));
            return (
              <div key={i} className="px-5 py-3 border-b" style={{ borderColor: C.li }}>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-lg">{s2.nome}</span>
                  {s2.persona && <span className="text-sm" style={{ color: C.mu }}>{s2.persona}</span>}
                  {s2.tifo && <span className="text-xs" style={{ color: COL_RUOLO.A }}>{s2.tifo}</span>}
                  <span className="ml-auto text-xl font-bold">{s2.crediti}</span>
                  <span className="text-xs w-14 text-right" style={{ color: C.mu }}>max {offertaMassimaLegale(s2)}</span>
                </div>
                <div className="flex gap-1 mt-2 mb-2">
                  {RUOLI.map((r) => (
                    <div key={r} className="flex-1 flex items-center gap-1">
                      <div className="flex-1 h-1.5 rounded-sm"
                        style={{ background: `linear-gradient(to right, ${COL_RUOLO[r]} ${(s2.rosa[r].length / SLOT[r]) * 100}%, ${C.li} ${(s2.rosa[r].length / SLOT[r]) * 100}%)` }} />
                      <span className="text-xs w-7" style={{ color: C.mu }}>{s2.rosa[r].length}/{SLOT[r]}</span>
                    </div>
                  ))}
                </div>
                {tutti2.length > 0 && (
                  <div className="text-sm leading-relaxed" style={{ color: C.mu }}>
                    {tutti2.map((g) => (
                      <button key={g.id} onClick={() => { setModifica(g.id); setModPrezzo(String(g.prezzo)); }}
                        className="inline-block mr-2" style={{ color: C.mu }}>
                        <span style={{ color: COL_RUOLO[g.r] }}>{g.r}</span> {g.nome} <span style={{ color: C.tx }}>{g.prezzo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={esportaXLSX}>Excel</Btn>
              <Btn onClick={esportaCSV}>CSV</Btn>
            </div>
            <Btn onClick={apriProiezione}>Proietta su schermo esterno</Btn>
            <Btn onClick={() => setFase("attesa")}>Indietro</Btn>
          </div>
        </div>
      )}

      {/* ─────────── IMPOSTAZIONI, fuori dai piedi ─────────── */}
      {dettagli && fase === "attesa" && (
        <div className="border-t px-5 py-5 space-y-4" style={{ borderColor: C.li }}>
          <div className="text-sm" style={{ color: C.gi }}>Chi c'e' al tavolo</div>
          <div className="flex gap-2 text-xs pb-1" style={{ color: C.mu }}>
            <span className="flex-1">fantasquadra</span><span className="flex-1">persona</span>
            <span className="w-12">tifa</span><span className="w-12 text-right">crediti</span>
          </div>
          {squadre.map((s2, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={s2.nome} placeholder="squadra"
                onChange={(e) => setStato((v) => ({ ...v, squadre: v.squadre.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) }))}
                className="flex-1 min-w-0 px-2 py-2 rounded text-sm outline-none"
                style={{ background: C.bg, color: i === 0 ? C.gi : C.tx, border: `1px solid ${C.li}` }} />
              <input value={s2.persona || ""} placeholder="chi e'"
                onChange={(e) => setStato((v) => ({ ...v, squadre: v.squadre.map((x, j) => (j === i ? { ...x, persona: e.target.value } : x)) }))}
                className="flex-1 min-w-0 px-2 py-2 rounded text-sm outline-none"
                style={{ background: C.bg, color: C.tx, border: `1px solid ${C.li}` }} />
              <select value={s2.tifo || ""} onChange={(e) => setStato((v) => ({ ...v, squadre: v.squadre.map((x, j) => (j === i ? { ...x, tifo: e.target.value } : x)) }))}
                className="text-xs rounded px-1 py-2 outline-none w-12" style={{ background: C.bg, color: C.mu, border: `1px solid ${C.li}` }}>
                {TIFI.map((t) => <option key={t.k} value={t.k} style={{ background: C.bg }}>{t.k || "—"}</option>)}
              </select>
              <span className="text-sm font-semibold w-12 text-right">{s2.crediti}</span>
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm pt-2">
            <input type="checkbox" checked={aiAcceso} onChange={(e) => setAiAcceso(e.target.checked)} />
            Prezzi decisi dall'AI
          </label>
          <div className="flex gap-2">
            {[["in diretta", veloce, setVeloce], ["a fondo", profondo, setProfondo]].map(([et, val, set], i) => (
              <div key={i} className="flex-1">
                <div className="text-xs mb-1" style={{ color: C.mu }}>{et}</div>
                <select value={val} onChange={(e) => set(e.target.value)}
                  className="w-full rounded px-2 py-2 text-sm outline-none"
                  style={{ background: C.bg, color: C.tx, border: `1px solid ${C.li}` }}>
                  {MODELLI.map((m) => <option key={m.id} value={m.id} style={{ background: C.bg }}>{m.n}</option>)}
                </select>
              </div>
            ))}
          </div>

          {(() => {
            const tot = LISTONE.filter((g) => !g.fuori).length;
            const manca = tot - coperti;
            const perBlocco = stimaSecondi(veloce, true, misure);
            const attivo = prep.attivo && prep.che === "statistiche";
            const restano = attivo ? Math.max(0, prep.totale - prep.fatti) : manca;
            const secondi = Math.ceil(restano / 8) * perBlocco;
            return (
              <>
                <div className="text-xs" style={{ color: C.mu }}>
                  Storico completo su {coperti} dei {tot} giocatori.
                </div>
                {manca > 0 && (
                  <Btn forte onClick={completaStatistiche} disabled={prep.attivo}>
                    {attivo ? `${prep.fatti}/${prep.totale} — ancora ${formattaAttesa(secondi)}` : "Completa lo storico di tutti"}
                  </Btn>
                )}
                {manca > 0 && !prep.attivo && (
                  <div className="text-xs" style={{ color: C.li, marginTop: -6 }}>
                    Mancano {manca} giocatori, {Math.ceil(manca / 8)} richieste: {formattaAttesa(secondi)}. Puoi lasciarlo girare e fare altro.
                  </div>
                )}
              </>
            );
          })()}
          {!stato.preparata && venduti.length === 0 && (
            <Btn onClick={preparaAsta} disabled={prep.attivo}>
              {prep.attivo && prep.che === "notizie"
                ? `${prep.fatti}/${prep.totale} — ancora ${formattaAttesa(Math.ceil((prep.totale - prep.fatti) / 4) * stimaSecondi(veloce, true, misure))}`
                : "Infortuni e formazioni"}
            </Btn>
          )}
          {venduti.length > 0 && <Btn onClick={annulla}>Annulla ultimo acquisto</Btn>}
          <button onClick={() => { if (confirm("Cancellare tutto?")) setStato(statoIniziale()); }}
            className="text-xs underline" style={{ color: C.ro }}>ricomincia da capo</button>

          <div className="pt-3 text-xs" style={{ color: C.li }}>
            {RUOLI.map((r) => `${r} ${io.rosa[r].length}/${SLOT[r]}`).join("   ")}
          </div>
          <div className="text-xs" style={{ color: C.li }}>
            Versione {VERSIONE}
            {USA_PROXY && (PROXY ? " · proxy impostato" : " · proxy da impostare")}
          </div>
        </div>
      )}
    </div>
  );
}

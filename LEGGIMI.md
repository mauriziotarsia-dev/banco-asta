# Banco d'asta — installazione

App per l'asta del fantacalcio. Gira nel browser, si installa sul telefono,
funziona offline. Il motore dei prezzi e' tutto locale: gli ordini escono
anche senza rete. Solo le tre funzioni AI hanno bisogno di connessione.

## 1. Pubblicare su GitHub Pages (5 minuti)

1. Crea un repository nuovo, per esempio `banco-asta`. Puo' essere privato:
   GitHub Pages funziona anche cosi' sui piani a pagamento, altrimenti pubblico.
2. Carica tutti i file di questa cartella nella radice del repo.
3. Settings → Pages → Source: *Deploy from a branch*, branch `main`, cartella `/ (root)`.
4. Dopo qualche minuto il sito e' su `https://TUONOME.github.io/banco-asta/`.

A questo punto l'app funziona gia': listone, storico di 129 giocatori,
piano, tetti, rose, tutto. Mancano solo le funzioni AI.

## 2. Installarla sul telefono

- **iPhone**: apri il link in Safari (non Chrome), tocca Condividi →
  *Aggiungi a schermata Home*.
- **Android**: apri in Chrome, menu → *Installa app*.

Diventa un'icona vera, si apre a schermo intero senza barra del browser,
e dopo la prima apertura funziona anche in aereo.

## 3. Accendere le funzioni AI (10 minuti)

Servono per: completare lo storico dei giocatori mancanti, rivalutare il
tavolo dopo ogni aggiudicazione, cercare un nome fuori listone.

La chiave API non puo' stare nella pagina, perche' chiunque apra il sito
se la prenderebbe. Serve un proxy che la tenga lato server.

1. Vai su **console.anthropic.com**, crea una chiave API.
2. Vai su **dash.cloudflare.com** → Workers & Pages → *Create* → *Start with Hello World*.
3. Sostituisci tutto il codice con il contenuto di `worker.js`, e in cima
   metti il tuo indirizzo GitHub Pages al posto di `https://TUONOME.github.io`.
   Attenzione: solo dominio, senza il nome del repo.
4. Deploy. Poi Settings → *Variables and Secrets* → aggiungi
   `ANTHROPIC_API_KEY` come **Secret**, incollando la chiave.
5. Copia l'indirizzo del Worker (finisce in `.workers.dev`).
6. Apri l'app, e nella console del browser (F12) esegui una volta sola:

   localStorage.setItem("banco-proxy", "https://IL-TUO-WORKER.workers.dev")

   Ricarica. Le funzioni AI sono accese.

Il piano gratuito di Cloudflare copre centomila richieste al giorno:
per un'asta ne servono qualche decina.

## 4. Proiettare le rose su uno schermo esterno

Nella schermata *Rose e crediti di tutti* c'e' il bottone
**Proietta su schermo esterno**: apre una seconda finestra con le rose di
tutte le squadre e i crediti residui, leggibili da lontano.

1. Collega il proiettore o la TV e imposta i due schermi come *estesi*,
   non duplicati.
2. Premi il bottone: si apre una finestra nuova.
3. Trascinala sullo schermo esterno e premi **F11** per il pieno schermo.

Si aggiorna da sola a ogni aggiudicazione: la sincronia passa dal
salvataggio che l'app fa gia', quindi non serve nessun collegamento.
La finestra proiettata e' di sola lettura e non puo' toccare l'asta.

Se il browser blocca le finestre nuove, l'app passa da sola alla proiezione
dentro la stessa pagina: in quel caso sposta la finestra del browser sullo
schermo esterno e usa il telefono per registrare le aggiudicazioni.

## 5. Prima dell'asta

Apri le impostazioni in fondo alla schermata d'attesa e lancia
**Completa lo storico di tutti**: recupera presenze, media voto, fantamedia,
gol e assist per i giocatori che mancano. Poi **Infortuni e formazioni**.
I dati restano salvati sul telefono.

## Regole della lega

Stanno in cima ad `app.js`, nel blocco `const REGOLE`. Cambia li' numero di
squadre, crediti, composizione della rosa, modificatore di difesa e cosa
succede a gennaio. Cambiando quel blocco l'asta salvata si azzera: e' voluto,
perche' con rosa o crediti diversi i conti precedenti non valgono piu'.

## File

- `index.html` — pagina, carica React e Tailwind da CDN, nessuna compilazione
- `app.js` — l'applicazione: listone, storico, motore dei prezzi, interfaccia
- `sw.js` — cache offline
- `manifest.webmanifest`, `icona-*.png` — installazione sul telefono
- `worker.js` — proxy per la chiave API (va su Cloudflare, non su GitHub)

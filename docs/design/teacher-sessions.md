# Accesso docente e sessioni di gioco — Design

Stato: **requisiti futuri (post demo-1)**. Non implementato; non modifica il
perimetro demo-1 descritto in `docs/DEMO_SCOPE.md`. I requisiti funzionali sono
in `docs/policy_accesso_prof_e_gestione_sessione_gioco.md` (stessa cartella).

## Decisioni confermate

### Terminologia

- **Stanza** = room di gioco, nella gerarchia capitoli → stanze → enigmi.
- **Sessione** = la partita avviata dal docente ("stanza di gioco"), non l'aula
  fisica. Il vincolo di capienza (30 max, 15 attesi) è **per sessione**.
- "Quali livelli sbloccare" va letto come "quali **stanze** sbloccare".

### Ruoli e autenticazione

- Il docente accede con account Google (OAuth); è il solo a possedere un account.
- Gli studenti non hanno account: entrano con link + codice di sessione +
  nickname pseudonimo, coerente con GDD §12 (account pseudonimi, minimizzazione
  dei dati).

### Set di derivate

- Esistono un set di **default** e set alternativi nominati, scelti per
  sessione, con import/export. Coerente con i contenuti data-driven e versionati
  del transcript §7: i set devono essere versionati, così una modifica successiva
  non altera i risultati storici delle sessioni già concluse.

### Formulario

- Il formulario fa parte della **biblioteca personale** del giocatore (GDD §8.2).
- Ha una **parte statica**: tabella delle regole di derivazione, sempre
  consultabile; è questa la parte che il docente può abilitare/disabilitare per
  sessione.
- **Arricchimento (proposta da validare):** stanza dopo stanza il formulario si
  arricchisce del "richiamo teorico" (indizio di livello 2) quando lo studente
  risponde correttamente.
- **Note a mano libera** (annotazioni personali sulle trappole più comuni):
  lasciate libere, senza vincoli per ora.

## Implicazioni sullo schema dati

Il GDD §11.1 non copre la sessione multigiocatore. Servono entità aggiuntive:

- `sessions`: sessione di gioco (codice, config, stato, tempi, docente).
- `session_players`: studente → sessione, con nickname modificabile dal docente.
- `derivative_sets`: set di derivate nominati (incluso "default"), versionati.
- `session_configs` (o campi su `sessions`): stanze sbloccate, suggerimenti e
  formulario abilitati, tempo massimo.
- collegamento `attempts → session` e `attempts → session_player` per il
  monitoraggio "errori per enigma" (il backend espone già `feedback_category`).
- identità docente via OAuth Google, mappata su `users`.

## Sicurezza e privacy (requisiti da dettagliare)

- Il codice di sessione non deve essere banalmente indovinabile: definire
  lunghezza, entropia, scadenza, rigenerazione e unicità tra docenti.
- Servono azioni di moderazione: rimozione/espulsione di un giocatore e
  moderazione dei nickname (oggi il docente può solo rinominare).
- Comportamento al raggiungimento della capienza (30) da definire.
- Dati di minori: retention, cancellazione e visibilità dei dati vanno verificati
  rispetto alle policy dell'istituto (GDD §12).
- Il monitoraggio live richiede tempo reale (WebSocket/SSE o polling): scelta
  tecnica ancora aperta.

## Questioni aperte

- **Podio pubblico:** valutare se la classifica proiettata debba essere
  opzionale o anonimizzabile, in tensione con il principio GDD §10.1 ("il
  punteggio non misura l'apprendimento") e con §9 (progressione non punitiva).
- **Coerenza punteggi:** se il docente disabilita i suggerimenti, il criterio
  "risposta senza indizi" (§9.1) perde significato; da armonizzare.
- **Ciclo di vita:** comportamento alla chiusura per chi sta ancora risolvendo un
  enigma, eventuale pausa/riprendi lato docente.
- **Formato di export:** CSV (come da GDD §12) o JSON; elenco esatto dei campi.

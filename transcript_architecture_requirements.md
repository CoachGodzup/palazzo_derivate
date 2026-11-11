Hai ragione: ho recuperato le decisioni della chat precedente. In particolare, avevamo già scelto:
- Phaser 3 + HTML5 per il gioco.
- MathLive per l'editor matematico, integrato sopra il canvas Phaser.
- Python + FastAPI per il backend.
- SymPy per la verifica simbolica.
- Supporto mobile, con orientamento verticale prioritario.
- Esercizi configurabili dal docente anno per anno, senza modificare il codice.


Il Palazzo delle Derivate — Scelte tecnologiche
Queste sono le scelte tecnologiche che avevamo individuato per realizzare il gioco come applicazione web. Le riporto distinguendo le decisioni già emerse dalle tecnologie complementari che avevamo considerato o che servono a completare l'architettura.
1. Architettura generale
Scelta progettuale
 Applicazione web client-server.

Il gioco sarà accessibile attraverso un normale browser, senza richiedere installazioni da parte dello studente. Il client gestirà la visualizzazione e le interazioni, mentre il server si occuperà della logica applicativa, della verifica matematica e della persistenza dei dati.

La separazione è importante: il gioco deve poter funzionare su dispositivi differenti e il sistema di verifica deve rimanere indipendente dalla grafica.
2. Frontend: HTML5 e Phaser 3










Phaser 3

Motore del gioco 2D, basato su HTML5 e JavaScript.
Scelta effettuata


Phaser gestirà:
- Stanze e ambientazioni.
- Sprite, fondali e animazioni.
- Oggetti interattivi, leve, porte e meccanismi.
- Transizioni tra le stanze.
- Interazioni con mouse e touch.
- Adattamento della scena alle dimensioni dello schermo.
La scelta è coerente con un gioco a schermate fisse, con ambienti 2D e oggetti interattivi. Non abbiamo bisogno di un motore 3D o di un'applicazione desktop.

HTML5, CSS e JavaScript costituiscono la base dell'interfaccia web. Phaser gestisce il mondo di gioco, mentre gli elementi dell'interfaccia possono essere realizzati con HTML e CSS.
3. Editor matematico: MathLive










MathLive

Editor di formule matematiche per il browser.
Scelta effettuata


È una componente particolarmente importante del progetto.

Il giocatore deve poter inserire una derivata in forma matematica, non digitare necessariamente una stringa di testo in una casella tradizionale.

MathLive offre:
- Inserimento di formule matematiche.
- Gestione di frazioni, potenze, radicali e parentesi.
- Tastiera matematica virtuale.
- Supporto per dispositivi touch.
- Rappresentazioni esportabili come LaTeX e MathJSON.
Integrazione con Phaser
Avevamo individuato un punto architetturale importante: MathLive non deve essere disegnato dentro il canvas Phaser.

L'editor sarà un elemento HTML sovrapposto al canvas.

Il flusso sarà:
1. Lo studente interagisce con un oggetto nella stanza.
2. Si apre il pannello dell'enigma.
3. MathLive permette di inserire la derivata.
4. La risposta viene inviata al backend.
5. Il backend verifica il risultato.
6. Phaser riceve l'esito e attiva il meccanismo corrispondente.
Questa separazione evita di dover implementare un editor matematico da zero.
4. Backend: Python e FastAPI










FastAPI

Framework Python per le API.
Scelta effettuata


Il backend costituisce il punto centrale dell'applicazione.

Le sue responsabilità saranno:
- Ricevere le risposte degli studenti.
- Recuperare gli esercizi e le relative funzioni.
- Verificare matematicamente le risposte.
- Gestire capitoli, stanze e progressione.
- Registrare tentativi e utilizzo degli indizi.
- Salvare e recuperare i progressi.
- Gestire account, classi e permessi.
- Fornire le statistiche ai docenti.
FastAPI è una scelta adatta perché consente di realizzare API REST in modo relativamente rapido, con validazione dei dati e documentazione automatica degli endpoint.
5. Motore matematico: SymPy










SymPy

Libreria Python per il calcolo simbolico.
Scelta effettuata


È il componente che rende possibile la verifica matematica degli enigmi.

Il server conosce la funzione originale, per esempio:
\[
f(x)=3x^4-2x^2+5x
\]

SymPy calcola la derivata attesa:
\[
f'(x)=12x^3-4x+5
\]

Quando lo studente invia la propria risposta, il backend la interpreta e la confronta con il risultato.
Un requisito fondamentale: equivalenza simbolica
Non dobbiamo confrontare semplicemente le stringhe.

Per esempio, queste espressioni possono rappresentare la stessa derivata:
\[
6x^2+6x
\]

\[
6x(x+1)
\]

Il sistema deve riconoscere l'equivalenza anche quando le espressioni sono scritte in forme differenti.

SymPy permette di affrontare questo problema attraverso la manipolazione simbolica.

Dovremo comunque gestire attentamente domini, singolarità, radicali e funzioni composte.

Sicurezza: le formule inviate dall'utente dovranno essere interpretate attraverso un parser controllato, senza utilizzare eval() o eseguire codice arbitrario. Andranno previsti anche limiti di complessità e tempi massimi di calcolo.
6. Database: PostgreSQL










PostgreSQL

Database relazionale.
Proposta architetturale


Per la versione completa propongo PostgreSQL.

Dovrà conservare:
- Utenti e ruoli.
- Classi e associazioni studente-docente.
- Campagna, capitoli e stanze.
- Enigmi e relative versioni.
- Tentativi e risposte.
- Indizi utilizzati.
- Progressi e punteggi.
- Statistiche didattiche.
Per la prima PoC potrebbe bastare SQLite, soprattutto se l'applicazione viene inizialmente utilizzata da pochi tester. Il passaggio a PostgreSQL avrebbe senso quando si introdurranno classi e utilizzo contemporaneo da parte di più utenti.

La distinzione è importante: non serve complicare la prima implementazione con un'infrastruttura sovradimensionata.
7. Contenuti didattici: approccio data-driven
Requisito già discusso
Questa è una delle scelte più importanti che avevamo individuato.

Gli esercizi non devono essere codificati direttamente nelle scene del gioco.

Devono essere descritti attraverso dati strutturati, contenenti:
- Funzione da derivare.
- Dominio e variabile.
- Capitolo e stanza di appartenenza.
- Livello di difficoltà.
- Regole di derivazione coinvolte.
- Indizi graduati.
- Tipologie di errore previste.
- Punteggio.
Per esempio:
{
  "id": "c1-r2-e1",
  "function": "3*x^4 - 2*x^2 + 5*x",
  "variable": "x",
  "difficulty": 1,
  "hints": [
    "Osserva i singoli termini.",
    "Applica la regola delle potenze."
  ],
  "feedback_profile": "power_rule"
}


Il formato definitivo andrà formalizzato e validato dal backend.
Perché questa scelta è importante?
Avevamo esplicitamente previsto che il docente possa modificare gli esercizi anno per anno, senza dover intervenire sul codice.

Quindi, in prospettiva, sarà necessario un editor web dedicato che consenta di:
- Creare nuovi esercizi.
- Modificare le funzioni.
- Cambiare difficoltà.
- Scrivere e modificare gli indizi.
- Definire i feedback.
- Provare gli esercizi prima della pubblicazione.
Gli esercizi pubblicati dovranno essere versionati, in modo che le modifiche future non alterino i risultati storici degli studenti.
8. Supporto mobile e responsive design
Requisito già discusso
Il gioco dovrà funzionare su:
- Computer desktop.
- Notebook.
- Tablet.
- Smartphone.
Avevamo individuato una priorità precisa: lo smartphone in orientamento verticale deve essere un formato di riferimento, non semplicemente una versione ridotta del desktop.

Questo comporta alcune attenzioni:
- scene Phaser adattabili;
- interazioni touch;
- pulsanti sufficientemente grandi;
- MathLive con tastiera virtuale;
- pannello dell'enigma che non copra gli elementi essenziali;
- layout responsive;
- testi leggibili anche su schermi piccoli.
Non abbiamo stabilito un framework CSS specifico. Per la PoC partirei da CSS moderno, Grid e Flexbox, evitando di introdurre subito una dipendenza aggiuntiva.
9. Distribuzione e hosting
Da definire
La distribuzione sarà via web, attraverso un dominio HTTPS.

La proposta è:
Componente	Distribuzione
Frontend	Hosting statico
Backend	Servizio Python con FastAPI
Database	PostgreSQL
Comunicazione	API REST su HTTPS
Ambiente di sviluppo	Docker Compose

Docker Compose può semplificare l'avvio locale di backend e database, rendendo riproducibile l'ambiente di sviluppo.

Non avevamo ancora scelto un provider di hosting. La scelta dovrà tenere conto soprattutto di:
- costo ricorrente;
- semplicità di gestione;
- backup;
- localizzazione dei dati;
- possibilità di migrazione.
Una PWA, cioè una Progressive Web App installabile dal browser, può essere valutata successivamente. Non è necessaria per rendere il gioco fruibile via web.

10. Riepilogo delle tecnologie
Livello	Tecnologia	Stato
Motore 2D	Phaser 3	Scelta
Base web	HTML5, CSS, JavaScript	Scelta
Editor matematico	MathLive	Scelta
Backend	Python + FastAPI	Scelta
Calcolo simbolico	SymPy	Scelta
Database	PostgreSQL	Proposta
Database PoC	SQLite	Alternativa
Formato contenuti	JSON validato	Proposta
Comunicazione	REST + JSON	Proposta
Deployment	Docker Compose + hosting web	Proposta
CSS	CSS moderno	Proposta

11. Stack consigliato per la PoC
Per non disperdere energie, partirei con un insieme molto contenuto di dipendenze:
Stack della prima versione










Phaser 3

Stanze e interazioni 2D













MathLive

Inserimento delle derivate













Python + FastAPI

API e logica applicativa













SymPy

Verifica matematica













SQLite

Persistenza iniziale, se necessaria



Il primo obiettivo tecnico dovrebbe essere una singola stanza funzionante nel browser, anche graficamente molto semplice: il giocatore apre un dispositivo, inserisce una derivata con MathLive, FastAPI la invia a SymPy per la verifica e Phaser reagisce al risultato.

Se questo flusso funziona bene sia su desktop sia su smartphone verticale, avremo validato il nucleo tecnologico del progetto. Tutto il resto — campagna, grafica, gestione delle classi e statistiche — potrà essere costruito sopra una base già verificata.

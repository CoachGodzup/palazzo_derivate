# Le Mille e Una Derivata

## Game Design Document

**Versione:** 1.1 — Markdown  
**Base documentale:** GDD v1.0 del 2 novembre 2026 e decisioni recuperate dalla conversazione *Concept escape room derivate*.  
**Stato:** documento di lavoro per avviare una Proof of Concept (PoC).

> **Nota sulla ricostruzione:** non è stato possibile recuperare il transcript integrale, parola per parola, della vecchia chat. È stato però recuperato il GDD v1.0 prodotto al termine della conversazione e il riepilogo delle decisioni prese. Questo documento riorganizza e rende utilizzabile quel materiale; non presenta come decisioni definitive le opzioni che nel GDD originale risultavano ancora aperte.

---

## 1. Visione del progetto

**Le Mille e Una Derivata** è un'escape room didattica / puzzle adventure per studenti della scuola superiore. Il giocatore attraversa un palazzo fantasy ispirato alle *Mille e una notte*, ad Aladdin e all'avventura di *Prince of Persia*. Le stanze sono ambienti 2D a schermata fissa; porte, fontane, ingranaggi, specchi e altri dispositivi si attivano risolvendo enigmi basati sul calcolo delle derivate.

La meccanica centrale è la derivazione simbolica con **inserimento libero della risposta**. Il giocatore non sceglie da un elenco la regola da applicare: deve riconoscere la struttura della funzione, decidere come procedere e digitare la derivata. Un motore simbolico verifica la correttezza, accettando forme matematicamente equivalenti.

Il principio guida è che la matematica costituisca il gameplay. Il calcolo non deve essere un esercizio scolastico seguito da una ricompensa grafica: la soluzione deve produrre una conseguenza concreta e leggibile nell'ambiente di gioco.

### 1.1 Scheda sintetica

| Elemento | Definizione |
|---|---|
| Titolo | Le Mille e Una Derivata |
| Genere | Escape room / puzzle adventure didattico |
| Destinatari | Studenti della scuola superiore, indicativamente quarto e quinto anno |
| Modalità | Giocatore singolo |
| Visuale | 2D, stanze a schermata fissa |
| Piattaforma prevista | Browser desktop |
| Input | Mouse e tastiera |
| Meccanica centrale | Derivazione simbolica con inserimento libero |
| Durata indicativa | 2–4 ore per la campagna iniziale, da verificare con playtest |
| Struttura prevista | 8 capitoli, 32 stanze principali e 8 stanze segrete facoltative |

## 2. Premessa narrativa e direzione artistica

Un antico sovrano costruì un palazzo nel quale ogni ambiente rappresentava una legge della natura: le fontane il movimento, gli ingranaggi le variazioni, gli specchi le trasformazioni e l'osservatorio il moto degli astri. Un Visir ha alterato il funzionamento del palazzo nel tentativo di controllare il Tempo. Il protagonista deve attraversare le stanze sigillate e raggiungere la Camera del Tempo.

Ogni capitolo può essere introdotto da un personaggio o da un breve racconto, evitando di interrompere troppo spesso il flusso degli enigmi.

### 2.1 Direzione artistica

- **Architettura:** archi, mosaici, cupole, cortili, piastrelle e decorazioni geometriche.
- **Meccanismi:** ottone, rame, ingranaggi, astrolabi, serrature e contrappesi.
- **Interfaccia:** pergamene, iscrizioni, sigilli e simboli luminosi.
- **Palette proposta:** blu notte per gli ambienti, oro per i meccanismi, turchese per la magia, rosso scuro per pericoli e trappole.

Il protagonista e la caratterizzazione definitiva dell'antagonista non erano ancora stati scelti: si vedano le decisioni aperte.

## 3. Obiettivi didattici

Al termine del percorso, lo studente dovrebbe essere in grado di:

1. comprendere la derivata come tasso di variazione istantaneo e come pendenza della retta tangente;
2. calcolare derivate di potenze, polinomi e funzioni elementari;
3. applicare le regole di somma, prodotto, quoziente e catena;
4. riconoscere la struttura di una funzione e scegliere autonomamente le regole da applicare;
5. individuare e correggere errori tipici di derivazione;
6. trasferire le regole apprese a funzioni con forme differenti da quelle già incontrate.

### 3.1 Principi di design didattico

- **La matematica è gameplay:** la soluzione attiva un elemento del mondo.
- **La difficoltà è strutturale:** dipende dal numero di regole, dai livelli di composizione, dalla forma algebrica e dall'autonomia richiesta, non soltanto dalla lunghezza dell'espressione.
- **L'errore è informazione:** il feedback deve aiutare a capire cosa non funziona senza consegnare sempre la soluzione.
- **Progressione non punitiva:** punteggio e medaglie non devono impedire di proseguire.
- **Esplorazione significativa:** gli oggetti interattivi devono fornire indizi, informazioni o conseguenze.
- **Padronanza distinta dalla prestazione:** velocità e punteggio non equivalgono automaticamente ad apprendimento.

## 4. Struttura della campagna

La proposta iniziale prevede 8 capitoli, 32 stanze principali e 8 stanze segrete facoltative. La progressione è sequenziale tra capitoli; all'interno di un capitolo alcune stanze possono essere affrontate in ordine variabile.

| Capitolo | Nome | Tema matematico | Stanze |
|---:|---|---|---:|
| 0 | La stanza del viaggiatore | Tutorial: significato della derivata e prime regole | 2 |
| 1 | Il cortile delle fontane | Potenze, polinomi, radicali e potenze negative | 5 |
| 2 | Il bazar degli alchimisti | Somme, differenze, coefficienti e parentesi | 4 |
| 3 | La torre degli ingranaggi | Regola del prodotto | 4 |
| 4 | La biblioteca proibita | Regola del quoziente | 4 |
| 5 | L'osservatorio celeste | Esponenziali, logaritmi e funzioni trigonometriche | 4 |
| 6 | Il palazzo degli specchi | Regola della catena e composizioni | 4 |
| 7 | La Camera del Tempo | Combinazioni di regole e prova finale | 5 |

**Nota curricolare:** la presenza e l'ordine di logaritmi, esponenziali e funzioni trigonometriche dovranno essere adattati al programma effettivamente svolto dalla classe. Le stanze segrete possono introdurre approfondimenti come parametri, derivate successive e funzioni definite a tratti.

## 5. Struttura di una stanza e ciclo di gioco

### 5.1 Elementi di una stanza

Ogni stanza dovrebbe contenere:

- **Ingresso:** punto di partenza e breve descrizione della situazione.
- **Ambiente:** scena fissa con elementi visivi riconoscibili.
- **Oggetti:** pergamene, leve, libri e dispositivi interattivi.
- **Enigma:** uno o più problemi matematici contestualizzati.
- **Uscita:** porta o passaggio che si sblocca al completamento degli enigmi richiesti.

### 5.2 Ciclo di interazione

1. **Osservare:** il giocatore esplora la schermata e individua gli elementi interattivi. Il gioco segnala gli oggetti selezionabili senza sovraccaricare la scena.
2. **Interagire:** il giocatore clicca un oggetto; il gioco mostra testo, indizio, funzione o dispositivo.
3. **Interpretare:** il giocatore comprende la richiesta matematica. Il contesto narrativo non deve necessariamente suggerire la regola da applicare.
4. **Calcolare:** il giocatore inserisce la derivata nell'editor matematico.
5. **Verificare:** il gioco controlla sintassi ed equivalenza simbolica.
6. **Attivare:** se la risposta è corretta, il meccanismo si anima e la progressione viene aggiornata.
7. **Uscire:** il giocatore accede alla stanza successiva; il sistema registra punteggio, tentativi, aiuti e tempo.

## 6. Inserimento delle formule e verifica simbolica

### 6.1 Requisito fondamentale

Il giocatore deve poter scrivere liberamente la derivata, senza risposte multiple e senza dover selezionare in anticipo la regola da applicare. Il sistema non deve confrontare stringhe: deve interpretare le espressioni e verificarne l'equivalenza matematica.

### 6.2 Sintassi iniziale prevista

| Operazione | Sintassi | Esempio |
|---|---|---|
| Potenza | `^` | `x^3` |
| Moltiplicazione | `*` oppure implicita | `3*x` oppure `3x` |
| Divisione | `/` | `(x+1)/(x-2)` |
| Radice | `sqrt()` | `sqrt(x)` |
| Esponenziale | `exp()` | `exp(x)` |
| Logaritmo naturale | `ln()` | `ln(x)` |
| Seno e coseno | `sin()`, `cos()` | `sin(2*x)`, `cos(x)` |
| Parentesi | `()` | `(x+1)^2` |

### 6.3 Flusso di verifica

1. Il client invia al backend l'identificativo dell'enigma e la risposta inserita.
2. Il backend recupera la funzione originale e le condizioni di dominio previste.
3. Un parser analizza l'espressione dello studente in un ambiente controllato.
4. SymPy calcola la derivata attesa della funzione originale.
5. Il sistema confronta la risposta con il risultato atteso tramite semplificazione simbolica e controlli di dominio.
6. Il backend restituisce uno stato: `correct`, `incorrect`, `syntax_error` oppure `unsupported_expression`.
7. Il tentativo e gli eventuali indicatori d'errore vengono registrati.

### 6.4 Requisiti e cautele

- Accettare forme algebriche equivalenti, anche se non completamente semplificate.
- Gestire coefficienti frazionari, potenze negative e razionali, radicali e funzioni annidate.
- Non usare valutazioni numeriche in pochi punti come unico criterio di equivalenza.
- Gestire i domini: due espressioni possono coincidere dove entrambe sono definite, ma avere punti singolari differenti.
- Limitare complessità e tempo di elaborazione delle espressioni inviate.
- Non eseguire codice arbitrario: usare un parser matematico con funzioni consentite.

**Esempio di equivalenza:** per la funzione `(3*x^2 - 2)*(x + 1)`, il sistema deve accettare sia `9*x^2 + 6*x - 2` sia `6*x*(x + 1) + 3*x^2 - 2`, se equivalenti nel dominio considerato.

## 7. Elenco dei capitoli e degli enigmi

Gli esercizi seguenti sono la proposta contenuta nel GDD v1.0. Sono esempi iniziali da validare matematicamente e didatticamente; non costituiscono ancora un database definitivo degli enigmi.

### Capitolo 0 — La stanza del viaggiatore

**Obiettivo:** tutorial su rapporto incrementale, derivata in un punto e pendenza della tangente.

| Stanza | Contenuto |
|---|---|
| 0.1 — La pergamena | Esplorazione interattiva del rapporto incrementale e della tangente. |
| 0.2 — La prima serratura | `f(x) = 3*x^2 - 5*x + 4`; risultato atteso: `f'(x) = 6*x - 5`. |

### Capitolo 1 — Il cortile delle fontane

**Obiettivo:** potenze, polinomi, radicali e potenze negative.

| Stanza | Contenuto |
|---|---|
| 1.1 — La fontana asciutta | `5*x^4 - 3*x^2 + 7*x - 2` |
| 1.2 — I canali ostruiti | `2*x^5 - 4*x^(-2) + 3` |
| 1.3 — Il pozzo delle radici | `3*sqrt(x) + 2*x^(3/2)` |
| 1.4 — Le tre valvole | `2/x^3 + 5*sqrt(x) - 4*x^2` |
| 1.5 — La grande fontana | Prova composta con potenze intere e frazionarie. |

### Capitolo 2 — Il bazar degli alchimisti

**Obiettivo:** consolidamento di somme, differenze, coefficienti e parentesi.

| Stanza | Contenuto |
|---|---|
| 2.1 — Il laboratorio | `4*(3*x^3 - 2*x + 1)` |
| 2.2 — Le ampolle | `(x^2 + 1) + (3*x^4 - 5*x)` |
| 2.3 — La bilancia | `2*(x^3 - 1) - 3*(2*x^2 + 4*x)` |
| 2.4 — Il composto proibito | Espressioni miste con parentesi e coefficienti frazionari. |

### Capitolo 3 — La torre degli ingranaggi

**Obiettivo:** regola del prodotto, `(fg)' = f'g + fg'`.

| Stanza | Contenuto |
|---|---|
| 3.1 | `(x^2 + 3)*(x^3 - 1)` |
| 3.2 | `(2*x^3 - x)*(x^2 + 4)` |
| 3.3 | `(x^2 + 1)*sqrt(x)` |
| 3.4 | `(3*x^2 - 2*x + 1)*(2*x^3 + 5*x)` |

### Capitolo 4 — La biblioteca proibita

**Obiettivo:** regola del quoziente, `(f/g)' = (f'g - fg')/g^2`.

| Stanza | Contenuto |
|---|---|
| 4.1 | `(x^2 + 3)/(x + 1)` |
| 4.2 | `(2*x^3 - 1)/(3*x^2 + 2)` |
| 4.3 | `sqrt(x)/(x^2 + 1)` |
| 4.4 | `(x^3 - 2*x + 1)/(x^2 + 3*x + 2)` |

### Capitolo 5 — L'osservatorio celeste

**Obiettivo:** derivate di esponenziali, logaritmi e funzioni trigonometriche.

| Stanza | Contenuto |
|---|---|
| 5.1 — La sfera solare | `3*exp(2*x) - 4*sin(x)` |
| 5.2 — La volta stellata | `2*cos(x) + 5*ln(x)` |
| 5.3 — Il planetario | `x^2*sin(x)` |
| 5.4 — Il moto degli astri | `exp(x)*cos(x)` |

### Capitolo 6 — Il palazzo degli specchi

**Obiettivo:** regola della catena, `[f(g(x))]' = f'(g(x))*g'(x)`.

| Stanza | Contenuto |
|---|---|
| 6.1 | `(3*x^2 + 1)^5` |
| 6.2 | `sqrt(4*x^3 - 2*x + 1)` |
| 6.3 | `sin(2*x^2 + 3*x)` |
| 6.4 | `exp(x^2 + 1)*cos(3*x)` |

### Capitolo 7 — La Camera del Tempo

**Obiettivo:** combinazione di regole e verifica finale senza suggerimenti obbligatori.

| Stanza | Contenuto |
|---|---|
| 7.1 | Polinomio con radicali e potenze negative. |
| 7.2 | Prodotto di funzioni composte. |
| 7.3 | Quoziente con funzioni esponenziali. |
| 7.4 | Funzione trigonometrica composta. |
| 7.5 — Enigma finale | `f(x) = ((x^2 + 1)^3 * sin(2*x))/exp(x)` |

## 8. Difficoltà, aiuti e feedback

### 8.1 Dimensioni della difficoltà

| Dimensione | Bassa complessità | Alta complessità |
|---|---|---|
| Numero di regole | Una regola | Tre o più regole combinate |
| Composizione | Nessun annidamento | Due o più livelli di composizione |
| Forma algebrica | Polinomi semplici | Frazioni, radicali e potenze |
| Autonomia | Regola suggerita | Scelta autonoma della strategia |

### 8.2 Sistema di aiuti

Gli aiuti sono facoltativi e progressivi. Il giocatore può anche consultare una biblioteca personale con regole, esempi risolti e annotazioni sulle trappole più comuni.

| Livello | Tipo | Contenuto |
|---:|---|---|
| 1 | Indizio ambientale | Suggerimento narrativo che orienta l'osservazione. |
| 2 | Richiamo teorico | Mostra la regola matematica pertinente. |
| 3 | Scomposizione | Indica le funzioni coinvolte e i passaggi da impostare. |
| 4 | Soluzione guidata | Mostra passaggi intermedi e risultato. |

### 8.3 Feedback sugli errori

| Categoria | Esempio di errore | Feedback possibile |
|---|---|---|
| Esponente | `3*x^4` derivato come `3*x^3` | Hai diminuito l'esponente, ma hai dimenticato di moltiplicare per quello originale. |
| Costante | `5` derivato come `5` | La derivata di una costante è zero. |
| Somma | È stato derivato un solo termine | Ogni termine della somma deve essere derivato. |
| Prodotto | `(fg)' = f'g'` | La derivata di un prodotto non è il prodotto delle derivate. |
| Catena | Manca il fattore interno | Non dimenticare di derivare anche la funzione interna. |

Il riconoscimento degli errori richiede un'analisi strutturale della risposta e un catalogo di misconcezioni tipiche. Se il sistema non riesce a classificare un errore con sufficiente affidabilità, deve limitarsi a segnalare che la risposta non è corretta, senza inventare una spiegazione.

## 9. Progressione, punteggi e ricompense

La **Sabbia del Tempo** è una risorsa narrativa utilizzabile per suggerimenti o riattivazioni di dispositivi. Non deve bloccare l'accesso alle stanze successive né generare game over punitivi.

### 9.1 Punteggio proposto per stanza

| Criterio | Punti massimi |
|---|---:|
| Risposta corretta al primo tentativo | 50 |
| Risposta corretta senza indizi | 25 |
| Nessun errore precedente | 15 |
| Completamento entro il tempo indicativo | 10 |
| **Totale** | **100** |

Soglie indicative:

- 60 punti: completamento;
- 75 punti: medaglia d'argento;
- 90 punti: medaglia d'oro;
- 100 punti: completamento perfetto.

Le medaglie non condizionano lo sblocco dei capitoli. Per stanze con più serrature, il punteggio viene distribuito tra gli enigmi.

## 10. Dashboard e statistiche per l'insegnante

La dashboard è prevista come funzionalità didattica, non come sistema di valutazione automatica sostitutivo del docente.

### 10.1 Dashboard di classe

- numero di studenti e percentuale di completamento della campagna;
- tempo medio per capitolo e stanza;
- percentuale di risposte corrette al primo tentativo;
- numero medio di suggerimenti utilizzati;
- distribuzione delle categorie di errore;
- confronto tra capitoli e argomenti.

### 10.2 Profilo individuale

- stanze completate e tentativi per enigma;
- accuratezza al primo tentativo;
- autonomia, intesa come risposte corrette senza aiuti;
- tempo impiegato, da interpretare con cautela;
- andamento della prestazione per argomento;
- risposte errate e categorie di errore riconosciute.

È importante distinguere tre indicatori:

- **Accuratezza:** quante risposte sono corrette.
- **Autonomia:** quante risposte corrette sono state ottenute senza aiuti.
- **Padronanza:** capacità di trasferire le regole a esercizi strutturalmente differenti.

Il punteggio di gioco non deve essere presentato come misura diretta dell'apprendimento.

## 11. Architettura tecnica proposta

Lo stack indicato nel GDD v1.0 è una proposta di partenza da verificare durante la PoC.

| Componente | Tecnologia proposta | Responsabilità |
|---|---|---|
| Frontend / gioco | JavaScript, Phaser 3 | Scene, stanze, sprite, animazioni, input e interfaccia. |
| Editor matematico | Componente JavaScript dedicato | Input, sintassi, anteprima e gestione degli errori di parsing. |
| Backend API | Python, FastAPI | Autenticazione, verifica, progressione e statistiche. |
| Motore simbolico | SymPy | Derivazione, semplificazione e confronto simbolico. |
| Database | PostgreSQL | Utenti, classi, enigmi, tentativi e progressi. |

### 11.1 Entità principali del database

| Tabella | Contenuto |
|---|---|
| `users` | Studenti e insegnanti; ruoli e identificativi pseudonimi. |
| `classes` | Classi e gruppi didattici. |
| `class_members` | Associazione tra utenti e classi. |
| `chapters` | Capitoli e metadati di progressione. |
| `rooms` | Stanze, ordine e condizioni di sblocco. |
| `puzzles` | Funzione, soluzione attesa, dominio, regole, difficoltà e feedback. |
| `attempts` | Risposta inserita, esito, timestamp, tempo e categoria di errore. |
| `hints_used` | Indizi consultati e relativo livello. |
| `progress` | Stato di avanzamento e punteggi. |
| `achievements` | Medaglie e ricompense ottenute. |

### 11.2 Dati obbligatori per ogni enigma

- identificativo univoco, capitolo e stanza;
- funzione originale in forma strutturata e leggibile;
- variabile indipendente e dominio previsto;
- risultato derivato atteso o procedura di calcolo verificabile;
- regole matematiche coinvolte e livello di difficoltà per dimensione;
- indizi graduati e feedback per errori tipici;
- eventuali condizioni di completamento e ricompensa.

## 12. Privacy, sicurezza e accessibilità

- Usare account pseudonimi per gli studenti e non raccogliere dati personali non necessari.
- Separare i permessi di studenti e insegnanti e limitare la visibilità dei dati alla propria classe.
- Proteggere le classi con codici di iscrizione e usare connessioni cifrate.
- Prevedere esportazione CSV e cancellazione dei dati della classe secondo le regole applicabili.
- Non eseguire codice arbitrario nel parser matematico; imporre limiti di complessità e tempo.
- Supportare la navigazione da tastiera, un contrasto leggibile e dimensioni dei caratteri regolabili.
- Non affidare il feedback soltanto al colore.
- Consentire di mettere in pausa e riprendere senza perdere i progressi.

La progettazione definitiva dovrà essere verificata rispetto ai requisiti privacy e alle policy dell'istituto scolastico che utilizzerà il gioco.

## 13. Piano di sviluppo e criteri di accettazione

Il percorso di sviluppo proposto è incrementale: prima si valida il nucleo matematico, poi si costruisce una stanza completa, quindi una breve esperienza verticale e infine la campagna.

| Fase | Attività | Risultato verificabile |
|---|---|---|
| 1. Prototipo matematico | Editor, parser, verifica SymPy, equivalenze e gestione sintassi. | Applicazione che verifica correttamente un set di test di derivate. |
| 2. Prima stanza | Ambiente, oggetti, porta, pergamene e animazioni. | Una stanza completa e giocabile. |
| 3. Vertical slice | Tutorial e tre stanze, progressione, salvataggi e punteggi. | Esperienza breve dall'inizio alla fine. |
| 4. Dashboard | Classi, profili, statistiche ed esportazione. | Insegnante in grado di consultare i risultati. |
| 5. Campagna | Otto capitoli, stanze segrete, narrazione e bilanciamento. | Versione completa da testare in classe. |

### 13.1 Test di accettazione iniziali

| Test | Risultato richiesto |
|---|---|
| Risposta corretta in forma espansa | Accettata. |
| Risposta corretta non semplificata | Accettata se simbolicamente equivalente. |
| Risposta errata | Rifiutata con feedback proporzionato. |
| Errore di sintassi | Segnalato senza bloccare il gioco. |
| Uso di un suggerimento | Registrato. |
| Uscita e rientro | Progressi conservati. |
| Completamento stanza | Statistiche aggiornate. |
| Accesso insegnante | Visibili soltanto i dati autorizzati. |

## 14. Decisioni ancora aperte

Questi punti erano esplicitamente lasciati alla discussione nel GDD v1.0 e non vanno considerati già risolti.

| Decisione | Opzioni / nota |
|---|---|
| Protagonista | Giovane avventuriero agile, ispirato a *Prince of Persia*, oppure apprendista sapiente più vicino alle *Mille e una notte*. |
| Antagonista | Visir ricorrente in scena oppure figura misteriosa presente attraverso messaggi e illusioni. |
| Fallimento | Preferibile evitare game over punitivi; eventuali trappole potrebbero riportare all'inizio della stanza con penalità contenuta. |
| Sabbia del Tempo | Risorsa consumabile per aiuti e dispositivi oppure valuta narrativa per suggerimenti e ricompense. |
| Programma matematico | Confermare ordine e presenza di logaritmi, esponenziali e trigonometriche in base al percorso scolastico. |
| Durata e bilanciamento | Da misurare con playtest; la stima di 2–4 ore è provvisoria. |

## 15. Espansione futura: I Segreti del Tempo

Dopo la campagna dedicata al calcolo simbolico, si può aggiungere un secondo percorso applicativo. Gli enigmi potrebbero riguardare, per esempio:

- massimizzare l'altezza di una fontana;
- ottimizzare il funzionamento di una macchina;
- individuare l'istante in cui un meccanismo raggiunge una certa velocità.

L'obiettivo sarebbe passare dal saper derivare al capire a cosa serve derivare. Questo percorso è fuori dallo scope della prima versione e della PoC iniziale.

## 16. Ambito consigliato per la Proof of Concept

Per ridurre il rischio tecnico, la PoC dovrebbe dimostrare prima di tutto che la meccanica fondamentale funziona: inserimento libero, parsing sicuro, confronto simbolico e feedback comprensibile. La parte grafica e la campagna completa possono essere sviluppate dopo aver validato questo nucleo.

### 16.1 Obiettivo minimo della PoC

Una piccola applicazione browser con:

1. una schermata di ingresso e una stanza tutorial;
2. almeno tre enigmi con difficoltà crescente;
3. un editor che accetti la sintassi matematica definita;
4. un endpoint che calcoli la derivata attesa e confronti simbolicamente la risposta;
5. accettazione di almeno due forme equivalenti della stessa derivata;
6. feedback distinti per risposta corretta, risposta errata ed errore di sintassi;
7. sblocco della porta al completamento;
8. salvataggio locale o persistente del progresso, secondo la scelta tecnica della PoC.

### 16.2 Fuori dallo scope della prima PoC

- campagna completa da 32 stanze;
- otto stanze segrete;
- dashboard docente completa;
- sistema definitivo di account e gestione classi;
- bilanciamento finale di punteggi, medaglie e Sabbia del Tempo;
- percorso applicativo *I Segreti del Tempo*.

### 16.3 Criterio di successo della PoC

La PoC è riuscita se uno studente può leggere un enigma, inserire liberamente una derivata, ricevere una verifica corretta anche quando la risposta è scritta in una forma equivalente non identica a quella attesa e vedere il mondo di gioco reagire al successo. Il sistema deve inoltre gestire in modo controllato risposte errate e input non validi.

---

## Principio guida

> Le Mille e Una Derivata deve portare lo studente dal saper applicare le regole al saper riconoscere, scegliere e utilizzare autonomamente gli strumenti del calcolo differenziale.

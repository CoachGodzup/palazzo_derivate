# Accesso del docente e gestione della sessione di gioco

> **Stato:** requisiti futuri (post demo-1). Nessuna di queste funzionalità è
> prevista nella vertical slice corrente; il perimetro demo-1 resta quello di
> `DEMO_SCOPE.md` (in questa stessa cartella).

## Attori

- **Docente:** accede con un account Google e dispone di una pagina di controllo.
- **Studenti:** accedono senza account, tramite un link e un codice di sessione,
  scegliendo un nickname pseudonimo.

## Configurazione della sessione

Per ogni sessione di gioco il docente può:

- **Set di derivate:** scegliere tra il set di default (le derivate previste a
  priori) o set alternativi creati in precedenza e salvati con un nome. Ogni set
  può essere esportato e importato.
- **Stanze sbloccate:** decidere quali stanze (nella gerarchia
  capitoli → stanze → enigmi) sono disponibili nella sessione.
- **Suggerimenti:** abilitarli o disabilitarli.
- **Formulario:** abilitare o disabilitare la parte statica (tabella delle
  regole di derivazione). Il formulario vive dentro la "biblioteca personale"
  del giocatore (GDD §8.2).

## Avvio e onboarding

1. Il docente avvia la sessione.
2. Sul suo schermo compare un **codice** da fornire agli studenti.
3. Gli studenti aprono il link al gioco e, per iniziare, digitano il codice.
4. Inseriscono un **nickname**. Il docente vede i nickname sulla plancia e ha la
   facoltà di modificarli.

## Svolgimento

- Finché la sessione è attiva, chiunque abbia il codice può entrare.
- Il docente monitora: studenti collegati, stanze raggiunte, punteggi e numero
  di errori per enigma.

## Terminazione

La sessione termina quando:

- il docente preme il tasto "termina sessione", oppure
- si raggiunge un tempo massimo fissato alla partenza.

Al termine, ciascuno studente vede il proprio punteggio; il docente può
proiettare la classifica come podio.

## Registrazione ed export

- Le sessioni vengono salvate sul profilo del docente.
- Il docente può esportare un file con le informazioni della sessione (derivate
  assegnate, eventuale tempo massimo) e, per ciascuno studente, punteggio
  ottenuto e tentativi effettuati per stanza.

## Capienza e dispositivi

- Carico massimo previsto: 30 studenti, previsti 15, **per sessione**.
- Gli studenti giocano prevalentemente da cellulare; è possibile giocare anche
  da PC.

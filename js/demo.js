/* Beispieldeck zum Ausprobieren, damit man die App auch ohne Buchfoto testen kann. */
export const DEMO_DECK = {
  schema: 'wortschmiede/deck@1',
  name: 'Beispiel – At the market',
  sourceLanguage: 'de',
  targetLanguage: 'en',
  cards: [
    { front: 'der Apfel', back: 'apple', hint: 'Plural: apples', example: 'I eat an apple every day.', exampleTranslation: 'Ich esse jeden Tag einen Apfel.', tags: ['Nomen'] },
    { front: 'die Birne', back: 'pear', tags: ['Nomen'] },
    { front: 'die Erdbeere', back: 'strawberry', tags: ['Nomen'] },
    { front: 'die Traube', back: 'grape', hint: 'meist Plural: grapes', tags: ['Nomen'] },
    { front: 'der Markt', back: 'market', example: 'We go to the market on Saturdays.', exampleTranslation: 'Samstags gehen wir auf den Markt.', tags: ['Nomen'] },
    { front: 'die Kasse', back: 'checkout', alternatives: ['till'], tags: ['Nomen'] },
    { front: 'teuer', back: 'expensive', alternatives: ['pricey'], tags: ['Adjektiv'] },
    { front: 'billig', back: 'cheap', tags: ['Adjektiv'] },
    { front: 'bezahlen', back: 'to pay', hint: 'paid, paid', tags: ['Verb'] },
    { front: 'wiegen', back: 'to weigh', hint: 'weighed, weighed', tags: ['Verb'] },
    { front: 'frisch', back: 'fresh', tags: ['Adjektiv'] },
    { front: 'die Tüte', back: 'bag', alternatives: ['plastic bag'], tags: ['Nomen'] },
  ],
};

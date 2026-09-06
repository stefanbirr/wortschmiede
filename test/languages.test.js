import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultDirectionFor, directionOptions, languageName } from '../js/languages.js';

test('lebende Fremdsprachen werden produziert', () => {
  assert.equal(defaultDirectionFor('en'), 'production');
  assert.equal(defaultDirectionFor('fr'), 'production');
  assert.equal(defaultDirectionFor('es'), 'production');
});

test('Latein und Altgriechisch werden übersetzt', () => {
  assert.equal(defaultDirectionFor('la'), 'recognition');
  assert.equal(defaultDirectionFor('LA'), 'recognition');
  assert.equal(defaultDirectionFor('grc'), 'recognition');
});

test('unbekannte Sprache fällt auf Produzieren zurück', () => {
  assert.equal(defaultDirectionFor(''), 'production');
  assert.equal(defaultDirectionFor(undefined), 'production');
});

test('Richtungen sind mit den Sprachen des Decks beschriftet', () => {
  const opts = directionOptions({ sourceLanguage: 'de', targetLanguage: 'la' });
  assert.match(opts[0][1], /Deutsch → Latein/);
  assert.match(opts[1][1], /Latein → Deutsch/);
  assert.equal(languageName('la'), 'Latein');
  assert.equal(languageName('xx'), 'xx');
});

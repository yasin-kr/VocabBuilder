const categoryLabels: Record<string, string> = {
  verb: 'Fiil',
  participle: 'Sıfat-fiil',
  noun: 'İsim',
  adjective: 'Sıfat',
  pronoun: 'Zamir',
  numerals: 'Sayı',
  adverb: 'Zarf',
  preposition: 'Edat',
  conjunction: 'Bağlaç',
  'phrasal verb': 'Öbek fiil',
  'functional phrase': 'Kalıp ifade',
};

export function categoryLabel(code: string): string {
  return categoryLabels[code] ?? code;
}

export function capitalize(value: string, language: 'en' | 'tr' = 'en'): string {
  return value.charAt(0).toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US') + value.slice(1);
}

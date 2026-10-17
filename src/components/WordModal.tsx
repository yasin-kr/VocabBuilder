import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { errorMessage, useApp } from '../app-context';
import { api } from '../services/api';
import type { Word, WordInput } from '../types';
import { wordSchema } from '../lib/validation';
import { categoryLabel } from '../lib/locale';
import { Icon } from './Icon';
import { Modal } from './Modal';

export function WordModal({ word, onClose }: { word?: Word; onClose: () => void }) {
  const { categories, notify, refresh } = useApp();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WordInput>({
    resolver: yupResolver(wordSchema) as Resolver<WordInput>,
    defaultValues: {
      en: word?.en ?? '',
      tr: word?.tr ?? '',
      category: word?.category ?? '',
      isIrregular: word?.isIrregular ?? false,
    },
  });
  const category = watch('category');
  const submit = handleSubmit(async (values) => {
    setSaving(true);
    setSaveError('');
    try {
      const input = {
        ...values,
        en: values.en.trim(),
        tr: values.tr.trim(),
        ...(values.category === 'verb'
          ? { isIrregular: String(values.isIrregular) === 'true' }
          : {}),
      };
      if (input.category !== 'verb') delete input.isIrregular;
      if (word) await api.editWord(word._id, input);
      else await api.createWord(input);
      notify(word ? 'Kelimeniz güncellendi.' : 'Yeni kelimeniz sözlüğünüze eklendi!');
      refresh();
      onClose();
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  });
  return (
    <Modal
      onClose={onClose}
      titleId="word-modal-title"
      className={`word-modal ${word ? 'edit-modal' : ''}`}
    >
      <h2 id="word-modal-title" className={word ? 'sr-only' : undefined}>
        {word ? 'Kelimeyi düzenle' : 'Kelime ekle'}
      </h2>
      {!word && (
        <p className="modal-intro">
          Sözlüğünüze yeni kelimeler ekleyerek kelime dağarcığınızı geliştirin ve öğrendiklerinizi
          kalıcı hale getirin.
        </p>
      )}
      <form onSubmit={submit} noValidate>
        {saveError && (
          <div className="toast toast-error modal-notice" role="alert">
            <Icon name="alert" size={20} />
            <span>{saveError}</span>
            <button
              className="icon-button"
              type="button"
              aria-label="Bildirimi kapat"
              onClick={() => setSaveError('')}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        {!word && (
          <div className="word-category">
            <label className="sr-only" htmlFor="word-category">
              Kategori
            </label>
            <div className="select-wrap">
              <select
                id="word-category"
                {...register('category')}
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'word-category-error' : undefined}
              >
                <option value="" disabled>
                  Kategoriler
                </option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(item)}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={20} />
            </div>
            {errors.category && (
              <p id="word-category-error" className="field-error">
                {errors.category.message}
              </p>
            )}
            {category === 'verb' && (
              <fieldset className="verb-options">
                <legend className="sr-only">Fiil türü</legend>
                <label>
                  <input type="radio" value="false" {...register('isIrregular')} defaultChecked />
                  Düzenli
                </label>
                <label>
                  <input type="radio" value="true" {...register('isIrregular')} />
                  Düzensiz
                </label>
              </fieldset>
            )}
            {category === 'verb' && String(watch('isIrregular')) === 'true' && (
              <p className="verb-help">Fiilin üç halini aralarında boşluk bırakarak yazın.</p>
            )}
          </div>
        )}
        <div className="word-fields">
          {(['tr', 'en'] as const).map((language) => (
            <div className="word-field" key={language}>
              <label htmlFor={`word-${language}`}>
                <Icon name={language === 'en' ? 'flag-uk' : 'flag-tr'} size={32} />
                {language === 'en' ? 'İngilizce' : 'Türkçe'}
              </label>
              <div>
                <input
                  id={`word-${language}`}
                  lang={language}
                  {...register(language)}
                  placeholder={
                    language === 'en' ? 'İngilizce kelimeyi yazın' : 'Türkçe karşılığını yazın'
                  }
                  autoComplete="off"
                  aria-invalid={!!errors[language]}
                  aria-describedby={errors[language] ? `error-${language}` : undefined}
                />
                {errors[language] && (
                  <p id={`error-${language}`} className="field-error">
                    {errors[language]?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="button button-light" type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor…' : word ? 'Kaydet' : 'Ekle'}
          </button>
          <button type="button" className="button button-outline-light" onClick={onClose}>
            İptal
          </button>
        </div>
      </form>
    </Modal>
  );
}

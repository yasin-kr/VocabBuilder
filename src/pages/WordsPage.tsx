import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { errorMessage, useApp } from '../app-context';
import { api } from '../services/api';
import type { Word } from '../types';
import { Icon } from '../components/Icon';
import { Illustration } from '../components/Illustration';
import { WordModal } from '../components/WordModal';
import { capitalize } from '../lib/locale';
import { WordsTable } from '../components/WordsTable';
import { Pagination } from '../components/Pagination';
import { Dashboard } from '../components/Dashboard';

export function WordsPage({ scope }: { scope: 'own' | 'all' }) {
  const { categories, notify, revision, refresh } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [irregular, setIrregular] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Word | 'add' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState(new Set<string>());
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (search.trim() === keyword) return;
    const timer = setTimeout(() => {
      setKeyword(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, keyword]);
  useEffect(() => {
    setSearch('');
    setKeyword('');
    setCategory('');
    setPage(1);
    setAddedIds(new Set());
  }, [scope]);
  useEffect(() => {
    if (scope === 'own' && searchParams.get('add') === 'true') {
      setModal('add');
      setSearchParams({}, { replace: true });
    }
  }, [scope, searchParams, setSearchParams]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      api.listWords({
        scope,
        page,
        limit: 7,
        keyword,
        category,
        ...(category === 'verb' ? { isIrregular: irregular } : {}),
      }),
      api.statistics(),
    ])
      .then(([result, stats]) => {
        if (active) {
          if (page > result.totalPages && result.totalPages > 0) {
            setPage(result.totalPages);
            return;
          }
          setWords(result.results);
          setTotalPages(result.totalPages);
          setTotalCount(stats.totalCount);
        }
      })
      .catch((error) => {
        if (active) setError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [scope, page, keyword, category, irregular, revision, retry]);
  const removeWord = async (word: Word) => {
    setBusyId(word._id);
    try {
      await api.deleteWord(word._id);
      notify(`“${capitalize(word.en)}” sözlüğünüzden silindi.`);
      refresh();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };
  const addWord = async (word: Word) => {
    setBusyId(word._id);
    try {
      await api.addWord(word._id);
      setAddedIds((ids) => new Set(ids).add(word._id));
      notify(`“${capitalize(word.en)}” sözlüğünüze eklendi.`);
      refresh();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };
  return (
    <main id="main-content" className="container words-page">
      <h1 className="sr-only">{scope === 'own' ? 'Sözlük' : 'Öneriler'}</h1>
      <Dashboard
        categories={categories}
        search={search}
        category={category}
        irregular={irregular}
        totalCount={totalCount}
        onSearchChange={setSearch}
        onCategoryChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
        onIrregularChange={(value) => {
          setIrregular(value);
          setPage(1);
        }}
        onAddWord={scope === 'own' ? () => setModal('add') : undefined}
      />
      <div aria-busy={loading} className="words-content">
        {error ? (
          <div className="empty-state" role="alert">
            <Icon name="alert" size={36} />
            <h2>Kelimeleriniz yüklenemedi</h2>
            <p>{error}</p>
            <button
              className="button button-primary"
              onClick={() => setRetry((value) => value + 1)}
            >
              Tekrar dene
            </button>
          </div>
        ) : loading ? (
          <div className="table-skeleton" role="status">
            <span className="sr-only">Kelimeler yükleniyor</span>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} />
            ))}
          </div>
        ) : words.length ? (
          <WordsTable
            words={words}
            scope={scope}
            busyId={busyId}
            addedIds={addedIds}
            onEdit={setModal}
            onDelete={removeWord}
            onAdd={addWord}
          />
        ) : (
          <div className="empty-state">
            <Illustration variant="book" />
            <h2>
              {keyword || category
                ? 'Kelime bulunamadı'
                : scope === 'own'
                  ? 'İlk kelimenizle başlayın'
                  : 'Yeni kelimeler sizi bekliyor'}
            </h2>
            <p>
              {keyword || category
                ? 'Farklı bir kelime veya kategori deneyin.'
                : scope === 'own'
                  ? 'İlk kelimenizi ekleyin veya Öneriler sayfasında yeni kelimeler keşfedin.'
                  : 'Diğer kullanıcıların paylaştığı yeni kelimeler burada görünecek.'}
            </p>
            {scope === 'own' && !keyword && !category && (
              <button className="button button-primary" onClick={() => setModal('add')}>
                Kelime ekle <Icon name="plus" size={18} />
              </button>
            )}
          </div>
        )}
      </div>
      {!error && (
        <Pagination page={page} totalPages={totalPages} disabled={loading} onChange={setPage} />
      )}
      {modal && (
        <WordModal word={modal === 'add' ? undefined : modal} onClose={() => setModal(null)} />
      )}
    </main>
  );
}

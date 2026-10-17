import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage, useApp } from '../app-context';
import { api } from '../services/api';
import type { Answer, AnswerResult, Task } from '../types';
import { Icon } from '../components/Icon';
import { Illustration } from '../components/Illustration';
import { Progress } from '../components/Progress';
import { Modal } from '../components/Modal';
import { capitalize } from '../lib/locale';
import { createTrainingSessions } from '../lib/training';

export function TrainingPage() {
  const { notify, refresh } = useApp();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Task[][]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [results, setResults] = useState<AnswerResult[] | null>(null);
  const [saving, setSaving] = useState(false);
  const answerField = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .tasks()
      .then((data) => {
        if (active) setSessions(createTrainingSessions(data.words));
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
  }, [retry]);
  useEffect(() => {
    if (!loading && results === null) answerField.current?.focus();
  }, [sessionIndex, loading, results]);
  const tasks = sessions[sessionIndex] ?? [];
  const hasNextSession = sessionIndex + 1 < sessions.length;
  const task = tasks[index];
  const withCurrentAnswer = () => {
    if (!answer.trim() || !task) return answers;
    return [
      ...answers,
      {
        _id: task._id,
        en: task.task === 'en' ? answer.trim() : (task.en ?? ''),
        tr: task.task === 'tr' ? answer.trim() : (task.tr ?? ''),
        task: task.task,
      },
    ];
  };
  const next = () => {
    setAnswers(withCurrentAnswer());
    setAnswer('');
    setIndex((value) => value + 1);
  };
  const save = async () => {
    const completed = withCurrentAnswer();
    setSaving(true);
    try {
      const response = completed.length ? await api.answers(completed) : [];
      setResults(response);
      setAnswers(completed);
      setAnswer('');
      refresh();
    } catch (error) {
      notify(`İlerlemeniz kaydedilemedi. ${errorMessage(error)}`, 'error');
      navigate('/dictionary');
    } finally {
      setSaving(false);
    }
  };
  const nextSession = () => {
    setSessionIndex((value) => value + 1);
    setIndex(0);
    setAnswer('');
    setAnswers([]);
    setResults(null);
  };
  if (loading)
    return (
      <main id="main-content" className="container page-loading" role="status">
        <span className="spinner" />
        Alıştırmanız hazırlanıyor…
      </main>
    );
  if (error)
    return (
      <main id="main-content" className="container empty-state" role="alert">
        <h1>Alıştırma yüklenemedi</h1>
        <p>{error}</p>
        <button className="button button-primary" onClick={() => setRetry((value) => value + 1)}>
          Tekrar dene
        </button>
      </main>
    );
  if (!tasks.length)
    return (
      <main id="main-content" className="container empty-training">
        <Illustration variant="study" />
        <div>
          <h1>Şu anda çalışılacak kelimeniz yok.</h1>
          <p>
            Alıştırmaya başlamak için sözlüğünüze bir kelime ekleyin. Öğrenmek istediğiniz
            kelimeleri seçin ve düzenli tekrarlarla kelime dağarcığınızı geliştirin.
          </p>
          <div className="empty-training-actions">
            <Link to="/dictionary?add=true" className="button button-primary">
              Kelime ekle
            </Link>
            <Link to="/dictionary" className="button button-secondary">
              İptal
            </Link>
          </div>
        </div>
      </main>
    );
  const answerCount = answers.length + (answer.trim() ? 1 : 0);
  return (
    <main id="main-content" className="container training-page">
      <h1 className="sr-only">Kelime alıştırması</h1>
      <div className="training-progress">
        <div className="training-step">
          {sessions.length > 1 && (
            <p>
              Alıştırma {sessionIndex + 1} / {sessions.length}
            </p>
          )}
          <p>
            Kelime {index + 1} / {tasks.length}
          </p>
        </div>
        <Progress
          value={(answerCount / tasks.length) * 100}
          label={String(tasks.length - answerCount)}
          training
        />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!saving) {
            if (index < tasks.length - 1) next();
            else void save();
          }
        }}
      >
        <div className="training-card">
          <div className="training-answer">
            <label className="language-label" htmlFor="training-answer">
              <Icon name={task.task === 'en' ? 'flag-uk' : 'flag-tr'} size={32} />
              {task.task === 'en' ? 'İngilizce' : 'Türkçe'}
            </label>
            <textarea
              ref={answerField}
              id="training-answer"
              lang={task.task}
              key={`${sessionIndex}-${index}`}
              autoFocus
              placeholder={
                task.task === 'en' ? 'İngilizce karşılığını yazın' : 'Türkçe karşılığını yazın'
              }
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key !== 'Enter' ||
                  event.shiftKey ||
                  event.ctrlKey ||
                  event.altKey ||
                  event.metaKey ||
                  event.nativeEvent.isComposing ||
                  event.nativeEvent.keyCode === 229
                )
                  return;
                event.preventDefault();
                if (!event.repeat && !saving && results === null)
                  event.currentTarget.form?.requestSubmit();
              }}
              autoComplete="off"
              spellCheck={false}
              disabled={saving}
              aria-label={task.task === 'en' ? 'İngilizceye çevir' : 'Türkçeye çevir'}
            />
            {index < tasks.length - 1 && (
              <button type="submit" className="text-button next-word" disabled={saving}>
                Sonraki <Icon name="arrow-right" size={20} />
              </button>
            )}
          </div>
          <div className="training-prompt">
            <span className="language-label">
              <Icon name={task.task === 'en' ? 'flag-tr' : 'flag-uk'} size={32} />
              {task.task === 'en' ? 'Türkçe' : 'İngilizce'}
            </span>
            <p lang={task.task === 'en' ? 'tr' : 'en'}>
              {capitalize(
                (task.task === 'en' ? task.tr : task.en) ?? '',
                task.task === 'en' ? 'tr' : 'en',
              )}
            </p>
          </div>
        </div>
        <div className="training-actions">
          <button className="button button-primary" type="button" disabled={saving} onClick={save}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <Link className="button button-secondary" to="/dictionary">
            İptal
          </Link>
        </div>
      </form>
      {results && (
        <Modal
          onClose={() => navigate('/dictionary')}
          titleId="results-title"
          className="results-modal"
        >
          <h2 id="results-title">Tebrikler</h2>
          <p className="results-summary">
            {results.length} yanıttan {results.filter((item) => item.isDone).length} tanesi doğru
            {tasks.length > results.length
              ? ` · ${tasks.length - results.length} kelime atlandı`
              : ''}
          </p>
          <div className="results-columns">
            <div>
              <h3>Doğru yanıtlar:</h3>
              <ul>
                {results
                  .filter((item) => item.isDone)
                  .map((item) => (
                    <li key={`${item._id}-${item.task}`} lang="en">
                      {capitalize(item.en)}
                    </li>
                  ))}
              </ul>
              {!results.some((item) => item.isDone) && <p>Pratik yapmaya devam edin!</p>}
            </div>
            <div>
              <h3>Yanlış yanıtlar:</h3>
              <ul>
                {results
                  .filter((item) => !item.isDone)
                  .map((item) => (
                    <li key={`${item._id}-${item.task}`} lang="en">
                      {capitalize(item.en)}
                    </li>
                  ))}
              </ul>
              {results.length > 0 && results.every((item) => item.isDone) && <p>Hepsi doğru!</p>}
              <Illustration variant="book" />
            </div>
          </div>
          {hasNextSession && (
            <button className="button button-light" onClick={nextSession}>
              Sonraki alıştırma <Icon name="arrow-right" size={20} />
            </button>
          )}
          <button className="button button-light" onClick={() => navigate('/dictionary')}>
            Sözlüğe dön <Icon name="arrow-right" size={20} />
          </button>
        </Modal>
      )}
    </main>
  );
}

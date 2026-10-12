import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { errorMessage, useApp } from '../app-context';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Illustration } from './Illustration';

const pages = [
  ['/dictionary', 'Sözlük'],
  ['/recommend', 'Öneriler'],
  ['/training', 'Alıştırma'],
];
export function Header() {
  const { user, logout, notify } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const signOut = async () => {
    setLeaving(true);
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setLeaving(false);
    }
  };
  const navigation = (
    <>
      {pages.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </>
  );
  return (
    <header className={`header ${user ? '' : 'header-public'}`}>
      <div className="container header-inner">
        <Link
          to={user ? '/dictionary' : '/register'}
          className="brand"
          aria-label="VocabBuilder ana sayfa"
        >
          <Icon name="logo" size={40} />
          <span>VocabBuilder</span>
        </Link>
        {user && (
          <>
            <nav className="desktop-nav" aria-label="Ana menü">
              {navigation}
            </nav>
            <div className="user-bar">
              <span className="user-name">{user.name}</span>
              <span className="avatar">
                <Icon name="user" size={24} />
              </span>
              <button className="text-button desktop-logout" onClick={signOut} disabled={leaving}>
                Çıkış yap <Icon name="arrow-right" size={20} />
              </button>
              <button
                className="icon-button menu-toggle"
                aria-label="Menüyü aç"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Icon name="menu" size={32} />
              </button>
            </div>
          </>
        )}
      </div>
      {menuOpen && user && (
        <Modal onClose={() => setMenuOpen(false)} titleId="menu-title" className="menu-drawer">
          <h2 id="menu-title" className="sr-only">
            Menü
          </h2>
          <div className="drawer-user">
            <span>{user.name}</span>
            <span className="avatar">
              <Icon name="user" />
            </span>
          </div>
          <nav aria-label="Mobil menü" className="drawer-nav">
            {navigation}
            <button className="text-button" onClick={signOut} disabled={leaving}>
              Çıkış yap <Icon name="arrow-right" size={20} />
            </button>
          </nav>
          <Illustration variant="people" className="drawer-illustration" />
        </Modal>
      )}
    </header>
  );
}

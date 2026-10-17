type IllustrationProps = {
  variant?: 'people' | 'book' | 'study';
  className?: string;
};

export function Illustration({ variant = 'people', className = '' }: IllustrationProps) {
  const classes = `illustration illustration--${variant} ${className}`.trim();

  if (variant === 'people') {
    return (
      <picture className={classes}>
        <source
          media="(min-width: 768px)"
          srcSet="/illustrations/reading-desktop.png 2x"
          width={498}
          height={435}
        />
        <img
          src="/illustrations/reading-mobile.png"
          srcSet="/illustrations/reading-mobile.png 2x"
          width={247}
          height={191}
          alt="Birlikte kitap okuyan iki öğrenci"
          decoding="async"
        />
      </picture>
    );
  }

  const isBook = variant === 'book';
  const src = `/illustrations/${isBook ? 'open-book' : 'training-empty'}.png`;
  return (
    <img
      className={classes}
      src={src}
      srcSet={`${src} 2x`}
      width={isBook ? 212 : 265}
      height={isBook ? 179 : 282}
      alt={
        isBook ? 'Yeni kelimeler öğrenmek için açık bir kitap' : 'Alıştırmalar için çalışma kâğıdı'
      }
      loading="lazy"
      decoding="async"
    />
  );
}

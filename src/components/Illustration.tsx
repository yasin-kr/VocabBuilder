import { useId } from 'react';

type IllustrationProps = {
  variant?: 'people' | 'book' | 'study';
  className?: string;
};

export function Illustration({ variant = 'people', className }: IllustrationProps) {
  const id = useId().replace(/:/g, '');
  const paint = (name: string) => `url(#${id}-${name})`;

  if (variant === 'book') {
    return (
      <svg
        className={className}
        viewBox="0 0 240 220"
        fill="none"
        role="img"
        aria-label="Yeni kelimeler öğrenmek için açık bir kitap"
      >
        <defs>
          <linearGradient
            id={`${id}-pages`}
            x1="51"
            y1="53"
            x2="172"
            y2="181"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#D7D6CF" />
          </linearGradient>
          <linearGradient
            id={`${id}-cover`}
            x1="38"
            y1="85"
            x2="185"
            y2="194"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E5B665" />
            <stop offset="1" stopColor="#C78C42" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#476558" stopOpacity=".23" />
            <stop offset="1" stopColor="#476558" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="133" cy="186" rx="99" ry="20" fill={paint('shadow')} />
        <path d="m34 87 67-53 45 55 66 60-67 53-38-14Z" fill={paint('cover')} />
        <path d="m38 85 66-46 41 56 61 55-66 45-33-11Z" fill="#F9F5E9" />
        <path
          d="m42 78 65-43 37 58c15 5 37 24 57 48l-61 46c-9-8-19-13-32-12Z"
          fill={paint('pages')}
        />
        <path d="m42 78 65-43 37 58c-17 3-29 25-36 82Z" fill="#ECEBE5" />
        <path d="m51 78 52-35 34 51c-14 8-21 22-28 48Z" fill="#FBFBF7" />
        <path
          d="M144 93c-19 10-27 35-36 82 8-13 18-21 30-24 13-4 31-6 52-14-16-22-32-38-46-44Z"
          fill="#FFFFFF"
        />
        <path
          d="M112 174c13-15 31-13 44-16m-41 22c12-10 27-11 36-12m-44 14 35 13 64-45"
          stroke="#BDBDB4"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="m126 173 7 5 13-9-1 16-12-3-7 6Z" fill="#85AA9F" />
        <path
          d="m193 64 2-7m13 14 6-2M54 124l-6 2"
          stroke="#F0D4A0"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'study') {
    return (
      <svg
        className={className}
        viewBox="0 0 240 240"
        fill="none"
        role="img"
        aria-label="Tamamlanan soruların işaretlendiği bir çalışma kâğıdı"
      >
        <defs>
          <linearGradient
            id={`${id}-paper`}
            x1="70"
            y1="39"
            x2="177"
            y2="207"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#DFE2DD" />
          </linearGradient>
          <linearGradient
            id={`${id}-badge`}
            x1="38"
            y1="35"
            x2="91"
            y2="87"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#A7C8D8" />
            <stop offset="1" stopColor="#5C91B0" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#476558" stopOpacity=".18" />
            <stop offset="1" stopColor="#476558" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="131" cy="219" rx="84" ry="15" fill={paint('shadow')} />
        <g transform="rotate(13 120 124)">
          <path
            d="M66 31h94l35 37v135a10 10 0 0 1-10 10H64a10 10 0 0 1-10-10V43a12 12 0 0 1 12-12Z"
            fill="#BDC4BC"
          />
          <path
            d="M62 27h94l35 37v135a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10V39a12 12 0 0 1 12-12Z"
            fill={paint('paper')}
          />
          <path d="m156 27 35 37h-23a12 12 0 0 1-12-12Z" fill="#D0D6CE" />
          <rect x="71" y="86" width="24" height="25" rx="7" fill="#CEA0AE" />
          <path
            d="m77 98 4 4 8-10"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="106" y="90" width="51" height="6" rx="3" fill="#C795A5" />
          <rect x="106" y="102" width="35" height="5" rx="2.5" fill="#DBBBC6" />
          <rect x="71" y="128" width="24" height="25" rx="7" fill="#85AA9F" />
          <path
            d="m77 140 4 4 8-10"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="106" y="132" width="55" height="6" rx="3" fill="#85AA9F" />
          <rect x="106" y="144" width="42" height="5" rx="2.5" fill="#B5CBC1" />
          <rect x="71" y="170" width="24" height="25" rx="7" fill="#DEB15F" />
          <path
            d="m77 182 4 4 8-10"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="106" y="174" width="49" height="6" rx="3" fill="#DEB15F" />
          <rect x="106" y="186" width="30" height="5" rx="2.5" fill="#E7D1A5" />
        </g>
        <circle cx="75" cy="49" r="29" fill="#547D90" />
        <circle cx="71" cy="46" r="29" fill={paint('badge')} />
        <path d="m56 59 14-28h8l4 29h-8l-.4-6H65l-2.6 5Zm12-12h5l-.5-9Z" fill="#FFFFFF" />
        <path
          d="m94 21 3-6m-51 61-6 3m145 15 7-3"
          stroke="#C8DAD1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 560 400"
      fill="none"
      role="img"
      aria-label="Birlikte oturup kitap okuyan iki öğrenci"
    >
      <defs>
        <linearGradient
          id={`${id}-skin`}
          x1="168"
          y1="111"
          x2="242"
          y2="259"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFC2A4" />
          <stop offset="1" stopColor="#CA8F73" />
        </linearGradient>
        <linearGradient
          id={`${id}-skin2`}
          x1="338"
          y1="110"
          x2="423"
          y2="297"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DDA782" />
          <stop offset="1" stopColor="#BA795B" />
        </linearGradient>
        <linearGradient
          id={`${id}-cream`}
          x1="123"
          y1="159"
          x2="235"
          y2="257"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#D8D6C9" />
        </linearGradient>
        <linearGradient
          id={`${id}-sage`}
          x1="130"
          y1="228"
          x2="267"
          y2="346"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A0BEB2" />
          <stop offset=".52" stopColor="#779C8D" />
          <stop offset="1" stopColor="#4D7668" />
        </linearGradient>
        <linearGradient
          id={`${id}-rose`}
          x1="305"
          y1="269"
          x2="453"
          y2="356"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D1A3B0" />
          <stop offset="1" stopColor="#A77386" />
        </linearGradient>
        <linearGradient
          id={`${id}-yellow`}
          x1="328"
          y1="178"
          x2="412"
          y2="278"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F5D886" />
          <stop offset="1" stopColor="#D2A449" />
        </linearGradient>
        <linearGradient
          id={`${id}-hair`}
          x1="189"
          y1="57"
          x2="231"
          y2="149"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#645049" />
          <stop offset="1" stopColor="#3D302D" />
        </linearGradient>
        <linearGradient
          id={`${id}-book`}
          x1="198"
          y1="212"
          x2="283"
          y2="286"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#89BAC0" />
          <stop offset="1" stopColor="#547E83" />
        </linearGradient>
        <radialGradient id={`${id}-ground`}>
          <stop stopColor="#4E6658" stopOpacity=".24" />
          <stop offset="1" stopColor="#4E6658" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="287" cy="356" rx="242" ry="27" fill={paint('ground')} />
      <path
        d="M174 235c-40-22-65-8-68 23l-2 62-28 13 26 14 42-11 20-57 53 46c24 10 52 12 65-2 10-12 1-23-16-32Z"
        fill={paint('sage')}
      />
      <path
        d="m129 253-7 72m43-46 33 29c17 18 38 23 67 18"
        stroke="#4E7968"
        strokeOpacity=".5"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="m103 317-28 10-20 5c-16 3-21 15-13 23 6 5 24 4 33 1l43-13Z" fill="#F6F4EB" />
      <path d="m102 321-28 9-14 3c-10 2-15 7-13 14 1 5 11 4 18 2l40-13Z" fill="#615650" />
      <path
        d="m65 331 6 16m3-19 6 16m3-19 6 16M39 351c17 5 43-4 63-8"
        stroke="#F4EFE3"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m225 319-17 23c-4 8 3 17 15 18l45-2c14-1 16-12 5-18l-20-15Z" fill="#EFECE1" />
      <path d="m225 324-13 18c8 8 26 11 44 7l10-5-15-12Z" fill="#71645B" />
      <path
        d="m224 332 18 8m-22-1 18 8m-28 7c14 7 43 6 61-1"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M169 142c-27-5-46 8-50 29l-9 28 36 9 3 32c17 13 50 17 71 5l24-71c-10-24-37-33-75-32Z"
        fill={paint('cream')}
      />
      <path d="m160 210-11 30m73-63 10 32" stroke="#C4C4B7" strokeWidth="3" strokeLinecap="round" />
      <path d="m192 122-11 29c4 16 25 17 32 3l3-25Z" fill={paint('skin')} />
      <path d="M191 137c10 9 16 10 23 5l3-15-22 2Z" fill="#BC8166" fillOpacity=".45" />
      <path
        d="M181 83c-14 18-6 54 11 63 16 9 34 1 44-17 9-15 12-42-3-55-16-14-40-10-52 9Z"
        fill={paint('skin')}
      />
      <path
        d="M179 113c-12-11-14-28-5-43 6-12 17-15 29-15 2-9 13-8 19-3 7-5 16 0 18 7 18 3 20 20 8 35-6 3-15-1-20-8-2 10-8 10-14 5l-5-11c-4 17-12 22-21 20l-1 16Z"
        fill={paint('hair')}
      />
      <path
        d="M192 65c-10 6-12 16-11 22m28-25c-9 8-9 17-6 23m19-19c-1 9 5 15 12 17"
        stroke="#876C5E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity=".6"
      />
      <ellipse cx="180" cy="112" rx="7" ry="10" transform="rotate(-13 180 112)" fill="#DCA688" />
      <path d="m209 109 8 1m10-1 7 4" stroke="#6B4B3E" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="213" cy="115" rx="2.5" ry="3.3" fill="#3D302B" />
      <ellipse cx="230" cy="119" rx="2.3" ry="3.1" fill="#3D302B" />
      <path
        d="m221 119-2 8 4 1m-15 1c4 7 9 9 15 6"
        stroke="#A76E56"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M121 187c-12 7-18 26-5 40 16 17 56 31 76 33l10-18c-20-7-42-17-58-29l5-18Z"
        fill={paint('skin')}
      />
      <path d="M184 240c13-4 23-3 30 3l14 12-9 13-24-8-12-8Z" fill="#E6B092" />
      <path d="m230 182-5 38-17 26 15 11c19-16 33-42 29-66Z" fill={paint('skin')} />
      <path d="m204 246 9-9 15 9-9 14Z" fill="#4D5C52" />
      <rect
        x="211"
        y="242"
        width="9"
        height="10"
        rx="2"
        transform="rotate(32 211 242)"
        fill="#DEC18B"
      />

      <path d="m188 222 49 16 45-15-8 64-39 13-40-32Z" fill="#3E686B" />
      <path d="m191 216 48 17 47-16-10 61-40 17-40-32Z" fill={paint('book')} />
      <path d="m239 233-3 62" stroke="#B5D2CD" strokeWidth="2" />
      <path d="m193 217 47 11 43-11-3 6-41 12Z" fill="#ECECDD" />
      <g fill="#D6E7D9">
        <circle cx="207" cy="238" r="2" />
        <circle cx="219" cy="252" r="2" />
        <circle cx="207" cy="257" r="1.5" />
        <circle cx="227" cy="273" r="1.5" />
      </g>

      <path
        d="M367 129c-16 1-24 20-24 37l-8 61c5 19 26 29 41 11 13-16 21-88-9-109Z"
        fill="#493932"
      />
      <path
        d="M351 267c-11 14-40 23-63 36-24 13-31 30-13 43 15 11 59 7 79 1l31-14c26 23 53 24 78 13 27-12 45-40 20-53-19-10-57-5-73-8l-18-22Z"
        fill={paint('rose')}
      />
      <path
        d="M399 290c18 11 36 26 45 36m-72-14c-19 17-47 27-80 28"
        stroke="#A77588"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="m333 330 24 7c14 2 27 1 37-7l8 9c-6 9-13 14-24 16l-42-5Z" fill={paint('skin2')} />
      <path d="m421 332 20-1 19 12c8 6 5 14-4 17-13 5-42 1-58-4-8-3-10-10-3-15Z" fill="#F2D17C" />
      <path
        d="m420 332-7 26m20-27-6 29m-33-16c13 8 38 14 66 9"
        stroke="#FFF9E7"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M360 178c-20-1-36 10-42 29l-8 31 31 8 1 30c21 14 50 14 67-1l-3-32 22-6-15-43c-9-11-34-16-53-16Z"
        fill={paint('yellow')}
      />
      <path
        d="m344 241-1 33m57-65 7 32"
        stroke="#C4983E"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity=".7"
      />
      <path d="m365 157-4 25c3 13 20 17 28 3l-3-23Z" fill={paint('skin2')} />
      <path
        d="M348 110c-12 17-7 45 5 58 14 14 36 11 49-7 13-18 17-44 1-57-15-12-42-11-55 6Z"
        fill={paint('skin2')}
      />
      <path
        d="M345 138c-15-9-16-31-6-42-2-12 6-26 14-24 7 2 7 9 13 11 2-11 10-13 16-7l3 9c13-3 21 3 24 14 14 9 12 28 1 37l-7-19c-15 10-32 7-45-3l-4 24Z"
        fill={paint('hair')}
      />
      <path
        d="M351 86c-8 10-8 16-4 23m24-20c0 10 8 14 21 16"
        stroke="#806356"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity=".5"
      />
      <ellipse cx="344" cy="140" rx="7" ry="9" fill="#D29472" />
      <ellipse cx="408" cy="141" rx="6" ry="9" fill="#C58B69" />
      <path d="m356 138 10-3m15 0 10 2" stroke="#5C4134" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="362" cy="143" rx="2.6" ry="3.2" fill="#3E3029" />
      <ellipse cx="386" cy="143" rx="2.6" ry="3.2" fill="#3E3029" />
      <path
        d="m374 143-2 10 5 1m-16 4c7 8 15 8 22-1"
        stroke="#995E46"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M364 159c5 3 10 3 15 0" stroke="#FFF0DD" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="343" cy="150" r="2.5" fill="#E8C87C" />
      <circle cx="408" cy="150" r="2.5" fill="#E8C87C" />

      <path
        d="m319 230-7 25c-2 12 5 21 16 20 15-3 28-29 33-43l-16-10-14 29 5-17Z"
        fill={paint('skin2')}
      />
      <path d="m407 229 11 40 8 36-13 5c-12-15-20-47-24-68Z" fill={paint('skin2')} />
      <path d="m412 299 15-3 3 12-16 4Z" fill="#514C3C" />
      <rect
        x="416"
        y="298"
        width="9"
        height="10"
        rx="2"
        transform="rotate(-13 416 298)"
        fill="#E5C46D"
      />
      <path
        d="m414 306 12-1 10 19c3 7-1 12-6 8l-8-11 4 17c0 6-6 7-8 0l-5-15c-5 7-9 6-8 1Z"
        fill="#C78C6A"
      />

      <path d="m337 190 39 8 39-14-8 65-37 17-32-19Z" fill="#58766B" />
      <path d="m334 187 41 6 36-14-8 65-35 16-32-20Z" fill="#89A697" />
      <path d="m335 185 40 6 36-14 1 6-37 13-40-5Z" fill="#F0EAD6" />
      <path d="m375 195-7 65" stroke="#D1DDCA" strokeWidth="2" />
      <path d="m345 212 15 3m-16 3 11 2" stroke="#C6D6BE" strokeWidth="2" strokeLinecap="round" />
      <path d="M339 230c3-10 11-10 15-5l-5 19c-4 7-10 8-15 2Z" fill="#D5A07D" />
      <path d="m390 236 8-12c3-4 7-2 7 2l-5 17c-3 8-11 7-12 1Z" fill="#CD9672" />
    </svg>
  );
}

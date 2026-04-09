import { useNavigate } from 'react-router-dom'

const licenses = [
  {
    name: 'React',
    version: '19.2.4',
    license: 'MIT',
    copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.',
  },
  {
    name: 'React Router',
    version: '7.13.2',
    license: 'MIT',
    copyright: 'Copyright (c) Remix Software Inc.',
  },
  {
    name: 'Tailwind CSS',
    version: '4.2.2',
    license: 'MIT',
    copyright: 'Copyright (c) Tailwind Labs, Inc.',
  },
  {
    name: 'Vite',
    version: '8.0.1',
    license: 'MIT',
    copyright: 'Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors.',
  },
]

const MIT_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.`

export default function OpenSource() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <div
        className="flex items-center gap-3 px-4 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>오픈소스 라이선스</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        {licenses.map((lib) => (
          <div
            key={lib.name}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">{lib.name}</p>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{lib.license}</span>
            </div>
            <p className="text-[11px] text-gray-400">v{lib.version} · {lib.copyright}</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">{MIT_TEXT}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'

const slides = [
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="15" r="5" stroke="#1f2937" strokeWidth="0.8" />
        <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="#1f2937" opacity="0.2" transform="rotate(-30 5.9 12.9)" />
        <circle cx="18" cy="7" r="3" stroke="#1f2937" strokeWidth="0.72" />
        <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="#1f2937" opacity="0.2" transform="rotate(-30 16.9 5.9)" />
        <circle cx="19.5" cy="17.5" r="1.8" stroke="#1f2937" strokeWidth="0.66" />
        <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="#1f2937" opacity="0.2" transform="rotate(-30 18.8 16.8)" />
      </svg>
    ),
    title: 'Bubblog에 오신 걸\n환영해요',
    desc: '생각과 일상을 버블에 담아\n자유롭게 기록하세요.',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="#1f2937" strokeWidth="0.9" />
        <path d="M7 9h10M7 12h7" stroke="#1f2937" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
    ),
    title: 'Log와 Pop,\n두 가지 글쓰기',
    desc: 'Log는 오래 남기고 싶은 기록,\nPop은 시간이 지나면 사라지는 순간이에요.',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="15" r="5" stroke="#1f2937" strokeWidth="0.8" />
        <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="#1f2937" opacity="0.2" transform="rotate(-30 5.9 12.9)" />
        <circle cx="18" cy="7" r="3" stroke="#1f2937" strokeWidth="0.72" />
        <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="#1f2937" opacity="0.2" transform="rotate(-30 16.9 5.9)" />
        <circle cx="19.5" cy="17.5" r="1.8" stroke="#1f2937" strokeWidth="0.66" />
        <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="#1f2937" opacity="0.2" transform="rotate(-30 18.8 16.8)" />
      </svg>
    ),
    title: '드리프트로\n글을 탐색해요',
    desc: '버블처럼 둥둥 떠다니는 글들을\n자유롭게 탐색하고 팔로우하세요.',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="#1f2937" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    title: '지금 바로\n시작해 보세요',
    desc: '첫 번째 버블을 띄워볼까요?',
  },
]

export default function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(null)
  const isLast = idx === slides.length - 1

  const goTo = (i) => setIdx(Math.max(0, Math.min(slides.length - 1, i)))

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX
    setDragging(true)
    setDragX(0)
  }
  const handleTouchMove = (e) => {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    setDragX(dx)
  }
  const handleTouchEnd = () => {
    const dx = dragX
    setDragging(false)
    setDragX(0)
    startXRef.current = null
    if (dx < -50 && idx < slides.length - 1) goTo(idx + 1)
    else if (dx > 50 && idx > 0) goTo(idx - 1)
  }

  const next = () => {
    if (isLast) onDone()
    else goTo(idx + 1)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between px-8 py-16 overflow-hidden"
      style={{ background: 'white' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 스킵 */}
      <div className="w-full flex justify-end">
        {!isLast && (
          <button onClick={onDone} className="text-sm text-gray-300 hover:text-gray-400 transition-colors">
            건너뛰기
          </button>
        )}
      </div>

      {/* 슬라이드 영역 */}
      <div className="flex flex-col items-center gap-8 flex-1 justify-center w-full">
        <div
          className="flex w-full"
          style={{
            transform: `translateX(calc(${-idx * 100}% + ${dragX}px))`,
            transition: dragging ? 'none' : 'transform 0.35s ease',
            willChange: 'transform',
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-8 flex-shrink-0 w-full"
            >
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.04)' }}
              >
                {slide.icon}
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 className="font-extrabold text-gray-800 leading-snug whitespace-pre-line" style={{ fontSize: '24px' }}>
                  {slide.title}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                  {slide.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* 인디케이터 */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === idx ? '20px' : '6px',
                height: '6px',
                background: i === idx ? '#1f2937' : '#e5e7eb',
              }}
            />
          ))}
        </div>

        {/* 버튼 */}
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-colors"
          style={{ background: '#1f2937', fontSize: '15px' }}
        >
          {isLast ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}

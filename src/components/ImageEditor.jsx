import { useState, useRef, useEffect, useCallback } from 'react'

const FONTS = [
  { id: 'system', label: '기본',   family: '-apple-system, "Apple SD Gothic Neo", sans-serif', weight: 'bold' },
  { id: 'noto',   label: '노토',   family: '"Noto Sans KR", sans-serif',                       weight: 'bold' },
  { id: 'serif',  label: '명조',   family: '"Noto Serif KR", serif',                           weight: 'bold' },
  { id: 'black',  label: '블랙',   family: '"Black Han Sans", sans-serif',                     weight: 'normal' },
  { id: 'dodum',  label: '도담',   family: '"Gowun Dodum", sans-serif',                        weight: 'bold' },
]

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&family=Noto+Serif+KR:wght@700&family=Black+Han+Sans&family=Gowun+Dodum&display=swap'

const FILTERS = [
  { id: 'none',      label: '원본',   css: '' },
  { id: 'grayscale', label: '흑백',   css: 'grayscale(100%)' },
  { id: 'sepia',     label: '세피아', css: 'sepia(80%)' },
  { id: 'warm',      label: '따뜻',   css: 'sepia(40%) saturate(130%) hue-rotate(-10deg)' },
  { id: 'cool',      label: '차가움', css: 'saturate(70%) hue-rotate(30deg) brightness(105%)' },
  { id: 'vivid',     label: '선명',   css: 'saturate(170%) contrast(110%)' },
  { id: 'fade',      label: '페이드', css: 'saturate(50%) brightness(115%)' },
]

function FilterThumb({ filter, img, active, onClick }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !img) return
    const ctx = ref.current.getContext('2d')
    ctx.clearRect(0, 0, 56, 56)
    ctx.filter = filter.css || 'none'
    ctx.drawImage(img, 0, 0, 56, 56)
    ctx.filter = 'none'
  }, [img, filter.css])
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <canvas ref={ref} width={56} height={56}
        className="rounded-xl border-2 transition-colors"
        style={{ borderColor: active ? 'white' : 'transparent' }} />
      <span className="text-xs" style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)' }}>{filter.label}</span>
    </button>
  )
}

// measure text bounding box in canvas units (multiline)
function measureText(t) {
  const tmp = document.createElement('canvas').getContext('2d')
  const weight = t.weight || 'bold'
  const family = t.family || FONTS[0].family
  tmp.font = `${weight} ${t.size}px ${family}`
  const lines = t.text.split('\n')
  const w = Math.max(...lines.map(l => tmp.measureText(l).width))
  const h = lines.length * t.size * 1.3
  return { w, h }
}

const LINE_HEIGHT = 1.3

export default function ImageEditor({ src, onConfirm, onCancel }) {
  const canvasRef  = useRef(null)
  const imageRef   = useRef(null)
  const drawingRef = useRef(false)
  const textDragRef = useRef(null) // { id, offsetX, offsetY }

  const [ready,      setReady]      = useState(false)
  const [rotation,   setRotation]   = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [filterId,   setFilterId]   = useState('none')
  const [activeTool, setActiveTool] = useState(null)

  // crop
  const [cropDrag,    setCropDrag]    = useState(null)
  const [appliedCrop, setAppliedCrop] = useState(null)

  // text
  const [texts,          setTexts]          = useState([])
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [showTextInput,  setShowTextInput]  = useState(false)
  const [textInput,      setTextInput]      = useState('')
  const [textColor,      setTextColor]      = useState('#ffffff')
  const [textSize,       setTextSize]       = useState(20)
  const [textFont,       setTextFont]       = useState('system')
  const textInputRef = useRef(null)

  // brush
  const [strokes,    setStrokes]    = useState([])
  const [liveStroke, setLiveStroke] = useState(null)
  const [brushColor, setBrushColor] = useState('#ff3b30')
  const [brushSize,  setBrushSize]  = useState(6)
  const [isEraser,   setIsEraser]   = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imageRef.current = img; setReady(true) }
    img.src = src
  }, [src])

  // load Korean web fonts
  useEffect(() => {
    if (document.getElementById('image-editor-fonts')) return
    const link = document.createElement('link')
    link.id   = 'image-editor-fonts'
    link.rel  = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }, [])

  // ── canvas coordinate helper ──────────────────────────────────────
  const toCanvas = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  // ── render ────────────────────────────────────────────────────────
  const render = useCallback((overrideLive) => {
    const canvas = canvasRef.current
    const img    = imageRef.current
    if (!canvas || !img) return

    const ctx       = canvas.getContext('2d')
    const rotated90 = rotation % 180 !== 0
    const cw        = rotated90 ? img.naturalHeight : img.naturalWidth
    const ch        = rotated90 ? img.naturalWidth  : img.naturalHeight

    canvas.width  = cw
    canvas.height = ch
    ctx.clearRect(0, 0, cw, ch)

    // image + filter
    const filterCSS = (FILTERS.find(f => f.id === filterId)?.css || '')
    ctx.save()
    ctx.translate(cw / 2, ch / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.filter = `brightness(${brightness}%) ${filterCSS}`.trim() || 'none'
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.filter = 'none'
    ctx.restore()

    // brush strokes — render on separate layer so eraser only removes brush, not image
    const allStrokes = [...strokes, ...(overrideLive ?? (liveStroke ? [liveStroke] : []))]
    if (allStrokes.some(s => s.points.length >= 2)) {
      const layer = document.createElement('canvas')
      layer.width  = cw
      layer.height = ch
      const lctx = layer.getContext('2d')
      allStrokes.forEach(stroke => {
        if (stroke.points.length < 2) return
        lctx.save()
        lctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over'
        lctx.strokeStyle = stroke.eraser ? 'rgba(0,0,0,1)' : stroke.color
        lctx.lineWidth   = stroke.size
        lctx.lineCap     = 'round'
        lctx.lineJoin    = 'round'
        lctx.beginPath()
        lctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        stroke.points.slice(1).forEach(p => lctx.lineTo(p.x, p.y))
        lctx.stroke()
        lctx.restore()
      })
      ctx.drawImage(layer, 0, 0)
    }

    // texts (multiline)
    texts.forEach(t => {
      ctx.save()
      ctx.font         = `${t.weight || 'bold'} ${t.size}px ${t.family || FONTS[0].family}`
      ctx.fillStyle    = t.color
      ctx.textBaseline = 'top'
      ctx.shadowColor  = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur   = 6
      t.text.split('\n').forEach((line, i) => {
        ctx.fillText(line, t.x, t.y + i * t.size * LINE_HEIGHT)
      })
      ctx.restore()
    })

    // selection box around selected text
    if (activeTool === 'text' && selectedTextId != null) {
      const sel = texts.find(t => t.id === selectedTextId)
      if (sel) {
        const { w, h } = measureText(sel)
        const pad = 6
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.lineWidth   = Math.max(2, cw / 400)
        ctx.setLineDash([8, 4])
        ctx.strokeRect(sel.x - pad, sel.y - pad, w + pad * 2, h + pad * 1.5)
        ctx.restore()
      }
    }

    // crop overlay
    const drag = cropDrag
    if (activeTool === 'crop') {
      const region = drag
        ? { x: Math.min(drag.sx, drag.ex), y: Math.min(drag.sy, drag.ey),
            w: Math.abs(drag.ex - drag.sx),  h: Math.abs(drag.ey - drag.sy) }
        : appliedCrop

      if (region && region.w > 0 && region.h > 0) {
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, 0, cw, ch)
        ctx.clearRect(region.x, region.y, region.w, region.h)
        ctx.save()
        ctx.translate(cw / 2, ch / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.filter = `brightness(${brightness}%) ${filterCSS}`.trim() || 'none'
        ctx.globalCompositeOperation = 'destination-over'
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
        ctx.filter = 'none'
        ctx.restore()
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = 'white'
        ctx.lineWidth   = Math.max(1, cw / 300)
        ctx.setLineDash([8, 4])
        ctx.strokeRect(region.x, region.y, region.w, region.h)
        ctx.restore()
      }
    }
  }, [rotation, brightness, filterId, strokes, liveStroke, texts, activeTool, cropDrag, appliedCrop, selectedTextId])

  useEffect(() => { if (ready) render() }, [ready, render])

  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus()
      // place cursor at end
      const range = document.createRange()
      range.selectNodeContents(textInputRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }, [showTextInput])

  // ── pointer routing ───────────────────────────────────────────────
  const onDown = (e) => {
    e.preventDefault()
    const pos = toCanvas(e)

    if (activeTool === 'crop') {
      setCropDrag({ sx: pos.x, sy: pos.y, ex: pos.x, ey: pos.y })
    } else if (activeTool === 'brush') {
      drawingRef.current = true
      setLiveStroke({ points: [pos], color: brushColor, size: brushSize, eraser: isEraser })
    } else if (activeTool === 'text') {
      // check if tapping an existing text
      let hit = null
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i]
        const { w, h } = measureText(t)
        const pad = 8
        if (pos.x >= t.x - pad && pos.x <= t.x + w + pad &&
            pos.y >= t.y - pad && pos.y <= t.y + h + pad) {
          hit = t
          break
        }
      }
      if (hit) {
        setSelectedTextId(hit.id)
        textDragRef.current = { id: hit.id, offsetX: pos.x - hit.x, offsetY: pos.y - hit.y }
      } else {
        setSelectedTextId(null)
        textDragRef.current = null
      }
    }
  }

  const onMove = (e) => {
    e.preventDefault()
    const pos = toCanvas(e)
    if (activeTool === 'crop' && cropDrag) {
      setCropDrag(prev => ({ ...prev, ex: pos.x, ey: pos.y }))
    } else if (activeTool === 'brush' && drawingRef.current) {
      setLiveStroke(prev => prev ? { ...prev, points: [...prev.points, pos] } : null)
    } else if (activeTool === 'text' && textDragRef.current) {
      const { id, offsetX, offsetY } = textDragRef.current
      setTexts(prev => prev.map(t =>
        t.id === id ? { ...t, x: pos.x - offsetX, y: pos.y - offsetY } : t
      ))
    }
  }

  const onUp = (e) => {
    if (activeTool === 'crop' && cropDrag) {
      const rx = Math.min(cropDrag.sx, cropDrag.ex)
      const ry = Math.min(cropDrag.sy, cropDrag.ey)
      const rw = Math.abs(cropDrag.ex - cropDrag.sx)
      const rh = Math.abs(cropDrag.ey - cropDrag.sy)
      if (rw > 10 && rh > 10) setAppliedCrop({ x: rx, y: ry, w: rw, h: rh })
      setCropDrag(null)
    } else if (activeTool === 'brush' && drawingRef.current) {
      drawingRef.current = false
      if (liveStroke?.points.length > 1) {
        setStrokes(prev => [...prev, liveStroke])
      }
      setLiveStroke(null)
    } else if (activeTool === 'text') {
      textDragRef.current = null
    }
  }

  // ── text confirm ──────────────────────────────────────────────────
  const confirmText = () => {
    if (!textInput.trim()) return
    const canvas = canvasRef.current
    if (!canvas) return
    // scale from screen px → canvas px so visual size matches the overlay preview
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    const canvasSize = Math.round(textSize * scale)
    const font = FONTS.find(f => f.id === textFont) || FONTS[0]
    const { w, h } = measureText({ text: textInput.trim(), size: canvasSize, family: font.family, weight: font.weight })
    setTexts(prev => [...prev, {
      id: Date.now(),
      text:   textInput.trim(),
      x:      canvas.width  / 2 - w / 2,
      y:      canvas.height / 2 - h / 2,
      color:  textColor,
      size:   canvasSize,
      family: font.family,
      weight: font.weight,
    }])
    setShowTextInput(false)
    setTextInput('')
  }

  // update selected text property
  const updateSelected = (patch) => {
    setTexts(prev => prev.map(t => t.id === selectedTextId ? { ...t, ...patch } : t))
  }

  const deleteSelected = () => {
    setTexts(prev => prev.filter(t => t.id !== selectedTextId))
    setSelectedTextId(null)
  }

  // ── export ────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const img = imageRef.current
    if (!img) return

    const rotated90 = rotation % 180 !== 0
    const cw = rotated90 ? img.naturalHeight : img.naturalWidth
    const ch = rotated90 ? img.naturalWidth  : img.naturalHeight
    const crop = appliedCrop || { x: 0, y: 0, w: cw, h: ch }

    const exp = document.createElement('canvas')
    exp.width  = crop.w
    exp.height = crop.h
    const ctx = exp.getContext('2d')

    ctx.save()
    ctx.translate(-crop.x, -crop.y)

    const filterCSS = FILTERS.find(f => f.id === filterId)?.css || ''
    ctx.save()
    ctx.translate(cw / 2, ch / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.filter = `brightness(${brightness}%) ${filterCSS}`.trim() || 'none'
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.filter = 'none'
    ctx.restore()

    if (strokes.some(s => s.points.length >= 2)) {
      const layer = document.createElement('canvas')
      layer.width  = crop.w
      layer.height = crop.h
      const lctx = layer.getContext('2d')
      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return
        lctx.save()
        lctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over'
        lctx.strokeStyle = stroke.eraser ? 'rgba(0,0,0,1)' : stroke.color
        lctx.lineWidth   = stroke.size
        lctx.lineCap     = 'round'
        lctx.lineJoin    = 'round'
        lctx.beginPath()
        lctx.moveTo(stroke.points[0].x - crop.x, stroke.points[0].y - crop.y)
        stroke.points.slice(1).forEach(p => lctx.lineTo(p.x - crop.x, p.y - crop.y))
        lctx.stroke()
        lctx.restore()
      })
      ctx.drawImage(layer, 0, 0)
    }

    texts.forEach(t => {
      ctx.save()
      ctx.font         = `${t.weight || 'bold'} ${t.size}px ${t.family || FONTS[0].family}`
      ctx.fillStyle    = t.color
      ctx.textBaseline = 'top'
      ctx.shadowColor  = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur   = 6
      t.text.split('\n').forEach((line, i) => {
        ctx.fillText(line, t.x, t.y + i * t.size * LINE_HEIGHT)
      })
      ctx.restore()
    })

    ctx.restore()

    const MAX = 1200
    let final = exp
    if (crop.w > MAX || crop.h > MAX) {
      const s = MAX / Math.max(crop.w, crop.h)
      const c = document.createElement('canvas')
      c.width  = crop.w * s
      c.height = crop.h * s
      c.getContext('2d').drawImage(exp, 0, 0, c.width, c.height)
      final = c
    }
    onConfirm(final.toDataURL('image/jpeg', 0.85))
  }

  // ── tool definitions ──────────────────────────────────────────────
  const tools = [
    {
      id: 'crop', label: '자르기',
      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><path d="M5 1v14h14M1 5h14v14" strokeLinecap="round"/></svg>,
    },
    {
      id: 'rotate', label: '회전',
      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><path d="M4 8A7 7 0 1 1 5.6 14" strokeLinecap="round"/><path d="M4 4v4h4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      id: 'brightness', label: '밝기',
      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" strokeLinecap="round"/></svg>,
    },
    {
      id: 'filter', label: '필터',
      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><circle cx="7" cy="10" r="4"/><circle cx="13" cy="10" r="4"/></svg>,
    },
    {
      id: 'text', label: '텍스트',
      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><path d="M4 5h12M10 5v10M7 15h6" strokeLinecap="round"/></svg>,
    },
    {
      id: 'brush', label: '브러시',
      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><path d="M3 17c2-2 3-4 5-4s3 2 3 3-1 2-2 2c-2 0-2-2-1-3" strokeLinecap="round"/><path d="M6 13L15 4l1 1-9 9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
  ]

  const selectedText = texts.find(t => t.id === selectedTextId)

  // canvas px ↔ screen px conversion
  const getScale = () => {
    const c = canvasRef.current
    if (!c) return 1
    const rect = c.getBoundingClientRect()
    return rect.width > 0 ? c.width / rect.width : 1
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#111' }}>
      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
        <button onClick={onCancel} className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>취소</button>
        <span className="text-sm font-semibold text-white">편집</span>
        <button onClick={handleConfirm} className="text-sm font-semibold text-white">완료</button>
      </div>

      {/* canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-3 py-2 min-h-0">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded-xl touch-none"
          style={{ objectFit: 'contain', cursor: activeTool === 'brush' ? 'crosshair' : activeTool === 'text' ? 'default' : activeTool === 'crop' ? 'crosshair' : 'default' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>

      {/* tool-specific controls */}
      <div className="flex-shrink-0">
        {activeTool === 'brightness' && (
          <div className="px-6 py-3">
            <input type="range" min="30" max="220" value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              className="w-full accent-white" />
            <p className="text-center text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{brightness}%</p>
          </div>
        )}

        {activeTool === 'filter' && (
          <div className="flex gap-3 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <FilterThumb key={f.id} filter={f} img={imageRef.current}
                active={filterId === f.id} onClick={() => setFilterId(f.id)} />
            ))}
          </div>
        )}

        {activeTool === 'brush' && (
          <div className="flex flex-col gap-2 px-5 py-3">
            <div className="flex items-center gap-3">
              {/* color swatch — hidden when eraser active */}
              <div className="relative w-8 h-8 flex-shrink-0" style={{ opacity: isEraser ? 0.3 : 1 }}>
                <div className="w-8 h-8 rounded-full border-2 border-white/30" style={{ background: brushColor }} />
                <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)}
                  disabled={isEraser}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full" />
              </div>
              {/* size slider */}
              <input type="range" min="2" max="48" value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="flex-1 accent-white" />
              <div className="rounded-full flex-shrink-0 border border-white/30"
                style={{ width: Math.min(brushSize * 1.5, 32) + 'px', height: Math.min(brushSize * 1.5, 32) + 'px', background: isEraser ? 'rgba(255,255,255,0.15)' : brushColor }} />
            </div>
            <div className="flex items-center gap-2">
              {/* eraser toggle */}
              <button
                onClick={() => setIsEraser(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{ background: isEraser ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', color: isEraser ? 'white' : 'rgba(255,255,255,0.5)' }}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                  <path d="M3 16l4-4L15 4l1 1-8 8-4 4H3z" strokeLinejoin="round"/>
                  <path d="M11 6l3 3" strokeLinecap="round"/>
                </svg>
                지우개
              </button>
              {/* undo */}
              <button
                onClick={() => setStrokes(prev => prev.slice(0, -1))}
                disabled={strokes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', color: strokes.length === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)' }}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                  <path d="M4 8A7 7 0 1 1 5.6 14" strokeLinecap="round"/>
                  <path d="M4 4v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                되돌리기
              </button>
            </div>
          </div>
        )}

        {/* text: selected — move (drag on canvas) + resize + color + delete */}
        {activeTool === 'text' && selectedText && (
          <div className="px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {/* color */}
              <div className="relative w-8 h-8 flex-shrink-0">
                <div className="w-8 h-8 rounded-full border-2 border-white/30" style={{ background: selectedText.color }} />
                <input type="color" value={selectedText.color}
                  onChange={e => updateSelected({ color: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full" />
              </div>
              {/* size slider — values in screen px, stored in canvas px */}
              <input type="range" min="10" max="50"
                value={Math.round(selectedText.size / getScale())}
                onChange={e => updateSelected({ size: Math.round(Number(e.target.value) * getScale()) })}
                className="flex-1 accent-white" />
              <span className="text-xs w-7 text-center flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {Math.round(selectedText.size / getScale())}
              </span>
              {/* delete */}
              <button onClick={deleteSelected} className="flex-shrink-0 p-1">
                <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,100,100,0.85)" strokeWidth="1.6" className="w-5 h-5">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              드래그로 위치 조정
            </p>
          </div>
        )}

        {/* text: hint + add button */}
        {activeTool === 'text' && !selectedText && (
          <div className="flex items-center justify-center gap-3 py-3">
            <button
              onClick={() => { setShowTextInput(true); setTextInput('') }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
              </svg>
              텍스트 추가
            </button>
            {texts.length > 0 && (
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>탭해서 선택</span>
            )}
          </div>
        )}

        {activeTool === 'crop' && (
          <div className="flex items-center justify-between px-5 py-3">
            <button onClick={() => setAppliedCrop(null)}
              className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>초기화</button>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>드래그로 영역 선택</p>
          </div>
        )}
      </div>

      {/* ── Instagram-style text input overlay ── */}
      {showTextInput && (
        <div className="fixed inset-0 z-[110] flex flex-col" style={{ background: 'rgba(0,0,0,0.82)' }}>
          {/* top bar */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
            <button
              onClick={() => { setShowTextInput(false); setTextInput('') }}
              className="text-sm"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >취소</button>
            <button
              onClick={confirmText}
              className="text-sm font-bold text-white px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >완료</button>
          </div>

          {/* centered editable area */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="relative w-full flex items-center justify-center">
              {!textInput && (
                <span
                  className="absolute pointer-events-none select-none text-center w-full"
                  style={{ color: 'rgba(255,255,255,0.25)', fontSize: `${textSize}px`, fontWeight: (FONTS.find(f => f.id === textFont) || FONTS[0]).weight, fontFamily: (FONTS.find(f => f.id === textFont) || FONTS[0]).family }}
                >텍스트 입력...</span>
              )}
              <div
                ref={textInputRef}
                contentEditable
                suppressContentEditableWarning
                onInput={e => setTextInput(e.currentTarget.innerText)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); confirmText() } }}
                className="outline-none text-center w-full"
                style={{
                  color: textColor,
                  fontSize: `${textSize}px`,
                  fontWeight: (FONTS.find(f => f.id === textFont) || FONTS[0]).weight,
                  fontFamily: (FONTS.find(f => f.id === textFont) || FONTS[0]).family,
                  textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  minHeight: `${textSize * 1.4}px`,
                }}
              />
            </div>
          </div>

          {/* bottom controls */}
          <div className="flex-shrink-0 px-5 pb-10 flex flex-col gap-4">
            {/* font picker */}
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setTextFont(f.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <span
                    className="px-3 py-1.5 rounded-xl text-base transition-colors"
                    style={{
                      fontFamily: f.family,
                      fontWeight: f.weight,
                      color: 'white',
                      background: textFont === f.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    }}
                  >가</span>
                  <span className="text-xs" style={{ color: textFont === f.id ? 'white' : 'rgba(255,255,255,0.45)' }}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
            {/* color palette */}
            <div className="flex items-center justify-center gap-2">
              {['#ffffff','#000000','#ffcc00','#ff9500','#ff3b30','#ff2d55','#af52de','#007aff','#34c759'].map(c => (
                <button
                  key={c}
                  onClick={() => setTextColor(c)}
                  className="rounded-full border-2 transition-all flex-shrink-0"
                  style={{
                    width:  textColor === c ? '28px' : '22px',
                    height: textColor === c ? '28px' : '22px',
                    background: c,
                    borderColor: textColor === c ? 'white' : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </div>
            {/* size slider */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>A</span>
              <input type="range" min="10" max="50" value={textSize}
                onChange={e => setTextSize(Number(e.target.value))}
                className="flex-1 accent-white" />
              <span className="text-xl font-bold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>A</span>
            </div>
          </div>
        </div>
      )}

      {/* toolbar */}
      <div className="flex items-center justify-around px-4 pt-2 pb-8 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {tools.map(tool => {
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === 'rotate') {
                  setRotation(r => (r + 90) % 360)
                  return
                }
                if (tool.id === 'text') {
                  setActiveTool('text')
                  setShowTextInput(true)
                  setTextInput('')
                  setSelectedTextId(null)
                  return
                }
                setActiveTool(prev => prev === tool.id ? null : tool.id)
                setSelectedTextId(null)
              }}
              className="flex flex-col items-center gap-1"
              style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.45)' }}
            >
              {tool.icon}
              <span className="text-xs">{tool.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

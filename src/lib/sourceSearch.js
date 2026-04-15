function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, '').trim()
}

export async function searchMusic(query) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=8&country=KR`
    )
    const json = await res.json()
    return (json.results || []).map((item) => ({
      title: item.trackName || '',
      creator: item.artistName || '',
      cover: item.artworkUrl100 || null,
      year: item.releaseDate ? item.releaseDate.slice(0, 4) : '',
    }))
  } catch {
    return []
  }
}

export async function searchBook(query) {
  try {
    const res = await fetch(`/api/naver-book?q=${encodeURIComponent(query)}`)
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: stripHtml(item.author),
      cover: item.image || null,
      year: item.pubdate ? String(item.pubdate).slice(0, 4) : '',
    }))
  } catch {
    return []
  }
}

export async function searchLocal(query) {
  try {
    const res = await fetch(`/api/naver-local?q=${encodeURIComponent(query)}`)
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: item.category || '',
      cover: null,
      year: item.roadAddress || item.address || '',
    }))
  } catch {
    return []
  }
}

export async function searchDict(query) {
  try {
    const res = await fetch(`/api/naver-dict?q=${encodeURIComponent(query)}`)
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: stripHtml(item.description).slice(0, 80),
      cover: null,
      year: '',
    }))
  } catch {
    return []
  }
}

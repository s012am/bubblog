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

export async function searchMovie(query) {
  try {
    const res = await fetch(`/api/naver-movie?q=${encodeURIComponent(query)}`)
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: stripHtml(item.director).replace(/\|/g, ', ').replace(/,\s*$/, '').trim(),
      cover: item.image || null,
      year: item.pubdate ? String(item.pubdate).slice(0, 4) : '',
    }))
  } catch {
    return []
  }
}

export async function searchDrama(query) {
  return searchMovie(query)
}

export async function searchAnime(query) {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`
    )
    const json = await res.json()
    return (json.data || []).map((item) => ({
      title: item.titles?.find(t => t.type === 'Korean')?.title || item.title || '',
      creator: item.studios?.[0]?.name || '',
      cover: item.images?.jpg?.image_url || null,
      year: item.year ? String(item.year) : '',
    }))
  } catch {
    return []
  }
}

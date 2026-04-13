const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY

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
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,author_name,cover_i,first_publish_year`
    )
    const json = await res.json()
    return (json.docs || []).map((item) => ({
      title: item.title || '',
      creator: (item.author_name || []).join(', ') || '',
      cover: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
        : null,
      year: item.first_publish_year ? String(item.first_publish_year) : '',
    }))
  } catch {
    return []
  }
}

export async function searchMovie(query) {
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=${OMDB_KEY}`
    )
    const json = await res.json()
    return (json.Search || []).map((item) => ({
      title: item.Title || '',
      creator: '',
      cover: item.Poster && item.Poster !== 'N/A' ? item.Poster : null,
      year: item.Year || '',
    }))
  } catch {
    return []
  }
}

export async function searchDrama(query) {
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=series&apikey=${OMDB_KEY}`
    )
    const json = await res.json()
    return (json.Search || []).map((item) => ({
      title: item.Title || '',
      creator: '',
      cover: item.Poster && item.Poster !== 'N/A' ? item.Poster : null,
      year: item.Year || '',
    }))
  } catch {
    return []
  }
}

export async function searchAnime(query) {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`
    )
    const json = await res.json()
    return (json.data || []).map((item) => ({
      title: item.title || '',
      creator: item.studios?.[0]?.name || '',
      cover: item.images?.jpg?.image_url || null,
      year: item.year ? String(item.year) : '',
    }))
  } catch {
    return []
  }
}

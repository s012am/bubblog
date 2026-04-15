const NAVER_ID = import.meta.env.VITE_NAVER_CLIENT_ID
const NAVER_SECRET = import.meta.env.VITE_NAVER_CLIENT_SECRET

const naverHeaders = {
  'X-Naver-Client-Id': NAVER_ID,
  'X-Naver-Client-Secret': NAVER_SECRET,
}

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
    const res = await fetch(
      `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=8`,
      { headers: naverHeaders }
    )
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: stripHtml(item.author),
      cover: item.image || null,
      year: item.pubdate ? item.pubdate.slice(0, 4) : '',
    }))
  } catch {
    return []
  }
}

export async function searchMovie(query) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(query)}&display=8`,
      { headers: naverHeaders }
    )
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: stripHtml(item.director).replace(/\|/g, ', ').replace(/,$/, '').trim(),
      cover: item.image || null,
      year: item.pubdate ? String(item.pubdate).slice(0, 4) : '',
    }))
  } catch {
    return []
  }
}

export async function searchDrama(query) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(query)}&display=8`,
      { headers: naverHeaders }
    )
    const json = await res.json()
    return (json.items || []).map((item) => ({
      title: stripHtml(item.title),
      creator: stripHtml(item.director).replace(/\|/g, ', ').replace(/,$/, '').trim(),
      cover: item.image || null,
      year: item.pubdate ? String(item.pubdate).slice(0, 4) : '',
    }))
  } catch {
    return []
  }
}

export async function searchAnime(query) {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query ($search: String) {
          Page(page: 1, perPage: 8) {
            media(search: $search, type: ANIME) {
              title { native romaji }
              coverImage { medium }
              startDate { year }
              studios(isMain: true) { nodes { name } }
            }
          }
        }`,
        variables: { search: query },
      }),
    })
    const json = await res.json()
    return (json.data?.Page?.media || []).map((item) => ({
      title: item.title?.native || item.title?.romaji || '',
      creator: item.studios?.nodes?.[0]?.name || '',
      cover: item.coverImage?.medium || null,
      year: item.startDate?.year ? String(item.startDate.year) : '',
    }))
  } catch {
    return []
  }
}

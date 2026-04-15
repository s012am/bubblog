export default async function handler(req, res) {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'query required' })

  const response = await fetch(
    `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(q)}&display=8`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.VITE_NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.VITE_NAVER_CLIENT_SECRET,
      },
    }
  )
  const data = await response.json()
  res.status(200).json(data)
}

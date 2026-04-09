import { useNavigate } from 'react-router-dom'

const sections = [
  {
    title: '서비스 이용',
    content: `Bubblog는 누구나 자유롭게 글을 작성하고 공유할 수 있는 버블 블로그 서비스입니다. 만 14세 이상부터 이용할 수 있습니다.`,
  },
  {
    title: '계정',
    content: `· 하나의 이메일로 하나의 계정만 생성할 수 있습니다.\n· 계정 정보는 본인이 관리할 책임이 있습니다.\n· 타인의 계정을 무단으로 사용하는 것은 금지됩니다.`,
  },
  {
    title: '금지 행위',
    content: `다음 행위는 금지됩니다.\n\n· 타인을 비방하거나 명예를 훼손하는 콘텐츠 게시\n· 저작권을 침해하는 콘텐츠 게시\n· 스팸, 광고, 악성코드 배포\n· 서비스 운영을 방해하는 행위\n· 타인의 개인정보 무단 수집`,
  },
  {
    title: '콘텐츠',
    content: `이용자가 작성한 글의 저작권은 이용자에게 있습니다. 단, Bubblog는 서비스 운영 및 홍보 목적으로 콘텐츠를 활용할 수 있습니다.\n\n금지 행위에 해당하는 콘텐츠는 사전 통보 없이 삭제될 수 있습니다.`,
  },
  {
    title: 'Pop 기능',
    content: `Pop 글은 설정한 기간이 지나면 자동으로 삭제됩니다. 삭제된 글은 복구되지 않으니 주의하세요.`,
  },
  {
    title: '서비스 변경 및 중단',
    content: `Bubblog는 서비스 내용을 변경하거나 중단할 수 있습니다. 중요한 변경 사항은 사전에 공지합니다.`,
  },
  {
    title: '면책',
    content: `Bubblog는 이용자가 작성한 콘텐츠로 인해 발생하는 분쟁에 대해 책임지지 않습니다. 서비스 장애로 인한 손해에 대해서도 고의 또는 중대한 과실이 없는 한 책임지지 않습니다.`,
  },
  {
    title: '문의',
    content: `이용약관에 관한 문의는 아래로 연락해 주세요.\n\n· 이메일: support@bubblog.io`,
  },
]

export default function Terms() {
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
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>이용약관</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        <p className="text-xs text-gray-400">시행일: 2025년 1월 1일</p>
        {sections.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
          >
            <p className="text-sm font-bold text-gray-800">{s.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

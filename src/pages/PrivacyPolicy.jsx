import { useNavigate } from 'react-router-dom'

const sections = [
  {
    title: '수집하는 개인정보',
    content: `Bubblog는 서비스 제공을 위해 다음과 같은 정보를 수집합니다.\n\n· 필수: 이메일 주소, 닉네임\n· 선택: 프로필 사진, 자기소개\n· 자동 수집: 서비스 이용 기록, 기기 정보`,
  },
  {
    title: '개인정보 이용 목적',
    content: `수집한 개인정보는 다음 목적으로만 이용됩니다.\n\n· 회원 식별 및 서비스 제공\n· 공지사항 및 서비스 변경 안내\n· 서비스 품질 개선`,
  },
  {
    title: '개인정보 보유 및 파기',
    content: `회원 탈퇴 시 개인정보는 즉시 파기됩니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다.`,
  },
  {
    title: '개인정보 제3자 제공',
    content: `Bubblog는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 법령에 의한 경우는 예외로 합니다.`,
  },
  {
    title: '이용자의 권리',
    content: `이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 계정 설정에서 직접 수정하거나 고객센터를 통해 요청할 수 있습니다.`,
  },
  {
    title: '문의',
    content: `개인정보 처리에 관한 문의는 아래로 연락해 주세요.\n\n· 이메일: privacy@bubblog.io`,
  },
]

export default function PrivacyPolicy() {
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
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>개인정보 처리방침</h1>
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

import React from 'react'

export default function VerificationResult({ data }) {
  const resolved = data.resolved === true || data.resolved === 'true'
  const score = data.similarity_score
  const scorePercent = (score * 100).toFixed(0)

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header stripe */}
      <div className={`px-5 py-4 flex items-center justify-between ${
        resolved
          ? 'bg-gradient-to-r from-green-600 to-green-500'
          : 'bg-gradient-to-r from-red-600 to-red-500'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${resolved ? 'bg-green-200' : 'bg-red-200 animate-pulse'}`}></div>
          <span className="font-semibold text-white text-sm">
            {resolved ? 'Yoxlama Tamamlandı — Problem Həll Edilib' : 'Yoxlama Tamamlandı — Problem Həll Edilməyib'}
          </span>
        </div>
        <span className="text-xs text-white/70 font-mono">{data.request_id}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Verdict banner */}
        <div className={`rounded-xl p-4 border ${
          resolved
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              resolved ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {resolved ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-semibold text-sm ${resolved ? 'text-green-800' : 'text-red-800'}`}>
                {data.message_az}
              </p>
              {data.mismatch_reason && (
                <p className="text-sm text-red-600 mt-1">{data.mismatch_reason}</p>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Similarity score */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Oxşarlıq Faizi</p>
            <p className={`text-2xl font-bold ${
              score >= 0.95 ? 'text-red-700' : score >= 0.75 ? 'text-green-700' : score >= 0.5 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {scorePercent}%
            </p>
            {score >= 0.95 && (
              <p className="text-xs text-red-500 mt-1">Şəkillər demək olar ki, eynidir — dəyişiklik yoxdur</p>
            )}
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 0.95 ? 'bg-red-500' : score >= 0.75 ? 'bg-green-500' : score >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Həddi: 75%</p>
          </div>

          {/* Alert status */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Xəbərdarlıq</p>
            {data.alert_triggered ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-sm font-semibold text-red-700">Xəbərdarlıq yaradıldı</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-sm font-semibold text-green-700">Xəbərdarlıq yoxdur</span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {data.alert_triggered
                ? 'İdarəetmə panelinə xəbərdarlıq göndərildi.'
                : resolved
                  ? 'Problem uğurla həll edilib.'
                  : 'Xəbərdarlıq tələb olunmur.'}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-3 rounded-xl p-3 border ${
          resolved
            ? 'bg-green-50 border-green-100'
            : 'bg-amber-50 border-amber-100'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            resolved ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            {resolved ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className={`text-sm ${resolved ? 'text-green-800' : 'text-amber-800'}`}>
            {resolved
              ? 'Müraciət bağlandı. Nəticə uğurla təsdiq edildi.'
              : 'Müraciət açıq qalır. Əməkdaşlara xəbərdarlıq göndərildi.'}
          </p>
        </div>
      </div>
    </div>
  )
}

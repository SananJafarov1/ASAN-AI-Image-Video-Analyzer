import React from 'react'

const CATEGORY_CONFIG = {
  kommunal:      { label: 'Kommunal xidmətlər', icon: '🔧', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  yol_neqliyyat: { label: 'Yol və nəqliyyat',   icon: '🚧', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  infrastruktur: { label: 'İnfrastruktur',       icon: '🏗️', color: 'bg-blue-50 text-blue-700 border-blue-200'     },
  ekoloji:       { label: 'Ekoloji problemlər',  icon: '🌿', color: 'bg-green-50 text-green-700 border-green-200'   },
  diger:         { label: 'Digər',               icon: '📋', color: 'bg-slate-50 text-slate-700 border-slate-200'   },
}

const PRIORITY_CONFIG = {
  tecili: {
    label: 'Təcili',
    bg: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    bar: 'w-full bg-red-500',
    dot: 'bg-red-500 animate-pulse',
  },
  orta: {
    label: 'Orta',
    bg: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'w-2/3 bg-amber-500',
    dot: 'bg-amber-500',
  },
  asagi: {
    label: 'Aşağı',
    bg: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    bar: 'w-1/3 bg-green-500',
    dot: 'bg-green-500',
  },
}

export default function AnalysisResult({ data }) {
  const hasProblem = data.has_problem !== false
  const priority = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.asagi
  const category = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.diger

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header stripe */}
      <div className={`px-5 py-4 flex items-center justify-between ${hasProblem ? 'bg-gradient-to-r from-[#003087] to-[#0050b3]' : 'bg-gradient-to-r from-green-600 to-green-500'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasProblem ? 'bg-green-400' : 'bg-white'}`}></div>
          <span className="font-semibold text-white text-sm">
            {hasProblem ? 'Analiz Tamamlandı' : 'Problem Aşkar Edilmədi'}
          </span>
        </div>
        <span className="text-xs text-blue-200 font-mono">{data.request_id}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Description */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Avtomatik Açıqlama
          </p>
          <p className="text-slate-800 leading-relaxed text-sm">{data.description_az}</p>
        </div>

        {/* Category + Priority + Confidence */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Kateqoriya</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${category.color}`}>
              <span>{category.icon}</span>
              {category.label}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Prioritet</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${priority.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                {priority.label}
              </span>
            </div>
            <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${priority.bar}`} />
            </div>
          </div>

          {data.confidence != null && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Etibar</p>
              <p className="text-xl font-bold text-slate-800">{(data.confidence * 100).toFixed(0)}%</p>
              <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(data.confidence * 100).toFixed(0)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Detected objects */}
        {data.detected_objects?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Aşkar Edilən Obyektlər
            </p>
            <div className="flex flex-wrap gap-2">
              {data.detected_objects.map((obj) => (
                <span
                  key={obj}
                  className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full border border-slate-200 font-medium"
                >
                  {obj}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        {data.location_hint && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-blue-800">{data.location_hint}</span>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center gap-3 rounded-xl p-3 ${hasProblem ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasProblem ? 'bg-green-100' : 'bg-slate-200'}`}>
            <svg className={`w-4 h-4 ${hasProblem ? 'text-green-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className={`text-sm ${hasProblem ? 'text-green-800' : 'text-slate-600'}`}>
            {hasProblem
              ? 'Müraciətiniz uğurla qeydə alındı və müvafiq qurumlara yönləndirildi.'
              : 'Şəkildə heç bir problem aşkar edilmədi. Əgər problem olduğunu düşünürsünüzsə, başqa bir şəkil yükləyin.'}
          </p>
        </div>
      </div>
    </div>
  )
}

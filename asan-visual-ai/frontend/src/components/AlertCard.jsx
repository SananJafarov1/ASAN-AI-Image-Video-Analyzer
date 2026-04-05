import React, { useState } from 'react'

const SEVERITY_CONFIG = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    label: 'Yüksək',
    dot: 'bg-red-500 animate-pulse',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Orta',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600',
    label: 'Aşağı',
    dot: 'bg-slate-400',
  },
}

const ALERT_TYPE_CONFIG = {
  low_similarity:       { label: 'Aşağı Oxşarlıq',      icon: '🔍' },
  damage_still_detected:{ label: 'Zədə Hələ Mövcuddur',  icon: '⚠️' },
  wrong_location:       { label: 'Yanlış Yer',           icon: '📍' },
  no_result_uploaded:   { label: 'Nəticə Yüklənməyib',   icon: '📂' },
}

export default function AlertCard({ alert, onAcknowledge }) {
  const [confirming, setConfirming] = useState(false)
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium
  const typeCfg = ALERT_TYPE_CONFIG[alert.alert_type] || { label: alert.alert_type, icon: '🔔' }
  const date = new Date(alert.created_at).toLocaleString('az-AZ')

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 transition-all`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`${cfg.iconBg} ${cfg.iconColor} rounded-xl p-2.5 shrink-0 text-lg leading-none`}>
          {typeCfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
              {cfg.label}
            </span>
            <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
              {typeCfg.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{alert.request_id}</span>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-700 leading-relaxed">{alert.message_az}</p>

          {/* Date */}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {date}
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {confirming ? (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
              >
                Təsdiq
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-white border border-slate-200 transition"
              >
                Ləğv
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs font-medium text-slate-500 hover:text-[#003087] border border-slate-300 hover:border-[#003087] bg-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Bağla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

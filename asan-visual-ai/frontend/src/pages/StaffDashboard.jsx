import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AlertCard from '../components/AlertCard'

const API_KEY = import.meta.env.VITE_INSTITUTION_API_KEY || 'institution-secret-key'

const SEVERITY_FILTERS = ['Hamısı', 'high', 'medium', 'low']
const SEVERITY_LABELS = { high: 'Yüksək', medium: 'Orta', low: 'Aşağı' }

export default function StaffDashboard() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Hamısı')
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('/api/alerts', {
        headers: { 'x-api-key': API_KEY },
      })
      setAlerts(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.response?.data?.detail || 'Xəta baş verdi.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.patch(`/api/alerts/${alertId}/acknowledge`, null, {
        headers: { 'x-api-key': API_KEY },
      })
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const counts = {
    total: alerts.length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  }

  const filtered = filter === 'Hamısı' ? alerts : alerts.filter((a) => a.severity === filter)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">İdarəetmə Paneli</h1>
          <p className="text-slate-500 text-sm mt-1">
            {lastUpdated
              ? `Son yenilənmə: ${lastUpdated.toLocaleTimeString('az-AZ')}`
              : 'Yüklənir…'}
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 text-sm font-medium text-[#003087] border border-[#003087] px-4 py-2 rounded-lg hover:bg-blue-50 transition"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Yenilə
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Ümumi Xəbərdarlıq"
          value={counts.total}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          label="Yüksək Prioritet"
          value={counts.high}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="red"
        />
        <StatCard
          label="Orta Prioritet"
          value={counts.medium}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
        <StatCard
          label="Aşağı Prioritet"
          value={counts.low}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {SEVERITY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-[#003087] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-[#003087] hover:text-[#003087]'
            }`}
          >
            {f === 'Hamısı' ? `Hamısı (${counts.total})` : `${SEVERITY_LABELS[f]} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !alerts.length && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">Aktiv xəbərdarlıq yoxdur</p>
          <p className="text-slate-400 text-sm mt-1">Bütün müraciətlər nəzərdən keçirilib.</p>
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue:  { bg: 'bg-blue-50',  icon: 'text-blue-600',  value: 'text-blue-700'  },
    red:   { bg: 'bg-red-50',   icon: 'text-red-600',   value: 'text-red-700'   },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-700' },
  }
  const c = colors[color]
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
      <div className={`${c.bg} ${c.icon} rounded-xl p-2.5 shrink-0`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

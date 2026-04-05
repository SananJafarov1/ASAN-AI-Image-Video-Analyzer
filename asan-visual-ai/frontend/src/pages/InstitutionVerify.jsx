import React, { useState, useRef } from 'react'
import axios from 'axios'
import VerificationResult from '../components/VerificationResult'

const API_KEY = import.meta.env.VITE_INSTITUTION_API_KEY || 'institution-secret-key'

export default function InstitutionVerify() {
  const [requestId, setRequestId] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [requestInfo, setRequestInfo] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const fileInput = useRef()

  const lookupRequest = async () => {
    if (!requestId.trim()) return
    setLookupLoading(true)
    setError(null)
    setRequestInfo(null)
    setResult(null)
    try {
      const res = await axios.get(`/api/requests/${requestId.trim()}`)
      setRequestInfo(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Bu ID ilə müraciət tapılmadı. Zəhmət olmasa ID-ni yoxlayın.')
      } else {
        setError(err.response?.data?.detail || 'Xəta baş verdi.')
      }
    } finally {
      setLookupLoading(false)
    }
  }

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file || !requestId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post(`/api/verify/${requestId.trim()}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-api-key': API_KEY,
        },
      })
      setResult(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Bu ID ilə müraciət tapılmadı.')
      } else {
        setError(err.response?.data?.detail || 'Yoxlama zamanı xəta baş verdi. Yenidən cəhd edin.')
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const resetAll = () => {
    reset()
    setRequestId('')
    setRequestInfo(null)
  }

  const CATEGORY_LABELS = {
    kommunal: 'Kommunal xidmətlər',
    yol_neqliyyat: 'Yol və nəqliyyat',
    infrastruktur: 'İnfrastruktur',
    ekoloji: 'Ekoloji problemlər',
    diger: 'Digər',
  }

  const PRIORITY_LABELS = {
    tecili: { label: 'Təcili', color: 'bg-red-50 text-red-700 border-red-200' },
    orta: { label: 'Orta', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    asagi: { label: 'Aşağı', color: 'bg-green-50 text-green-700 border-green-200' },
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Nəticə Yoxlaması</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Qurumun icra nəticəsini yükləyin. Sistem ilkin müraciətlə vizual uyğunluğu yoxlayacaq.
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { n: '1', label: 'Müraciət tap' },
          { n: '2', label: 'Nəticə yüklə' },
          { n: '3', label: 'Yoxlama' },
        ].map((step, i) => {
          const done =
            (i === 0 && requestInfo) ||
            (i === 1 && file && requestInfo) ||
            (i === 2 && result)
          return (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  result && i <= 2 ? 'bg-green-500 text-white' :
                  loading && i === 2 ? 'bg-blue-600 text-white animate-pulse' :
                  done ? 'bg-blue-600 text-white' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {result && i <= 2 ? '✓' : step.n}
                </div>
                <span className={`text-sm font-medium ${
                  done || result ? 'text-slate-700' : 'text-slate-400'
                }`}>{step.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${done ? 'bg-blue-300' : 'bg-slate-200'}`} />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step 1: Request lookup */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs font-bold">1</div>
          <span className="text-sm font-semibold text-slate-700">Müraciət ID Daxil Edin</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:border-[#003087] transition">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupRequest()}
                placeholder="Məs: req_abc12345"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none font-mono"
              />
            </div>
            <button
              onClick={lookupRequest}
              disabled={!requestId.trim() || lookupLoading}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                !requestId.trim() || lookupLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#003087] text-white hover:bg-[#0050b3] shadow-sm hover:shadow-md'
              }`}
            >
              {lookupLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Axtar
            </button>
          </div>

          {/* Request info card */}
          {requestInfo && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Tapılan Müraciət</span>
                <button onClick={resetAll} className="text-xs text-blue-500 hover:text-blue-700 underline">
                  Sıfırla
                </button>
              </div>
              <p className="text-sm text-slate-800 mb-3">{requestInfo.description_az}</p>
              <div className="flex flex-wrap gap-2">
                {requestInfo.category && (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200">
                    {CATEGORY_LABELS[requestInfo.category] || requestInfo.category}
                  </span>
                )}
                {requestInfo.priority && PRIORITY_LABELS[requestInfo.priority] && (
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border ${PRIORITY_LABELS[requestInfo.priority].color}`}>
                    {PRIORITY_LABELS[requestInfo.priority].label}
                  </span>
                )}
                {requestInfo.status && (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
                    Status: {requestInfo.status}
                  </span>
                )}
                {requestInfo.location_hint && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border bg-white text-slate-600 border-slate-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {requestInfo.location_hint}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Upload result image (only shown after request found) */}
      {requestInfo && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-sm font-semibold text-slate-700">Nəticə Şəklini Yükləyin</span>
          </div>

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed m-4 rounded-xl transition-all cursor-pointer ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50/30'
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
            style={{ minHeight: '180px' }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !preview && fileInput.current.click()}
          >
            {preview ? (
              <div className="relative p-3">
                <img
                  src={preview}
                  alt="preview"
                  className="max-h-56 mx-auto rounded-lg object-contain shadow-sm"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); reset() }}
                  className="absolute top-5 right-5 bg-white rounded-full shadow p-1.5 hover:bg-red-50 transition"
                  title="Sil"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">İcra nəticəsinin şəklini yükləyin</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 · Maks. 20 MB</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {/* File info + submit */}
          <div className="px-4 pb-4 flex items-center gap-3">
            {file && (
              <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-slate-600 truncate">{file.name}</span>
                <span className="text-xs text-slate-400 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                !file || loading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#003087] text-white hover:bg-[#0050b3] shadow-sm hover:shadow-md'
              } ${!file ? 'w-full justify-center' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Yoxlanılır…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Yoxla
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {result && <VerificationResult data={result} />}
    </div>
  )
}

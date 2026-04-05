import React, { useState, useRef } from 'react'
import axios from 'axios'
import AnalysisResult from '../components/AnalysisResult'

export default function CitizenUpload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [manualLocation, setManualLocation] = useState('')
  const fileInput = useRef()

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
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    if (manualLocation.trim()) form.append('manual_location', manualLocation.trim())
    try {
      const res = await axios.post('/api/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Xəta baş verdi. Yenidən cəhd edin.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setManualLocation('')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Müraciət Göndər</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Problemin şəklini və ya videosunu yükləyin. Süni intellekt avtomatik analiz edib müraciətinizi hazırlayacaq.
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { n: '1', label: 'Fayl yüklə' },
          { n: '2', label: 'AI analiz' },
          { n: '3', label: 'Nəticə' },
        ].map((step, i) => {
          const done = (i === 0 && file) || (i === 1 && loading) || (i === 2 && result)
          const active = (i === 0 && !file) || (i === 1 && file && !result && !loading) || (i === 2 && loading)
          return (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  result && i <= 2 ? 'bg-green-500 text-white' :
                  loading && i === 1 ? 'bg-blue-600 text-white animate-pulse' :
                  file && i === 0 ? 'bg-blue-600 text-white' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {result && i <= 2 ? '✓' : step.n}
                </div>
                <span className={`text-sm font-medium ${
                  (file && i === 0) || (loading && i === 1) || result ? 'text-slate-700' : 'text-slate-400'
                }`}>{step.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${file && i === 0 ? 'bg-blue-300' : 'bg-slate-200'}`} />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed m-4 rounded-xl transition-all cursor-pointer ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : file
              ? 'border-green-400 bg-green-50/30'
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
          style={{ minHeight: '220px' }}
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
                className="max-h-64 mx-auto rounded-lg object-contain shadow-sm"
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
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-600">Buraya sürükləyin və ya klikləyin</p>
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

        {/* Manual location input */}
        <div className="px-4 pb-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Yer ünvanı <span className="text-slate-400 font-normal normal-case">(GPS tapılmadıqda əl ilə daxil edin)</span>
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-[#003087] transition">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Məs: Nizami küçəsi, Nərimanov rayonu, Bakı"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
        </div>

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
                Təhlil edilir…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analiz Et
              </>
            )}
          </button>
        </div>
      </div>

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

      {result && <AnalysisResult data={result} />}
    </div>
  )
}
